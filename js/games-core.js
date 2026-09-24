/**
 * Shared Games.json helpers: flags, exclusion rules, game-number parsing,
 * eligible (ranked) games, spectator-style labels. Single source of truth for
 * the archive filters and display names (match unciv-web / spectator folders).
 *
 * Used by index.html, rating.js, achievements.js, site-core.js — avoids copies
 * of the same teams/scrap/excludeFromStats logic drifting apart.
 */
(function (global) {
  'use strict';

  /** All flags of a game as an array of strings (safe for missing fields). */
  function gameFlags(game) {
    return Array.isArray(game && game.flags) ? game.flags.map(String) : [];
  }

  /**
   * True for games excluded from rating/stats: explicit excludeFromStats or
   * flags containing teams / scrap / team.
   */
  function isExcludedGame(game) {
    if (game && game.excludeFromStats) return true;
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
   * `IronLeague-25`, `IronLeague-team2`.
   */
  function formatGameLabel(game) {
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

  /** Ranked games only (no teams/scrap), sorted by game number. */
  function eligibleGames(games) {
    return (games || [])
      .filter((g) => !isExcludedGame(g))
      .filter((g) => Array.isArray(g.players) && g.players.length > 0)
      .slice()
      .sort((a, b) => parseGameNum(a) - parseGameNum(b));
  }

  /** Ranked games only (no teams/scrap); unsorted — used by archive filters. */
  function rankedGamesOnly(games) {
    return (games || []).filter((g) => !isExcludedGame(g));
  }

  global.IronLeagueGamesCore = {
    gameFlags,
    isExcludedGame,
    eligibleGames,
    rankedGamesOnly,
    parseGameNum,
    formatGameLabel,
    spectatorFolderName,
  };
})(typeof window !== 'undefined' ? window : globalThis);
