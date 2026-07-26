/**
 * Iron League rating engines.
 * Recalculated client-side from Games.json whenever the archive loads.
 *
 * Excluded: games with flags containing "teams" or "scrap", or excludeFromStats=true.
 * Placement: winner first; remaining by score (desc), then alive, then name.
 */
(function (global) {
  'use strict';

  const START_ELO = 1000;
  const START_ELO_ZERO = 0;
  const START_K = 24;
  const ALLOWED_K = [20, 24, 32];
  /** Default lobby elimination penalty when the UI toggle is on. */
  const LOBBY_ELIM_PENALTY = 5;

  function gameFlags(game) {
    const flags = Array.isArray(game.flags) ? game.flags.map(String) : [];
    return flags;
  }

  function isExcludedGame(game) {
    if (game && game.excludeFromStats) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('teams') || flags.includes('scrap') || flags.includes('team');
  }

  function parseGameNum(game) {
    const m = String(game.number || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : (game.id || 0);
  }

  function eligibleGames(games) {
    return (games || [])
      .filter((g) => !isExcludedGame(g))
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /**
   * Return ordered player names for a game (best → worst).
   */
  function placementOrder(game) {
    const players = Array.isArray(game.players) ? game.players : [];
    const byName = new Map(players.map((p) => [String(p.name || '').trim(), p]));
    const survivors = Array.isArray(game.survivors) ? game.survivors : [];
    const survByName = new Map(
      survivors.map((s) => [String(s.name || '').trim(), s])
    );
    const winnerNation = String(game.winner || '').trim();

    const names = [...byName.keys()].filter(Boolean);
    names.sort((a, b) => {
      const pa = byName.get(a);
      const pb = byName.get(b);
      const sa = survByName.get(a);
      const sb = survByName.get(b);
      const aWin = pa && pa.nation === winnerNation ? 1 : 0;
      const bWin = pb && pb.nation === winnerNation ? 1 : 0;
      if (aWin !== bWin) return bWin - aWin;
      const aAlive = sa ? (sa.alive !== false ? 1 : 0) : 0;
      const bAlive = sb ? (sb.alive !== false ? 1 : 0) : 0;
      if (aAlive !== bAlive) return bAlive - aAlive;
      const aScore = sa && Number.isFinite(Number(sa.score)) ? Number(sa.score) : null;
      const bScore = sb && Number.isFinite(Number(sb.score)) ? Number(sb.score) : null;
      if (aScore !== null && bScore !== null && aScore !== bScore) return bScore - aScore;
      if (aScore !== null && bScore === null) return -1;
      if (aScore === null && bScore !== null) return 1;
      return a.localeCompare(b, (global.IronLeagueI18n && IronLeagueI18n.getLang() === 'en') ? 'en' : 'ru', {
        sensitivity: 'base',
        numeric: true,
      });
    });
    return names;
  }

  function expectedScore(ri, rj) {
    return 1 / (1 + Math.pow(10, (rj - ri) / 400));
  }

  function ensureRatings(map, names, startElo) {
    const start = Number.isFinite(startElo) ? startElo : START_ELO;
    names.forEach((n) => {
      if (!map.has(n)) map.set(n, start);
    });
  }

  /** Method A: FFA Elo from ratingv2 sheet (Actual 1..0, Expected avg pairwise). */
  function normalizeK(k) {
    const n = Number(k);
    return ALLOWED_K.includes(n) ? n : START_K;
  }

  function rateFfaLinear(games, k, startElo) {
    const K = normalizeK(k);
    const start = Number.isFinite(startElo) ? startElo : START_ELO;
    const ratings = new Map();
    const gamesPlayed = new Map();
    for (const game of eligibleGames(games)) {
      const order = placementOrder(game);
      if (order.length < 2) continue;
      ensureRatings(ratings, order, start);
      const n = order.length;
      const actual = order.map((_, i) => (n === 1 ? 1 : (n - 1 - i) / (n - 1)));
      const expected = order.map((name, i) => {
        let sum = 0;
        let cnt = 0;
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          sum += expectedScore(ratings.get(name), ratings.get(order[j]));
          cnt += 1;
        }
        return cnt ? sum / cnt : 0.5;
      });
      order.forEach((name, i) => {
        const next = ratings.get(name) + K * (actual[i] - expected[i]);
        ratings.set(name, next);
        gamesPlayed.set(name, (gamesPlayed.get(name) || 0) + 1);
      });
    }
    return toRows(ratings, gamesPlayed);
  }

  /** Method B: pairwise Elo — each higher place beats each lower. */
  function ratePairwise(games, k, startElo) {
    const K = normalizeK(k);
    const start = Number.isFinite(startElo) ? startElo : START_ELO;
    const ratings = new Map();
    const gamesPlayed = new Map();
    for (const game of eligibleGames(games)) {
      const order = placementOrder(game);
      if (order.length < 2) continue;
      ensureRatings(ratings, order, start);
      const n = order.length;
      const pairs = (n * (n - 1)) / 2;
      const kPair = pairs > 0 ? K / pairs : K;
      const delta = new Map(order.map((name) => [name, 0]));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const hi = order[i];
          const lo = order[j];
          const expHi = expectedScore(ratings.get(hi), ratings.get(lo));
          delta.set(hi, delta.get(hi) + kPair * (1 - expHi));
          delta.set(lo, delta.get(lo) + kPair * (0 - (1 - expHi)));
        }
      }
      order.forEach((name) => {
        ratings.set(name, ratings.get(name) + delta.get(name));
        gamesPlayed.set(name, (gamesPlayed.get(name) || 0) + 1);
      });
    }
    return toRows(ratings, gamesPlayed);
  }

  /**
   * Method C: finish-place rating.
   * Each game awards points from place (1.0 best … 0.0 worst), scaled by lobby size;
   * running Elo-like average toward target 1000 + 400*(avgPlaceScore - 0.5).
   */
  function rateFinishPlace(games, options) {
    const zeroBase = options && options.zeroBase;
    const ratings = new Map();
    const gamesPlayed = new Map();
    const placeSum = new Map();
    for (const game of eligibleGames(games)) {
      const order = placementOrder(game);
      if (order.length < 2) continue;
      ensureRatings(ratings, order, zeroBase ? START_ELO_ZERO : START_ELO);
      const n = order.length;
      order.forEach((name, i) => {
        const placeScore = (n - 1 - i) / (n - 1);
        const gp = (gamesPlayed.get(name) || 0) + 1;
        const prevSum = placeSum.get(name) || 0;
        const nextSum = prevSum + placeScore;
        placeSum.set(name, nextSum);
        gamesPlayed.set(name, gp);
        const avg = nextSum / gp;
        if (zeroBase) {
          // Pure average place-score on 0..100 (no 1000±400 mapping).
          ratings.set(name, avg * 100);
        } else {
          // Blend toward place-based rating; more games → closer to long-run avg.
          const target = START_ELO + 400 * (avg - 0.5);
          const w = Math.min(1, gp / 8);
          const cur = ratings.get(name);
          ratings.set(name, cur * (1 - w) + target * w);
        }
      });
    }
    return toRows(ratings, gamesPlayed);
  }

  function toRows(ratings, gamesPlayed) {
    const rows = [...ratings.entries()].map(([name, rating]) => {
      const games = gamesPlayed.get(name) || 0;
      const rounded = Math.round(rating * 100) / 100;
      return {
        name,
        rating: rounded,
        games,
        perGame: games > 0 ? Math.round((rounded / games) * 100) / 100 : null,
      };
    });
    rows.sort((a, b) => {
      const loc = (global.IronLeagueI18n && IronLeagueI18n.getLang() === 'en') ? 'en' : 'ru';
      return b.rating - a.rating
        || a.name.localeCompare(b.name, loc, { sensitivity: 'base', numeric: true });
    });
    rows.forEach((r, i) => {
      r.place = i + 1;
    });
    return rows;
  }

  /** Survivor row by player name (trimmed). */
  function survivorByName(game, name) {
    const survivors = Array.isArray(game.survivors) ? game.survivors : [];
    const key = String(name || '').trim();
    return survivors.find((s) => String(s.name || '').trim() === key) || null;
  }

  /** Survivor is eliminated / dead in finale (`alive === false`). */
  function isEliminated(survivor) {
    return !!(survivor && survivor.alive === false);
  }

  /**
   * Avg of finale development stats for lobby-avg rating.
   * Uses techs, policies, cities when finite numbers are present.
   */
  function finaleMetricsAvg(survivor) {
    if (!survivor) return 0;
    const vals = ['techs', 'policies', 'cities']
      .map((k) => Number(survivor[k]))
      .filter((n) => Number.isFinite(n));
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function normalizeElimPenalty(options) {
    const raw = options && options.elimPenalty;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * Strength for lobby opponent adjustment: rating / games (form).
   * Сила для поправки за оппонентов: рейтинг / число игр (форма).
   *
   * Using form (not raw sum) so veterans with many games are not
   * automatically "stronger" than efficient newcomers.
   * Форма, а не сырая сумма: ветераны с кучей игр не сильнее
   * эффективных новичков автоматически.
   */
  function lobbyForm(ratings, gamesPlayed, name) {
    const r = Number(ratings.get(name) || 0);
    const g = Number(gamesPlayed.get(name) || 0);
    return g > 0 ? r / g : r;
  }

  /**
   * Underdog bonus for the winner vs stronger opponents (by form).
   * Бонус аутсайдеру-победителю против более сильных (по форме).
   *
   * sum(form_opp − form_me) for opp with form > me, / count of such opps.
   * Сумма (форма_опп − форма_я) для опп сильнее меня / число таких опп.
   */
  function winnerOpponentBonus(ratings, gamesPlayed, order) {
    if (!order || order.length < 2) return 0;
    const winner = order[0];
    const myForm = lobbyForm(ratings, gamesPlayed, winner);
    let sumDiff = 0;
    let stronger = 0;
    for (let i = 1; i < order.length; i += 1) {
      const oppForm = lobbyForm(ratings, gamesPlayed, order[i]);
      if (oppForm > myForm) {
        sumDiff += oppForm - myForm;
        stronger += 1;
      }
    }
    return stronger > 0 ? sumDiff / stronger : 0;
  }

  /**
   * Zero-based lobby points: participation (N−1) for everyone;
   * winner gets an extra +10 plus underdog bonus vs stronger forms.
   * Optional elimPenalty subtracted if alive===false.
   * N = lobby size (player count).
   */
  function rateLobbyWinBonus(games, options) {
    const elimPenalty = normalizeElimPenalty(options);
    const ratings = new Map();
    const gamesPlayed = new Map();
    for (const game of eligibleGames(games)) {
      const order = placementOrder(game);
      if (order.length < 2) continue;
      ensureRatings(ratings, order, START_ELO_ZERO);
      const n = order.length;
      const base = n - 1;
      const underdog = winnerOpponentBonus(ratings, gamesPlayed, order);
      order.forEach((name, i) => {
        let delta = i === 0 ? base + 10 + underdog : base;
        if (elimPenalty && isEliminated(survivorByName(game, name))) {
          delta -= elimPenalty;
        }
        ratings.set(name, ratings.get(name) + delta);
        gamesPlayed.set(name, (gamesPlayed.get(name) || 0) + 1);
      });
    }
    return toRows(ratings, gamesPlayed);
  }

  /**
   * Zero-based lobby points: (N−1) + Avg for every player,
   * where Avg is the mean of available techs / policies / cities from finale.
   * Winner also gets underdog bonus vs stronger forms.
   * Optional elimPenalty subtracted if alive===false.
   */
  function rateLobbyAvgBonus(games, options) {
    const elimPenalty = normalizeElimPenalty(options);
    const ratings = new Map();
    const gamesPlayed = new Map();
    for (const game of eligibleGames(games)) {
      const order = placementOrder(game);
      if (order.length < 2) continue;
      ensureRatings(ratings, order, START_ELO_ZERO);
      const n = order.length;
      const base = n - 1;
      const underdog = winnerOpponentBonus(ratings, gamesPlayed, order);
      order.forEach((name, i) => {
        const avg = finaleMetricsAvg(survivorByName(game, name));
        let delta = base + avg;
        if (i === 0) delta += underdog;
        if (elimPenalty && isEliminated(survivorByName(game, name))) {
          delta -= elimPenalty;
        }
        ratings.set(name, ratings.get(name) + delta);
        gamesPlayed.set(name, (gamesPlayed.get(name) || 0) + 1);
      });
    }
    return toRows(ratings, gamesPlayed);
  }

  function rankMap(rows) {
    const m = new Map();
    rows.forEach((r) => m.set(r.name, r.place));
    return m;
  }

  function ratingMap(rows) {
    const m = new Map();
    rows.forEach((r) => m.set(r.name, r.rating));
    return m;
  }

  function computeAll(games, k, options) {
    const K = normalizeK(k);
    const zeroBase = !!(options && options.zeroBase);
    const start = zeroBase ? START_ELO_ZERO : START_ELO;
    const elimPenalty = normalizeElimPenalty(options);
    const lobbyOpts = { elimPenalty };
    const ffa = rateFfaLinear(games, K, start);
    const pairwise = ratePairwise(games, K, start);
    const finish = rateFinishPlace(games, { zeroBase });
    const rFfa = ratingMap(ffa);
    const rPair = ratingMap(pairwise);
    const rFin = ratingMap(finish);
    const pFfa = rankMap(ffa);
    const pPair = rankMap(pairwise);
    const pFin = rankMap(finish);

    const names = new Set([
      ...rFfa.keys(),
      ...rPair.keys(),
      ...rFin.keys(),
    ]);
    const combined = [...names].map((name) => {
      const ratings = [rFfa.get(name), rPair.get(name), rFin.get(name)].filter(
        (x) => x !== undefined
      );
      const places = [pFfa.get(name), pPair.get(name), pFin.get(name)].filter(
        (x) => x !== undefined
      );
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100
          : start;
      const avgPlace =
        places.length > 0
          ? Math.round((places.reduce((a, b) => a + b, 0) / places.length) * 100) / 100
          : null;
      return {
        name,
        rating: avgRating,
        avgPlace,
        placeFfa: pFfa.get(name) || null,
        placePairwise: pPair.get(name) || null,
        placeFinish: pFin.get(name) || null,
        ratingFfa: rFfa.get(name),
        ratingPairwise: rPair.get(name),
        ratingFinish: rFin.get(name),
        games: Math.max(
          ffa.find((x) => x.name === name)?.games || 0,
          pairwise.find((x) => x.name === name)?.games || 0,
          finish.find((x) => x.name === name)?.games || 0
        ),
      };
    });
    combined.sort(
      (a, b) => b.rating - a.rating || (a.avgPlace || 99) - (b.avgPlace || 99)
    );
    combined.forEach((r, i) => {
      r.place = i + 1;
    });

    return {
      ffa,
      pairwise,
      finish,
      combined,
      lobbyWin: rateLobbyWinBonus(games, lobbyOpts),
      lobbyAvg: rateLobbyAvgBonus(games, lobbyOpts),
      k: K,
      zeroBase,
      elimPenalty,
      eligibleCount: eligibleGames(games).length,
      excludedCount: (games || []).filter(isExcludedGame).length,
    };
  }

  global.IronLeagueRating = {
    START_ELO,
    START_ELO_ZERO,
    START_K,
    ALLOWED_K,
    LOBBY_ELIM_PENALTY,
    normalizeK,
    isExcludedGame,
    isEliminated,
    eligibleGames,
    placementOrder,
    parseGameNum,
    rateLobbyWinBonus,
    rateLobbyAvgBonus,
    computeAll,
  };
})(typeof window !== 'undefined' ? window : globalThis);
