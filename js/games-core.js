/**
 * Shared Games.json helpers: flags, exclusion rules, game-number parsing,
 * eligible (ranked) games, spectator-style labels. Single source of truth for
 * the archive filters and display names (match unciv-web / spectator folders).
 *
 * Used by index.html, rating.js, achievements.js, site-core.js — avoids copies
 * of the same teams/scrap/excludeFromStats/tournament logic drifting apart.
 */
(function (global) {
  'use strict';

  /** All flags of a game as an array of strings (safe for missing fields). */
  function gameFlags(game) {
    return Array.isArray(game && game.flags) ? game.flags.map(String) : [];
  }

  /**
   * Tournament match: flag "tournament" (any case) or a non-empty tournamentName.
   */
  function isTournamentGame(game) {
    if (!game) return false;
    if (String(game.tournamentName || '').trim()) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('tournament');
  }

  /**
   * True for games excluded from FFA rating/stats: explicit excludeFromStats,
   * tournament matches, or flags containing teams / scrap / team.
   */
  function isExcludedGame(game) {
    if (game && game.excludeFromStats) return true;
    if (isTournamentGame(game)) return true;
    const flags = gameFlags(game).map((f) => f.toLowerCase());
    return flags.includes('teams') || flags.includes('scrap') || flags.includes('team');
  }

  /** Numeric archive id — prefer `id`, fall back to digits in `number`. */
  function parseGameNum(game) {
    const id = Number(game && game.id);
    if (Number.isFinite(id) && id >= 1) return id;
    const m = String((game && game.number) || '').match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /**
   * Display / spectator folder name as on unciv-web:
   * `IronLeague-25`, `IronLeague-team2`, or raw session name for tournaments.
   */
  function formatGameLabel(game) {
    if (isTournamentGame(game)) {
      const raw = String((game && game.number) || '').trim();
      return raw || '';
    }
    const raw = String((game && game.number) || '').trim();
    const il = /^IronLeague-(team)?(\d+)$/i.exec(raw);
    if (il) return il[1] ? `IronLeague-team${il[2]}` : `IronLeague-${il[2]}`;
    const team = /^Team\s+Game\s+(\d+)$/i.exec(raw);
    if (team) return `IronLeague-team${team[1]}`;
    const id = Number(game && game.id);
    if (Number.isFinite(id) && id >= 1) return `IronLeague-${id}`;
    return raw || '';
  }

  /** Alias used by replay deep-links (same as formatGameLabel). */
  function spectatorFolderName(game) {
    return formatGameLabel(game);
  }

  /** Ranked FFA games only (no teams/scrap/tournament), sorted by game number. */
  function eligibleGames(games) {
    return (games || [])
      .filter((g) => !isExcludedGame(g))
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /**
   * Games already selected as a stats/rating pool (FFA or tournament):
   * only require a non-empty player roster. Does not re-apply isExcludedGame,
   * so tournament matches (excludeFromStats / tournament flag) still count.
   */
  function poolEligibleGames(games) {
    return (games || [])
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /** Ranked FFA games only (no teams/scrap/tournament); unsorted. */
  function rankedGamesOnly(games) {
    return (games || []).filter((g) => !isExcludedGame(g));
  }

  /** Alias: FFA pool = ranked (tournaments excluded via isExcludedGame). */
  function ffaGamesOnly(games) {
    return rankedGamesOnly(games);
  }

  /** Tournament matches only (unsorted). */
  function tournamentGamesOnly(games) {
    return (games || []).filter(isTournamentGame);
  }

  function isBarbarianNation(nation) {
    const n = String(nation || '').trim().toLowerCase();
    return !n || n === 'варвары' || n === 'barbarians' || n === 'barbarian';
  }

  /**
   * Winning nation for display/stats/rating.
   * Prefer explicit ``winner``, then CC vote nation, then highest finale score.
   */
  function resolveWinnerNation(game) {
    if (!game) return '';
    const explicit = String(game.winner || '').trim();
    if (explicit && !isBarbarianNation(explicit)) return explicit;

    const cc = game.league && game.league.cc;
    const ccNation = cc && String(cc.nation || '').trim();
    if (ccNation && !isBarbarianNation(ccNation)) return ccNation;

    const survivors = Array.isArray(game.survivors) ? game.survivors : [];
    let best = null;
    let bestScore = -Infinity;
    for (const s of survivors) {
      if (!s || s.is_barbarian) continue;
      const nation = String(s.nation || '').trim();
      if (isBarbarianNation(nation)) continue;
      const score = Number(s.score);
      const n = Number.isFinite(score) ? score : -1;
      if (n > bestScore) {
        bestScore = n;
        best = nation;
      }
    }
    if (best) return best;

    const alive = survivors.filter((s) => {
      if (!s || s.is_barbarian) return false;
      const nation = String(s.nation || '').trim();
      if (isBarbarianNation(nation)) return false;
      return s.alive !== false;
    });
    if (alive.length === 1) return String(alive[0].nation || '').trim();
    return '';
  }

  /**
   * First IronLeague-N of each FFA season (matches live/core: season 0 = IL 1–11).
   * When season 2 starts, add its first IL here (e.g. 2: 40). Prefer game.season when present.
   */
  const SEASON_FIRST_IL = Object.freeze({
    0: 1,
    1: 12,
  });

  /** IronLeague-N session number, or null for teams/tournaments/other. */
  function ilSessionNumber(game) {
    const raw = String((game && game.number) || '').trim();
    const m = /^IronLeague-(\d+)$/i.exec(raw);
    return m ? parseInt(m[1], 10) : null;
  }

  /**
   * Archive FFA season id for a game, or null if not an IL numbered session.
   * Uses ``game.season`` when set; otherwise maps IL-N via SEASON_FIRST_IL.
   */
  function gameSeasonId(game) {
    if (game && game.season != null && game.season !== '') {
      const s = Number(game.season);
      if (Number.isFinite(s) && s >= 0) return s;
    }
    const n = ilSessionNumber(game);
    if (n == null || n < 1) return null;
    let best = null;
    let bestFirst = -Infinity;
    for (const key of Object.keys(SEASON_FIRST_IL)) {
      const sid = Number(key);
      const first = Number(SEASON_FIRST_IL[key]);
      if (!Number.isFinite(sid) || !Number.isFinite(first)) continue;
      if (n >= first && first >= bestFirst) {
        bestFirst = first;
        best = sid;
      }
    }
    return best;
  }

  /** Filter games to one season; ``all`` / null / '' returns the input list. */
  function filterGamesBySeason(games, seasonId) {
    if (seasonId == null || seasonId === '' || seasonId === 'all') {
      return Array.isArray(games) ? games : [];
    }
    const want = Number(seasonId);
    if (!Number.isFinite(want)) return Array.isArray(games) ? games : [];
    return (games || []).filter((g) => gameSeasonId(g) === want);
  }

  /**
   * Season ids to offer in the FFA records picker: known SEASON_FIRST_IL keys
   * plus any seasons present on games (explicit ``season`` field).
   */
  function listArchiveSeasonIds(games) {
    const set = new Set();
    for (const key of Object.keys(SEASON_FIRST_IL)) {
      const sid = Number(key);
      if (Number.isFinite(sid)) set.add(sid);
    }
    for (const g of games || []) {
      const s = gameSeasonId(g);
      if (s != null) set.add(s);
    }
    return [...set].sort((a, b) => a - b);
  }

  global.IronLeagueGamesCore = {
    gameFlags,
    isTournamentGame,
    isExcludedGame,
    eligibleGames,
    poolEligibleGames,
    rankedGamesOnly,
    ffaGamesOnly,
    tournamentGamesOnly,
    parseGameNum,
    formatGameLabel,
    spectatorFolderName,
    resolveWinnerNation,
    SEASON_FIRST_IL,
    ilSessionNumber,
    gameSeasonId,
    filterGamesBySeason,
    listArchiveSeasonIds,
  };
})(typeof window !== 'undefined' ? window : globalThis);
