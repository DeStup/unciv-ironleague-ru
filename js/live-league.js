/**
 * Live seasons + awards from unciv-web / core (`/api/home/*`).
 * Read-only; needs CORS on core for GitHub Pages / localhost.
 */
(function (global) {
  'use strict';

  const LIVE_ORIGIN = 'https://unciv.icanseeforever.com';
  const DEFAULT_API = `${LIVE_ORIGIN}/api/home`;

  function apiBase() {
    const cfg = global.IronLeagueSiteCore && IronLeagueSiteCore.CONFIG;
    const base = (cfg && cfg.liveApiBase) || DEFAULT_API;
    return String(base).replace(/\/+$/, '');
  }

  function absUrl(path) {
    if (!path) return '';
    const s = String(path);
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith('/')) return LIVE_ORIGIN + s;
    return `${LIVE_ORIGIN}/${s}`;
  }

  function playerCardUrl(userId) {
    return `${LIVE_ORIGIN}/players/${encodeURIComponent(userId)}`;
  }

  function seasonPageUrl(season) {
    if (season == null || season === '') return `${LIVE_ORIGIN}/season`;
    return `${LIVE_ORIGIN}/season/${encodeURIComponent(season)}`;
  }

  async function fetchJson(path) {
    const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, { cache: 'no-store', credentials: 'omit' });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    return res.json();
  }

  function fetchCurrentSeason() {
    return fetchJson('/current-season');
  }

  function fetchSeasonRating(season) {
    const q = season == null || season === '' ? '' : `?season=${encodeURIComponent(season)}`;
    return fetchJson(`/season/rating${q}`);
  }

  function fetchAwardsPublic() {
    return fetchJson('/awards/public');
  }

  function fetchPlayer(userId) {
    return fetchJson(`/player/${encodeURIComponent(userId)}`);
  }

  function fetchPlayers() {
    return fetchJson('/players');
  }

  /** Case-insensitive nick → live user id (first match). */
  function nickIndex(players) {
    const map = new Map();
    for (const p of players || []) {
      const nick = String(p.nick || '').trim();
      if (!nick || map.has(nick.toLowerCase())) continue;
      map.set(nick.toLowerCase(), p);
    }
    return map;
  }

  function findPlayerByNick(index, nick) {
    if (!index || !nick) return null;
    return index.get(String(nick).trim().toLowerCase()) || null;
  }

  global.IronLeagueLive = {
    LIVE_ORIGIN,
    apiBase,
    absUrl,
    playerCardUrl,
    seasonPageUrl,
    fetchCurrentSeason,
    fetchSeasonRating,
    fetchAwardsPublic,
    fetchPlayer,
    fetchPlayers,
    nickIndex,
    findPlayerByNick,
  };
})(typeof window !== 'undefined' ? window : globalThis);
