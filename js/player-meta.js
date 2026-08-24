/**
 * Player country flags, profile backgrounds, display helpers.
 * Флаги стран игроков, фоны профилей и хелперы отображения.
 */
(function (global) {
  'use strict';

  /**
   * Default RU; exceptions only.
   * Value: country code string or array of codes (shown left→right).
   */
  const COUNTRY_BY_PLAYER = {
    EmperorPenguin01: 'nl',
    Bahahanchiklkm: 'kz',
    REPUNZEL2882: 'kz',
    Click4x: ['cy', 'ru'],
  };

  const FLAG_SVG = {
    ru: '<svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="9" height="6" fill="#fff"/><rect y="2" width="9" height="2" fill="#0039a6"/><rect y="4" width="9" height="2" fill="#d52b1e"/></svg>',
    nl: '<svg viewBox="0 0 9 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="9" height="2" fill="#ae1c28"/><rect y="2" width="9" height="2" fill="#fff"/><rect y="4" width="9" height="2" fill="#21468b"/></svg>',
    kz: '<svg viewBox="0 0 12 6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="12" height="6" fill="#00afca"/><circle cx="6" cy="3" r="1.35" fill="#fec50c"/><path fill="#fec50c" d="M1.2 1.1h.35v3.8H1.2zm.55.4c.7.35 1.15 1.1 1.15 1.9s-.45 1.55-1.15 1.9V1.5z"/></svg>',
    // White field + copper island + olive wreath (simplified Cyprus flag).
    cy: '<svg viewBox="0 0 36 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="36" height="24" fill="#fff"/><path fill="#d4762c" d="M10.2 8.2c1.6-.9 3.4-1.5 5.4-1.6 1.8-.1 3.5.2 4.9.8 1.1.5 1.6 1.2 1.4 1.9-.3 1.1-1.6 1.6-2.8 2-.7.2-1.1.6-1 .9.2.5 1.1.4 1.9.6 1.2.3 2.2 1 2.1 1.8-.1.9-1.2 1.3-2.3 1.4-1.6.2-3.4-.1-5-.7-1.8-.7-3.4-1.8-4.4-3.2-.7-1-.9-2.1-.2-2.9z"/><path fill="none" stroke="#4c8c2b" stroke-width="0.7" stroke-linecap="round" d="M14.2 16.8c1.2 1.4 2.6 2.2 3.8 2.2s2.6-.8 3.8-2.2"/><path fill="#4c8c2b" d="M15.4 17.2c.2-.5.7-.7 1-.5.2.5-.2 1.1-.7 1.2-.3 0-.5-.3-.3-.7zm5.2 0c-.2-.5-.7-.7-1-.5-.2.5.2 1.1.7 1.2.3 0 .5-.3.3-.7z"/></svg>',
  };

  const COUNTRY_LABEL = {
    ru: { ru: 'Россия', en: 'Russia' },
    nl: { ru: 'Нидерланды', en: 'Netherlands' },
    kz: { ru: 'Казахстан', en: 'Kazakhstan' },
    cy: { ru: 'Кипр', en: 'Cyprus' },
  };

  const BG_PALETTES = [
    ['#1a1428', '#3d2a14', '#0f1a2e'],
    ['#14201c', '#2a3d18', '#1a2830'],
    ['#201418', '#3d1828', '#141828'],
    ['#181828', '#243048', '#2a2030'],
    ['#1c1810', '#384018', '#201828'],
    ['#101820', '#182838', '#283018'],
  ];

  function countryCodesFor(name) {
    const key = String(name || '').trim();
    const raw = COUNTRY_BY_PLAYER[key];
    if (Array.isArray(raw) && raw.length) {
      return raw.map((c) => String(c || '').trim().toLowerCase()).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) return [raw.trim().toLowerCase()];
    return ['ru'];
  }

  /** Primary country code (first flag). */
  function countryCodeFor(name) {
    return countryCodesFor(name)[0] || 'ru';
  }

  function oneFlagHtml(code, lang, titleOverride) {
    const svg = FLAG_SVG[code] || FLAG_SVG.ru;
    const label = (COUNTRY_LABEL[code] && COUNTRY_LABEL[code][lang]) || code.toUpperCase();
    const title = titleOverride || label;
    return `<span class="player-flag" title="${title}" data-country="${code}">${svg}</span>`;
  }

  function flagHtml(name, opts) {
    const codes = countryCodesFor(name);
    const lang = (opts && opts.lang) || 'ru';
    if (opts && opts.title && codes.length === 1) {
      return oneFlagHtml(codes[0], lang, opts.title);
    }
    const flags = codes.map((code) => oneFlagHtml(code, lang)).join('');
    if (codes.length <= 1) return flags;
    return `<span class="player-flags">${flags}</span>`;
  }

  function hashName(name) {
    let h = 0;
    const s = String(name || '');
    for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  /**
   * Deterministic CSS background for a player profile card (Civ5 dossier base + tint).
   * Детерминированный CSS-фон карточки профиля (база «личное дело» Civ5 + оттенок).
   */
  function profileBackgroundStyle(name) {
    const h = hashName(name);
    const pal = BG_PALETTES[h % BG_PALETTES.length];
    const angle = 120 + (h % 60);
    const x = 20 + (h % 50);
    const y = 15 + ((h >> 3) % 55);
    return `background-image:
      radial-gradient(ellipse 70% 55% at ${x}% ${y}%, ${pal[1]}66 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at ${100 - x}% ${100 - y}%, ${pal[2]}55 0%, transparent 50%),
      linear-gradient(${angle}deg, rgba(12,10,18,0.72), rgba(8,8,14,0.78) 70%),
      url('img/profiles/dossier-bg.jpg');`;
  }

  /**
   * Normalize map type key for preview assets.
   * Нормализует тип карты для превью.
   */
  function mapPreviewKey(raw) {
    const s = String(raw || '').trim().toLowerCase();
    if (!s) return 'unknown';
    if (s.includes('fractal') || s.includes('фрактал')) return 'fractal';
    if (s.includes('pangaea') || s.includes('панге')) return 'pangaea';
    if (s.includes('perlin') || s.includes('перлин') || s.includes('шум')) return 'perlin';
    if (s.includes('inner') || s.includes('внутренн')) return 'inner_sea';
    if (s.includes('archipel') || s.includes('архипелаг')) return 'archipelago';
    if (s.includes('continents') || s.includes('континент')) return 'continents';
    if (s.includes('island') || s.includes('остров')) return 'islands';
    return 'unknown';
  }

  function mapPreviewHtml(raw) {
    const key = mapPreviewKey(raw);
    return `<img class="map-preview" src="img/maps/${key}.svg" alt="" width="48" height="48" loading="lazy">`;
  }

  /**
   * Same truncation as Unciv lobby prod: keep min(9, L − floor(L/3)), strip trailing _/-.
   * Та же обрезка, что на проде лобби Unciv.
   *
   * :param n: Full nick / полный ник
   * :return: Short nick / короткий ник
   */
  function shortNick(n) {
    const s = String(n == null ? '' : n);
    if (!s) return '';
    const keep = Math.min(9, s.length - Math.floor(s.length / 3));
    return s.slice(0, keep).replace(/[_-]+$/, '');
  }

  /**
   * True for Telegram-style handles (latin, digits, underscore). Not site logins.
   * True для тг-ников (латиница, цифры, _). Логины сайта — нет.
   *
   * :param n: Candidate / кандидат
   * :return: Whether to truncate / нужно ли резать
   */
  function isTelegramNick(n) {
    const s = String(n || '').trim().replace(/^@/, '');
    if (!s) return false;
    if (s === 'Barbarians' || s === 'Варвары') return false;
    return /^[A-Za-z0-9_]+$/.test(s);
  }

  /**
   * Public label: shorten Telegram nicks; leave Unciv/site logins unchanged.
   * Публичная подпись: тг-ники режем, логины сайта не трогаем.
   *
   * :param n: Stored player name / имя из архива
   * :return: Display string / строка для UI
   */
  function displayPlayerName(n) {
    const raw = String(n || '').trim();
    if (!raw) return '';
    const s = raw.replace(/^@/, '');
    if (!isTelegramNick(s)) return raw;
    return shortNick(s);
  }

  global.IronLeaguePlayerMeta = {
    COUNTRY_BY_PLAYER,
    countryCodeFor,
    countryCodesFor,
    flagHtml,
    profileBackgroundStyle,
    mapPreviewKey,
    mapPreviewHtml,
    shortNick,
    isTelegramNick,
    displayPlayerName,
  };
})(typeof window !== 'undefined' ? window : globalThis);
