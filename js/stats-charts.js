/**
 * Bar and pie charts for Iron League stats (switchable views).
 * Столбчатые и круговые диаграммы статистики (переключаемые виды).
 */
(function (global) {
  'use strict';

  /** Fallback palette when label has no fixed color (maps, nations, …). */
  const COLORS = [
    '#ffd700', '#5b8def', '#3d8a4a', '#e07a5f', '#9b5de5',
    '#00bbf9', '#f15bb5', '#fee440', '#00f5d4', '#9b2226',
    '#adb5bd', '#ff922b',
  ];

  /**
   * Stable colors per policy tree / ideology (Civ5-ish).
   * Matched by normalized RU or EN name so pie slices keep color when sorted by size.
   */
  const POLICY_TREE_COLORS = {
    tradition: '#9b5de5',
    традиция: '#9b5de5',
    liberty: '#3d8a4a',
    вольность: '#3d8a4a',
    воля: '#3d8a4a',
    honor: '#c0392b',
    honour: '#c0392b',
    честь: '#c0392b',
    piety: '#f1c40f',
    благочестие: '#f1c40f',
    набожность: '#f1c40f',
    patronage: '#3498db',
    заступничество: '#3498db',
    меценатство: '#3498db',
    aesthetics: '#e91e63',
    эстетика: '#e91e63',
    commerce: '#1abc9c',
    коммерция: '#1abc9c',
    exploration: '#d35400',
    исследование: '#d35400',
    rationalism: '#5dade2',
    рационализм: '#5dade2',
    freedom: '#2980b9',
    свобода: '#2980b9',
    order: '#e74c3c',
    порядок: '#e74c3c',
    autocracy: '#7f8c8d',
    самодержавие: '#7f8c8d',
    автократия: '#7f8c8d',
  };

  function normalizeColorKey(raw) {
    return String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  /**
   * Color for a chart row: fixed per policy/ideology name, else palette by index.
   * Цвет строки: фиксированный по ветке/идеологии, иначе палитра по индексу.
   */
  function colorForLabel(label, index, colorKey) {
    const keys = [colorKey, label]
      .map(normalizeColorKey)
      .filter(Boolean);
    for (const key of keys) {
      if (POLICY_TREE_COLORS[key]) return POLICY_TREE_COLORS[key];
    }
    // Compound labels ("Tradition + Freedom", "Традиция · Честь"): first known token.
    for (const key of keys) {
      const parts = key.split(/\s*[+·|,/]\s*|\s+and\s+/);
      for (const part of parts) {
        const p = part.trim();
        if (POLICY_TREE_COLORS[p]) return POLICY_TREE_COLORS[p];
      }
    }
    return COLORS[index % COLORS.length];
  }

  function prepareList(rows, opts) {
    const options = opts || {};
    const maxBars = options.maxBars || 16;
    const valueKey = options.valueKey || 'value';
    const labelKey = options.labelKey || 'label';
    return (rows || [])
      .slice()
      .sort((a, b) => Number(b[valueKey] || 0) - Number(a[valueKey] || 0))
      .filter((r) => Number(r[valueKey] || 0) > 0)
      .slice(0, maxBars)
      .map((r) => ({
        label: String(r[labelKey] || ''),
        value: Number(r[valueKey] || 0),
        colorKey: r.colorKey != null ? String(r.colorKey) : String(r[labelKey] || ''),
      }));
  }

  function renderBarChart(container, rows, opts) {
    if (!container) return;
    const options = opts || {};
    const list = prepareList(rows, options);
    if (!list.length) {
      container.innerHTML = `<p class="hint">${options.emptyText || '—'}</p>`;
      return;
    }
    const max = Math.max(...list.map((r) => r.value), 1);
    container.innerHTML = `<div class="il-bar-chart" role="img" aria-label="${options.aria || ''}">${
      list.map((r, i) => {
        const pct = Math.max(2, Math.round((r.value / max) * 100));
        const color = colorForLabel(r.label, i, r.colorKey);
        return `<div class="il-bar-row">
          <div class="il-bar-label" title="${r.label}">${r.label}</div>
          <div class="il-bar-track"><div class="il-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          <div class="il-bar-value">${r.value}</div>
        </div>`;
      }).join('')
    }</div>`;
  }

  function polar(cx, cy, r, angleDeg) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function renderPieChart(container, rows, opts) {
    if (!container) return;
    const options = opts || {};
    const list = prepareList(rows, options);
    if (!list.length) {
      container.innerHTML = `<p class="hint">${options.emptyText || '—'}</p>`;
      return;
    }
    const total = list.reduce((s, r) => s + r.value, 0) || 1;
    const cx = 80;
    const cy = 80;
    const R = 70;
    let angle = 0;
    const slices = [];
    list.forEach((r, i) => {
      const sweep = (r.value / total) * 360;
      const start = angle;
      const end = angle + sweep;
      angle = end;
      const large = sweep > 180 ? 1 : 0;
      const [x1, y1] = polar(cx, cy, R, start);
      const [x2, y2] = polar(cx, cy, R, end);
      const color = colorForLabel(r.label, i, r.colorKey);
      const d = sweep >= 359.9
        ? `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
      slices.push(`<path d="${d}" fill="${color}" stroke="#0c0c14" stroke-width="1.5">
        <title>${r.label}: ${r.value}</title></path>`);
    });
    const legend = list.map((r, i) => {
      const pct = Math.round((r.value / total) * 1000) / 10;
      const color = colorForLabel(r.label, i, r.colorKey);
      return `<div class="il-pie-legend-row">
        <span class="il-pie-swatch" style="background:${color}"></span>
        <span class="il-pie-legend-label" title="${r.label}">${r.label}</span>
        <span class="il-pie-legend-value">${r.value} (${pct}%)</span>
      </div>`;
    }).join('');
    container.innerHTML = `<div class="il-pie-wrap" role="img" aria-label="${options.aria || ''}">
      <svg class="il-pie-svg" viewBox="0 0 160 160" width="180" height="180">${slices.join('')}</svg>
      <div class="il-pie-legend">${legend}</div>
    </div>`;
  }

  /**
   * Mount chart with bar/pie toggle; persists mode in localStorage.
   * Монтирует диаграмму с переключателем bar/pie.
   */
  function renderChartWithToggle(container, rows, opts) {
    if (!container) return;
    const options = opts || {};
    const storageKey = options.storageKey || 'il_chart_mode_default';
    let mode = 'pie';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'bar' || saved === 'pie') mode = saved;
    } catch (e) { /* ignore */ }

    const shell = document.createElement('div');
    shell.className = 'il-chart-shell';
    shell.innerHTML = `<div class="il-chart-toolbar" role="group">
      <button type="button" class="il-chart-mode-btn" data-mode="pie">${options.pieLabel || 'Pie'}</button>
      <button type="button" class="il-chart-mode-btn" data-mode="bar">${options.barLabel || 'Bars'}</button>
    </div>
    <div class="il-chart-body"></div>`;
    container.innerHTML = '';
    container.appendChild(shell);
    const body = shell.querySelector('.il-chart-body');
    const paint = () => {
      shell.querySelectorAll('.il-chart-mode-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
      });
      if (mode === 'bar') renderBarChart(body, rows, options);
      else renderPieChart(body, rows, options);
    };
    shell.querySelectorAll('.il-chart-mode-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        mode = btn.dataset.mode;
        try { localStorage.setItem(storageKey, mode); } catch (e) { /* ignore */ }
        paint();
      });
    });
    paint();
  }

  /**
   * Line chart for ordered points { label, value } (e.g. game # → metric).
   * Линейный график по упорядоченным точкам { label, value }.
   */
  function renderLineChart(container, points, opts) {
    if (!container) return;
    const options = opts || {};
    const list = (points || [])
      .map((p) => ({
        label: String(p.label != null ? p.label : ''),
        value: Number(p.value),
      }))
      .filter((p) => Number.isFinite(p.value));
    if (!list.length) {
      container.innerHTML = `<p class="hint">${options.emptyText || '—'}</p>`;
      return;
    }

    const W = 640;
    const H = 220;
    const padL = 44;
    const padR = 16;
    const padT = 16;
    const padB = 36;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const values = list.map((p) => p.value);
    let minV = Math.min(...values);
    let maxV = Math.max(...values);
    if (minV === maxV) {
      minV -= 1;
      maxV += 1;
    }
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const xAt = (i) => padL + (list.length === 1 ? plotW / 2 : (i / (list.length - 1)) * plotW);
    const yAt = (v) => padT + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const poly = list.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ');
    const avgY = yAt(avg);
    const color = options.color || '#ffd700';
    const dots = list.map((p, i) => {
      const cx = xAt(i);
      const cy = yAt(p.value);
      const title = `${p.label}: ${p.value}`;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4" fill="${color}" stroke="#0c0c14" stroke-width="1.5">
        <title>${title}</title></circle>`;
    }).join('');
    const xLabels = list.map((p, i) => {
      // Avoid crowding: show first/last and ~every Nth
      const step = Math.max(1, Math.ceil(list.length / 8));
      if (i !== 0 && i !== list.length - 1 && i % step !== 0) return '';
      return `<text x="${xAt(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" class="il-line-axis">${p.label}</text>`;
    }).join('');
    const yTicks = [minV, avg, maxV].map((v) => {
      const y = yAt(v);
      const label = Number.isInteger(v) ? String(v) : v.toFixed(1);
      return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" class="il-line-grid" />
        <text x="${padL - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="il-line-axis">${label}</text>`;
    }).join('');

    container.innerHTML = `<div class="il-line-chart" role="img" aria-label="${options.aria || ''}">
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="xMidYMid meet">
        ${yTicks}
        <line x1="${padL}" y1="${avgY.toFixed(1)}" x2="${W - padR}" y2="${avgY.toFixed(1)}" class="il-line-avg" />
        <polyline fill="none" stroke="${color}" stroke-width="2.5" points="${poly}" />
        ${dots}
        ${xLabels}
      </svg>
      <div class="il-line-meta">${options.avgLabel || 'avg'}: <b>${avg.toFixed(1)}</b>
        · n=${list.length}
        · min ${Math.min(...values)}
        · max ${Math.max(...values)}</div>
    </div>`;
  }

  /**
   * Profile performance: average bars + metric tabs + line dynamics.
   * Профиль: средние + вкладки метрик + динамика по играм.
   */
  function renderProfilePerformance(container, series, opts) {
    if (!container) return;
    const options = opts || {};
    const metrics = options.metrics || [];
    const points = Array.isArray(series) ? series : [];
    if (!metrics.length || !points.length) {
      container.innerHTML = `<p class="hint">${options.emptyText || '—'}</p>`;
      return;
    }

    const avgs = [];
    metrics.forEach((m) => {
      const vals = points
        .map((p) => Number(p[m.key]))
        .filter((v) => Number.isFinite(v));
      if (!vals.length) return;
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      avgs.push({ label: m.label, value: Math.round(avg * 10) / 10, colorKey: m.key });
    });

    let metricKey = options.defaultMetric || (metrics[0] && metrics[0].key) || '';
    try {
      const saved = localStorage.getItem(options.storageKey || 'il_profile_perf_metric');
      if (saved && metrics.some((m) => m.key === saved)) metricKey = saved;
    } catch (e) { /* ignore */ }

    container.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'profile-perf-shell';
    shell.innerHTML = `
      <div class="profile-perf-avgs"></div>
      <div class="profile-perf-tabs" role="tablist"></div>
      <div class="profile-perf-line"></div>`;
    container.appendChild(shell);
    const avgsEl = shell.querySelector('.profile-perf-avgs');
    const tabsEl = shell.querySelector('.profile-perf-tabs');
    const lineEl = shell.querySelector('.profile-perf-line');

    renderBarChart(avgsEl, avgs, {
      aria: options.avgsAria || '',
      emptyText: options.emptyText || '—',
      maxBars: metrics.length,
    });

    const paintLine = () => {
      const meta = metrics.find((m) => m.key === metricKey) || metrics[0];
      tabsEl.querySelectorAll('.profile-perf-tab').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.metric === meta.key);
      });
      const linePoints = points
        .map((p) => ({
          label: String(p.gameLabel != null ? p.gameLabel : p.game),
          value: Number(p[meta.key]),
        }))
        .filter((p) => Number.isFinite(p.value));
      renderLineChart(lineEl, linePoints, {
        color: colorForLabel(meta.label, 0, meta.key),
        avgLabel: options.avgLabel || 'avg',
        emptyText: options.emptyText || '—',
        aria: meta.label,
      });
    };

    tabsEl.innerHTML = metrics.map((m) => {
      const has = points.some((p) => Number.isFinite(Number(p[m.key])));
      if (!has) return '';
      return `<button type="button" class="profile-perf-tab" data-metric="${m.key}">${m.label}</button>`;
    }).join('');
    tabsEl.querySelectorAll('.profile-perf-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        metricKey = btn.dataset.metric;
        try {
          localStorage.setItem(options.storageKey || 'il_profile_perf_metric', metricKey);
        } catch (e) { /* ignore */ }
        paintLine();
      });
    });
    paintLine();
  }

  global.IronLeagueCharts = {
    renderBarChart,
    renderPieChart,
    renderLineChart,
    renderChartWithToggle,
    renderProfilePerformance,
    colorForLabel,
  };
})(typeof window !== 'undefined' ? window : globalThis);
