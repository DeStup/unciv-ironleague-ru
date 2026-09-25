/**
 * Shared FFA / tournament pool + season filter for archive, stats, rating, records.
 *
 * Call IronLeaguePool.configure({ getGames, onChange, tt }) once from the page app,
 * then load()/bindUi() after DOM is ready.
 */
(function (global) {
  'use strict';

  const POOL_MODE_KEY = 'ironleague_pool_mode';
  const TOURNAMENT_NAME_KEY = 'ironleague_tournament_name';
  const FFA_SEASON_KEY = 'ironleague_ffa_season';
  const FFA_SEASON_KEY_LEGACY = 'ironleague_records_season';

  const TOURNAMENT_SELECTS = [
    '#tournamentNameFilter',
    '#statsTournamentNameFilter',
    '#ratingTournamentNameFilter',
    '#recordsTournamentNameFilter',
  ];
  const SEASON_SELECTS = [
    '#archiveSeasonFilter',
    '#recordsSeasonFilter',
    '#statsSeasonFilter',
    '#ratingSeasonFilter',
  ];
  const TOURNAMENT_GROUPS = [
    'tournamentNameFilterGroup',
    'statsTournamentFilterGroup',
    'ratingTournamentFilterGroup',
    'recordsTournamentFilterGroup',
  ];

  let poolMode = 'ffa';
  let tournamentNameFilter = 'all';
  let ffaSeasonFilter = 'all';
  let cfg = {
    getGames: () => [],
    onChange: null,
    tt: (k) => k,
  };

  function configure(options) {
    cfg = Object.assign({}, cfg, options || {});
  }

  function tt(key, vars) {
    if (typeof cfg.tt === 'function') return cfg.tt(key, vars);
    if (global.IronLeagueUiHelpers && IronLeagueUiHelpers.tt) return IronLeagueUiHelpers.tt(key, vars);
    if (global.IronLeagueI18n && IronLeagueI18n.t) return IronLeagueI18n.t(key, vars);
    return key;
  }

  function gamesData() {
    return typeof cfg.getGames === 'function' ? (cfg.getGames() || []) : [];
  }

  function rankedGamesOnly(games) {
    if (global.IronLeagueGamesCore && IronLeagueGamesCore.rankedGamesOnly) {
      return IronLeagueGamesCore.rankedGamesOnly(games);
    }
    return (games || []).filter((g) => !(g && g.excludeFromStats));
  }

  function tournamentGamesOnly(games) {
    if (global.IronLeagueGamesCore && IronLeagueGamesCore.tournamentGamesOnly) {
      return IronLeagueGamesCore.tournamentGamesOnly(games);
    }
    return (games || []).filter((g) => g && (g.tournamentName || false));
  }

  function getPoolMode() {
    return poolMode === 'tournaments' ? 'tournaments' : 'ffa';
  }

  function getTournamentNameFilter() {
    return tournamentNameFilter || 'all';
  }

  function getFfaSeasonFilter() {
    return ffaSeasonFilter || 'all';
  }

  function load() {
    try {
      const saved = localStorage.getItem(POOL_MODE_KEY);
      poolMode = saved === 'tournaments' ? 'tournaments' : 'ffa';
      const tn = localStorage.getItem(TOURNAMENT_NAME_KEY);
      tournamentNameFilter = tn && tn !== 'all' ? tn : 'all';
      const sn = localStorage.getItem(FFA_SEASON_KEY)
        || localStorage.getItem(FFA_SEASON_KEY_LEGACY);
      ffaSeasonFilter = sn && sn !== 'all' ? String(sn) : 'all';
    } catch (e) {
      poolMode = 'ffa';
      tournamentNameFilter = 'all';
      ffaSeasonFilter = 'all';
    }
  }

  function notify(silent) {
    if (!silent && typeof cfg.onChange === 'function') cfg.onChange();
  }

  function setPoolMode(mode, silent) {
    poolMode = mode === 'tournaments' ? 'tournaments' : 'ffa';
    try {
      localStorage.setItem(POOL_MODE_KEY, poolMode);
    } catch (e) { /* ignore */ }
    syncUi();
    notify(silent);
  }

  function setTournamentNameFilter(name, silent) {
    tournamentNameFilter = name && name !== 'all' ? String(name) : 'all';
    try {
      localStorage.setItem(TOURNAMENT_NAME_KEY, tournamentNameFilter);
    } catch (e) { /* ignore */ }
    document.querySelectorAll(TOURNAMENT_SELECTS.join(',')).forEach((el) => {
      if (el && el.value !== tournamentNameFilter) el.value = tournamentNameFilter;
    });
    notify(silent);
  }

  function syncFfaSeasonSelects() {
    document.querySelectorAll(SEASON_SELECTS.join(',')).forEach((el) => {
      if (el && el.value !== ffaSeasonFilter) el.value = ffaSeasonFilter;
    });
  }

  function setFfaSeasonFilter(season, silent) {
    ffaSeasonFilter = season != null && String(season) !== 'all' ? String(season) : 'all';
    try {
      localStorage.setItem(FFA_SEASON_KEY, ffaSeasonFilter);
    } catch (e) { /* ignore */ }
    syncFfaSeasonSelects();
    notify(silent);
  }

  function activeGamesPool() {
    const games = gamesData();
    if (getPoolMode() === 'tournaments') {
      let list = tournamentGamesOnly(games);
      const tn = getTournamentNameFilter();
      if (tn && tn !== 'all') {
        list = list.filter((g) => String(g.tournamentName || '').trim() === tn);
      }
      return list;
    }
    return rankedGamesOnly(games);
  }

  /** FFA pool filtered by season (tournaments ignore season). */
  function seasonScopedPool() {
    const pool = activeGamesPool();
    if (getPoolMode() !== 'ffa') return pool;
    if (!global.IronLeagueGamesCore || !IronLeagueGamesCore.filterGamesBySeason) {
      return pool;
    }
    return IronLeagueGamesCore.filterGamesBySeason(pool, getFfaSeasonFilter());
  }

  /**
   * Archive list filter: when FFA + season selected, keep only that season's
   * IronLeague-N sessions (teams/scrap still controlled by relevance filter).
   */
  function gameMatchesSeasonFilter(game) {
    if (getPoolMode() !== 'ffa') return true;
    const season = getFfaSeasonFilter();
    if (!season || season === 'all') return true;
    if (!global.IronLeagueGamesCore || !IronLeagueGamesCore.gameSeasonId) return true;
    const sid = IronLeagueGamesCore.gameSeasonId(game);
    if (sid == null) return false;
    return String(sid) === String(season);
  }

  function uniqueTournamentNames() {
    const names = new Set();
    for (const g of tournamentGamesOnly(gamesData())) {
      const n = String(g.tournamentName || '').trim();
      if (n) names.add(n);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  function seasonOptionLabel(sid) {
    if (Number(sid) === 0) return tt('records.season0');
    return tt('records.seasonN', { n: String(sid) });
  }

  function fillTournamentNameSelects() {
    const names = uniqueTournamentNames();
    document.querySelectorAll(TOURNAMENT_SELECTS.join(',')).forEach((sel) => {
      if (!sel) return;
      const cur = tournamentNameFilter || 'all';
      sel.innerHTML = `<option value="all">${tt('pool.tournamentAll')}</option>`
        + names.map((n) => `<option value="${String(n).replace(/"/g, '&quot;')}">${n}</option>`).join('');
      sel.value = names.includes(cur) ? cur : 'all';
      if (sel.value !== tournamentNameFilter) tournamentNameFilter = sel.value;
    });
  }

  function fillFfaSeasonSelects() {
    const ids = (global.IronLeagueGamesCore && IronLeagueGamesCore.listArchiveSeasonIds)
      ? IronLeagueGamesCore.listArchiveSeasonIds(gamesData())
      : [0, 1];
    const cur = getFfaSeasonFilter();
    const html = `<option value="all">${tt('records.seasonAll')}</option>`
      + ids.map((id) => `<option value="${id}">${seasonOptionLabel(id)}</option>`).join('');
    let resolved = 'all';
    if (cur !== 'all' && ids.map(String).includes(String(cur))) resolved = String(cur);
    document.querySelectorAll(SEASON_SELECTS.join(',')).forEach((sel) => {
      if (!sel) return;
      sel.innerHTML = html;
      sel.value = resolved;
    });
    ffaSeasonFilter = resolved;
  }

  function syncUi() {
    const mode = getPoolMode();
    document.querySelectorAll('.pool-mode-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.pool === mode);
    });
    const isTour = mode === 'tournaments';
    TOURNAMENT_GROUPS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !isTour;
    });
    const rel = document.getElementById('relevanceFilterGroup');
    if (rel) rel.hidden = isTour;
    document.querySelectorAll('[data-section-ffa]').forEach((el) => {
      el.hidden = isTour;
    });
    document.querySelectorAll('[data-section-duel]').forEach((el) => {
      el.hidden = !isTour;
    });
    const intro = document.getElementById('recordsIntro');
    if (intro) {
      intro.setAttribute('data-i18n', isTour ? 'records.intro.duel' : 'records.intro');
      intro.textContent = tt(isTour ? 'records.intro.duel' : 'records.intro');
    }
  }

  function bindUi() {
    document.querySelectorAll('.pool-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => setPoolMode(btn.dataset.pool));
    });
    document.querySelectorAll(TOURNAMENT_SELECTS.join(',')).forEach((el) => {
      el?.addEventListener('change', () => setTournamentNameFilter(el.value));
    });
    document.querySelectorAll(SEASON_SELECTS.join(',')).forEach((el) => {
      el?.addEventListener('change', () => setFfaSeasonFilter(el.value));
    });
  }

  global.IronLeaguePool = {
    configure,
    load,
    bindUi,
    syncUi,
    fillTournamentNameSelects,
    fillFfaSeasonSelects,
    getPoolMode,
    setPoolMode,
    getTournamentNameFilter,
    setTournamentNameFilter,
    getFfaSeasonFilter,
    setFfaSeasonFilter,
    activeGamesPool,
    seasonScopedPool,
    gameMatchesSeasonFilter,
    // aliases for gradual migration
    getRecordsSeasonFilter: getFfaSeasonFilter,
    setRecordsSeasonFilter: setFfaSeasonFilter,
    recordsGamesPool: seasonScopedPool,
    fillRecordsSeasonSelect: fillFfaSeasonSelects,
    loadPoolMode: load,
    syncPoolModeUi: syncUi,
  };
})(typeof window !== 'undefined' ? window : globalThis);
