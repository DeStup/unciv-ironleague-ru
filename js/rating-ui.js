/**
 * Rating tab tables UI. Implementation registered by js/app.js.
 */
(function (global) {
  'use strict';

  const api = {
    _impl: null,
    register(impl) {
      this._impl = impl || null;
    },
    renderRatingTables() {
      if (!this._impl || !this._impl.renderRatingTables) return;
      return this._impl.renderRatingTables();
    },
  };

  global.IronLeagueRatingUi = api;
})(typeof window !== 'undefined' ? window : globalThis);
