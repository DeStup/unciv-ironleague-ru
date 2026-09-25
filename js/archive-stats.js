/**
 * Archive aggregate stats API (winrate, nations, policies, wonders, maps).
 * Implementation is registered by js/app.js after helpers are in place.
 */
(function (global) {
  'use strict';

  const api = {
    _impl: null,
    register(impl) {
      this._impl = impl || null;
    },
    computeArchiveStats(games) {
      if (!this._impl || !this._impl.computeArchiveStats) {
        throw new Error('IronLeagueArchiveStats not registered');
      }
      return this._impl.computeArchiveStats(games);
    },
    renderStatsTables() {
      if (!this._impl || !this._impl.renderStatsTables) return;
      return this._impl.renderStatsTables();
    },
  };

  global.IronLeagueArchiveStats = api;
})(typeof window !== 'undefined' ? window : globalThis);
