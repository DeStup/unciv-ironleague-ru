/**
 * Nation name resolution (RU ↔ EN) and public display helpers.
 *
 * Previously a 340-line hardcoded array in index.html mirrored data/nation_names.json
 * 1:1 — every name lived in two places. Now the single source is the JSON loaded
 * from Nations.json in js/tools/export_default_capitals.py; this module owns the
 * runtime lookup and the public label (truncated TG nicks via player-meta).
 *
 * index.html feeds the array through setNations() after loadGamesData fetches
 * data/nation_names.json; displayNationName/displayPolicyName delegate here so
 * every render path stays consistent.
 */
(function (global) {
  'use strict';

  const state = {
    nations: [],            // [{ eng, rus }, ...]
    engToRu: new Map(),     // lowercased eng -> rus
    ruToEng: new Map(),     // rus -> eng
  };

  /** Aliases for non-The-prefixed names that appear in Games.json. */
  const ALIASES = {
    Aztec: 'Ацтеки',
    Aztecs: 'Ацтеки',
    Gaul: 'Галлы',
    Gauls: 'Галлы',
    Maya: 'Майя',
    'The Maya': 'Майя',
    Huns: 'Гунны',
    'The Huns': 'Гунны',
    Netherlands: 'Нидерланды',
    'The Netherlands': 'Нидерланды',
    Yugolslavia: 'Югославия',
    Yugoslavia: 'Югославия',
    Chile: 'Чили',
    Colombia: 'Колумбия',
    Ottomans: 'Османы',
    'The Ottomans': 'Османы',
    Moors: 'Мавры',
    'The Moors': 'Мавры',
  };

  function setNations(list) {
    state.nations = Array.isArray(list) ? list : [];
    state.engToRu = new Map();
    state.ruToEng = new Map();
    state.nations.forEach((n) => {
      if (n && n.eng) state.engToRu.set(String(n.eng).toLowerCase(), n.rus);
      if (n && n.rus) state.ruToEng.set(n.rus, n.eng);
    });
  }

  /** Russian name for an English nation key (alias-aware), fallback the input. */
  function engToRusNation(eng) {
    const key = String(eng || '');
    if (!key.trim()) return '';
    const hit = state.engToRu.get(key.toLowerCase());
    if (hit) return hit;
    return ALIASES[key] || key;
  }

  /** English name for a Russian nation name (via the nations map). */
  function rusToEngNation(rus) {
    const hit = state.ruToEng.get(String(rus || '').trim());
    return hit || rus;
  }

  /** Public label: EN when UI is English, else the Russian input. */
  function displayNationName(russianName) {
    if (global.IronLeagueI18n && global.IronLeagueI18n.getLang && global.IronLeagueI18n.getLang() === 'en') {
      return rusToEngNation(russianName);
    }
    return russianName || '';
  }

  /** Public policy/ideology label (shared policy-terms + i18n translateTerm). */
  function displayPolicyName(name) {
    const terms = global.IronLeaguePolicyTerms;
    if (terms && typeof terms.toEnglish === 'function' && terms.toEnglish(name) !== name) {
      return terms.toEnglish(name);
    }
    if (global.IronLeagueI18n && global.IronLeagueI18n.translateTerm) {
      return global.IronLeagueI18n.translateTerm(name);
    }
    if (global.IronLeagueI18n && global.IronLeagueI18n.translatePolicy) {
      return global.IronLeagueI18n.translatePolicy(name);
    }
    return name;
  }

  global.IronLeagueNationNames = {
    setNations,
    getState: () => state,
    engToRusNation,
    rusToEngNation,
    displayNationName,
    displayPolicyName,
  };
})(typeof window !== 'undefined' ? window : globalThis);