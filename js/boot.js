/**
 * Boot loader: resolve build-id, then load CSS/JS with a single cache-bust token.
 *
 * index.html only needs this script. Feature modules are listed in LIBS (order matters).
 */
(function (global) {
  'use strict';

  const STYLES = ['css/site.css'];

  const LIBS = [
    'js/games-core.js',
    'js/policy-terms.js',
    'js/nation-names.js',
    'js/site-core.js',
    'js/ui-helpers.js',
    'js/i18n.js',
    'js/player-meta.js',
    'js/stats-charts.js',
    'js/gif-preview.js',
    'js/rating.js',
    'js/achievements.js',
    'js/live-league.js',
    'js/tech-policy-paths.js',
    'js/pool.js',
    'js/archive-stats.js',
    'js/records-ui.js',
    'js/rating-ui.js',
    'js/player-profile.js',
    'js/app.js',
  ];

  function withBust(path, bust) {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}v=${encodeURIComponent(bust)}`;
  }

  function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load ${href}`));
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }

  async function resolveBuildId() {
    let bust = String(Date.now());
    try {
      const response = await fetch(`build-id.txt?t=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const text = (await response.text()).trim().split(/\r?\n/)[0].trim();
        if (text) bust = text;
      }
    } catch (e) {
      /* keep Date.now() */
    }
    global.IronLeagueCacheBust = bust;
    if (global.IronLeagueSiteCore) {
      /* site-core may overwrite later via initAssetCacheBust — keep in sync */
    }
    return bust;
  }

  async function boot() {
    const bust = await resolveBuildId();
    for (const href of STYLES) {
      await loadStylesheet(withBust(href, bust));
    }
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }
    for (const src of LIBS) {
      await loadScript(withBust(src, bust));
    }
  }

  boot().catch((err) => {
    console.error('[IronLeague boot]', err);
    const body = document.body;
    if (body) {
      const el = document.createElement('p');
      el.className = 'error';
      el.textContent = 'Failed to load site scripts. Try a hard refresh.';
      body.prepend(el);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
