/**
 * Records / achievements UI (section catalogs + card render).
 * Implementation is registered by js/app.js.
 */
(function (global) {
  'use strict';

  const api = {
    _impl: null,
    register(impl) {
      this._impl = impl || null;
    },
    renderRecords() {
      if (!this._impl || !this._impl.renderRecords) return;
      return this._impl.renderRecords();
    },
    formatRecordCard(item) {
      if (!this._impl || !this._impl.formatRecordCard) return '';
      return this._impl.formatRecordCard(item);
    },
    getRecordSections() {
      return (this._impl && this._impl.RECORD_SECTIONS) || null;
    },
    getDuelRecordSections() {
      return (this._impl && this._impl.DUEL_RECORD_SECTIONS) || null;
    },
  };

  global.IronLeagueRecordsUi = api;
})(typeof window !== 'undefined' ? window : globalThis);
