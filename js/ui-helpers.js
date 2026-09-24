/**
 * Pure UI helpers shared by the page script: i18n shorthand, locale tags,
 * HTML escaping, top-N counters, averages, map-name canonicalization.
 *
 * These were inline in index.html (~1 KB). Moved out so the page script is
 * smaller; all callers keep the same names via local aliases.
 */
(function (global) {
  'use strict';

  function tt(key, vars) {
    if (global.IronLeagueI18n && global.IronLeagueI18n.t) return global.IronLeagueI18n.t(key, vars);
    return key;
  }

  function localeTag() {
    return (global.IronLeagueI18n && global.IronLeagueI18n.getLang() === 'en') ? 'en' : 'ru';
  }

  /** localeCompare options for UI alphabetical sorts. */
  function localeCompareOpts() {
    return { sensitivity: 'base', numeric: true };
  }

  function escapeAttr(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /** Top N entries of a Map/object by count, then by label. */
  function topCounted(mapObj, n, labelFn) {
    const label = labelFn || ((k) => String(k));
    const entries = [...(mapObj || new Map()).entries()]
      .sort((a, b) => b[1] - a[1]
        || label(a[0]).localeCompare(label(b[0]), localeTag(), localeCompareOpts()));
    return entries.slice(0, n || 3);
  }

  function avgOrDash(sum, count) {
    if (!count) return '—';
    return (sum / count).toFixed(1);
  }

  function avgOrDashSigned(sum, count) {
    if (!count) return '—';
    const v = sum / count;
    const body = Math.abs(v).toFixed(1);
    if (v > 0) return `+${body}`;
    if (v < 0) return `-${body}`;
    return body;
  }

  function canonicalizeMapName(name) {
    if (global.IronLeagueI18n && global.IronLeagueI18n.canonicalizeMap) {
      return global.IronLeagueI18n.canonicalizeMap(name);
    }
    return String(name || '').trim();
  }

  global.IronLeagueUiHelpers = {
    tt,
    localeTag,
    localeCompareOpts,
    escapeAttr,
    topCounted,
    avgOrDash,
    avgOrDashSigned,
    canonicalizeMapName,
  };
})(typeof window !== 'undefined' ? window : globalThis);