/**
 * Single source of truth for RekMOD policy-branch / ideology names.
 *
 * Both i18n.js (RU→EN term translation) and stats-charts.js (stable chart
 * colors per branch) used to hardcode the same 11 branches twice — drift risk
 * when a branch is renamed in the mod. This module owns the mapping.
 *
 * Keys are the in-game Russian names (as stored in Games.json survivors);
 * values are the English labels used by the archive UI.
 */
(function (global) {
  'use strict';

  const POLICY_BRANCH_MAP = {
    'Традиция': 'Tradition',
    'Вольность': 'Liberty',
    'Воля': 'Liberty',
    'Честь': 'Honor',
    'Благочестие': 'Piety',
    'Набожность': 'Piety',
    'Заступничество': 'Patronage',
    'Меценатство': 'Patronage',
    'Эстетика': 'Aesthetics',
    'Коммерция': 'Commerce',
    'Исследование': 'Exploration',
    'Рационализм': 'Rationalism',
    'Свобода': 'Freedom',
    'Порядок': 'Order',
    'Самодержавие': 'Autocracy',
    'Автократия': 'Autocracy',
  };

  /** English branch names (for EN UI / color lookup). */
  const POLICY_BRANCH_EN = Object.values(POLICY_BRANCH_MAP);

  function normalizeKey(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /** EN label for a Russian policy/ideology name (fallback: the input). */
  function toEnglish(name) {
    if (name == null) return '';
    const raw = String(name).trim();
    if (!raw) return '';
    if (POLICY_BRANCH_MAP[raw]) return POLICY_BRANCH_MAP[raw];
    return raw;
  }

  global.IronLeaguePolicyTerms = {
    MAP: POLICY_BRANCH_MAP,
    EN: POLICY_BRANCH_EN,
    normalizeKey,
    toEnglish,
  };
})(typeof window !== 'undefined' ? window : globalThis);