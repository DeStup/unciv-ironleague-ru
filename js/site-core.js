/**
 * Site-level config + cache-busted fetch + unciv-web replay helpers.
 *
 * These were inline in index.html (~3 KB). Moved out so the page script is
 * smaller and the same helpers are available to every module.
 *
 * `fetchFresh` reads window.IronLeagueCacheBust on every call so a late
 * build-id update (initAssetCacheBust) is visible to all callers, including
 * js/tech-policy-paths.js, which only knows about IronLeagueCacheBust.
 */
(function (global) {
  'use strict';

  const CONFIG = {
    nationsPath: 'Nation_icons/',
    wonderIconsPath: 'Wonder_icons/',
    nationsNamesPath: 'data/nation_names.json',
    colorsPath: 'data/nation_colors.json',
    wonderNamesPath: 'data/wonder_names_ru.json',
    wonderDetailsPath: 'data/wonder_details.json',
    defaultCapitalsPath: 'data/default_capitals.json',
    replaysPath: 'Replays/',
    // Spectator viewer on unciv.icanseeforever.com (not icanseeforever.com/unciv).
    webReplaysBase: 'https://unciv.icanseeforever.com/replays',
  };

  /** Deep-link to unciv-web for this Iron League game (`IronLeague-{id}` backup folder). */
  function webReplayUrl(game) {
    const id = Number(game && game.id);
    if (!Number.isFinite(id) || id < 1) return '';
    const base = String(CONFIG.webReplaysBase || '').replace(/\/+$/, '');
    if (!base) return '';
    // Folder names on the spectator host are PascalCase (IronLeague-25), not lowercase.
    return `${base}/IronLeague-${id}`;
  }

  function renderWebReplayButton(game) {
    const href = webReplayUrl(game);
    if (!href) return '';
    const t = (global.IronLeagueI18n && global.IronLeagueI18n.t)
      ? global.IronLeagueI18n.t
      : (k) => k;
    return `<a class="replay-button replay-button--web" href="${href}"
            target="_blank" rel="noopener noreferrer"
            title="${t('card.webReplayTitle')}">${t('card.webReplay')}</a>`;
  }

  // Bust stale browser/CDN cache after GitHub Pages deploys.
  // Build id is loaded from build-id.txt (changed every deploy) with a
  // timestamp fallback so JSON is never served from an old disk cache.
  let assetCacheBust = String(Date.now());
  global.IronLeagueCacheBust = assetCacheBust;

  function assetUrl(path) {
    const bust = (global.IronLeagueCacheBust || assetCacheBust);
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}v=${encodeURIComponent(bust)}`;
  }

  async function fetchFresh(path, init) {
    const opts = Object.assign({ cache: 'no-store' }, init || {});
    return fetch(assetUrl(path), opts);
  }

  async function initAssetCacheBust() {
    try {
      const response = await fetch(`build-id.txt?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const text = (await response.text()).trim();
      if (text) {
        assetCacheBust = text.split(/\r?\n/)[0].trim() || assetCacheBust;
      }
    } catch (e) {
      // keep Date.now() fallback
    }
    global.IronLeagueCacheBust = assetCacheBust;
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        // ignore
      }
    }
  }

  global.IronLeagueSiteCore = {
    CONFIG,
    webReplayUrl,
    renderWebReplayButton,
    assetUrl,
    fetchFresh,
    initAssetCacheBust,
  };
})(typeof window !== 'undefined' ? window : globalThis);