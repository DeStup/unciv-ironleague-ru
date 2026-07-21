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
    };
  }

  function bumpPeak(s, key, gameKey, value, gNum) {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (n > s[key]) {
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

  function pickMax(stats, scoreFn, filterFn) {
    let best = null;
    let bestScore = -Infinity;
    for (const [name, s] of stats) {
      if (filterFn && !filterFn(s)) continue;
      const score = scoreFn(s);
      if (!Number.isFinite(score)) continue;
      if (
        score > bestScore
        || (score === bestScore && best && name.localeCompare(best.player) < 0)
      ) {
        bestScore = score;
        best = { player: name, stat: s, score };
      }
    }
    return best;
  }

  function pickMin(stats, scoreFn, filterFn) {
    let best = null;
    let bestScore = Infinity;
    for (const [name, s] of stats) {
      if (filterFn && !filterFn(s)) continue;
      const score = scoreFn(s);
      if (!Number.isFinite(score)) continue;
      if (
        score < bestScore
        || (score === bestScore && best && name.localeCompare(best.player) < 0)
      ) {
        bestScore = score;
        best = { player: name, stat: s, score };
      }
    }
    return best;
  }

  /**
   * Compute league records from archive games.
   * Считает рекорды лиги по архиву.
   *
   * :param games: Games.json games array / массив игр
   * :return: achievement objects for the UI / объекты ачивок для UI
   */
  function computeAchievements(games) {
    const { stats } = buildStats(games);
    const out = [];

    function push(id, hit, value, extra) {
      if (!hit) return;
      out.push(Object.assign({ id, player: hit.player, value }, extra || {}));
    }

    const mostWins = pickMax(stats, (s) => s.wins, (s) => s.wins > 0);
    if (mostWins) {
      push('most_wins', mostWins, String(mostWins.stat.wins), { games: mostWins.stat.played });
    }

    const winrateHit = pickMax(
      stats,
      // Prefer higher winrate; on a tie, prefer more games.
      // При равном винрейте предпочитаем больше игр.
      (s) => s.wins / s.played + s.played * 1e-9,
      (s) => s.played >= 3 && s.wins > 0,
    );
    if (winrateHit) {
      const pct = Math.round((winrateHit.stat.wins / winrateHit.stat.played) * 1000) / 10;
      push('best_winrate', winrateHit, `${pct}%`, {
        games: winrateHit.stat.played,
        wins: winrateHit.stat.wins,
      });
    }

    const winStreak = pickMax(stats, (s) => s.winStreak, (s) => s.winStreak >= 2);
    if (winStreak) push('longest_win_streak', winStreak, String(winStreak.stat.winStreak));

    const playStreak = pickMax(stats, (s) => s.playStreak, (s) => s.playStreak >= 3);
    if (playStreak) {
      push('longest_play_streak', playStreak, String(playStreak.stat.playStreak), {
        games: playStreak.stat.played,
      });
    }

    let fastest = null;
    let slowest = null;
    for (const [name, s] of stats) {
      for (const w of s.winTurns) {
        if (
          !fastest
          || w.turn < fastest.turn
          || (w.turn === fastest.turn && name < fastest.player)
        ) {
          fastest = { player: name, turn: w.turn, game: w.game };
        }
        if (
          !slowest
          || w.turn > slowest.turn
          || (w.turn === slowest.turn && name < slowest.player)
        ) {
          slowest = { player: name, turn: w.turn, game: w.game };
        }
      }
    }
    if (fastest) {
      out.push({
        id: 'fastest_win',
        player: fastest.player,
        value: String(fastest.turn),
        gameNumber: fastest.game,
      });
    }
    if (slowest) {
      out.push({
        id: 'slowest_win',
        player: slowest.player,
        value: String(slowest.turn),
        gameNumber: slowest.game,
      });
    }

    const allCapsWins = pickMax(
      stats,
      (s) => s.wins,
      (s) => s.wins >= 2 && s.winsNoCaps === 0,
    );
    if (allCapsWins) {
      push('wins_all_with_caps', allCapsWins, String(allCapsWins.stat.wins), {
        games: allCapsWins.stat.played,
      });
    }

    const capsInOne = pickMax(stats, (s) => s.maxCapsInWin, (s) => s.maxCapsInWin >= 2);
    if (capsInOne) {
      push('most_caps_single_win', capsInOne, String(capsInOne.stat.maxCapsInWin), {
        gameNumber: capsInOne.stat.maxCapsInWinGame,
      });
    }

    const mostCaps = pickMax(stats, (s) => s.caps, (s) => s.caps > 0);
    if (mostCaps) push('most_caps', mostCaps, String(mostCaps.stat.caps));

    const warmonger = pickMax(
      stats,
      (s) => s.warsDeclared,
      (s) => s.warsDeclKnown >= 3 && s.warsDeclared > 0,
    );
    if (warmonger) {
      push('most_wars_declared', warmonger, String(warmonger.stat.warsDeclared), {
        games: warmonger.stat.warsDeclKnown,
      });
    }

    const attacked = pickMax(
      stats,
      (s) => s.warsReceived,
      (s) => s.finaleGames >= 3 && s.warsReceived > 0,
    );
    if (attacked) {
      push('most_wars_received', attacked, String(attacked.stat.warsReceived), {
        games: attacked.stat.finaleGames,
      });
    }

    const deaths = pickMax(
      stats,
      (s) => s.deaths,
      (s) => s.deathsKnownGames >= 1 && s.deaths > 0,
    );
    if (deaths) push('most_military_deaths', deaths, String(deaths.stat.deaths));

    const fewestDeaths = pickMin(
      stats,
      (s) => s.deaths,
      (s) => s.deathsKnownGames >= 5,
    );
    if (fewestDeaths) {
      push('fewest_military_deaths', fewestDeaths, String(fewestDeaths.stat.deaths), {
        games: fewestDeaths.stat.deathsKnownGames,
      });
    }

    const pietyCount = pickMax(stats, (s) => s.pietyCount, (s) => s.pietyCount >= 2);
    if (pietyCount) {
      push('piety_first_count', pietyCount, String(pietyCount.stat.pietyCount), {
        games: pietyCount.stat.played,
      });
    }

    const pietyStreak = pickMax(stats, (s) => s.pietyStreak, (s) => s.pietyStreak >= 2);
    if (pietyStreak) {
      push('piety_first_streak', pietyStreak, String(pietyStreak.stat.pietyStreak));
    }

    const tradition = pickMax(stats, (s) => s.traditionCount, (s) => s.traditionCount >= 3);
    if (tradition) {
      push('tradition_first_count', tradition, String(tradition.stat.traditionCount), {
        games: tradition.stat.played,
      });
    }

    const liberty = pickMax(stats, (s) => s.libertyCount, (s) => s.libertyCount >= 3);
    if (liberty) {
      push('liberty_first_count', liberty, String(liberty.stat.libertyCount), {
        games: liberty.stat.played,
      });
    }

    const honor = pickMax(stats, (s) => s.honorCount, (s) => s.honorCount >= 2);
    if (honor) {
      push('honor_first_count', honor, String(honor.stat.honorCount), {
        games: honor.stat.played,
      });
    }

    const orderIdeo = pickMax(stats, (s) => s.orderCount, (s) => s.orderCount >= 2);
    if (orderIdeo) {
      push('ideology_order_count', orderIdeo, String(orderIdeo.stat.orderCount), {
        games: orderIdeo.stat.played,
      });
    }

    const freedomIdeo = pickMax(stats, (s) => s.freedomCount, (s) => s.freedomCount >= 2);
    if (freedomIdeo) {
      push('ideology_freedom_count', freedomIdeo, String(freedomIdeo.stat.freedomCount), {
        games: freedomIdeo.stat.played,
      });
    }

    const autoIdeo = pickMax(stats, (s) => s.autocracyCount, (s) => s.autocracyCount >= 2);
    if (autoIdeo) {
      push('ideology_autocracy_count', autoIdeo, String(autoIdeo.stat.autocracyCount), {
        games: autoIdeo.stat.played,
      });
    }

    const wonders = pickMax(stats, (s) => s.wondersBuilt, (s) => s.wondersBuilt > 0);
    if (wonders) push('most_wonders_built', wonders, String(wonders.stat.wondersBuilt));

    // First win while owning a self-built Statue of Zeus (may stay vacant).
    // Первая победа с собственно построенной Статуей Зевса (может быть пустой).
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
      });
    } else {
      out.push({
        id: 'zeus_statue_win',
        player: '',
        value: '—',
        vacant: true,
      });
    }

    const wondersOwned = pickMax(stats, (s) => s.wondersOwned, (s) => s.wondersOwned > 0);
    if (wondersOwned) {
      push('most_wonders_owned', wondersOwned, String(wondersOwned.stat.wondersOwned));
    }

    const uniqueNations = pickMax(
      stats,
      (s) => s.nations.size,
      (s) => s.played >= 5 && s.nations.size >= 5,
    );
    if (uniqueNations) {
      push('most_unique_nations', uniqueNations, String(uniqueNations.stat.nations.size), {
        games: uniqueNations.stat.played,
      });
    }

    const noWin = pickMax(stats, (s) => s.played, (s) => s.played >= 5 && s.wins === 0);
    if (noWin) push('most_games_no_win', noWin, String(noWin.stat.played));

    const survivor = pickMax(
      stats,
      (s) => s.finaleGames,
      (s) => s.finaleGames >= 3 && s.elim === 0,
    );
    if (survivor) push('never_eliminated', survivor, String(survivor.stat.finaleGames));

    const pacifist = pickMax(
      stats,
      (s) => s.warsDeclZero,
      (s) => s.warsDeclKnown >= 5,
    );
    if (pacifist) {
      push(
        'pacifist_games',
        pacifist,
        `${pacifist.stat.warsDeclZero}/${pacifist.stat.warsDeclKnown}`,
        { games: pacifist.stat.warsDeclKnown },
      );
    }

    const noCapSurvive = pickMax(
      stats,
      (s) => s.survivedNoCap,
      (s) => s.survivedNoCap >= 1,
    );
    if (noCapSurvive) {
      push('survived_no_capital', noCapSurvive, String(noCapSurvive.stat.survivedNoCap));
    }

    const maxCities = pickMax(stats, (s) => s.maxCities, (s) => s.maxCities > 0);
    if (maxCities) {
      push('max_cities_finale', maxCities, String(maxCities.stat.maxCities), {
        gameNumber: maxCities.stat.maxCitiesGame,
      });
    }

    const maxScore = pickMax(stats, (s) => s.maxScore, (s) => s.maxScore > 0);
    if (maxScore) {
      push('max_score_finale', maxScore, String(maxScore.stat.maxScore), {
        gameNumber: maxScore.stat.maxScoreGame,
      });
    }

    const maxUnits = pickMax(stats, (s) => s.maxUnits, (s) => s.maxUnits > 0);
    if (maxUnits) {
      push('max_units_finale', maxUnits, String(maxUnits.stat.maxUnits), {
        gameNumber: maxUnits.stat.maxUnitsGame,
      });
    }

    const maxTechs = pickMax(stats, (s) => s.maxTechs, (s) => s.maxTechs > 0);
    if (maxTechs) {
      push('max_techs_finale', maxTechs, String(maxTechs.stat.maxTechs), {
        gameNumber: maxTechs.stat.maxTechsGame,
      });
    }

    // Meta-record: most other records held (computed after the rest).
    // Мета-рекорд: больше всего остальных рекордов (считаем после остальных).
    const achCounts = new Map();
    for (const item of out) {
      const name = item && item.player;
      if (!name || item.vacant) continue;
      achCounts.set(name, (achCounts.get(name) || 0) + 1);
    }
    let mostTitled = null;
    let mostTitledCount = 0;
    for (const [player, count] of achCounts) {
      if (
        count > mostTitledCount
        || (count === mostTitledCount && mostTitled && player.localeCompare(mostTitled.player) < 0)
      ) {
        mostTitledCount = count;
        mostTitled = { player, stat: { count } };
      }
    }
    if (mostTitled && mostTitledCount >= 2) {
      push('most_achievements', mostTitled, String(mostTitledCount));
    }

    return out;
  }

  global.IronLeagueAchievements = {
    computeAchievements,
    isExcludedGame,
    eligibleGames,
    winnerPlayer,
  };
})(typeof window !== 'undefined' ? window : globalThis);
