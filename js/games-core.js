/**
 * Shared Games.json helpers: flags, exclusion rules, game-number parsing,
 * eligible (ranked) games. Single source of truth for the archive filters.
 *
 * Used by index.html, rating.js, achievements.js — avoids three copies of
 * the same teams/scrap/excludeFromStats logic drifting apart.
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

  /** Numeric game id from `number` ("Game 29") or `id`. */
  function parseGameNum(game) {
    const m = String(game.number || '').match(/(\d+)/);
    return m ? parseInt(m[1], 10) : Number(game.id) || 0;
  }

  global.IronLeagueGamesCore = {
    gameFlags,
    isExcludedGame,
    eligibleGames,
    rankedGamesOnly,
    parseGameNum,
  };
})(typeof window !== 'undefined' ? window : globalThis);