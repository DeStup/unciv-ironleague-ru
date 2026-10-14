/**
 * Live tournament bracket for Archive / Stats when a single tournament is selected.
 * Data: GET /api/home/tournaments/{name} (CORS open for GitHub Pages).
 */
(function (global) {
  'use strict';

  const cache = new Map(); // name -> { promise, data, error, at }
  let opts = null;
  let requestSeq = 0;
  let bound = false;

  function tt(key, vars) {
    if (global.IronLeagueUiHelpers && IronLeagueUiHelpers.tt) {
      return IronLeagueUiHelpers.tt(key, vars);
    }
    if (global.IronLeagueI18n && IronLeagueI18n.t) return IronLeagueI18n.t(key, vars);
    return key;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    if (global.IronLeagueUiHelpers && IronLeagueUiHelpers.escapeAttr) {
      return IronLeagueUiHelpers.escapeAttr(s);
    }
    return escapeHtml(s);
  }

  function displayNick(name) {
    if (global.IronLeaguePlayerMeta && IronLeaguePlayerMeta.displayPlayerName) {
      return IronLeaguePlayerMeta.displayPlayerName(name);
    }
    return String(name || '').trim() || '—';
  }

  function matchCode(id) {
    if (!id) return '';
    if (id === 'GF') return tt('bracket.gfShort');
    let m = /^W(\d+)M(\d+)$/.exec(id);
    if (m) return `${tt('bracket.wbShort')}${m[1]}.${m[2]}`;
    m = /^L(\d+)M(\d+)$/.exec(id);
    if (m) return `${tt('bracket.lbShort')}${m[1]}.${m[2]}`;
    return id;
  }

  function matchStatusKey(m) {
    if (!m) return 'not_started';
    if (m.winner != null || m.state === 'done') return 'finished';
    const st = m.game && m.game.stage;
    if (st === 'coin' || st === 'bans' || st === 'picks') return 'draft';
    if (m.gameName) return 'playing';
    return 'not_started';
  }

  function statusLabel(key) {
    const map = {
      not_started: 'bracket.status.notStarted',
      draft: 'bracket.status.draft',
      playing: 'bracket.status.playing',
      finished: 'bracket.status.finished',
    };
    return tt(map[key] || map.not_started);
  }

  function slotView(slot, seeds) {
    if (!slot) return { text: '—', pending: true, seed: null };
    if (slot.bye) return { text: tt('bracket.bye'), pending: true, seed: null };
    if (typeof slot.seed === 'number') {
      const s = (seeds || []).find((x) => x.seed === slot.seed);
      return {
        text: displayNick(s && s.name ? s.name : `#${slot.seed}`),
        pending: false,
        seed: slot.seed,
        rawName: s && s.name ? String(s.name) : '',
      };
    }
    if (slot.win) {
      return { text: `${tt('bracket.winnerOf')} ${matchCode(slot.win)}`, pending: true, seed: null };
    }
    if (slot.lose) {
      return { text: `${tt('bracket.loserOf')} ${matchCode(slot.lose)}`, pending: true, seed: null };
    }
    return { text: '—', pending: true, seed: null };
  }

  function gamesIndex() {
    const list = opts && typeof opts.getGames === 'function' ? (opts.getGames() || []) : [];
    const byNumber = new Map();
    const byMatch = new Map();
    for (const g of list) {
      const num = String(g.number || '').trim();
      if (num) byNumber.set(num, g);
      const mid = String(g.matchId || '').trim();
      const tn = String(g.tournamentName || '').trim();
      if (mid && tn) byMatch.set(`${tn}\0${mid}`, g);
    }
    return { byNumber, byMatch };
  }

  function findArchiveGame(match, tournamentName, index) {
    if (!match || !index) return null;
    const gname = String(match.gameName || '').trim();
    if (gname && index.byNumber.has(gname)) return index.byNumber.get(gname);
    const mid = String(match.id || '').trim();
    if (mid && tournamentName) {
      const hit = index.byMatch.get(`${tournamentName}\0${mid}`);
      if (hit) return hit;
    }
    // bo3: series games may be gameName + "-2" etc., or listed under matchId.
    if (Array.isArray(match.games)) {
      for (const sg of match.games) {
        const n = String(sg && sg.name || '').trim();
        if (n && index.byNumber.has(n)) return index.byNumber.get(n);
      }
    }
    return null;
  }

  function roundTitle(part, idx, total) {
    if (part === 'gf') return tt('bracket.grandFinal');
    if (part === 'wb') {
      if (idx === total - 1) return tt('bracket.wbFinal');
      return tt('bracket.roundN', { n: String(idx + 1) });
    }
    return tt('bracket.lbRoundN', { n: String(idx + 1) });
  }

  function renderMatch(m, seeds, tournamentName, index) {
    const a = slotView(m.a, seeds);
    const b = slotView(m.b, seeds);
    const done = m.state === 'done' || m.winner != null;
    const sk = matchStatusKey(m);
    const showScore = typeof (m.a && m.a.seed) === 'number' && typeof (m.b && m.b.seed) === 'number';
    const sa = Number(m.scoreA) || 0;
    const sb = Number(m.scoreB) || 0;
    const isBo3 = m.format === 'bo3';
    const arch = findArchiveGame(m, tournamentName, index);
    const aWin = done && m.winner === (m.a && m.a.seed);
    const bWin = done && m.winner === (m.b && m.b.seed);

    function slotRow(side, score, win) {
      const cls = `il-bm-slot${showScore ? ' il-bm-slot--score' : ''}${side.pending ? ' is-pending' : ''}${win ? ' is-win' : ''}`;
      const nameBtn = (!side.pending && side.rawName)
        ? `<button type="button" class="il-bm-nick" data-player="${escapeAttr(side.rawName)}">${escapeHtml(side.text)}</button>`
        : `<span class="il-bm-nick">${escapeHtml(side.text)}</span>`;
      return showScore
        ? `<div class="${cls}">${nameBtn}<span class="il-bm-wins">${score}</span></div>`
        : `<div class="${cls}">${nameBtn}</div>`;
    }

    const openBtn = arch
      ? `<button type="button" class="il-bm-open" data-game-id="${escapeAttr(arch.id)}">${tt('bracket.openArchive')}</button>`
      : (m.gameName
        ? `<span class="il-bm-session" title="${escapeAttr(m.gameName)}">${escapeHtml(m.gameName)}</span>`
        : '');

    return `<article class="il-bm il-bm--${sk}${done ? ' is-done' : ''}" data-match-id="${escapeAttr(m.id)}">
      <div class="il-bm-id">
        <span>${escapeHtml(matchCode(m.id))}${isBo3 ? '<span class="il-bm-bo3">bo3</span>' : ''}</span>
        <span class="il-bm-status il-bm-status--${sk}">${escapeHtml(statusLabel(sk))}</span>
      </div>
      ${slotRow(a, sa, aWin)}${slotRow(b, sb, bWin)}
      ${openBtn ? `<div class="il-bm-foot">${openBtn}</div>` : ''}
    </article>`;
  }

  function renderBand(title, rounds, part, seeds, tournamentName, index) {
    if (!rounds || !rounds.length) return '';
    const cols = rounds.map((rnd, i) => {
      const matches = (rnd || [])
        .filter((m) => m && m.state !== 'empty')
        .map((m) => renderMatch(m, seeds, tournamentName, index))
        .join('');
      if (!matches) return '';
      return `<div class="il-bracket-round">
        <div class="il-bracket-round-title">${escapeHtml(roundTitle(part, i, rounds.length))}</div>
        <div class="il-bracket-round-list">${matches}</div>
      </div>`;
    }).filter(Boolean).join('');
    if (!cols) return '';
    return `<section class="il-bracket-band il-bracket-band--${part}">
      <h3 class="il-bracket-band-title">${escapeHtml(title)}</h3>
      <div class="il-bracket-rounds">${cols}</div>
    </section>`;
  }

  function renderPodium(podium) {
    if (!Array.isArray(podium) || !podium.length) return '';
    const rows = podium.slice(0, 3).map((p) => {
      const place = Number(p.place) || 0;
      const name = displayNick(p.name);
      const raw = String(p.name || '').trim();
      const nick = raw
        ? `<button type="button" class="il-bm-nick" data-player="${escapeAttr(raw)}">${escapeHtml(name)}</button>`
        : escapeHtml(name);
      return `<li class="il-bracket-podium-item il-bracket-podium-item--${place}">
        <span class="il-bracket-podium-place">${place || '—'}</span>
        ${nick}
      </li>`;
    }).join('');
    return `<ul class="il-bracket-podium" aria-label="${escapeAttr(tt('bracket.podium'))}">${rows}</ul>`;
  }

  function renderDetail(detail) {
    const br = detail && detail.bracket;
    const name = String((detail && detail.name) || '').trim();
    const liveUrl = global.IronLeagueLive
      ? IronLeagueLive.tournamentPageUrl(name)
      : '#';
    const status = detail.statusLabel || detail.status || '';
    const index = gamesIndex();
    const seeds = (br && br.seeds) || [];

    let body = '';
    if (!br) {
      body = `<div class="il-bracket-empty">${escapeHtml(tt('bracket.pending'))}</div>`;
    } else {
      body = [
        renderPodium(detail.podium),
        renderBand(tt('bracket.wb'), br.wb, 'wb', seeds, name, index),
        renderBand(tt('bracket.lb'), br.lb, 'lb', seeds, name, index),
        renderBand(tt('bracket.grandFinal'), br.gf && br.gf.length ? [br.gf] : [], 'gf', seeds, name, index),
      ].join('');
      if (!body.trim()) {
        body = `<div class="il-bracket-empty">${escapeHtml(tt('bracket.pending'))}</div>`;
      }
    }

    return `<div class="il-bracket" data-tournament="${escapeAttr(name)}">
      <div class="il-bracket-head">
        <div class="il-bracket-head-text">
          <h2 class="il-bracket-title">${escapeHtml(name)}</h2>
          ${status ? `<span class="il-bracket-status">${escapeHtml(status)}</span>` : ''}
        </div>
        <a class="il-bracket-live" href="${escapeAttr(liveUrl)}" target="_blank" rel="noopener noreferrer">${tt('bracket.openLive')}</a>
      </div>
      ${body}
    </div>`;
  }

  function setContainersHtml(html, visible) {
    if (!opts || !opts.containers) return;
    for (const sel of opts.containers) {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el) continue;
      el.hidden = !visible;
      if (visible) el.innerHTML = html;
      else el.innerHTML = '';
    }
  }

  function bindContainerClicks() {
    if (bound || !opts || !opts.containers) return;
    bound = true;
    for (const sel of opts.containers) {
      const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
      if (!el || el.dataset.bracketBound) continue;
      el.dataset.bracketBound = '1';
      el.addEventListener('click', (e) => {
        const gameBtn = e.target.closest('[data-game-id]');
        if (gameBtn && opts.onOpenGame) {
          e.preventDefault();
          opts.onOpenGame(gameBtn.getAttribute('data-game-id'));
          return;
        }
        const playerBtn = e.target.closest('[data-player]');
        if (playerBtn && opts.onOpenPlayer) {
          e.preventDefault();
          opts.onOpenPlayer(playerBtn.getAttribute('data-player'));
        }
      });
    }
  }

  function loadTournament(name) {
    const key = String(name || '').trim();
    if (!key) return Promise.reject(new Error('empty'));
    const hit = cache.get(key);
    const freshMs = 60 * 1000;
    if (hit && hit.data && Date.now() - hit.at < freshMs) {
      return Promise.resolve(hit.data);
    }
    if (hit && hit.promise) return hit.promise;
    if (!global.IronLeagueLive || !IronLeagueLive.fetchTournament) {
      return Promise.reject(new Error('live module missing'));
    }
    const entry = { at: Date.now(), data: hit && hit.data, error: null, promise: null };
    entry.promise = IronLeagueLive.fetchTournament(key)
      .then((data) => {
        entry.data = data;
        entry.error = null;
        entry.at = Date.now();
        entry.promise = null;
        cache.set(key, entry);
        return data;
      })
      .catch((err) => {
        entry.error = err;
        entry.promise = null;
        cache.set(key, entry);
        throw err;
      });
    cache.set(key, entry);
    return entry.promise;
  }

  function activeTournamentName() {
    if (!opts) return '';
    const mode = typeof opts.getPoolMode === 'function' ? opts.getPoolMode() : 'ffa';
    if (mode !== 'tournaments') return '';
    const tn = typeof opts.getTournamentNameFilter === 'function'
      ? opts.getTournamentNameFilter()
      : 'all';
    if (!tn || tn === 'all') return '';
    return String(tn).trim();
  }

  async function refresh() {
    bindContainerClicks();
    const name = activeTournamentName();
    const seq = ++requestSeq;
    if (!name) {
      setContainersHtml('', false);
      return;
    }
    if (!global.IronLeagueLive) {
      setContainersHtml(
        `<div class="il-bracket"><div class="il-bracket-empty">${escapeHtml(tt('bracket.unavailable'))}</div></div>`,
        true,
      );
      return;
    }
    setContainersHtml(
      `<div class="il-bracket"><div class="il-bracket-empty">${escapeHtml(tt('bracket.loading'))}</div></div>`,
      true,
    );
    try {
      const detail = await loadTournament(name);
      if (seq !== requestSeq) return;
      // Re-check filter in case user changed selection while loading.
      if (activeTournamentName() !== name) return;
      setContainersHtml(renderDetail(detail), true);
    } catch (err) {
      if (seq !== requestSeq) return;
      if (activeTournamentName() !== name) return;
      const cached = cache.get(name);
      if (cached && cached.data) {
        setContainersHtml(renderDetail(cached.data), true);
        return;
      }
      setContainersHtml(
        `<div class="il-bracket"><div class="il-bracket-empty">${escapeHtml(tt('bracket.error', { err: String(err && err.message || err) }))}</div></div>`,
        true,
      );
    }
  }

  function configure(next) {
    opts = next || null;
    bound = false;
  }

  global.IronLeagueBracket = {
    configure,
    refresh,
    loadTournament,
  };
})(typeof window !== 'undefined' ? window : globalThis);
