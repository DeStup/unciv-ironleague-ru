/**
 * Player profile view. Implementation registered by js/app.js.
 */
(function (global) {
  'use strict';

  const api = {
    _impl: null,
    register(impl) {
      this._impl = impl || null;
    },
    openPlayerProfile(name) {
      if (!this._impl || !this._impl.openPlayerProfile) return;
      return this._impl.openPlayerProfile(name);
    },
  };

  global.IronLeaguePlayerProfile = api;
})(typeof window !== 'undefined' ? window : globalThis);
