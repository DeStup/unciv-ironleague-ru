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
  };
})(typeof window !== 'undefined' ? window : globalThis);
