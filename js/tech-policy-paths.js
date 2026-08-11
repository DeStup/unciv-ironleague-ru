/**
 * Tech / policy unlock paths tab for Iron League archive.
 * Loads data/tech_policy_timelines.json + name maps; renders league stats
 * and per-game player timelines with Unciv icons.
 */
(function () {
  const ERA_ORDER = [
    'Ancient era',
    'Classical era',
    'Medieval era',
    'Renaissance era',
    'Industrial era',
    'Modern era',
    'Atomic era',
    'Information era',
  ];

  let timelines = null;
  let techNames = {};
  let policyNames = {};
  let ready = false;

  function t(key, fallback) {
    if (window.IronLeagueI18n && IronLeagueI18n.t) {
      const hit = IronLeagueI18n.t(key);
      if (hit && hit !== key) return hit;
    }
    return fallback || key;
  }

  function lang() {
    return (window.IronLeagueI18n && IronLeagueI18n.getLang && IronLeagueI18n.getLang()) || 'ru';
  }

  function labelTech(name) {
    const row = techNames[name];
    if (!row) return name;
    return lang() === 'en' ? (row.en || name) : (row.ru || name);
  }

  function labelPolicy(name) {
    const row = policyNames[name];
    if (!row) return name;
    return lang() === 'en' ? (row.en || name) : (row.ru || name);
  }

  function eraLabel(eraEn) {
    const key = 'paths.era.' + String(eraEn || '').replace(/ /g, '_');
    const fallbacks = {
      'Ancient era': 'Древность',
      'Classical era': 'Классика',
      'Medieval era': 'Средневековье',
      'Renaissance era': 'Ренессанс',
      'Industrial era': 'Индустриальная',
      'Modern era': 'Новейшая',
      'Atomic era': 'Атомная',
      'Information era': 'Информационная',
    };
    return t(key, lang() === 'en' ? String(eraEn || '').replace(' era', '') : (fallbacks[eraEn] || eraEn));
  }

  function techIcon(name) {
    return `Tech_icons/${encodeURIComponent(name)}.png`;
  }

  function policyIcon(name) {
    // Branch icons share folder with policy icons
    return `Policy_icons/${encodeURIComponent(name)}.png`;
  }

  function pct(count, total) {
    if (!total) return '0%';
    return `${Math.round((1000 * count) / total) / 10}%`;
  }

  function ensureLoaded() {
    if (ready) return Promise.resolve();
    return Promise.all([
      fetch('data/tech_policy_timelines.json').then((r) => r.json()),
      fetch('data/tech_names.json').then((r) => r.json()),
      fetch('data/policy_names.json').then((r) => r.json()),
    ]).then(([tl, tn, pn]) => {
      timelines = tl;
      techNames = tn || {};
      policyNames = pn || {};
      ready = true;
    });
  }

  function renderStatCards(container, items, kind) {
    const total = (timelines.stats && timelines.stats.samples) || 0;
    container.innerHTML = '';
    (items || []).forEach((row, idx) => {
      const name = row.name;
      const card = document.createElement('div');
      card.className = 'paths-stat-card';
      const img = document.createElement('img');
      img.className = 'paths-stat-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.src = kind === 'tech' ? techIcon(name) : policyIcon(name);
      img.onerror = () => { img.style.visibility = 'hidden'; };

      const body = document.createElement('div');
      body.className = 'paths-stat-body';
      const title = document.createElement('div');
      title.className = 'paths-stat-title';
      title.textContent = `${idx + 1}. ${kind === 'tech' ? labelTech(name) : labelPolicy(name)}`;
      const meta = document.createElement('div');
      meta.className = 'paths-stat-meta';
      meta.textContent = `${row.count} / ${total} · ${pct(row.count, total)}`;
      const bar = document.createElement('div');
      bar.className = 'paths-stat-bar';
      const fill = document.createElement('div');
      fill.className = 'paths-stat-bar-fill';
      fill.style.width = pct(row.count, total);
      bar.appendChild(fill);

      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(bar);
      card.appendChild(img);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  function renderLeagueStats() {
    if (!timelines) return;
    const stats = timelines.stats || {};
    const note = document.getElementById('pathsCoverageNote');
    if (note) {
      const games = Object.keys(timelines.games || {}).map(Number).sort((a, b) => a - b);
      const partial = games.filter((n) => (timelines.games[String(n)] || {}).status === 'partial');
      const missing = [];
      for (let n = 1; n <= Math.max(...games, 28); n += 1) {
        if (!timelines.games[String(n)]) missing.push(n);
      }
      const parts = [
        t('paths.coverage', 'Покрытие:') + ` Game ${games.join(', ')}`,
        `${t('paths.samples', 'игроков')}: ${stats.samples || 0}`,
      ];
      if (partial.length) {
        parts.push(t('paths.partial', 'частично') + `: ${partial.join(', ')}`);
      }
      if (missing.length) {
        parts.push(t('paths.missing', 'нет бэкапов') + `: ${missing.join(', ')}`);
      }
      note.textContent = parts.join(' · ');
    }

    renderStatCards(
      document.getElementById('pathsFirstBranch'),
      stats.first_policy_branch,
      'policy'
    );
    renderStatCards(
      document.getElementById('pathsFirstTech'),
      stats.first_tech_after_agriculture,
      'tech'
    );

    const eraWrap = document.getElementById('pathsEraFirst');
    if (!eraWrap) return;
    eraWrap.innerHTML = '';
    const byEra = stats.first_tech_by_era || {};
    ERA_ORDER.forEach((era) => {
      const rows = byEra[era];
      if (!rows || !rows.length) return;
      const block = document.createElement('div');
      block.className = 'paths-era-block';
      const h = document.createElement('h4');
      h.textContent = eraLabel(era);
      block.appendChild(h);
      const grid = document.createElement('div');
      grid.className = 'paths-stat-grid';
      block.appendChild(grid);
      eraWrap.appendChild(block);
      renderStatCards(grid, rows.slice(0, 8), 'tech');
    });
  }

  function fillGameSelect() {
    const select = document.getElementById('pathsGameSelect');
    if (!select || !timelines) return;
    const cur = select.value;
    select.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = t('paths.pickGame', 'Выберите игру…');
    select.appendChild(opt0);
    Object.keys(timelines.games || {})
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((n) => {
        const g = timelines.games[String(n)] || {};
        const opt = document.createElement('option');
        opt.value = String(n);
        const players = Object.keys(g.players || {}).length;
        const tag = g.status === 'partial' ? ' *' : '';
        opt.textContent = `Game ${n}${tag} (${players})`;
        select.appendChild(opt);
      });
    if (cur && timelines.games[cur]) select.value = cur;
  }

  function fillPlayerSelect(gameNum) {
    const select = document.getElementById('pathsPlayerSelect');
    if (!select || !timelines) return;
    select.innerHTML = '';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = t('paths.pickPlayer', 'Выберите игрока…');
    select.appendChild(opt0);
    const g = timelines.games[String(gameNum)] || {};
    const players = g.players || {};
    Object.keys(players)
      .sort((a, b) => a.localeCompare(b))
      .forEach((civ) => {
        const row = players[civ] || {};
        const opt = document.createElement('option');
        opt.value = civ;
        const nick = row.player ? ` — ${row.player}` : '';
        opt.textContent = `${civ}${nick}`;
        select.appendChild(opt);
      });
  }

  function renderTimelineList(container, items, kind) {
    container.innerHTML = '';
    (items || []).forEach((item) => {
      const li = document.createElement('div');
      li.className = 'paths-tl-item' + (item.is_branch ? ' is-branch' : '');
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.src = kind === 'tech' ? techIcon(item.name) : policyIcon(item.name);
      img.onerror = () => { img.style.visibility = 'hidden'; };
      const order = document.createElement('span');
      order.className = 'paths-tl-order';
      order.textContent = `#${item.order}`;
      const name = document.createElement('span');
      name.className = 'paths-tl-name';
      name.textContent = kind === 'tech' ? labelTech(item.name) : labelPolicy(item.name);
      const turn = document.createElement('span');
      turn.className = 'paths-tl-turn';
      turn.textContent = `${t('paths.turn', 'ход')} ${item.turn}`;
      li.appendChild(order);
      li.appendChild(img);
      li.appendChild(name);
      li.appendChild(turn);
      container.appendChild(li);
    });
  }

  function renderPlayer() {
    const gameNum = document.getElementById('pathsGameSelect')?.value;
    const civ = document.getElementById('pathsPlayerSelect')?.value;
    const head = document.getElementById('pathsPlayerHeading');
    const techBox = document.getElementById('pathsTechTimeline');
    const polBox = document.getElementById('pathsPolicyTimeline');
    const meta = document.getElementById('pathsPlayerMeta');
    if (!gameNum || !civ || !timelines) {
      if (head) head.textContent = '';
      if (techBox) techBox.innerHTML = '';
      if (polBox) polBox.innerHTML = '';
      if (meta) meta.textContent = '';
      return;
    }
    const row = (((timelines.games[gameNum] || {}).players) || {})[civ];
    if (!row) return;
    if (head) {
      head.textContent = `${civ}${row.player ? ' — ' + row.player : ''} · Game ${gameNum}`;
    }
    if (meta) {
      const branch = row.first_policy_branch
        ? labelPolicy(row.first_policy_branch)
        : '—';
      meta.textContent = t('paths.playerMeta', 'Первый институт') + `: ${branch}`;
    }
    renderTimelineList(techBox, row.techs, 'tech');
    renderTimelineList(polBox, row.policies, 'policy');
  }

  function renderAll() {
    fillGameSelect();
    renderLeagueStats();
    renderPlayer();
  }

  window.IronLeaguePaths = {
    show() {
      ensureLoaded()
        .then(() => renderAll())
        .catch((err) => {
          const note = document.getElementById('pathsCoverageNote');
          if (note) note.textContent = String(err);
        });
    },
    refreshLabels() {
      if (ready) renderAll();
    },
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('pathsGameSelect')?.addEventListener('change', (e) => {
      fillPlayerSelect(e.target.value);
      renderPlayer();
    });
    document.getElementById('pathsPlayerSelect')?.addEventListener('change', renderPlayer);
    document.addEventListener('ironleague:lang', () => {
      if (window.IronLeaguePaths) window.IronLeaguePaths.refreshLabels();
    });
  });
})();
