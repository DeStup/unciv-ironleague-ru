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

  /**
   * Shared Games.json helpers (IronLeagueGamesCore): flags, exclusion rules,
   * parseGameNum, eligibleGames. Local fallback keeps achievements usable even
   * if the shared module failed to load.
   */
  function gameFlags(game) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.gameFlags) {
      return IronLeagueGamesCore.gameFlags(game);
    }
    return Array.isArray(game.flags) ? game.flags.map(String) : [];
  }

  function isTournamentGame(game) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.isTournamentGame) {
      return IronLeagueGamesCore.isTournamentGame(game);
    }
    if (game && String(game.tournamentName || '').trim()) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('tournament');
  }

  function isExcludedGame(game) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.isExcludedGame) {
      return IronLeagueGamesCore.isExcludedGame(game);
    }
    if (game && game.excludeFromStats) return true;
    if (isTournamentGame(game)) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('teams') || flags.includes('scrap') || flags.includes('team');
  }

  function parseGameNum(game) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.parseGameNum) {
      return IronLeagueGamesCore.parseGameNum(game);
    }
    const id = Number(game && game.id);
    if (Number.isFinite(id) && id >= 1) return id;
    const m = String((game && game.number) || '').match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function eligibleGames(games) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.eligibleGames) {
      return IronLeagueGamesCore.eligibleGames(games);
    }
    return (games || [])
      .filter((g) => !isExcludedGame(g))
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /** Tournament pool for duel records (does not apply FFA isExcludedGame). */
  function duelEligibleGames(games) {
    const source = (games || []).filter(isTournamentGame);
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.poolEligibleGames) {
      return IronLeagueGamesCore.poolEligibleGames(source);
    }
    return source
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  function isFinalMatch(game) {
    const code = `${game && game.matchId != null ? game.matchId : ''} ${
      game && game.matchCode != null ? game.matchCode : ''
    } ${game && game.number != null ? game.number : ''}`.toLowerCase();
    return /\bgf\b/.test(code) || code.includes('final') || code.includes('grand');
  }

  /** Cheap fingerprint so we recompute only when archive content / pool changes. */
  function gamesFingerprint(games) {
    if (!games || !games.length) return '0';
    let parts = [String(games.length)];
    for (const g of games) {
      const survivors = Array.isArray(g.survivors) ? g.survivors : [];
      let scoreSum = 0;
      let deathsSum = 0;
      for (const s of survivors) {
        const sc = Number(s && s.score);
        if (Number.isFinite(sc)) scoreSum += sc;
        const d = Number(s && s.military_deaths);
        if (Number.isFinite(d)) deathsSum += d;
      }
      parts.push(
        [
          g.id,
          g.number,
          g.endedOnTurn,
          g.winner,
          g.victoryType,
          g.bugCount != null ? g.bugCount : g.bugsFound,
          survivors.length,
          Array.isArray(g.players) ? g.players.length : 0,
          Math.round(scoreSum),
          Math.round(deathsSum),
        ].join(':'),
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
    const nation = resolveWinnerNation(game);
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

  function resolveWinnerNation(game) {
    if (window.IronLeagueGamesCore && IronLeagueGamesCore.resolveWinnerNation) {
      return IronLeagueGamesCore.resolveWinnerNation(game);
    }
    return String((game && game.winner) || '').trim();
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
      maxStrength: 0,
      maxStrengthGame: null,
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
      maxGreatMerchants: 0,
      maxGreatMerchantsGame: null,
      maxGreatAdmirals: 0,
      maxGreatAdmiralsGame: null,
      maxGreatCulturePeople: 0,
      maxGreatCulturePeopleGame: null,
      maxMilitaryDeathsSingle: 0,
      maxMilitaryDeathsSingleGame: null,
      capitalTakes: 0,
      maxWondersOneTurn: 0,
      maxWondersOneTurnGame: null,
      minIdeologyTurn: Infinity,
      minIdeologyTurnGame: null,
      maxIdeologyTurnWin: 0,
      maxIdeologyTurnWinGame: null,
      winsByNation: new Map(),
      underdogWins: 0,
      wonderRaceLosses: 0,
      noWarWins: 0,
      deathsInWins: 0,
      deathsInWinsKnown: 0,
      tournamentTitles: 0,
      sweepSeries: 0,
      winNations: new Set(),
      capitalOnlyWins: 0,
      capitalOnlyWinGame: null,
      noCapitalWins: 0,
      noCapitalWinGame: null,
      techLeadLosses: 0,
      maxTechLeadLoss: 0,
      maxTechLeadLossGame: null,
      nationPlayCounts: new Map(),
      comebackWins: 0,
      comebackWinGame: null,
      empireWins: 0,
      empireWinGame: null,
      fiascoGames: 0,
      fiascoGame: null,
      maxFiascoLosses: 0,
    };
  }

  /** Worker+Settler losses in one game (optional finale fields). */
  function civilianFiascoCount(row) {
    if (!row || typeof row !== 'object') return null;
    const direct = Number(
      row.worker_settler_deaths != null ? row.worker_settler_deaths
        : row.civilian_deaths != null ? row.civilian_deaths
          : NaN,
    );
    if (Number.isFinite(direct) && direct >= 0) return direct;
    const ud = row.unit_deaths;
    if (ud && typeof ud === 'object') {
      const keys = ['Worker', 'Settler', 'worker', 'settler', 'Рабочий', 'Поселенец'];
      let sum = 0;
      let any = false;
      for (const k of keys) {
        if (ud[k] == null) continue;
        const n = Number(ud[k]);
        if (!Number.isFinite(n)) continue;
        any = true;
        sum += n;
      }
      if (any) return sum;
    }
    return null;
  }

  /** City-states conquered this game (optional fields; ГГ in RU slang). */
  function cityStatesCaptured(row) {
    if (!row || typeof row !== 'object') return null;
    if (Array.isArray(row.conquered_city_states)) {
      return row.conquered_city_states.filter(Boolean).length;
    }
    const n = Number(
      row.city_states_captured != null ? row.city_states_captured
        : row.city_states_conquered != null ? row.city_states_conquered
          : NaN,
    );
    return Number.isFinite(n) && n >= 0 ? n : null;
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

  function playerNameByNation(game, nation) {
    const want = String(nation || '').trim();
    if (!want) return null;
    for (const s of game.survivors || []) {
      if (String(s.nation || '').trim() !== want) continue;
      const name = String(s.name || '').trim();
      if (name && !isBarbarianName(name) && !s.is_barbarian) return name;
    }
    for (const p of game.players || []) {
      if (String(p.nation || '').trim() !== want) continue;
      const name = String(p.name || '').trim();
      if (name && !isBarbarianName(name)) return name;
    }
    return null;
  }

  function militaryDeathsInCap(game, row) {
    if (!row || !Number.isFinite(Number(row.military_deaths))) return null;
    const deathsVal = Number(row.military_deaths);
    const endedTurn = Number(game && game.endedOnTurn);
    const turnCap = Number.isFinite(endedTurn) ? endedTurn * 3 : 400;
    const cap = Math.max(250, turnCap);
    if (deathsVal < 0 || deathsVal > cap) return null;
    return deathsVal;
  }

  function buildStats(games, listOverride) {
    const list = Array.isArray(listOverride) ? listOverride : eligibleGames(games);
    const stats = new Map();
    // Chronological: first league win for a civilization counts as underdog/pioneer.
    const nationWinsSoFar = new Map();

    function ensure(name) {
      if (!stats.has(name)) stats.set(name, emptyStat());
      return stats.get(name);
    }

    for (let gi = 0; gi < list.length; gi += 1) {
      const game = list[gi];
      const wp = winnerPlayer(game);
      const turn = Number(game.endedOnTurn);
      const gNum = parseGameNum(game);

      // Credit capital takes before per-player loop (one event per eliminated capital).
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        const capBy = String(s.capital_taken_by || '').trim();
        if (!capBy) continue;
        const killer = playerNameByNation(game, capBy);
        if (!killer) continue;
        ensure(killer).capitalTakes += 1;
      }

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

        // Nation pick from roster (patriot / hopper), even without finale row.
        let pickNation = '';
        for (const p of game.players || []) {
          if (String(p.name || '').trim() === name) {
            pickNation = String(p.nation || '').trim();
            break;
          }
        }
        if (!pickNation && row) pickNation = String(row.nation || '').trim();
        if (pickNation) {
          s.nations.add(pickNation);
          // Avoid double-count when row also adds below — track once here.
          if (!row) {
            s.nationPlayCounts.set(pickNation, (s.nationPlayCounts.get(pickNation) || 0) + 1);
          }
        }

        if (won) {
          s.wins += 1;
          s.winRun += 1;
          s.winStreak = Math.max(s.winStreak, s.winRun);
        } else {
          s.winRun = 0;
        }

        const fiascoN = civilianFiascoCount(row);
        if (fiascoN != null && fiascoN >= 2) {
          s.fiascoGames += 1;
          if (fiascoN > s.maxFiascoLosses) {
            s.maxFiascoLosses = fiascoN;
            s.fiascoGame = gNum;
          }
        }

        if (row) {
          s.finaleGames += 1;
          const caps = Array.isArray(row.conquered_capitals) ? row.conquered_capitals.length : 0;
          s.caps += caps;
          const deathsVal = militaryDeathsInCap(game, row);
          if (deathsVal != null) {
            s.deathsKnownGames += 1;
            s.deaths += deathsVal;
            if (won) {
              s.deathsInWinsKnown += 1;
              s.deathsInWins += deathsVal;
            }
            if (!isBarbarianName(name) && !row.is_barbarian) {
              bumpPeak(s, 'maxMilitaryDeathsSingle', 'maxMilitaryDeathsSingleGame', deathsVal, gNum);
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
          const nat = String(row.nation || '').trim() || pickNation;
          if (nat) {
            s.nations.add(nat);
            s.nationPlayCounts.set(nat, (s.nationPlayCounts.get(nat) || 0) + 1);
          }
          bumpPeak(s, 'maxCities', 'maxCitiesGame', row.cities, gNum);
          bumpPeak(s, 'maxScore', 'maxScoreGame', row.score, gNum);
          bumpPeak(s, 'maxUnits', 'maxUnitsGame', row.units, gNum);
          bumpPeak(s, 'maxStrength', 'maxStrengthGame', row.strength, gNum);
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
          bumpPeak(s, 'maxGreatMerchants', 'maxGreatMerchantsGame', gpTypeCount(row, 'Merchant'), gNum);
          bumpPeak(s, 'maxGreatAdmirals', 'maxGreatAdmiralsGame', gpTypeCount(row, 'Admiral'), gNum);
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
          if (caps <= 0) s.winsNoCaps += 1;
          if (caps > s.maxCapsInWin) {
            s.maxCapsInWin = caps;
            s.maxCapsInWinGame = gNum;
          }
          if (Number.isFinite(turn) && turn > 0) {
            s.winTurns.push({ turn, game: gNum });
          }
          const winNation = String((row && row.nation) || resolveWinnerNation(game) || '').trim();
          if (winNation) {
            s.winsByNation.set(winNation, (s.winsByNation.get(winNation) || 0) + 1);
            s.winNations.add(winNation);
            const prior = nationWinsSoFar.get(winNation) || 0;
            if (prior === 0) s.underdogWins += 1;
            nationWinsSoFar.set(winNation, prior + 1);
          }
          if (row && Number.isFinite(Number(row.wars_declared)) && Number(row.wars_declared) === 0) {
            s.noWarWins += 1;
          }
          if (row && Number.isFinite(Number(row.ideology_turn)) && Number(row.ideology_turn) > 0) {
            const ideoTurn = Number(row.ideology_turn);
            if (ideoTurn > s.maxIdeologyTurnWin) {
              s.maxIdeologyTurnWin = ideoTurn;
              s.maxIdeologyTurnWinGame = gNum;
            }
          }
          // One-city (capital-only) win / win after losing the capital.
          if (row && Number(row.cities) === 1 && row.has_capital !== false) {
            s.capitalOnlyWins += 1;
            s.capitalOnlyWinGame = gNum;
          }
          if (row && row.has_capital === false) {
            s.noCapitalWins += 1;
            s.noCapitalWinGame = gNum;
          }
          // Comeback: won after being first to lose the capital (best city-loss proxy).
          if (row && Number.isFinite(Number(row.capital_lost_turn))) {
            const myLost = Number(row.capital_lost_turn);
            let wasFirst = myLost > 0;
            for (const other of game.survivors || []) {
              if (String(other.name || '').trim() === name) continue;
              const ot = Number(other.capital_lost_turn);
              if (Number.isFinite(ot) && ot > 0 && ot < myLost) {
                wasFirst = false;
                break;
              }
            }
            if (wasFirst) {
              s.comebackWins += 1;
              s.comebackWinGame = gNum;
            }
          }
          // Empire: capture all city-states (ГГ) when tracked, else all rival capitals.
          const csCap = cityStatesCaptured(row);
          if (csCap != null && csCap > 0) {
            // Prefer explicit CS count when present (any positive CS wipe counts as progress;
            // "all" is recorded when field city_states_total matches, else any wipe).
            const csTotal = Number(row.city_states_total);
            if (!Number.isFinite(csTotal) || csCap >= csTotal) {
              s.empireWins += 1;
              s.empireWinGame = gNum;
            }
          } else if (row) {
            const opponents = playerNames(game).filter((n) => n !== name);
            if (opponents.length) {
              const caps = Array.isArray(row.conquered_capitals) ? row.conquered_capitals : [];
              const captured = new Set(
                caps.map((c) => String((c && c.nation) || '').trim()).filter(Boolean),
              );
              const allTaken = opponents.every((opp) => {
                const oRow = survivorByName(game, opp);
                if (oRow && oRow.has_capital === false) return true;
                let oppNation = '';
                for (const p of game.players || []) {
                  if (String(p.name || '').trim() === opp) {
                    oppNation = String(p.nation || '').trim();
                    break;
                  }
                }
                if (!oppNation && oRow) oppNation = String(oRow.nation || '').trim();
                return oppNation && captured.has(oppNation);
              });
              if (allTaken) {
                s.empireWins += 1;
                s.empireWinGame = gNum;
              }
            }
          }
          if (isFinalMatch(game)) s.tournamentTitles += 1;
        } else if (row && wp) {
          // Lost with more wonders owned than the winner.
          const myW = Array.isArray(row.wonders) ? row.wonders.length : 0;
          const wRow = survivorByName(game, wp);
          const theirW = wRow && Array.isArray(wRow.wonders) ? wRow.wonders.length : 0;
          if (myW > theirW && myW > 0) s.wonderRaceLosses += 1;

          // Lost despite a large tech lead over the winner (duel curiosities).
          const myTechs = Number(row.techs);
          const theirTechs = wRow != null ? Number(wRow.techs) : NaN;
          if (Number.isFinite(myTechs) && Number.isFinite(theirTechs)) {
            const lead = myTechs - theirTechs;
            if (lead >= 10) {
              s.techLeadLosses += 1;
              if (lead > s.maxTechLeadLoss) {
                s.maxTechLeadLoss = lead;
                s.maxTechLeadLossGame = gNum;
              }
            }
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

  /** Shared nation/game helpers + ranked record emitter for FFA and duel. */
  function createRecordEmitter(gameList, out) {
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

    function withGame(hits, gameFromHit) {
      return (hits || []).map((h) => {
        const g = typeof gameFromHit === 'function' ? gameFromHit(h) : gameFromHit;
        if (g == null || !Number.isFinite(Number(g))) return h;
        return Object.assign({}, h, { game: Number(g) });
      });
    }

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

    function pushOrVacant(id, hits, valueFn, extraFn) {
      if (hits && hits.length) {
        pushTop(id, hits, valueFn, extraFn);
      } else {
        out.push({
          id,
          player: '',
          value: '—',
          vacant: true,
        });
      }
    }

    return { nationAtGame, withGame, pushTop, pushOrVacant };
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
    const { nationAtGame, withGame, pushTop } = createRecordEmitter(gameList, out);

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
      'max_military_deaths_single',
      withGame(
        pickTop(
          stats,
          (s) => s.maxMilitaryDeathsSingle,
          (s) => s.maxMilitaryDeathsSingle >= 40,
        ),
        (h) => h.stat.maxMilitaryDeathsSingleGame,
      ),
      (h) => String(h.stat.maxMilitaryDeathsSingle),
      (h) => ({ gameNumber: h.stat.maxMilitaryDeathsSingleGame }),
    );

    pushTop(
      'most_capital_takes',
      pickTop(stats, (s) => s.capitalTakes, (s) => s.capitalTakes >= 2),
      (h) => String(h.stat.capitalTakes),
      (h) => ({ games: h.stat.played }),
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
      'max_strength_finale',
      withGame(
        pickTop(stats, (s) => s.maxStrength, (s) => s.maxStrength > 0),
        (h) => h.stat.maxStrengthGame,
      ),
      (h) => String(h.stat.maxStrength),
      (h) => ({ gameNumber: h.stat.maxStrengthGame }),
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
      'most_great_merchants_finale',
      withGame(
        pickTop(stats, (s) => s.maxGreatMerchants, (s) => s.maxGreatMerchants > 0),
        (h) => h.stat.maxGreatMerchantsGame,
      ),
      (h) => String(h.stat.maxGreatMerchants),
      (h) => ({ gameNumber: h.stat.maxGreatMerchantsGame }),
    );

    pushTop(
      'most_great_admirals_finale',
      withGame(
        pickTop(stats, (s) => s.maxGreatAdmirals, (s) => s.maxGreatAdmirals > 0),
        (h) => h.stat.maxGreatAdmiralsGame,
      ),
      (h) => String(h.stat.maxGreatAdmirals),
      (h) => ({ gameNumber: h.stat.maxGreatAdmiralsGame }),
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

    // Wins with the same nation (max over player's nation win counts).
    pushTop(
      'most_wins_same_nation',
      pickTop(
        stats,
        (s) => Math.max(0, ...[...s.winsByNation.values()], 0),
        (s) => s.winsByNation.size > 0 && Math.max(0, ...s.winsByNation.values()) >= 2,
      ),
      (h) => String(Math.max(0, ...h.stat.winsByNation.values())),
      (h) => {
        let bestNat = '';
        let best = 0;
        for (const [nat, n] of h.stat.winsByNation) {
          if (n > best) {
            best = n;
            bestNat = nat;
          }
        }
        return { nation: bestNat, games: h.stat.played };
      },
    );

    // Underdog proxy: wins with a nation that has the fewest wins in the archive.
    pushTop(
      'underdog_win',
      pickTop(stats, (s) => s.underdogWins, (s) => s.underdogWins > 0),
      (h) => String(h.stat.underdogWins),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'wonder_race_loss',
      pickTop(stats, (s) => s.wonderRaceLosses, (s) => s.wonderRaceLosses > 0),
      (h) => String(h.stat.wonderRaceLosses),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'no_war_win',
      pickTop(stats, (s) => s.noWarWins, (s) => s.noWarWins > 0),
      (h) => String(h.stat.noWarWins),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'late_ideology_win',
      withGame(
        pickTop(
          stats,
          (s) => s.maxIdeologyTurnWin,
          (s) => s.maxIdeologyTurnWin > 0,
        ),
        (h) => h.stat.maxIdeologyTurnWinGame,
      ),
      (h) => String(h.stat.maxIdeologyTurnWin),
      (h) => ({ gameNumber: h.stat.maxIdeologyTurnWinGame }),
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

  let duelCacheKey = '';
  let duelCacheItems = null;

  /**
   * Duel / tournament records from tournament-flagged games only.
   * Separate cache from FFA computeAchievements.
   */
  function computeDuelAchievements(games) {
    const key = `duel|${gamesFingerprint(games)}`;
    if (duelCacheKey === key && duelCacheItems) {
      return duelCacheItems;
    }

    const list = duelEligibleGames(games);
    const { stats, games: gameList } = buildStats(games, list);
    const out = [];
    const { withGame, pushTop, pushOrVacant } = createRecordEmitter(gameList, out);

    pushTop(
      'duel_most_wins',
      pickTop(stats, (s) => s.wins, (s) => s.wins > 0),
      (h) => String(h.stat.wins),
      (h) => ({ games: h.stat.played }),
    );

    pushTop(
      'duel_best_winrate',
      pickTop(
        stats,
        (s) => s.wins / s.played + s.played * 1e-9,
        (s) => s.played >= 5 && s.wins > 0,
      ),
      (h) => `${Math.round((h.stat.wins / h.stat.played) * 1000) / 10}%`,
      (h) => ({ games: h.stat.played, wins: h.stat.wins }),
    );

    pushTop(
      'duel_longest_win_streak',
      pickTop(stats, (s) => s.winStreak, (s) => s.winStreak >= 2),
      (h) => String(h.stat.winStreak),
    );

    const winTurns = [];
    for (const [name, s] of stats) {
      for (const w of s.winTurns) {
        winTurns.push({ player: name, turn: w.turn, game: w.game });
      }
    }
    pushTop(
      'duel_fastest_win',
      winTurns
        .slice()
        .sort((a, b) => (a.turn - b.turn) || a.player.localeCompare(b.player))
        .slice(0, 3)
        .map((w) => ({ player: w.player, stat: w, score: -w.turn, game: w.game })),
      (h) => String(h.stat.turn),
      (h) => ({ gameNumber: h.game }),
    );
    pushTop(
      'duel_slowest_win',
      winTurns
        .slice()
        .sort((a, b) => (b.turn - a.turn) || a.player.localeCompare(b.player))
        .slice(0, 3)
        .map((w) => ({ player: w.player, stat: w, score: w.turn, game: w.game })),
      (h) => String(h.stat.turn),
      (h) => ({ gameNumber: h.game }),
    );

    pushTop(
      'duel_most_military_deaths',
      pickTop(
        stats,
        (s) => s.deaths,
        (s) => s.deathsKnownGames >= 1 && s.deaths > 0,
      ),
      (h) => String(h.stat.deaths),
    );

    pushTop(
      'duel_fewest_military_deaths',
      pickTopMin(
        stats,
        (s) => s.deathsInWins,
        (s) => s.deathsInWinsKnown >= 3,
      ),
      (h) => String(h.stat.deathsInWins),
      (h) => ({ games: h.stat.deathsInWinsKnown }),
    );

    pushTop(
      'duel_most_wonders_built',
      pickTop(stats, (s) => s.wondersBuilt, (s) => s.wondersBuilt > 0),
      (h) => String(h.stat.wondersBuilt),
    );

    pushTop(
      'duel_fastest_ideology',
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

    pushTop(
      'duel_max_score_finale',
      withGame(pickTop(stats, (s) => s.maxScore, (s) => s.maxScore > 0), (h) => h.stat.maxScoreGame),
      (h) => String(h.stat.maxScore),
      (h) => ({ gameNumber: h.stat.maxScoreGame }),
    );
    pushTop(
      'duel_max_strength_finale',
      withGame(
        pickTop(stats, (s) => s.maxStrength, (s) => s.maxStrength > 0),
        (h) => h.stat.maxStrengthGame,
      ),
      (h) => String(h.stat.maxStrength),
      (h) => ({ gameNumber: h.stat.maxStrengthGame }),
    );
    pushTop(
      'duel_max_units_finale',
      withGame(pickTop(stats, (s) => s.maxUnits, (s) => s.maxUnits > 0), (h) => h.stat.maxUnitsGame),
      (h) => String(h.stat.maxUnits),
      (h) => ({ gameNumber: h.stat.maxUnitsGame }),
    );
    pushTop(
      'duel_max_techs_finale',
      withGame(pickTop(stats, (s) => s.maxTechs, (s) => s.maxTechs > 0), (h) => h.stat.maxTechsGame),
      (h) => String(h.stat.maxTechs),
      (h) => ({ gameNumber: h.stat.maxTechsGame }),
    );
    pushTop(
      'duel_max_science_finale',
      withGame(pickTop(stats, (s) => s.maxScience, (s) => s.maxScience > 0), (h) => h.stat.maxScienceGame),
      (h) => String(h.stat.maxScience),
      (h) => ({ gameNumber: h.stat.maxScienceGame }),
    );
    pushTop(
      'duel_max_culture_finale',
      withGame(pickTop(stats, (s) => s.maxCulture, (s) => s.maxCulture > 0), (h) => h.stat.maxCultureGame),
      (h) => String(h.stat.maxCulture),
      (h) => ({ gameNumber: h.stat.maxCultureGame }),
    );
    pushTop(
      'duel_max_production_finale',
      withGame(pickTop(stats, (s) => s.maxProduction, (s) => s.maxProduction > 0), (h) => h.stat.maxProductionGame),
      (h) => String(h.stat.maxProduction),
      (h) => ({ gameNumber: h.stat.maxProductionGame }),
    );
    pushTop(
      'duel_max_gold_finale',
      withGame(pickTop(stats, (s) => s.maxGold, (s) => s.maxGold > 0), (h) => h.stat.maxGoldGame),
      (h) => String(h.stat.maxGold),
      (h) => ({ gameNumber: h.stat.maxGoldGame }),
    );

    pushTop(
      'duel_tournament_titles',
      pickTop(stats, (s) => s.tournamentTitles, (s) => s.tournamentTitles > 0),
      (h) => String(h.stat.tournamentTitles),
      (h) => ({ games: h.stat.played }),
    );

    // Sweep: won every game in a series (same matchId, seriesGame present).
    const seriesMap = new Map();
    for (const game of gameList) {
      const mid = String(game.matchId || '').trim();
      if (!mid || game.seriesGame == null || game.seriesGame === '') continue;
      if (!seriesMap.has(mid)) seriesMap.set(mid, []);
      seriesMap.get(mid).push(game);
    }
    const sweepCounts = new Map();
    for (const [, series] of seriesMap) {
      if (series.length < 2) continue;
      const winners = series.map((g) => winnerPlayer(g)).filter(Boolean);
      if (!winners.length || winners.some((w) => w !== winners[0])) continue;
      const champ = winners[0];
      sweepCounts.set(champ, (sweepCounts.get(champ) || 0) + 1);
    }
    for (const [name, n] of sweepCounts) {
      const s = stats.get(name);
      if (s) s.sweepSeries = n;
    }
    pushTop(
      'duel_sweep',
      pickTop(stats, (s) => s.sweepSeries, (s) => s.sweepSeries > 0),
      (h) => String(h.stat.sweepSeries),
    );

    // Rematch king / nemesis from pairwise H2H.
    const vsPlayed = new Map();
    const vsLosses = new Map();
    function pairKey(a, b) {
      return a < b ? `${a}\0${b}` : `${b}\0${a}`;
    }
    for (const game of gameList) {
      const names = playerNames(game);
      if (names.length !== 2) continue;
      const [a, b] = names;
      const pk = pairKey(a, b);
      vsPlayed.set(pk, (vsPlayed.get(pk) || 0) + 1);
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const loser = wp === a ? b : wp === b ? a : null;
      if (!loser) continue;
      const lk = `${loser}\0${wp}`;
      vsLosses.set(lk, (vsLosses.get(lk) || 0) + 1);
    }
    const rematchHits = [...vsPlayed.entries()]
      .filter(([, n]) => n >= 3)
      .map(([pk, n]) => {
        const [a, b] = pk.split('\0');
        return { player: a, opponent: b, score: n, stat: { n, opponent: b } };
      })
      .concat(
        [...vsPlayed.entries()]
          .filter(([, n]) => n >= 3)
          .map(([pk, n]) => {
            const [a, b] = pk.split('\0');
            return { player: b, opponent: a, score: n, stat: { n, opponent: a } };
          }),
      )
      .sort((x, y) => (y.score - x.score) || x.player.localeCompare(y.player));
    // Deduplicate by player keeping best
    const rematchBest = new Map();
    for (const h of rematchHits) {
      if (!rematchBest.has(h.player) || rematchBest.get(h.player).score < h.score) {
        rematchBest.set(h.player, h);
      }
    }
    pushTop(
      'duel_rematch_king',
      [...rematchBest.values()]
        .sort((a, b) => (b.score - a.score) || a.player.localeCompare(b.player))
        .slice(0, 3),
      (h) => String(h.stat.n),
      (h) => ({ opponent: h.stat.opponent }),
    );

    const nemesisHits = [...vsLosses.entries()]
      .filter(([, n]) => n >= 2)
      .map(([lk, n]) => {
        const [loser, winner] = lk.split('\0');
        return { player: loser, score: n, stat: { n, opponent: winner } };
      })
      .sort((a, b) => (b.score - a.score) || a.player.localeCompare(b.player));
    const nemesisBest = new Map();
    for (const h of nemesisHits) {
      if (!nemesisBest.has(h.player) || nemesisBest.get(h.player).score < h.score) {
        nemesisBest.set(h.player, h);
      }
    }
    pushTop(
      'duel_nemesis',
      [...nemesisBest.values()]
        .sort((a, b) => (b.score - a.score) || a.player.localeCompare(b.player))
        .slice(0, 3),
      (h) => String(h.stat.n),
      (h) => ({ opponent: h.stat.opponent }),
    );

    pushTop(
      'duel_mirror',
      pickTop(
        stats,
        (s) => Math.max(0, ...[...s.winsByNation.values()], 0),
        (s) => s.winsByNation.size > 0 && Math.max(0, ...s.winsByNation.values()) >= 2,
      ),
      (h) => String(Math.max(0, ...h.stat.winsByNation.values())),
      (h) => {
        let bestNat = '';
        let best = 0;
        for (const [nat, n] of h.stat.winsByNation) {
          if (n > best) {
            best = n;
            bestNat = nat;
          }
        }
        return { nation: bestNat };
      },
    );

    pushTop(
      'duel_nation_hopper',
      pickTop(
        stats,
        (s) => s.winNations.size,
        (s) => s.winNations.size >= 3,
      ),
      (h) => String(h.stat.winNations.size),
      (h) => ({ games: h.stat.wins }),
    );

    pushOrVacant(
      'duel_capital_only_win',
      withGame(
        pickTop(stats, (s) => s.capitalOnlyWins, (s) => s.capitalOnlyWins > 0),
        (h) => h.stat.capitalOnlyWinGame,
      ),
      (h) => String(h.stat.capitalOnlyWins),
      (h) => ({ gameNumber: h.stat.capitalOnlyWinGame }),
    );

    pushOrVacant(
      'duel_no_capital_win',
      withGame(
        pickTop(stats, (s) => s.noCapitalWins, (s) => s.noCapitalWins > 0),
        (h) => h.stat.noCapitalWinGame,
      ),
      (h) => String(h.stat.noCapitalWins),
      (h) => ({ gameNumber: h.stat.noCapitalWinGame }),
    );

    pushOrVacant(
      'duel_tech_lead_loss',
      withGame(
        pickTop(stats, (s) => s.maxTechLeadLoss, (s) => s.maxTechLeadLoss >= 10),
        (h) => h.stat.maxTechLeadLossGame,
      ),
      (h) => String(h.stat.maxTechLeadLoss),
      (h) => ({
        gameNumber: h.stat.maxTechLeadLossGame,
        games: h.stat.techLeadLosses,
      }),
    );

    pushTop(
      'duel_patriot',
      pickTop(
        stats,
        (s) => Math.max(0, ...[...s.nationPlayCounts.values()], 0),
        (s) => Math.max(0, ...[...s.nationPlayCounts.values()], 0) >= 2,
      ),
      (h) => String(Math.max(0, ...h.stat.nationPlayCounts.values())),
      (h) => {
        let bestNat = '';
        let best = 0;
        for (const [nat, n] of h.stat.nationPlayCounts) {
          if (n > best) {
            best = n;
            bestNat = nat;
          }
        }
        return { nation: bestNat, games: h.stat.played };
      },
    );

    pushOrVacant(
      'duel_fiasco',
      withGame(
        pickTop(stats, (s) => s.fiascoGames, (s) => s.fiascoGames > 0),
        (h) => h.stat.fiascoGame,
      ),
      (h) => String(h.stat.maxFiascoLosses || h.stat.fiascoGames),
      (h) => ({ gameNumber: h.stat.fiascoGame, games: h.stat.fiascoGames }),
    );

    pushOrVacant(
      'duel_empire',
      withGame(
        pickTop(stats, (s) => s.empireWins, (s) => s.empireWins > 0),
        (h) => h.stat.empireWinGame,
      ),
      (h) => String(h.stat.empireWins),
      (h) => ({ gameNumber: h.stat.empireWinGame }),
    );

    pushOrVacant(
      'duel_comeback',
      withGame(
        pickTop(stats, (s) => s.comebackWins, (s) => s.comebackWins > 0),
        (h) => h.stat.comebackWinGame,
      ),
      (h) => String(h.stat.comebackWins),
      (h) => ({ gameNumber: h.stat.comebackWinGame }),
    );

    pushTop(
      'duel_tradition_first',
      pickTop(stats, (s) => s.traditionCount, (s) => s.traditionCount >= 1),
      (h) => String(h.stat.traditionCount),
      (h) => ({ games: h.stat.played }),
    );
    pushTop(
      'duel_liberty_first',
      pickTop(stats, (s) => s.libertyCount, (s) => s.libertyCount >= 1),
      (h) => String(h.stat.libertyCount),
      (h) => ({ games: h.stat.played }),
    );
    pushTop(
      'duel_honor_first',
      pickTop(stats, (s) => s.honorCount, (s) => s.honorCount >= 1),
      (h) => String(h.stat.honorCount),
      (h) => ({ games: h.stat.played }),
    );
    pushTop(
      'duel_piety_first',
      pickTop(stats, (s) => s.pietyCount, (s) => s.pietyCount >= 1),
      (h) => String(h.stat.pietyCount),
      (h) => ({ games: h.stat.played }),
    );

    // Shortest grand final (or any final match) by endedOnTurn.
    const finalHits = [];
    for (const game of gameList) {
      if (!isFinalMatch(game)) continue;
      const turn = Number(game.endedOnTurn);
      if (!Number.isFinite(turn) || turn <= 0) continue;
      const wp = winnerPlayer(game);
      if (!wp) continue;
      finalHits.push({
        player: wp,
        turn,
        game: parseGameNum(game),
        score: -turn,
      });
    }
    finalHits.sort((a, b) => (a.turn - b.turn) || a.player.localeCompare(b.player));
    pushOrVacant(
      'duel_shortest_final',
      withGame(finalHits.slice(0, 3), (h) => h.game),
      (h) => String(h.turn),
      (h) => ({ gameNumber: h.game }),
    );

    duelCacheKey = key;
    duelCacheItems = out;
    return out;
  }

  let epicCacheKey = '';
  let epicCacheItems = null;

  function victoryKey(game) {
    return String((game && game.victoryType) || '').trim().toLowerCase();
  }

  function isScientificVictory(game) {
    const v = victoryKey(game);
    return v === 'scientific' || v === 'science';
  }

  function isCulturalVictory(game) {
    const v = victoryKey(game);
    return v === 'cultural' || v === 'culture';
  }

  function isCcVictory(game) {
    const v = victoryKey(game);
    return !v || v === 'cc' || v === 'conciliation' || v === 'concession';
  }

  function rowScore(row) {
    const n = Number(row && row.score);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Hall-of-fame “epic plaques”: iconic single-game moments from the FFA archive.
   * IronLeague-30 is reserved for «most bugs found» until that session is published.
   */
  function computeEpicPlaques(games) {
    const key = `epic|${gamesFingerprint(games)}`;
    if (epicCacheKey === key && epicCacheItems) {
      return epicCacheItems;
    }

    const list = eligibleGames(games);
    const all = Array.isArray(games) ? games : [];
    const out = [];

    function vacant(id, value) {
      out.push({
        id,
        player: '',
        value: value != null ? String(value) : '—',
        vacant: true,
      });
    }

    // 1) Most broken — reserved for session IronLeague-30 (not archive id 30 / team2).
    const g30 = all.find((g) => {
      const raw = String((g && g.number) || '').trim();
      return /^IronLeague-30$/i.test(raw);
    });
    const bugs = g30
      ? Number(
        g30.bugCount != null ? g30.bugCount
          : g30.bugsFound != null ? g30.bugsFound
            : g30.bugs != null ? g30.bugs
              : NaN,
      )
      : NaN;
    if (g30 && Number.isFinite(bugs) && bugs > 0) {
      const reporter = String(g30.bugReporter || g30.bugFinder || '').trim();
      out.push({
        id: 'epic_most_broken',
        player: reporter || 'Iron League',
        value: String(bugs),
        gameNumber: 30,
      });
    } else {
      vacant('epic_most_broken', '30');
    }

    // 2) Science underdog — science win while someone else led on score.
    let sciUnder = null;
    for (const game of list) {
      if (!isScientificVictory(game)) continue;
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      const wScore = rowScore(wrow);
      if (wScore == null) continue;
      let best = null;
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        if (String(s.name || '').trim() === wp) continue;
        const sc = rowScore(s);
        if (sc == null) continue;
        if (!best || sc > best.score) {
          best = { score: sc, player: String(s.name || '').trim() };
        }
      }
      if (!best || best.score <= wScore) continue;
      const deficit = best.score - wScore;
      if (!sciUnder || deficit > sciUnder.deficit) {
        sciUnder = {
          deficit,
          player: wp,
          nation: String((wrow && wrow.nation) || '').trim(),
          opponent: best.player,
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (sciUnder) {
      out.push({
        id: 'epic_science_underdog',
        player: sciUnder.player,
        nation: sciUnder.nation,
        opponent: sciUnder.opponent,
        value: String(Math.round(sciUnder.deficit)),
        gameNumber: sciUnder.gameNumber,
      });
    } else {
      vacant('epic_science_underdog');
    }

    // 3) Bait on the throne — win with 0 wars declared, maximize wars received.
    let bait = null;
    for (const game of list) {
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      if (!wrow || !Number.isFinite(Number(wrow.wars_declared)) || Number(wrow.wars_declared) !== 0) {
        continue;
      }
      const received = Number(wrow.wars_received);
      if (!Number.isFinite(received) || received < 3) continue;
      if (!bait || received > bait.received) {
        bait = {
          received,
          player: wp,
          nation: String(wrow.nation || '').trim(),
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (bait) {
      out.push({
        id: 'epic_bait_throne',
        player: bait.player,
        nation: bait.nation,
        value: String(bait.received),
        gameNumber: bait.gameNumber,
      });
    } else {
      vacant('epic_bait_throne');
    }

    // 4) First cultural victory (chronological).
    let culture = null;
    for (const game of list) {
      if (!isCulturalVictory(game)) continue;
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      culture = {
        player: wp,
        nation: String((wrow && wrow.nation) || '').trim(),
        gameNumber: parseGameNum(game),
        turn: Number(game.endedOnTurn) || 0,
      };
      break;
    }
    if (culture) {
      out.push({
        id: 'epic_first_culture',
        player: culture.player,
        nation: culture.nation,
        value: culture.turn ? String(culture.turn) : '1',
        gameNumber: culture.gameNumber,
      });
    } else {
      vacant('epic_first_culture');
    }

    // 5) Meat cosmos — science win with the highest military deaths on the winner.
    let meat = null;
    for (const game of list) {
      if (!isScientificVictory(game)) continue;
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      if (!wrow) continue;
      const deaths = Number(wrow.military_deaths);
      const strength = Number(wrow.strength);
      if (!Number.isFinite(deaths) || deaths < 40) continue;
      const score = deaths + (Number.isFinite(strength) ? strength / 10000 : 0);
      if (!meat || score > meat.score) {
        meat = {
          score,
          deaths,
          player: wp,
          nation: String(wrow.nation || '').trim(),
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (meat) {
      out.push({
        id: 'epic_meat_cosmos',
        player: meat.player,
        nation: meat.nation,
        value: String(meat.deaths),
        gameNumber: meat.gameNumber,
      });
    } else {
      vacant('epic_meat_cosmos');
    }

    // 6) CC without the score lead.
    let ccUnder = null;
    for (const game of list) {
      if (!isCcVictory(game) || isScientificVictory(game) || isCulturalVictory(game)) continue;
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      const wScore = rowScore(wrow);
      if (wScore == null) continue;
      let best = null;
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        if (String(s.name || '').trim() === wp) continue;
        const sc = rowScore(s);
        if (sc == null) continue;
        if (!best || sc > best.score) {
          best = { score: sc, player: String(s.name || '').trim() };
        }
      }
      if (!best || best.score <= wScore) continue;
      const deficit = best.score - wScore;
      if (!ccUnder || deficit > ccUnder.deficit) {
        ccUnder = {
          deficit,
          player: wp,
          nation: String((wrow && wrow.nation) || '').trim(),
          opponent: best.player,
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (ccUnder) {
      out.push({
        id: 'epic_cc_not_lead',
        player: ccUnder.player,
        nation: ccUnder.nation,
        opponent: ccUnder.opponent,
        value: String(Math.round(ccUnder.deficit)),
        gameNumber: ccUnder.gameNumber,
      });
    } else {
      vacant('epic_cc_not_lead');
    }

    // 7) Lobby bloodbath — most eliminations in one game.
    let blood = null;
    for (const game of list) {
      const surv = (game.survivors || []).filter((s) => s && !s.is_barbarian && !isBarbarianName(s.name));
      const dead = surv.filter((s) => s.alive === false).length;
      if (dead < 3) continue;
      const wp = winnerPlayer(game);
      const wrow = wp ? survivorByName(game, wp) : null;
      if (!blood || dead > blood.dead) {
        blood = {
          dead,
          player: wp || '',
          nation: String((wrow && wrow.nation) || '').trim(),
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (blood && blood.player) {
      out.push({
        id: 'epic_lobby_bloodbath',
        player: blood.player,
        nation: blood.nation,
        value: String(blood.dead),
        gameNumber: blood.gameNumber,
      });
    } else {
      vacant('epic_lobby_bloodbath');
    }

    // 8) Single-game war hawk — max wars_declared in one finale row.
    let hawk = null;
    for (const game of list) {
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        const wd = Number(s.wars_declared);
        if (!Number.isFinite(wd) || wd < 4) continue;
        if (!hawk || wd > hawk.wd) {
          hawk = {
            wd,
            player: String(s.name || '').trim(),
            nation: String(s.nation || '').trim(),
            gameNumber: parseGameNum(game),
          };
        }
      }
    }
    if (hawk) {
      out.push({
        id: 'epic_war_hawk_game',
        player: hawk.player,
        nation: hawk.nation,
        value: String(hawk.wd),
        gameNumber: hawk.gameNumber,
      });
    } else {
      vacant('epic_war_hawk_game');
    }

    // 9) Score crush — largest winner−#2 gap when winner leads on score.
    let crush = null;
    for (const game of list) {
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      const wScore = rowScore(wrow);
      if (wScore == null) continue;
      let second = null;
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        if (String(s.name || '').trim() === wp) continue;
        const sc = rowScore(s);
        if (sc == null) continue;
        if (second == null || sc > second) second = sc;
      }
      if (second == null || wScore <= second) continue;
      const gap = wScore - second;
      if (!crush || gap > crush.gap) {
        crush = {
          gap,
          player: wp,
          nation: String((wrow && wrow.nation) || '').trim(),
          gameNumber: parseGameNum(game),
        };
      }
    }
    if (crush) {
      out.push({
        id: 'epic_score_crush',
        player: crush.player,
        nation: crush.nation,
        value: String(Math.round(crush.gap)),
        gameNumber: crush.gameNumber,
      });
    } else {
      vacant('epic_score_crush');
    }

    // 10) Wonder without a crown — largest wonders owned by a non-winner.
    let wonderLoss = null;
    for (const game of list) {
      const wp = winnerPlayer(game);
      if (!wp) continue;
      const wrow = survivorByName(game, wp);
      const ww = wrow ? (Array.isArray(wrow.wonders) ? wrow.wonders.length : 0) : 0;
      for (const s of game.survivors || []) {
        if (!s || s.is_barbarian || isBarbarianName(s.name)) continue;
        const name = String(s.name || '').trim();
        if (!name || name === wp) continue;
        const owned = Array.isArray(s.wonders) ? s.wonders.length : 0;
        if (owned < 8 || owned <= ww) continue;
        if (!wonderLoss || owned > wonderLoss.owned) {
          wonderLoss = {
            owned,
            player: name,
            nation: String(s.nation || '').trim(),
            opponent: wp,
            gameNumber: parseGameNum(game),
          };
        }
      }
    }
    if (wonderLoss) {
      out.push({
        id: 'epic_wonder_no_crown',
        player: wonderLoss.player,
        nation: wonderLoss.nation,
        opponent: wonderLoss.opponent,
        value: String(wonderLoss.owned),
        gameNumber: wonderLoss.gameNumber,
      });
    } else {
      vacant('epic_wonder_no_crown');
    }

    epicCacheKey = key;
    epicCacheItems = out;
    return out;
  }

  /** Drop memo when Games.json is reloaded (same array ref can still be mutated). */
  function invalidateAchievementsCache() {
    achievementsCacheKey = '';
    achievementsCacheItems = null;
    duelCacheKey = '';
    duelCacheItems = null;
    epicCacheKey = '';
    epicCacheItems = null;
  }

  global.IronLeagueAchievements = {
    computeAchievements,
    computeDuelAchievements,
    computeEpicPlaques,
    invalidateAchievementsCache,
    isExcludedGame,
    isTournamentGame,
    eligibleGames,
    duelEligibleGames,
    winnerPlayer,
    pickTop,
    pickTopMin,
  };
})(typeof window !== 'undefined' ? window : globalThis);

