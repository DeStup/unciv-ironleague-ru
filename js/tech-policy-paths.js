/**
 * Tech / policy unlock paths tab for Iron League archive.
 * Full G&K tech tree, unlock icons, roster nicks from Games.json.
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
    'Future era',
  ];

  const NODE_W = 248;
  const NODE_H = 84;
  const COL_W = 268;
  const ROW_H = 90;
  const PAD_X = 16;
  const PAD_Y = 10;
  const ERA_BANNER_H = 30;
  const MAX_UNLOCK_ICONS = 8;

  /** RekMOD / Unciv Eras.json iconRGB — era header bands on the tech tree. */
  const ERA_COLORS = {
    'Ancient era': [255, 87, 35],
    'Classical era': [233, 31, 99],
    'Medieval era': [157, 39, 176],
    'Renaissance era': [104, 58, 183],
    'Industrial era': [63, 81, 182],
    'Modern era': [33, 150, 243],
    'Atomic era': [0, 150, 136],
    'Information era': [76, 176, 81],
    'Future era': [76, 176, 81],
  };

  let timelines = null;
  let techTree = null;
  let techDetails = {};
  let techNames = {};
  let policyNames = {};
  let constructionNames = {};
  let nationNames = {};
  let roster = {};
  let ready = false;
  let selectedEra = 'all';

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

  function labelNation(name) {
    const row = nationNames[name];
    if (!row) return name;
    return lang() === 'en' ? (row.en || name) : (row.ru || name);
  }

  function labelConstruction(name) {
    const res = RESOURCE_NAMES[name];
    if (res) return lang() === 'en' ? (res.en || name) : (res.ru || name);
    const row = constructionNames[name];
    if (!row) return name;
    return lang() === 'en' ? (row.en || name) : (row.ru || name);
  }

  function playerNick(gameNum, civ) {
    const fromRoster = ((roster[String(gameNum)] || {})[civ]) || '';
    if (fromRoster) return fromRoster;
    const row = (((timelines.games[String(gameNum)] || {}).players) || {})[civ] || {};
    return row.player || '';
  }

  function eraLabel(eraEn) {
    if (eraEn === 'all') return t('paths.era.all', lang() === 'en' ? 'All eras' : 'Все эпохи');
    const key = 'paths.era.' + String(eraEn || '').replace(/ /g, '_');
    // Unciv Russian.properties / English keys (full era names).
    const fallbacks = {
      'Ancient era': { ru: 'Древнейший мир', en: 'Ancient era' },
      'Classical era': { ru: 'Античность', en: 'Classical era' },
      'Medieval era': { ru: 'Средневековье', en: 'Medieval era' },
      'Renaissance era': { ru: 'Новое время', en: 'Renaissance era' },
      'Industrial era': { ru: 'Новейшее время', en: 'Industrial era' },
      'Modern era': { ru: 'Современность', en: 'Modern era' },
      'Atomic era': { ru: 'Атомная эра', en: 'Atomic era' },
      'Information era': { ru: 'Информационная эра', en: 'Information era' },
      'Future era': { ru: 'Будущее', en: 'Future era' },
    };
    const fb = fallbacks[eraEn];
    const fallback = fb
      ? (lang() === 'en' ? fb.en : fb.ru)
      : (lang() === 'en' ? String(eraEn || '') : String(eraEn || ''));
    return t(key, fallback);
  }

  function eraRgb(eraEn) {
    const rgb = ERA_COLORS[eraEn];
    return rgb || [96, 96, 96];
  }

  function kindLabel(kind) {
    const map = {
      building: t('paths.kind.building', 'здание'),
      wonder: t('paths.kind.wonder', 'чудо'),
      unit: t('paths.kind.unit', 'юнит'),
      improvement: t('paths.kind.improvement', 'улучшение'),
      improvement_bonus: t('paths.kind.improvement_bonus', 'бонус улучшения'),
      building_bonus: t('paths.kind.building_bonus', 'бонус здания'),
      nation_effect: t('paths.kind.nation_effect', 'эффект нации'),
      resource: t('paths.kind.resource', 'ресурс'),
      unique: t('paths.kind.unique', 'эффект'),
    };
    return map[kind] || kind;
  }

  /** Selected player's nation for highlighting UU/UB on the tree. */
  function selectedNation() {
    return selectedPlayer() || '';
  }

  /** G&K strategic resources revealed by tech (Unciv TileResources.revealedBy). */
  const STRATEGIC_REVEALS = {
    'Animal Husbandry': ['Horses'],
    'Iron Working': ['Iron'],
    Industrialization: ['Coal'],
    Biology: ['Oil'],
    Electricity: ['Aluminum'],
    'Atomic Theory': ['Uranium'],
  };

  const RESOURCE_NAMES = {
    Horses: { en: 'Horses', ru: 'Лошади' },
    Iron: { en: 'Iron', ru: 'Железо' },
    Coal: { en: 'Coal', ru: 'Уголь' },
    Oil: { en: 'Oil', ru: 'Нефть' },
    Aluminum: { en: 'Aluminum', ru: 'Алюминий' },
    Uranium: { en: 'Uranium', ru: 'Уран' },
  };

  function techIcon(name) {
    return `Tech_icons/${encodeURIComponent(name)}.png`;
  }

  function policyIcon(name) {
    let iconName = name;
    // Branch completion rows share the branch icon (Tradition Complete → Tradition).
    if (String(name).endsWith(' Complete')) {
      iconName = String(name).slice(0, -' Complete'.length);
    }
    return `Policy_icons/${encodeURIComponent(iconName)}.png`;
  }

  function unlockIcon(item) {
    const name = item.name;
    if (item.kind === 'unit') return `Unit_icons/${encodeURIComponent(name)}.png`;
    if (item.kind === 'resource') return `Resource_icons/${encodeURIComponent(name)}.png`;
    if (item.kind === 'wonder' || (item.kind === 'building_bonus' && item.is_wonder)) {
      return `Wonder_icons/${encodeURIComponent(name)}.png`;
    }
    if (item.kind === 'improvement' || item.kind === 'improvement_bonus') {
      return `Improvement_icons/${encodeURIComponent(name)}.png`;
    }
    if (item.kind === 'building_bonus') {
      return `Building_icons/${encodeURIComponent(name)}.png`;
    }
    if (item.kind === 'nation_effect') {
      const nation = item.uniqueTo || name;
      return `Nation_icons/${encodeURIComponent(nation)}.png`;
    }
    if (item.kind === 'unique') {
      return item.icon
        ? `Unique_icons/${encodeURIComponent(item.icon)}.png`
        : 'Unique_icons/Star.png';
    }
    return `Building_icons/${encodeURIComponent(name)}.png`;
  }

  const UNLOCK_KIND_ORDER = {
    unit: 0,
    building: 1,
    wonder: 2,
    resource: 3,
    improvement: 4,
    improvement_bonus: 5,
    building_bonus: 6,
    nation_effect: 7,
    unique: 8,
  };

  function unlocksForTech(techName, detail, nationFilter) {
    // Unciv TechButton: common unlocks + this civ's uniqueTo (UU/UB/bonuses/effects).
    // Other nations stay in detail.nation_unlocks (★ panel).
    const base = (detail.unlocks || []).filter((u) => !u.uniqueTo);
    const mine = nationFilter
      ? (detail.nation_unlocks || []).filter((u) => u.uniqueTo === nationFilter)
      : [];
    const seenRes = new Set(
      base.filter((u) => u.kind === 'resource').map((u) => u.name)
    );
    const extras = (STRATEGIC_REVEALS[techName] || [])
      .filter((name) => !seenRes.has(name))
      .map((name) => ({
        kind: 'resource',
        name,
        uniques: [],
      }));
    const passives = (detail.uniques || [])
      .filter((u) => u && !String(u).includes('weight to this choice for AI'))
      .map((text) => ({
        kind: 'unique',
        name: String(text),
        uniques: [String(text)],
      }));
    const all = base.concat(mine).concat(extras).concat(passives);
    all.sort((a, b) => {
      const aMine = nationFilter && a.uniqueTo === nationFilter ? 0 : 1;
      const bMine = nationFilter && b.uniqueTo === nationFilter ? 0 : 1;
      if (aMine !== bMine) return aMine - bMine;
      return (UNLOCK_KIND_ORDER[a.kind] ?? 9) - (UNLOCK_KIND_ORDER[b.kind] ?? 9)
        || String(a.name || '').localeCompare(String(b.name || ''));
    });
    return all;
  }

  function nationUnlocksForTech(detail, nationFilter) {
    const list = (detail.nation_unlocks || []).slice();
    list.sort((a, b) => {
      const aMine = nationFilter && a.uniqueTo === nationFilter ? 0 : 1;
      const bMine = nationFilter && b.uniqueTo === nationFilter ? 0 : 1;
      if (aMine !== bMine) return aMine - bMine;
      return (UNLOCK_KIND_ORDER[a.kind] ?? 9) - (UNLOCK_KIND_ORDER[b.kind] ?? 9)
        || String(a.uniqueTo || '').localeCompare(String(b.uniqueTo || ''))
        || String(a.name || '').localeCompare(String(b.name || ''));
    });
    return list;
  }

  function pct(count, total) {
    if (!total) return '0%';
    return `${Math.round((1000 * count) / total) / 10}%`;
  }

  function pathsDataUrl(path) {
    const bust = window.IronLeagueCacheBust || Date.now();
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}v=${encodeURIComponent(bust)}`;
  }

  function ensureLoaded() {
    if (ready) return Promise.resolve();
    const get = (path) => fetch(pathsDataUrl(path), { cache: 'no-store' }).then((r) => r.json());
    return Promise.all([
      get('data/tech_policy_timelines.json'),
      get('data/tech_names.json'),
      get('data/policy_names.json'),
      get('data/tech_tree.json'),
      get('data/tech_details.json'),
      get('data/construction_names.json'),
      get('data/paths_roster.json'),
      get('data/nation_names.json'),
    ]).then(([tl, tn, pn, tree, details, cn, rost, nn]) => {
      timelines = tl;
      techNames = tn || {};
      policyNames = pn || {};
      techTree = tree;
      techDetails = (details && details.techs) || {};
      constructionNames = cn || {};
      roster = rost || {};
      nationNames = nn || {};
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
      const plate = document.createElement('span');
      plate.className = 'paths-stat-icon-plate';
      const img = document.createElement('img');
      img.className = 'paths-stat-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.src = kind === 'tech' ? techIcon(name) : policyIcon(name);
      img.onerror = () => { plate.style.visibility = 'hidden'; };
      plate.appendChild(img);

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
      card.appendChild(plate);
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
        t('paths.statsFilter', 'статистика только по полным архивам'),
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

  function selectedGame() {
    return document.getElementById('pathsGameSelect')?.value || '';
  }

  function selectedPlayer() {
    return document.getElementById('pathsPlayerSelect')?.value || '';
  }

  function setGame(gameNum, opts) {
    const select = document.getElementById('pathsGameSelect');
    if (select) select.value = gameNum || '';
    fillPlayerSelect(gameNum);
    renderGameChips();
    renderPlayerChips();
    if (!opts || opts.render !== false) renderPlayer();
  }

  function setPlayer(civ, opts) {
    const select = document.getElementById('pathsPlayerSelect');
    if (select) select.value = civ || '';
    renderPlayerChips();
    if (!opts || opts.render !== false) renderPlayer();
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
    const nums = Object.keys(timelines.games || {}).map(Number).sort((a, b) => a - b);
    nums.forEach((n) => {
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
    const prev = select.value;
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
        const nick = playerNick(gameNum, civ);
        const opt = document.createElement('option');
        opt.value = civ;
        const civLabel = labelNation(civ);
        opt.textContent = nick ? `${civLabel} — ${nick}` : civLabel;
        select.appendChild(opt);
      });
    if (prev && players[prev]) select.value = prev;
    else select.value = '';
  }

  function renderGameChips() {
    const wrap = document.getElementById('pathsGameChips');
    if (!wrap || !timelines) return;
    wrap.innerHTML = '';
    const nums = Object.keys(timelines.games || {}).map(Number).sort((a, b) => a - b);
    const cur = selectedGame();
    nums.forEach((n) => {
      const g = timelines.games[String(n)] || {};
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'paths-chip' + (String(n) === cur ? ' active' : '');
      btn.textContent = `Game ${n}${g.status === 'partial' ? '*' : ''}`;
      btn.addEventListener('click', () => setGame(String(n)));
      wrap.appendChild(btn);
    });
  }

  function renderPlayerChips() {
    const wrap = document.getElementById('pathsPlayerChips');
    if (!wrap || !timelines) return;
    wrap.innerHTML = '';
    const gameNum = selectedGame();
    if (!gameNum) {
      const hint = document.createElement('span');
      hint.className = 'paths-chip-hint';
      hint.textContent = t('paths.pickGameFirst', 'Сначала выберите игру');
      wrap.appendChild(hint);
      return;
    }
    const players = (timelines.games[gameNum] || {}).players || {};
    const cur = selectedPlayer();
    Object.keys(players)
      .sort((a, b) => labelNation(a).localeCompare(labelNation(b), lang() === 'en' ? 'en' : 'ru'))
      .forEach((civ) => {
        const nick = playerNick(gameNum, civ);
        const civLabel = labelNation(civ);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'paths-chip paths-chip-player' + (civ === cur ? ' active' : '');
        const civSpan = document.createElement('span');
        civSpan.className = 'paths-chip-civ';
        civSpan.textContent = civLabel;
        btn.appendChild(civSpan);
        if (nick) {
          const nickSpan = document.createElement('span');
          nickSpan.className = 'paths-chip-nick';
          nickSpan.textContent = nick;
          btn.appendChild(nickSpan);
        }
        btn.title = nick ? `${civLabel} — ${nick}` : civLabel;
        btn.addEventListener('click', () => setPlayer(civ));
        wrap.appendChild(btn);
      });
  }

  function renderEraTabs() {
    const wrap = document.getElementById('pathsEraTabs');
    if (!wrap) return;
    wrap.innerHTML = '';
    const eras = ['all'].concat(
      (techTree && techTree.eras && techTree.eras.length) ? techTree.eras : ERA_ORDER
    );
    eras.forEach((era) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'paths-era-tab' + (era === selectedEra ? ' active' : '');
      btn.textContent = eraLabel(era);
      btn.addEventListener('click', () => {
        selectedEra = era;
        renderEraTabs();
        renderTechTree();
      });
      wrap.appendChild(btn);
    });
  }

  function renderTimelineList(container, items, kind) {
    if (!container) return;
    container.innerHTML = '';
    (items || []).forEach((item) => {
      const li = document.createElement('div');
      li.className = 'paths-tl-item' + (item.is_branch ? ' is-branch' : '');
      const plate = document.createElement('span');
      plate.className = 'paths-tl-icon-plate';
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.src = kind === 'tech' ? techIcon(item.name) : policyIcon(item.name);
      if (kind === 'policy') {
        img.className = 'paths-tl-icon' + (item.is_branch || String(item.name).endsWith(' Complete') ? ' is-branch-icon' : '');
      } else {
        img.className = 'paths-tl-icon';
      }
      img.onerror = () => { plate.style.visibility = 'hidden'; };
      plate.appendChild(img);
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
      li.appendChild(plate);
      li.appendChild(name);
      li.appendChild(turn);
      container.appendChild(li);
    });
  }

  function researchedMap(row) {
    const map = Object.create(null);
    (row.techs || []).forEach((item) => {
      map[item.name] = item;
    });
    return map;
  }

  function visibleTechs() {
    const all = (techTree && techTree.techs) || [];
    if (selectedEra === 'all') return all.slice();
    return all.filter((tech) => tech.era === selectedEra);
  }

  function nodeOrigin(tech, minCol, minRow) {
    return {
      x: PAD_X + (tech.column - minCol) * COL_W,
      y: PAD_Y + ERA_BANNER_H + 10 + (tech.row - minRow) * ROW_H,
    };
  }

  function unlockUniques(item) {
    if (lang() === 'ru' && item.uniques_ru && item.uniques_ru.length) {
      return item.uniques_ru;
    }
    if (item.uniques_en && item.uniques_en.length) {
      return item.uniques_en;
    }
    return item.uniques || [];
  }

  function unlockShortLines(item) {
    if (lang() === 'ru' && item.short_lines_ru && item.short_lines_ru.length) {
      return item.short_lines_ru;
    }
    if (item.short_lines_en && item.short_lines_en.length) {
      return item.short_lines_en;
    }
    return [];
  }

  function unlockTooltip(item) {
    if (item.kind === 'unique') {
      return `${kindLabel('unique')}: ${item.name}`;
    }
    const lines = [];
    if (item.kind === 'nation_effect') {
      lines.push(`${labelNation(item.uniqueTo || item.name)} (${kindLabel('nation_effect')})`);
    } else if (item.kind === 'improvement_bonus') {
      lines.push(`${labelConstruction(item.name)} (${kindLabel('improvement_bonus')})`);
    } else if (item.kind === 'building_bonus') {
      lines.push(`${labelConstruction(item.name)} (${kindLabel('building_bonus')})`);
    } else {
      lines.push(`${labelConstruction(item.name)} (${kindLabel(item.kind)})`);
    }
    if (item.uniqueTo && item.kind !== 'nation_effect') {
      lines.push(`${t('paths.uniqueTo', 'нация')}: ${labelNation(item.uniqueTo)}`);
    }
    const quote = (lang() === 'ru' && item.quote_ru) ? item.quote_ru : (item.quote || '');
    if (quote) lines.push(quote);
    unlockShortLines(item).forEach((u) => lines.push(String(u)));
    unlockUniques(item).forEach((u) => lines.push(String(u)));
    return lines.join('\n');
  }

  function techTooltip(name, detail) {
    const lines = [labelTech(name)];
    const quote = (lang() === 'ru' && detail.quote_ru) ? detail.quote_ru : (detail.quote || '');
    if (quote) lines.push(quote);
    const common = unlocksForTech(name, detail, selectedNation()).length;
    const nationN = (detail.nation_unlocks || []).length;
    if (common || nationN) {
      lines.push(
        t('paths.unlockSummary', 'открывает: {common} · уникалии наций: {nation}')
          .replace('{common}', String(common))
          .replace('{nation}', String(nationN))
      );
    }
    return lines.join('\n');
  }

  function makeUnlockIcon(item, opts) {
    const wrap = document.createElement('span');
    wrap.className = 'paths-tree-unlock';
    wrap.dataset.kind = item.kind || 'building';
    if (item.uniqueTo) wrap.dataset.uniqueTo = item.uniqueTo;
    if (opts && opts.mine) wrap.classList.add('is-mine');
    wrap.title = unlockTooltip(item);
    const img = document.createElement('img');
    img.className = 'paths-tree-unlock-img';
    img.alt = (item.kind === 'unique' || item.kind === 'nation_effect')
      ? (item.kind === 'nation_effect' ? labelNation(item.uniqueTo || item.name) : item.name)
      : labelConstruction(item.name);
    img.loading = 'lazy';

    // Try primary + fallbacks; never remove the slot (missing RekMOD icons
    // used to flash then vanish via wrap.remove()).
    const name = item.name;
    const candidates = [];
    const push = (url) => {
      if (url && !candidates.includes(url)) candidates.push(url);
    };
    push(unlockIcon(item));
    if (item.kind === 'wonder' || item.is_wonder) {
      push(`Building_icons/${encodeURIComponent(name)}.png`);
      push(`Wonder_icons/${encodeURIComponent(name)}.png`);
    }
    if (item.kind === 'building' || item.kind === 'building_bonus') {
      push(`Building_icons/${encodeURIComponent(name)}.png`);
      push(`Wonder_icons/${encodeURIComponent(name)}.png`);
    }
    if (item.kind === 'improvement' || item.kind === 'improvement_bonus') {
      push(`Improvement_icons/${encodeURIComponent(name)}.png`);
      push(`Building_icons/${encodeURIComponent(name)}.png`);
    }
    if (item.kind === 'unit') {
      push(`Unit_icons/${encodeURIComponent(name)}.png`);
    }
    if (item.kind === 'resource') {
      push(`Resource_icons/${encodeURIComponent(name)}.png`);
    }
    if (item.kind === 'nation_effect') {
      const nation = item.uniqueTo || name;
      push(`Nation_icons/${encodeURIComponent(nation)}.png`);
    }
    push('Unique_icons/Star.png');

    let tryIdx = 0;
    img.src = candidates[0];
    img.onerror = () => {
      tryIdx += 1;
      if (tryIdx < candidates.length) {
        img.src = candidates[tryIdx];
        return;
      }
      // Last resort already tried — keep empty plate, do not remove.
      img.onerror = null;
      img.style.visibility = 'hidden';
    };

    wrap.appendChild(img);
    if (opts && opts.withNation && item.uniqueTo) {
      const tag = document.createElement('span');
      tag.className = 'paths-tree-unlock-nation';
      tag.textContent = labelNation(item.uniqueTo);
      wrap.appendChild(tag);
    }
    return wrap;
  }

  function appendUnlocks(node, detail, techName) {
    const nation = selectedNation();
    const unlocks = unlocksForTech(techName, detail, nation);
    const nationList = nationUnlocksForTech(detail, nation);
    if (!unlocks.length && !nationList.length) return;

    const row = document.createElement('div');
    row.className = 'paths-tree-unlocks';
    unlocks.slice(0, MAX_UNLOCK_ICONS).forEach((item) => {
      row.appendChild(
        makeUnlockIcon(item, {
          mine: !!(nation && item.uniqueTo === nation),
        })
      );
    });

    if (nationList.length) {
      const mineCount = nation
        ? nationList.filter((u) => u.uniqueTo === nation).length
        : 0;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'paths-tree-nation-toggle' + (mineCount ? ' has-mine' : '');
      btn.title = t(
        'paths.nationUnlocksHint',
        'Уникальные юниты / здания / бонусы наций (как uniqueTo в Unciv)'
      );
      btn.textContent = mineCount
        ? `★${mineCount}/${nationList.length}`
        : `★${nationList.length}`;
      btn.setAttribute(
        'aria-label',
        t('paths.nationUnlocks', 'уникалии наций') + `: ${nationList.length}`
      );

      const panel = document.createElement('div');
      panel.className = 'paths-tree-nation-panel';
      panel.hidden = true;
      const head = document.createElement('div');
      head.className = 'paths-tree-nation-panel-head';
      head.textContent = t('paths.nationUnlocks', 'уникалии наций');
      panel.appendChild(head);
      const grid = document.createElement('div');
      grid.className = 'paths-tree-nation-grid';
      nationList.forEach((item) => {
        grid.appendChild(
          makeUnlockIcon(item, {
            withNation: true,
            mine: !!(nation && item.uniqueTo === nation),
          })
        );
      });
      panel.appendChild(grid);

      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const open = panel.hidden;
        // Close other open nation panels on the tree.
        node.parentElement
          && node.parentElement.querySelectorAll('.paths-tree-nation-panel:not([hidden])')
            .forEach((el) => {
              if (el !== panel) {
                el.hidden = true;
                const otherBtn = el.parentElement
                  && el.parentElement.querySelector('.paths-tree-nation-toggle.is-open');
                if (otherBtn) otherBtn.classList.remove('is-open');
              }
            });
        panel.hidden = !open;
        btn.classList.toggle('is-open', open);
        node.classList.toggle('is-nation-open', open);
      });

      row.appendChild(btn);
      node.appendChild(row);
      node.appendChild(panel);
      return;
    }

    if (row.childNodes.length) node.appendChild(row);
  }

  function renderTechTree() {
    const canvas = document.getElementById('pathsTechTree');
    const legend = document.getElementById('pathsTreeLegend');
    if (!canvas) return;

    const gameNum = selectedGame();
    const civ = selectedPlayer();
    if (!gameNum || !civ || !techTree) {
      canvas.innerHTML = '';
      canvas.style.width = '';
      canvas.style.height = '';
      if (legend) {
        legend.textContent = t(
          'paths.treeHint',
          'Выберите игру и игрока, чтобы увидеть полное древо техов.'
        );
      }
      return;
    }

    const row = (((timelines.games[gameNum] || {}).players) || {})[civ];
    if (!row) {
      canvas.innerHTML = '';
      return;
    }

    const done = researchedMap(row);
    const researching = row.researching_at_end || row.researching || null;
    const techs = visibleTechs();
    if (!techs.length) {
      canvas.innerHTML = '';
      if (legend) legend.textContent = '';
      return;
    }

    const minCol = Math.min(...techs.map((x) => x.column));
    const maxCol = Math.max(...techs.map((x) => x.column));
    const minRow = Math.min(...techs.map((x) => x.row));
    const maxRow = Math.max(...techs.map((x) => x.row));
    const width = PAD_X * 2 + (maxCol - minCol) * COL_W + NODE_W;
    const height =
      PAD_Y * 2 + ERA_BANNER_H + 10 + (maxRow - minRow) * ROW_H + NODE_H;

    const byName = Object.create(null);
    techs.forEach((tech) => { byName[tech.name] = tech; });

    canvas.innerHTML = '';
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Unciv-style era header bands spanning each era's columns.
    const eraBands = document.createElement('div');
    eraBands.className = 'paths-tree-era-banners';
    ERA_ORDER.forEach((era) => {
      const cols = techs.filter((tech) => tech.era === era).map((tech) => tech.column);
      if (!cols.length) return;
      const eraMin = Math.min(...cols);
      const eraMax = Math.max(...cols);
      const band = document.createElement('div');
      band.className = 'paths-tree-era-banner';
      band.style.left = `${PAD_X + (eraMin - minCol) * COL_W}px`;
      band.style.width = `${(eraMax - eraMin) * COL_W + NODE_W}px`;
      const rgb = eraRgb(era);
      band.style.background = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.88)`;
      band.style.borderColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`;
      band.textContent = eraLabel(era);
      band.title = eraLabel(era);
      eraBands.appendChild(band);
    });
    canvas.appendChild(eraBands);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'paths-tree-edges');
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    techs.forEach((tech) => {
      const to = nodeOrigin(tech, minCol, minRow);
      (tech.prerequisites || []).forEach((preName) => {
        const pre = byName[preName];
        if (!pre) return;
        const from = nodeOrigin(pre, minCol, minRow);
        const x1 = from.x + NODE_W;
        const y1 = from.y + NODE_H / 2;
        const x2 = to.x;
        const y2 = to.y + NODE_H / 2;
        const mx = (x1 + x2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const researchedEdge = done[preName] && done[tech.name];
        path.setAttribute('d', `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
        path.setAttribute('class', researchedEdge ? 'paths-edge is-done' : 'paths-edge');
        svg.appendChild(path);
      });
    });
    canvas.appendChild(svg);

    techs.forEach((tech) => {
      const pos = nodeOrigin(tech, minCol, minRow);
      const info = done[tech.name];
      const detail = techDetails[tech.name] || {};
      const node = document.createElement('div');
      node.className = 'paths-tree-node' + (info ? ' is-done' : ' is-locked');
      if (researching && researching === tech.name) node.classList.add('is-researching');
      node.dataset.era = tech.era || '';
      node.style.left = `${pos.x}px`;
      node.style.top = `${pos.y}px`;
      node.title = techTooltip(tech.name, detail);

      const plate = document.createElement('span');
      plate.className = 'paths-tree-tech-icon-plate';
      const img = document.createElement('img');
      img.className = 'paths-tree-tech-icon';
      img.alt = '';
      img.loading = 'lazy';
      img.src = techIcon(tech.name);
      img.onerror = () => { plate.style.visibility = 'hidden'; };
      plate.appendChild(img);

      const head = document.createElement('div');
      head.className = 'paths-tree-node-head';
      const title = document.createElement('div');
      title.className = 'paths-tree-node-title';
      title.textContent = labelTech(tech.name);
      head.appendChild(title);
      if (info) {
        const meta = document.createElement('div');
        meta.className = 'paths-tree-node-meta';
        meta.textContent = `#${info.order} · ${t('paths.turn', 'ход')} ${info.turn}`;
        head.appendChild(meta);
      } else if (researching && researching === tech.name) {
        const meta = document.createElement('div');
        meta.className = 'paths-tree-node-meta';
        meta.textContent = t('paths.researchingEnd', 'изучалось на финише');
        head.appendChild(meta);
      }

      node.appendChild(plate);
      node.appendChild(head);
      appendUnlocks(node, detail, tech.name);
      canvas.appendChild(node);
    });

    if (legend) {
      const parts = [
        t('paths.legendDone', 'зелёный — открыто'),
        t('paths.legendLocked', 'тёмный — не открыто'),
        t('paths.legendUnlocks', 'иконки снизу — что открывает тех'),
        t('paths.legendNation', '★ — уникалии наций (нажмите)'),
      ];
      if (researching) {
        parts.push(
          t('paths.legendResearching', 'обводка — изучалось на финише') +
            `: ${labelTech(researching)}`
        );
      }
      legend.textContent = parts.join(' · ');
    }
  }

  function renderPlayer() {
    const gameNum = selectedGame();
    const civ = selectedPlayer();
    const head = document.getElementById('pathsPlayerHeading');
    const techBox = document.getElementById('pathsTechTimeline');
    const polBox = document.getElementById('pathsPolicyTimeline');
    const meta = document.getElementById('pathsPlayerMeta');
    if (!gameNum || !civ || !timelines) {
      if (head) head.textContent = '';
      if (techBox) techBox.innerHTML = '';
      if (polBox) polBox.innerHTML = '';
      if (meta) meta.textContent = '';
      renderTechTree();
      return;
    }
    const row = (((timelines.games[gameNum] || {}).players) || {})[civ];
    if (!row) return;
    const nick = playerNick(gameNum, civ);
    const civLabel = labelNation(civ);
    if (head) {
      head.textContent = nick
        ? `${civLabel} — ${nick} · Game ${gameNum}`
        : `${civLabel} · Game ${gameNum}`;
    }
    if (meta) {
      const bits = [
        t('paths.playerMeta', 'Первый институт') + `: ${
          row.first_policy_branch ? labelPolicy(row.first_policy_branch) : '—'
        }`,
      ];
      if (row.researching_at_end || row.researching) {
        bits.push(
          t('paths.researchingEnd', 'изучалось на финише') +
            `: ${labelTech(row.researching_at_end || row.researching)}`
        );
      }
      meta.textContent = bits.join(' · ');
    }
    renderEraTabs();
    renderTechTree();
    renderTimelineList(techBox, row.techs, 'tech');
    renderTimelineList(polBox, row.policies, 'policy');
  }

  function renderAll() {
    fillGameSelect();
    fillPlayerSelect(selectedGame());
    renderGameChips();
    renderPlayerChips();
    renderEraTabs();
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
      setGame(e.target.value);
    });
    document.getElementById('pathsPlayerSelect')?.addEventListener('change', (e) => {
      setPlayer(e.target.value);
    });
  });
})();
