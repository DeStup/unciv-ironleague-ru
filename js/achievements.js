/**
 * Iron League records / achievements from Games.json.
 * Рекорды и достижения Iron League по Games.json.
 *
 * Excludes teams/scrap (same rules as rating.js). Winner = nation name → player.
 * Исключает teams/scrap (как rating.js). Победитель: нация → игрок.
 */
(function (global) {
  'use strict';

  const BARBARIAN_NAMES = new Set(['barbarians', 'варвары']);
  const PIETY_NAMES = new Set(['набожность', 'piety']);
  const TRADITION_NAMES = new Set(['традиция', 'tradition']);
  const LIBERTY_NAMES = new Set(['воля', 'liberty']);
  const HONOR_NAMES = new Set(['честь', 'honor', 'honour']);
  const ORDER_NAMES = new Set(['порядок', 'order']);
  const FREEDOM_NAMES = new Set(['свобода', 'freedom']);
  const AUTOCRACY_NAMES = new Set(['автократия', 'самодержавие', 'autocracy']);
  const ZEUS_WONDER_NAMES = new Set(['statue of zeus', 'статуя зевса']);

  function normSetHas(set, value) {
    return set.has(String(value || '').trim().toLowerCase());
  }

  function hasZeusWonder(wonders) {
    if (!Array.isArray(wonders)) return false;
    return wonders.some((w) => ZEUS_WONDER_NAMES.has(String(w || '').trim().toLowerCase()));
  }

  function gameFlags(game) {
    return Array.isArray(game.flags) ? game.flags.map(String) : [];
  }

  function isExcludedGame(game) {
    if (game && game.excludeFromStats) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('teams') || flags.includes('scrap') || flags.includes('team');
  }

  function parseGameNum(game) {
    const m = String(game.number || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : Number(game.id) || 0;
  }

  function eligibleGames(games) {
    return (games || [])
      .filter((g) => !isExcludedGame(g))
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /** Cheap fingerprint so we recompute only when archive content changes. */
  function gamesFingerprint(games) {
    if (!games || !games.length) return '0';
    let parts = [String(games.length)];
    for (const g of games) {
      parts.push(
        [
          g.id,
          g.number,
          g.endedOnTurn,
          g.winner,
          Array.isArray(g.survivors) ? g.survivors.length : 0,
          Array.isArray(g.players) ? g.players.length : 0,
        ].join(':')
      );
    }
    return parts.join('|');
  }

  let achievementsCacheKey = '';
  let achievementsCacheItems = null;

  function isBarbarianName(name) {
    return BARBARIAN_NAMES.has(String(name || '').trim().toLowerCase());
  }

  function isPiety(policy) {
    return normSetHas(PIETY_NAMES, policy);
  }

  function isTradition(policy) {
    return normSetHas(TRADITION_NAMES, policy);
  }

  function isLiberty(policy) {
    return normSetHas(LIBERTY_NAMES, policy);
  }

  function isHonor(policy) {
    return normSetHas(HONOR_NAMES, policy);
  }

  function isOrder(ideology) {
    return normSetHas(ORDER_NAMES, ideology);
  }

  function isFreedom(ideology) {
    return normSetHas(FREEDOM_NAMES, ideology);
  }

  function isAutocracy(ideology) {
    return normSetHas(AUTOCRACY_NAMES, ideology);
  }

  function survivorByName(game, name) {
    const key = String(name || '').trim();
    const survivors = Array.isArray(game.survivors) ? game.survivors : [];
    return survivors.find((s) => String(s.name || '').trim() === key) || null;
  }

  /** Resolve winner username from Russian nation in game.winner. */
  function winnerPlayer(game) {
    const nation = String(game.winner || '').trim();
    if (!nation) return null;
    for (const s of game.survivors || []) {
      if (String(s.nation || '').trim() === nation) {
        const name = String(s.name || '').trim();
        return name || null;
      }
    }
    for (const p of game.players || []) {
      if (String(p.nation || '').trim() === nation) {
        const name = String(p.name || '').trim();
        return name || null;
      }
    }
    return null;
  }

  function playerNames(game) {
    const names = new Set();
    for (const p of game.players || []) {
      const n = String(p.name || '').trim();
      if (n) names.add(n);
    }
    for (const s of game.survivors || []) {
      const n = String(s.name || '').trim();
      if (n) names.add(n);
    }
    return [...names].filter((n) => n && !isBarbarianName(n));
  }

  function emptyStat() {
    return {
      played: 0,
      wins: 0,
      winsWithCaps: 0,
      winsNoCaps: 0,
      caps: 0,
      deaths: 0,
      deathsKnownGames: 0,
      wondersBuilt: 0,
      wondersOwned: 0,
      elim: 0,
      finaleGames: 0,
      pietyCount: 0,
      pietyStreak: 0,
      pietyRun: 0,
      traditionCount: 0,
      libertyCount: 0,
      honorCount: 0,
      orderCount: 0,
      freedomCount: 0,
      autocracyCount: 0,
      winTurns: [],
      maxCapsInWin: 0,
      maxCapsInWinGame: null,
      warsDeclared: 0,
      warsReceived: 0,
      warsDeclZero: 0,
      warsDeclKnown: 0,
      nations: new Set(),
      survivedNoCap: 0,
      winStreak: 0,
      winRun: 0,
      playStreak: 0,
      playRun: 0,
      lastPlayIndex: -2,
      maxCities: 0,
      maxCitiesGame: null,
      maxScore: 0,
      maxScoreGame: null,
      maxUnits: 0,
      maxUnitsGame: null,
      maxTechs: 0,
      maxTechsGame: null,
      maxPopulation: 0,
      maxPopulationGame: null,
      maxCapitalPop: 0,
      maxCapitalPopGame: null,
      maxProduction: 0,
      maxProductionGame: null,
      maxGold: 0,
      maxGoldGame: null,
      maxGoldIncome: 0,
      maxGoldIncomeGame: null,
      maxScience: 0,
      maxScienceGame: null,
      maxCulture: 0,
      maxCultureGame: null,
      maxGreatPeople: 0,
      maxGreatPeopleGame: null,
      maxGreatScientists: 0,
      maxGreatScientistsGame: null,
      maxGreatEngineers: 0,
      maxGreatEngineersGame: null,
      maxGreatGenerals: 0,
      maxGreatGeneralsGame: null,
      maxGreatCulturePeople: 0,
      maxGreatCulturePeopleGame: null,
      maxWondersOneTurn: 0,
      maxWondersOneTurnGame: null,
      minIdeologyTurn: Infinity,
      minIdeologyTurnGame: null,
    };
  }

  function gpTypeCount(row, type) {
    const types = row && row.great_people_types;
    if (!types || typeof types !== 'object') return null;
    const n = Number(types[type]);
    return Number.isFinite(n) ? n : null;
  }

  function gpCultureCount(row) {
    const parts = ['Artist', 'Writer', 'Musician'].map((t) => gpTypeCount(row, t));
    if (parts.every((x) => x == null)) return null;
    return parts.reduce((sum, x) => sum + (x || 0), 0);
  }

  function bumpPeak(s, key, gameKey, value, gNum) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n > s[key]) {
      s[key] = n;
      s[gameKey] = gNum;
    }
  }

  function bumpMinPeak(s, key, gameKey, value, gNum) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n < s[key]) {
      s[key] = n;
      s[gameKey] = gNum;
    }
  }

  function buildStats(games) {
    const list = eligibleGames(games);
    const stats = new Map();

    function ensure(name) {
      if (!stats.has(name)) stats.set(name, emptyStat());
      return stats.get(name);
    }

    for (let gi = 0; gi < list.length; gi += 1) {
      const game = list[gi];
      const wp = winnerPlayer(game);
      const turn = Number(game.endedOnTurn);
      const gNum = parseGameNum(game);
      for (const name of playerNames(game)) {
        const s = ensure(name);
        s.played += 1;
        if (s.lastPlayIndex === gi - 1) s.playRun += 1;
        else s.playRun = 1;
        s.lastPlayIndex = gi;
        s.playStreak = Math.max(s.playStreak, s.playRun);
        const row = survivorByName(game, name);
        const won = name === wp;
        let piety = false;

        if (won) {
          s.wins += 1;
          s.winRun += 1;
          s.winStreak = Math.max(s.winStreak, s.winRun);
        } else {
          s.winRun = 0;
        }

        if (row) {
          s.finaleGames += 1;
          const caps = Array.isArray(row.conquered_capitals) ? row.conquered_capitals.length : 0;
          s.caps += caps;
          if (Number.isFinite(Number(row.military_deaths))) {
            const deathsVal = Number(row.military_deaths);
            // Games 12–13 had corrupt tallies (thousands of “deaths”);
            // skip absurd per-game values vs turn length.
            const endedTurn = Number(game.endedOnTurn);
            const turnCap = Number.isFinite(endedTurn) ? endedTurn * 3 : 400;
            const cap = Math.max(250, turnCap);
            if (deathsVal >= 0 && deathsVal <= cap) {
              s.deathsKnownGames += 1;
              s.deaths += deathsVal;
            }
          }
          s.wondersBuilt += Array.isArray(row.wonders_built) ? row.wonders_built.length : 0;
          s.wondersOwned += Array.isArray(row.wonders) ? row.wonders.length : 0;
          if (row.alive === false) s.elim += 1;
          if (row.alive === true && row.has_capital === false) s.survivedNoCap += 1;
          if (isPiety(row.first_policy)) {
            s.pietyCount += 1;
            piety = true;
          }
          if (isTradition(row.first_policy)) s.traditionCount += 1;
          if (isLiberty(row.first_policy)) s.libertyCount += 1;
          if (isHonor(row.first_policy)) s.honorCount += 1;
          if (isOrder(row.ideology)) s.orderCount += 1;
          if (isFreedom(row.ideology)) s.freedomCount += 1;
          if (isAutocracy(row.ideology)) s.autocracyCount += 1;
          if (Number.isFinite(Number(row.wars_declared))) {
            s.warsDeclKnown += 1;
            const wd = Number(row.wars_declared);
            s.warsDeclared += wd;
            if (wd === 0) s.warsDeclZero += 1;
          }
          if (Number.isFinite(Number(row.wars_received))) {
            s.warsReceived += Number(row.wars_received);
          }
          const nat = String(row.nation || '').trim();
          if (nat) s.nations.add(nat);
          bumpPeak(s, 'maxCities', 'maxCitiesGame', row.cities, gNum);
          bumpPeak(s, 'maxScore', 'maxScoreGame', row.score, gNum);
          bumpPeak(s, 'maxUnits', 'maxUnitsGame', row.units, gNum);
          bumpPeak(s, 'maxTechs', 'maxTechsGame', row.techs, gNum);
          bumpPeak(s, 'maxPopulation', 'maxPopulationGame', row.population, gNum);
          bumpPeak(s, 'maxCapitalPop', 'maxCapitalPopGame', row.capital_population, gNum);
          bumpPeak(s, 'maxProduction', 'maxProductionGame', row.production, gNum);
          bumpPeak(s, 'maxGold', 'maxGoldGame', row.gold, gNum);
          bumpPeak(s, 'maxGoldIncome', 'maxGoldIncomeGame', row.gold_income, gNum);
          bumpPeak(s, 'maxScience', 'maxScienceGame', row.science, gNum);
          bumpPeak(s, 'maxCulture', 'maxCultureGame', row.culture, gNum);
          bumpPeak(s, 'maxGreatPeople', 'maxGreatPeopleGame', row.great_people, gNum);
          bumpPeak(s, 'maxGreatScientists', 'maxGreatScientistsGame', gpTypeCount(row, 'Scientist'), gNum);
          bumpPeak(s, 'maxGreatEngineers', 'maxGreatEngineersGame', gpTypeCount(row, 'Engineer'), gNum);
          bumpPeak(s, 'maxGreatGenerals', 'maxGreatGeneralsGame', gpTypeCount(row, 'General'), gNum);
          bumpPeak(s, 'maxGreatCulturePeople', 'maxGreatCulturePeopleGame', gpCultureCount(row), gNum);
          const mw = Number(row.max_wonders_built_one_turn);
          if (Number.isFinite(mw) && mw >= 2) {
            bumpPeak(s, 'maxWondersOneTurn', 'maxWondersOneTurnGame', mw, gNum);
          }
          bumpMinPeak(s, 'minIdeologyTurn', 'minIdeologyTurnGame', row.ideology_turn, gNum);
        }

        if (piety) {
          s.pietyRun += 1;
          s.pietyStreak = Math.max(s.pietyStreak, s.pietyRun);
        } else {
          s.pietyRun = 0;
        }

        if (won) {
          const caps = Array.isArray((row || {}).conquered_capitals)
            ? row.conquered_capitals.length
            : 0;
          if (caps > 0) s.winsWithCaps += 1;
          else s.winsNoCaps += 1;
          if (caps > s.maxCapsInWin) {
            s.maxCapsInWin = caps;
            s.maxCapsInWinGame = gNum;
          }
          if (Number.isFinite(turn) && turn > 0) {
            s.winTurns.push({ turn, game: gNum });
          }
        }
      }
    }
    return { stats, games: list };
  }

  /**
   * Top-N by score (desc); ties by nickname asc.
   * Топ-N по score (убыв.); ничья — ник по возрастанию.
   */
  function pickTop(stats, scoreFn, filterFn, limit) {
    const n = limit == null ? 3 : limit;
    const rows = [];
    for (const [name, s] of stats) {
      if (filterFn && !filterFn(s)) continue;
      const score = scoreFn(s);
      if (!Number.isFinite(score)) continue;
      rows.push({ player: name, stat: s, score });
    }
    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.player.localeCompare(b.player);
    });
    return rows.slice(0, Math.max(0, n));
  }

  /**
   * Top-N by lowest score (asc); ties by nickname asc.
   * Топ-N по наименьшему score; ничья — ник по возрастанию.
   */
  function pickTopMin(stats, scoreFn, filterFn, limit) {
    return pickTop(stats, (s) => -scoreFn(s), filterFn, limit).map((row) => ({
      player: row.player,
      stat: row.stat,
      score: -row.score,
    }));
  }

  function pickMax(stats, scoreFn, filterFn) {
    return pickTop(stats, scoreFn, filterFn, 1)[0] || null;
  }

  function pickMin(stats, scoreFn, filterFn) {
    return pickTopMin(stats, scoreFn, filterFn, 1)[0] || null;
  }

  /**
   * Compute league records from archive games.
   * Считает рекорды лиги по архиву.
   *
   * :param games: Games.json games array / массив игр
   * :return: achievement objects for the UI / объекты ачивок для UI
   */
  function computeAchievements(games) {
    const key = gamesFingerprint(games);
    if (achievementsCacheKey === key && achievementsCacheItems) {
      return achievementsCacheItems;
    }

    const { stats, games: gameList } = buildStats(games);
    const out = [];

    function nationAtGame(player, gNum) {
      const want = Number(gNum);
      if (!Number.isFinite(want) || want <= 0) return '';
      for (const game of gameList) {
        if (parseGameNum(game) !== want) continue;
        const row = survivorByName(game, player);
        if (row && String(row.nation || '').trim()) {
          return String(row.nation).trim();
        }
        for (const p of game.players || []) {
          if (String(p.name || '').trim() !== player) continue;
          const nat = String(p.nation || '').trim();
          if (nat) return nat;
        }
      }
      return '';
    }

    /** Attach per-hit game number so top-2/3 and nation badges resolve. */
    function withGame(hits, gameFromHit) {
      return (hits || []).map((h) => {
        const g = typeof gameFromHit === 'function' ? gameFromHit(h) : gameFromHit;
        if (g == null || !Number.isFinite(Number(g))) return h;
        return Object.assign({}, h, { game: Number(g) });
      });
    }

    /**
     * Push a ranked record with optional top-2 / top-3 runners-up.
     * Пишет рекорд с опциональными 2–3 местами.
     *
     * :param id: record id / id рекорда
     * :param hits: pickTop rows / строки pickTop
     * :param valueFn: (hit) => display value / значение для UI
     * :param extraFn: optional (hit) => extra fields for #1 body / доп. поля для текста 1 места
     */
    function pushTop(id, hits, valueFn, extraFn) {
      if (!hits || !hits.length) return;
      const top = hits.map((h, i) => {
        const row = { place: i + 1, player: h.player, value: valueFn(h) };
        if (h.game != null) row.gameNumber = h.game;
        if (h.nation) row.nation = h.nation;
        else if (row.gameNumber != null) {
          const nat = nationAtGame(h.player, row.gameNumber);
          if (nat) row.nation = nat;
        }
        return row;
      });
      const head = hits[0];
      const extra = typeof extraFn === 'function' ? (extraFn(head) || {}) : (extraFn || {});
      if (extra.gameNumber != null && top[0].gameNumber == null) {
        top[0].gameNumber = extra.gameNumber;
      }
      if (!extra.nation && top[0].nation) extra.nation = top[0].nation;
      if (extra.gameNumber != null && !extra.nation) {
        const nat = nationAtGame(head.player, extra.gameNumber);
        if (nat) {
          extra.nation = nat;
          top[0].nation = nat;
        }
      }
      out.push(Object.assign({
        id,
        player: head.player,
        value: top[0].value,
        top,
      }, extra));
    }

    pushTop(
      'most_wins',
      pickTop(stats, (s) => s.wins, (s) => s.wins > 0),
      (h) => String(h.stat.wins),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'best_winrate',
      pickTop(
        stats,
        // Prefer higher winrate; on a tie, prefer more games.
        // При равном винрейте предпочитаем больше игр.
        (s) => s.wins / s.played + s.played * 1e-9,
        (s) => s.played >= 3 && s.wins > 0,
      ),
      (h) => `${Math.round((h.stat.wins / h.stat.played) * 1000) / 10}%`,
      (h) => ({ games: h.stat.played, wins: h.stat.wins }),
    );

    pushTop(
      'longest_win_streak',
      pickTop(stats, (s) => s.winStreak, (s) => s.winStreak >= 2),
      (h) => String(h.stat.winStreak),
    );

    pushTop(
      'longest_play_streak',
      pickTop(stats, (s) => s.playStreak, (s) => s.playStreak >= 3),
      (h) => String(h.stat.playStreak),
      (h) => ({ games: h.stat.played }),
    );

    const winTurns = [];
    for (const [name, s] of stats) {
      for (const w of s.winTurns) {
        winTurns.push({ player: name, turn: w.turn, game: w.game });
      }
    }
    const fastestHits = winTurns
      .slice()
      .sort((a, b) => (a.turn - b.turn) || a.player.localeCompare(b.player))
      .slice(0, 3)
      .map((w) => ({ player: w.player, stat: w, score: -w.turn, game: w.game }));
    pushTop(
      'fastest_win',
      fastestHits,
      (h) => String(h.stat.turn),
      (h) => ({ gameNumber: h.game }),
    );

    const slowestHits = winTurns
      .slice()
      .sort((a, b) => (b.turn - a.turn) || a.player.localeCompare(b.player))
      .slice(0, 3)
      .map((w) => ({ player: w.player, stat: w, score: w.turn, game: w.game }));
    pushTop(
      'slowest_win',
      slowestHits,
      (h) => String(h.stat.turn),
      (h) => ({ gameNumber: h.game }),
    );

    pushTop(
      'wins_all_with_caps',
      pickTop(stats, (s) => s.wins, (s) => s.wins >= 2 && s.winsNoCaps === 0),
      (h) => String(h.stat.wins),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'most_caps_single_win',
      withGame(
        pickTop(stats, (s) => s.maxCapsInWin, (s) => s.maxCapsInWin >= 2),
        (h) => h.stat.maxCapsInWinGame,
      ),
      (h) => String(h.stat.maxCapsInWin),
      (h) => ({ gameNumber: h.stat.maxCapsInWinGame }),
    );

    pushTop(
      'most_caps',
      pickTop(stats, (s) => s.caps, (s) => s.caps > 0),
      (h) => String(h.stat.caps),
    );

    pushTop(
      'most_wars_declared',
      pickTop(
        stats,
        (s) => s.warsDeclared,
        (s) => s.warsDeclKnown >= 3 && s.warsDeclared > 0,
      ),
      (h) => String(h.stat.warsDeclared),
      (h) => ({ games: h.stat.warsDeclKnown }),
    );

    pushTop(
      'most_wars_received',
      pickTop(
        stats,
        (s) => s.warsReceived,
        (s) => s.finaleGames >= 3 && s.warsReceived > 0,
      ),
      (h) => String(h.stat.warsReceived),
      (h) => ({ games: h.stat.finaleGames }),
    );

    pushTop(
      'most_military_deaths',
      pickTop(
        stats,
        (s) => s.deaths,
        (s) => s.deathsKnownGames >= 1 && s.deaths > 0,
      ),
      (h) => String(h.stat.deaths),
    );

    pushTop(
      'fewest_military_deaths',
      pickTopMin(stats, (s) => s.deaths, (s) => s.deathsKnownGames >= 5),
      (h) => String(h.stat.deaths),
      (h) => ({ games: h.stat.deathsKnownGames }),
    );

    pushTop(
      'piety_first_count',
      pickTop(stats, (s) => s.pietyCount, (s) => s.pietyCount >= 2),
      (h) => String(h.stat.pietyCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'piety_first_streak',
      pickTop(stats, (s) => s.pietyStreak, (s) => s.pietyStreak >= 2),
      (h) => String(h.stat.pietyStreak),
    );

    pushTop(
      'tradition_first_count',
      pickTop(stats, (s) => s.traditionCount, (s) => s.traditionCount >= 3),
      (h) => String(h.stat.traditionCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'liberty_first_count',
      pickTop(stats, (s) => s.libertyCount, (s) => s.libertyCount >= 3),
      (h) => String(h.stat.libertyCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'honor_first_count',
      pickTop(stats, (s) => s.honorCount, (s) => s.honorCount >= 2),
      (h) => String(h.stat.honorCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'ideology_order_count',
      pickTop(stats, (s) => s.orderCount, (s) => s.orderCount >= 2),
      (h) => String(h.stat.orderCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'ideology_freedom_count',
      pickTop(stats, (s) => s.freedomCount, (s) => s.freedomCount >= 2),
      (h) => String(h.stat.freedomCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'ideology_autocracy_count',
      pickTop(stats, (s) => s.autocracyCount, (s) => s.autocracyCount >= 2),
      (h) => String(h.stat.autocracyCount),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'most_wonders_built',
      pickTop(stats, (s) => s.wondersBuilt, (s) => s.wondersBuilt > 0),
      (h) => String(h.stat.wondersBuilt),
    );

    // First win while owning a self-built Statue of Zeus (may stay vacant; no top-3).
    // Первая победа с собственно построенной Статуей Зевса (может быть пустой; без топ-3).
    let zeusWin = null;
    for (const game of eligibleGames(games)) {
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const row = survivorByName(game, wp);
      if (!row || !hasZeusWonder(row.wonders_built)) continue;
      const gNum = parseGameNum(game);
      if (!zeusWin || gNum < zeusWin.game) {
        zeusWin = { player: wp, game: gNum };
      }
    }
    if (zeusWin) {
      out.push({
        id: 'zeus_statue_win',
        player: zeusWin.player,
        value: String(zeusWin.game),
        gameNumber: zeusWin.game,
        nation: nationAtGame(zeusWin.player, zeusWin.game),
      });
    } else {
      out.push({
        id: 'zeus_statue_win',
        player: '',
        value: '—',
        vacant: true,
      });
    }

    pushTop(
      'most_wonders_owned',
      pickTop(stats, (s) => s.wondersOwned, (s) => s.wondersOwned > 0),
      (h) => String(h.stat.wondersOwned),
    );

    const twoWonderHits = pickTop(
      stats,
      (s) => s.maxWondersOneTurn,
      (s) => s.maxWondersOneTurn >= 2,
    );
    if (twoWonderHits.length) {
      pushTop(
        'two_wonders_one_turn',
        twoWonderHits,
        (h) => String(h.stat.maxWondersOneTurn),
        (h) => ({ gameNumber: h.stat.maxWondersOneTurnGame }),
      );
    } else {
      out.push({
        id: 'two_wonders_one_turn',
        player: '',
        value: '—',
        vacant: true,
      });
    }

    pushTop(
      'most_unique_nations',
      pickTop(
        stats,
        (s) => s.nations.size,
        (s) => s.played >= 5 && s.nations.size >= 5,
      ),
      (h) => String(h.stat.nations.size),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'most_games_no_win',
      pickTop(stats, (s) => s.played, (s) => s.played >= 5 && s.wins === 0),
      (h) => String(h.stat.played),
    );

    // Never eliminated in finale (count of finale rows with elim===0).
    // Ни разу не выбывал в финале (число финалов при elim===0).
    pushTop(
      'never_eliminated',
      pickTop(
        stats,
        (s) => s.finaleGames,
        (s) => s.finaleGames >= 3 && s.elim === 0,
      ),
      (h) => String(h.stat.finaleGames),
    );

    // Survival rate over all ranked games: (played − elim) / played.
    // Выживаемость по всем учтённым играм: (played − elim) / played.
    pushTop(
      'best_survival_rate',
      pickTop(
        stats,
        (s) => (s.played - s.elim) / s.played + s.played * 1e-9,
        (s) => s.played >= 5,
      ),
      (h) => `${Math.round(((h.stat.played - h.stat.elim) / h.stat.played) * 1000) / 10}%`,
      (h) => ({
        games: h.stat.played,
        survived: h.stat.played - h.stat.elim,
      }),
    );

    pushTop(
      'pacifist_games',
      pickTop(stats, (s) => s.warsDeclZero, (s) => s.warsDeclKnown >= 5),
      (h) => `${h.stat.warsDeclZero}/${h.stat.warsDeclKnown}`,
      (h) => ({ games: h.stat.warsDeclKnown }),
    );

    pushTop(
      'survived_no_capital',
      pickTop(stats, (s) => s.survivedNoCap, (s) => s.survivedNoCap >= 1),
      (h) => String(h.stat.survivedNoCap),
    );

    pushTop(
      'max_cities_finale',
      withGame(pickTop(stats, (s) => s.maxCities, (s) => s.maxCities > 0), (h) => h.stat.maxCitiesGame),
      (h) => String(h.stat.maxCities),
      (h) => ({ gameNumber: h.stat.maxCitiesGame }),
    );

    pushTop(
      'max_score_finale',
      withGame(pickTop(stats, (s) => s.maxScore, (s) => s.maxScore > 0), (h) => h.stat.maxScoreGame),
      (h) => String(h.stat.maxScore),
      (h) => ({ gameNumber: h.stat.maxScoreGame }),
    );

    pushTop(
      'max_units_finale',
      withGame(pickTop(stats, (s) => s.maxUnits, (s) => s.maxUnits > 0), (h) => h.stat.maxUnitsGame),
      (h) => String(h.stat.maxUnits),
      (h) => ({ gameNumber: h.stat.maxUnitsGame }),
    );

    pushTop(
      'max_techs_finale',
      withGame(pickTop(stats, (s) => s.maxTechs, (s) => s.maxTechs > 0), (h) => h.stat.maxTechsGame),
      (h) => String(h.stat.maxTechs),
      (h) => ({ gameNumber: h.stat.maxTechsGame }),
    );

    pushTop(
      'max_population_finale',
      withGame(pickTop(stats, (s) => s.maxPopulation, (s) => s.maxPopulation > 0), (h) => h.stat.maxPopulationGame),
      (h) => String(h.stat.maxPopulation),
      (h) => ({ gameNumber: h.stat.maxPopulationGame }),
    );

    pushTop(
      'max_capital_population_finale',
      withGame(pickTop(stats, (s) => s.maxCapitalPop, (s) => s.maxCapitalPop > 0), (h) => h.stat.maxCapitalPopGame),
      (h) => String(h.stat.maxCapitalPop),
      (h) => ({ gameNumber: h.stat.maxCapitalPopGame }),
    );

    pushTop(
      'max_production_finale',
      withGame(pickTop(stats, (s) => s.maxProduction, (s) => s.maxProduction > 0), (h) => h.stat.maxProductionGame),
      (h) => String(h.stat.maxProduction),
      (h) => ({ gameNumber: h.stat.maxProductionGame }),
    );

    pushTop(
      'max_gold_finale',
      withGame(pickTop(stats, (s) => s.maxGold, (s) => s.maxGold > 0), (h) => h.stat.maxGoldGame),
      (h) => String(h.stat.maxGold),
      (h) => ({ gameNumber: h.stat.maxGoldGame }),
    );

    pushTop(
      'max_gold_income_finale',
      withGame(pickTop(stats, (s) => s.maxGoldIncome, (s) => s.maxGoldIncome > 0), (h) => h.stat.maxGoldIncomeGame),
      (h) => `+${h.stat.maxGoldIncome}`,
      (h) => ({ gameNumber: h.stat.maxGoldIncomeGame }),
    );

    pushTop(
      'max_science_finale',
      withGame(pickTop(stats, (s) => s.maxScience, (s) => s.maxScience > 0), (h) => h.stat.maxScienceGame),
      (h) => String(h.stat.maxScience),
      (h) => ({ gameNumber: h.stat.maxScienceGame }),
    );

    pushTop(
      'max_culture_finale',
      withGame(pickTop(stats, (s) => s.maxCulture, (s) => s.maxCulture > 0), (h) => h.stat.maxCultureGame),
      (h) => String(h.stat.maxCulture),
      (h) => ({ gameNumber: h.stat.maxCultureGame }),
    );

    pushTop(
      'most_great_people_finale',
      withGame(pickTop(stats, (s) => s.maxGreatPeople, (s) => s.maxGreatPeople > 0), (h) => h.stat.maxGreatPeopleGame),
      (h) => String(h.stat.maxGreatPeople),
      (h) => ({ gameNumber: h.stat.maxGreatPeopleGame }),
    );

    pushTop(
      'most_great_scientists_finale',
      withGame(pickTop(stats, (s) => s.maxGreatScientists, (s) => s.maxGreatScientists > 0), (h) => h.stat.maxGreatScientistsGame),
      (h) => String(h.stat.maxGreatScientists),
      (h) => ({ gameNumber: h.stat.maxGreatScientistsGame }),
    );

    pushTop(
      'most_great_engineers_finale',
      withGame(pickTop(stats, (s) => s.maxGreatEngineers, (s) => s.maxGreatEngineers > 0), (h) => h.stat.maxGreatEngineersGame),
      (h) => String(h.stat.maxGreatEngineers),
      (h) => ({ gameNumber: h.stat.maxGreatEngineersGame }),
    );

    pushTop(
      'most_great_generals_finale',
      withGame(pickTop(stats, (s) => s.maxGreatGenerals, (s) => s.maxGreatGenerals > 0), (h) => h.stat.maxGreatGeneralsGame),
      (h) => String(h.stat.maxGreatGenerals),
      (h) => ({ gameNumber: h.stat.maxGreatGeneralsGame }),
    );

    pushTop(
      'most_great_culture_people_finale',
      withGame(pickTop(stats, (s) => s.maxGreatCulturePeople, (s) => s.maxGreatCulturePeople > 0), (h) => h.stat.maxGreatCulturePeopleGame),
      (h) => String(h.stat.maxGreatCulturePeople),
      (h) => ({ gameNumber: h.stat.maxGreatCulturePeopleGame }),
    );

    pushTop(
      'fastest_ideology',
      withGame(
        pickTopMin(
          stats,
          (s) => s.minIdeologyTurn,
          (s) => Number.isFinite(s.minIdeologyTurn) && s.minIdeologyTurn < Infinity,
        ),
        (h) => h.stat.minIdeologyTurnGame,
      ),
      (h) => String(h.stat.minIdeologyTurn),
      (h) => ({ gameNumber: h.stat.minIdeologyTurnGame }),
    );

    // Meta-record: most other 1st-place records (computed after the rest).
    // Мета-рекорд: больше всего остальных рекордов 1 места (считаем после остальных).
    const achCounts = new Map();
    for (const item of out) {
      const name = item && item.player;
      if (!name || item.vacant) continue;
      achCounts.set(name, (achCounts.get(name) || 0) + 1);
    }
    const titledHits = [...achCounts.entries()]
      .map(([player, count]) => ({ player, stat: { count }, score: count }))
      .filter((h) => h.score >= 2)
      .sort((a, b) => (b.score - a.score) || a.player.localeCompare(b.player))
      .slice(0, 3);
    pushTop(
      'most_achievements',
      titledHits,
      (h) => String(h.stat.count),
    );

    achievementsCacheKey = key;
    achievementsCacheItems = out;
    return out;
  }

  /** Drop memo when Games.json is reloaded (same array ref can still be mutated). */
  function invalidateAchievementsCache() {
    achievementsCacheKey = '';
    achievementsCacheItems = null;
  }

  global.IronLeagueAchievements = {
    computeAchievements,
    invalidateAchievementsCache,
    isExcludedGame,
    eligibleGames,
    winnerPlayer,
    pickTop,
    pickTopMin,
  };
})(typeof window !== 'undefined' ? window : globalThis);
