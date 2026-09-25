    // Конфигурация
    function tt(key, vars) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.tt) return IronLeagueUiHelpers.tt(key, vars);
        if (window.IronLeagueI18n && IronLeagueI18n.t) return IronLeagueI18n.t(key, vars);
        return key;
    }
    function localeTag() {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.localeTag) return IronLeagueUiHelpers.localeTag();
        return (window.IronLeagueI18n && IronLeagueI18n.getLang() === 'en') ? 'en' : 'ru';
    }

    /** localeCompare options for UI alphabetical sorts. */
    function localeCompareOpts() {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.localeCompareOpts) return IronLeagueUiHelpers.localeCompareOpts();
        return { sensitivity: 'base', numeric: true };
    }

    /**
     * Public player label (Telegram nicks truncated; site logins unchanged).
     * Публичная подпись игрока (тг-ники режем, логины сайта нет).
     */
    function displayPlayerName(name) {
        if (window.IronLeaguePlayerMeta && IronLeaguePlayerMeta.displayPlayerName) {
            return IronLeaguePlayerMeta.displayPlayerName(name);
        }
        return String(name || '').trim();
    }

    /**
     * Text used for alphabetical column sort (matches what the user sees).
     * Текст для алфавитной сортировки колонки (как на экране).
     */
    function sortDisplayText(row, key, labelFns) {
        if (labelFns && typeof labelFns[key] === 'function') {
            return String(labelFns[key](row) ?? '');
        }
        const raw = row ? row[key] : '';
        if (key === 'nation' || key === 'topNation' || key === 'civRu') {
            return displayNationName(row.nation || row.civRu || raw || '');
        }
        if (key === 'civ') {
            return displayNationName(row.civRu || engToRusNation(row.civ) || row.civ || '');
        }
        if (key === 'topIdeology') {
            return displayPolicyName(raw || '');
        }
        return null;
    }

    // Site config + cache-busted fetch + unciv-web replay helpers live in
    // js/site-core.js (IronLeagueSiteCore). Thin wrappers keep the page script
    // calling the same names while modules share one cache-bust token.
    const CONFIG = (window.IronLeagueSiteCore && IronLeagueSiteCore.CONFIG) || {};

    function assetUrl(path) {
        if (window.IronLeagueSiteCore && IronLeagueSiteCore.assetUrl) {
            return IronLeagueSiteCore.assetUrl(path);
        }
        const bust = window.IronLeagueCacheBust || String(Date.now());
        const sep = path.includes('?') ? '&' : '?';
        return `${path}${sep}v=${encodeURIComponent(bust)}`;
    }

    function fetchFresh(path, init) {
        if (window.IronLeagueSiteCore && IronLeagueSiteCore.fetchFresh) {
            return IronLeagueSiteCore.fetchFresh(path, init);
        }
        const opts = Object.assign({ cache: 'no-store' }, init || {});
        return fetch(assetUrl(path), opts);
    }

    function initAssetCacheBust() {
        if (window.IronLeagueSiteCore && IronLeagueSiteCore.initAssetCacheBust) {
            return IronLeagueSiteCore.initAssetCacheBust();
        }
        return Promise.resolve();
    }

    function webReplayUrl(game) {
        if (window.IronLeagueSiteCore && IronLeagueSiteCore.webReplayUrl) {
            return IronLeagueSiteCore.webReplayUrl(game);
        }
        const folder = formatGameLabel(game);
        if (!folder) return '';
        const base = String(CONFIG.webReplaysBase || '').replace(/\/+$/, '');
        if (!base) return '';
        return `${base}/${folder}`;
    }

    function renderWebReplayButton(game) {
        if (window.IronLeagueSiteCore && IronLeagueSiteCore.renderWebReplayButton) {
            return IronLeagueSiteCore.renderWebReplayButton(game);
        }
        const href = webReplayUrl(game);
        if (!href) return '';
        return `<a class="replay-button replay-button--web" href="${href}"
            target="_blank" rel="noopener noreferrer"
            title="${tt('card.webReplayTitle')}">${tt('card.webReplay')}</a>`;
    }

    let wonderNamesRu = {};
    /** eng wonder → Civilopedia-style lines (from tech_details export). */
    let wonderDetails = {};
    /** eng nation → { en, ru } default capital (first city in Nations.json). */
    let defaultCapitals = {};

    // Названия наций (eng <-> ru) — из data/nation_names.json (источник: Nations.json RekMOD).
    let nations = [];

    // Map для быстрого поиска: русское название -> английское (строится после загрузки nations).
    let nationMap = new Map();
    function rebuildNationMap() {
        nationMap = new Map();
        nations.forEach(item => {
            if (item.rus) nationMap.set(item.rus, item.eng);
        });
        // Keep the shared module in sync — engToRusNation/displayNationName
        // prefer IronLeagueNationNames when the script is loaded.
        if (window.IronLeagueNationNames && typeof IronLeagueNationNames.setNations === 'function') {
            IronLeagueNationNames.setNations(nations);
        }
    }

    // Цвета наций (Unciv + RekMOD): eng -> {outer, inner}
    let nationColors = {};
    let nationColorFallback = { outer: [80, 80, 80], inner: [255, 255, 255] };

    // Глобальные переменные
    let gamesData = [];
    let allNations = new Set();

    function gameFlags(game) {
        return (window.IronLeagueGamesCore && IronLeagueGamesCore.gameFlags)
            ? IronLeagueGamesCore.gameFlags(game)
            : (Array.isArray(game && game.flags) ? game.flags.map(String) : []);
    }

    function isExcludedGame(game) {
        if (window.IronLeagueGamesCore && typeof IronLeagueGamesCore.isExcludedGame === 'function') {
            return IronLeagueGamesCore.isExcludedGame(game);
        }
        if (game && game.excludeFromStats) return true;
        if (isTournamentGame(game)) return true;
        const flags = gameFlags(game).map((f) => f.toLowerCase());
        return flags.includes('teams') || flags.includes('scrap') || flags.includes('team');
    }

    function isTournamentGame(game) {
        if (window.IronLeagueGamesCore && typeof IronLeagueGamesCore.isTournamentGame === 'function') {
            return IronLeagueGamesCore.isTournamentGame(game);
        }
        if (game && String(game.tournamentName || '').trim()) return true;
        const flags = gameFlags(game).map((f) => f.toLowerCase());
        return flags.includes('tournament');
    }

    /** Winning nation: Games.json winner, else CC vote, else top finale score. */
    function resolveWinnerNation(game) {
        if (window.IronLeagueGamesCore && typeof IronLeagueGamesCore.resolveWinnerNation === 'function') {
            return IronLeagueGamesCore.resolveWinnerNation(game);
        }
        return String((game && game.winner) || '').trim();
    }

    function rankedGamesOnly(games) {
        if (window.IronLeagueGamesCore && typeof IronLeagueGamesCore.rankedGamesOnly === 'function') {
            return IronLeagueGamesCore.rankedGamesOnly(games);
        }
        return (games || []).filter((g) => !isExcludedGame(g));
    }

    function tournamentGamesOnly(games) {
        if (window.IronLeagueGamesCore && typeof IronLeagueGamesCore.tournamentGamesOnly === 'function') {
            return IronLeagueGamesCore.tournamentGamesOnly(games);
        }
        return (games || []).filter(isTournamentGame);
    }

    function getPoolMode() {
        return IronLeaguePool.getPoolMode();
    }

    function getTournamentNameFilter() {
        return IronLeaguePool.getTournamentNameFilter();
    }

    function getFfaSeasonFilter() {
        return IronLeaguePool.getFfaSeasonFilter();
    }

    function getRecordsSeasonFilter() {
        return IronLeaguePool.getFfaSeasonFilter();
    }

    function loadPoolMode() {
        IronLeaguePool.load();
    }

    function setPoolMode(mode, silent) {
        IronLeaguePool.setPoolMode(mode, silent);
    }

    function setTournamentNameFilter(name, silent) {
        IronLeaguePool.setTournamentNameFilter(name, silent);
    }

    function setFfaSeasonFilter(season, silent) {
        IronLeaguePool.setFfaSeasonFilter(season, silent);
    }

    function setRecordsSeasonFilter(season, silent) {
        IronLeaguePool.setFfaSeasonFilter(season, silent);
    }

    function activeGamesPool() {
        return IronLeaguePool.activeGamesPool();
    }

    function seasonScopedPool() {
        return IronLeaguePool.seasonScopedPool();
    }

    function recordsGamesPool() {
        return IronLeaguePool.seasonScopedPool();
    }

    function fillTournamentNameSelects() {
        IronLeaguePool.fillTournamentNameSelects();
    }

    function fillFfaSeasonSelects() {
        IronLeaguePool.fillFfaSeasonSelects();
    }

    function fillRecordsSeasonSelect() {
        IronLeaguePool.fillFfaSeasonSelects();
    }

    function syncPoolModeUi() {
        IronLeaguePool.syncUi();
    }

    function refreshPoolDependentViews() {
        const steps = [
            filterGames,
            renderStatsTables,
            renderRatingTables,
            renderRecords,
        ];
        for (const step of steps) {
            try {
                step();
            } catch (err) {
                console.error('[IronLeague] pool refresh failed in', step.name || 'step', err);
            }
        }
        const profileActive = document.getElementById('viewProfile')?.classList.contains('active');
        if (profileActive) {
            const title = document.getElementById('profileTitle');
            const name = title?.dataset?.playerName || '';
            if (name) {
                try {
                    openPlayerProfile(name);
                } catch (err) {
                    console.error('[IronLeague] profile refresh failed', err);
                }
            }
        }
    }

    function parseGameNum(game) {
        if (window.IronLeagueGamesCore && IronLeagueGamesCore.parseGameNum) {
            return IronLeagueGamesCore.parseGameNum(game);
        }
        const id = Number(game && game.id);
        if (Number.isFinite(id) && id >= 1) return id;
        const m = String((game && game.number) || '').match(/(\d+)\s*$/);
        return m ? parseInt(m[1], 10) : 0;
    }

    /** Spectator-style label: IronLeague-25 / IronLeague-team2. */
    function formatGameLabel(game) {
        if (window.IronLeagueGamesCore && IronLeagueGamesCore.formatGameLabel) {
            return IronLeagueGamesCore.formatGameLabel(game);
        }
        const id = Number(game && game.id);
        if (Number.isFinite(id) && id >= 1) return `IronLeague-${id}`;
        return String((game && game.number) || '');
    }

    function renderGameFlags(game) {
        const flags = gameFlags(game).map((f) => f.toLowerCase());
        const parts = [];
        const isTour = isTournamentGame(game);
        if (isTour) {
            parts.push(`<span class="game-flag-badge tournament">${tt('badge.tournament')}</span>`);
        }
        if (flags.includes('teams') || flags.includes('team')) {
            parts.push(`<span class="game-flag-badge teams">${tt('badge.teams')}</span>`);
        }
        if (flags.includes('scrap')) {
            parts.push(`<span class="game-flag-badge scrap">${tt('badge.scrap')}</span>`);
        }
        if (!isTour && isExcludedGame(game)) {
            parts.push(`<span class="game-flag-badge excluded">${tt('badge.excluded')}</span>`);
        }
        if (game && game.note) {
            parts.push(`<span class="game-flag-badge">${String(game.note).replace(/</g, '&lt;')}</span>`);
        }
        return parts.length ? `<div class="game-flags">${parts.join('')}</div>` : '';
    }


    function rgbCss(rgb) {
        if (!Array.isArray(rgb) || rgb.length < 3) return '#808080';
        return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    // Функция для получения пути к иконке нации
    function getNationIconPath(russianName) {
        const englishName = nationMap.get(russianName);
        if (englishName) {
            return `${CONFIG.nationsPath}${encodeURIComponent(englishName)}.png`;
        }
        console.warn(`Иконка для нации "${russianName}" не найдена`);
        return `${CONFIG.nationsPath}Random.png`;
    }

    function getNationColors(russianName) {
        const englishName = nationMap.get(russianName);
        if (englishName && nationColors[englishName]) {
            return nationColors[englishName];
        }
        return nationColorFallback;
    }

    const portraitCache = new Map();
    const imageCache = new Map();

    function loadImage(url) {
        if (imageCache.has(url)) return imageCache.get(url);
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => {
                const fallback = `${CONFIG.nationsPath}Random.png`;
                if (url === fallback) {
                    reject(new Error('icon missing'));
                    return;
                }
                const fb = new Image();
                fb.onload = () => resolve(fb);
                fb.onerror = reject;
                fb.src = fallback;
            };
            img.src = url;
        });
        imageCache.set(url, promise);
        return promise;
    }

    /**
     * Solid-pixel bbox (for scale) + alpha centroid (for centering).
     * Soft halos (Ukraine etc.) skew a low-threshold bbox; mass stays stable.
     */
    function getAlphaLayout(img, solidThr = 128, massThr = 24) {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, w, h).data;

        let minX = w, minY = h, maxX = -1, maxY = -1;
        let sumA = 0, sumX = 0, sumY = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const a = data[(y * w + x) * 4 + 3];
                if (a >= solidThr) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
                if (a >= massThr) {
                    sumA += a;
                    sumX += x * a;
                    sumY += y * a;
                }
            }
        }

        const box = maxX < 0
            ? { x: 0, y: 0, w, h }
            : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };

        const massX = sumA > 0 ? sumX / sumA : box.x + box.w / 2;
        const massY = sumA > 0 ? sumY / sumA : box.y + box.h / 2;

        return { box, massX, massY, imgW: w, imgH: h };
    }

    /**
     * Unciv PortraitNation: outerColor fill, innerColor ring + silhouette.
     * Scale by solid alpha bbox; center by alpha centroid (RekMOD-safe).
     */
    async function buildNationPortraitDataUrl(russianName, size) {
        const colors = getNationColors(russianName);
        const iconUrl = getNationIconPath(russianName);
        const cacheKey = `${iconUrl}|${colors.outer}|${colors.inner}|${size}|v2`;
        if (portraitCache.has(cacheKey)) return portraitCache.get(cacheKey);

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx = size / 2;
        const cy = size / 2;
        const ring = Math.max(1.5, size * 0.08);
        const outerR = size / 2 - ring / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.fillStyle = rgbCss(colors.outer);
        ctx.fill();
        ctx.lineWidth = ring;
        ctx.strokeStyle = rgbCss(colors.inner);
        ctx.stroke();

        try {
            const img = await loadImage(iconUrl);
            const { box, massX, massY } = getAlphaLayout(img);
            const pad = size * 0.18;
            const avail = size - pad * 2;
            const scale = Math.min(avail / box.w, avail / box.h);

            // Place image so the alpha centroid lands on the circle center.
            const dx = cx - massX * scale;
            const dy = cy - massY * scale;
            const dw = (img.naturalWidth || img.width) * scale;
            const dh = (img.naturalHeight || img.height) * scale;

            const iconCanvas = document.createElement('canvas');
            iconCanvas.width = size;
            iconCanvas.height = size;
            const ictx = iconCanvas.getContext('2d');
            ictx.drawImage(img, 0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height, dx, dy, dw, dh);
            ictx.globalCompositeOperation = 'source-in';
            ictx.fillStyle = rgbCss(colors.inner);
            ictx.fillRect(0, 0, size, size);

            ctx.drawImage(iconCanvas, 0, 0);
        } catch (e) {
            console.warn('portrait icon failed', russianName, e);
        }

        const dataUrl = canvas.toDataURL('image/png');
        portraitCache.set(cacheKey, dataUrl);
        return dataUrl;
    }

    function victoryTypeLabel(victoryType) {
        const key = String(victoryType || '').trim();
        const map = {
            Scientific: 'victory.science',
            Science: 'victory.science',
            Cultural: 'victory.culture',
            Culture: 'victory.culture',
            Domination: 'victory.domination',
            Diplomatic: 'victory.diplomatic',
            Time: 'victory.time',
            CC: 'victory.cc',
            SS: 'victory.cc',
        };
        if (!key) return tt('victory.cc');
        if (map[key]) return tt(map[key]);
        const hit = Object.keys(map).find((k) => k.toLowerCase() === key.toLowerCase());
        return hit ? tt(map[hit]) : key;
    }
    const victoryTypeRu = victoryTypeLabel;

    function wonderNameRu(englishName) {
        if (window.IronLeagueI18n && IronLeagueI18n.getLang() === 'en') {
            return englishName;
        }
        return wonderNamesRu[englishName] || englishName;
    }

    function escapeAttr(text) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.escapeAttr) return IronLeagueUiHelpers.escapeAttr(text);
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    /** Same shape as tech-tree unlock tooltips (stats + translated uniques + quote). */
    function wonderTooltip(englishName) {
        const raw = String(englishName || '').trim();
        if (!raw) return '';
        const label = wonderNameRu(raw);
        const kind = (window.IronLeagueI18n && IronLeagueI18n.t)
            ? (IronLeagueI18n.t('paths.kind.wonder') || 'чудо')
            : 'чудо';
        const lines = [`${label} (${kind})`];
        const detail = wonderDetails[raw] || {};
        if (detail.uniqueTo) {
            const uniqueLabel = (window.IronLeagueI18n && IronLeagueI18n.t)
                ? (IronLeagueI18n.t('paths.uniqueTo') || 'нация')
                : 'нация';
            const nationLabel = displayNationName(engToRusNation(detail.uniqueTo));
            lines.push(`${uniqueLabel}: ${nationLabel || detail.uniqueTo}`);
        }
        const isEn = window.IronLeagueI18n && IronLeagueI18n.getLang() === 'en';
        const quote = (!isEn && detail.quote_ru) ? detail.quote_ru : (detail.quote || '');
        if (quote) lines.push(quote);
        const shortLines = (!isEn && detail.short_lines_ru && detail.short_lines_ru.length)
            ? detail.short_lines_ru
            : (detail.short_lines_en || []);
        shortLines.forEach((u) => lines.push(String(u)));
        const uniques = (!isEn && detail.uniques_ru && detail.uniques_ru.length)
            ? detail.uniques_ru
            : (detail.uniques_en || detail.uniques || []);
        uniques.forEach((u) => lines.push(String(u)));
        return lines.join('\n');
    }

    function wonderTitleAttr(englishName) {
        return escapeAttr(wonderTooltip(englishName) || wonderNameRu(englishName));
    }

    /** Resolve Games.json nation (RU or EN) to default_capitals.json key. */
    function resolveDefaultCapitalNationKey(nation) {
        const raw = String(nation || '').trim();
        if (!raw) return '';
        if (defaultCapitals[raw]) return raw;
        const fromRu = rusToEngNation(raw);
        if (fromRu && defaultCapitals[fromRu]) return fromRu;
        const stripped = raw.replace(/^The\s+/i, '');
        if (stripped !== raw && defaultCapitals[stripped]) return stripped;
        if (defaultCapitals[`The ${stripped}`]) return `The ${stripped}`;
        if (fromRu) {
            const fromRuStripped = String(fromRu).replace(/^The\s+/i, '');
            if (defaultCapitals[fromRuStripped]) return fromRuStripped;
            if (defaultCapitals[`The ${fromRuStripped}`]) return `The ${fromRuStripped}`;
        }
        return fromRu || raw;
    }

    /**
     * Show captured capital in UI language when the save city equals that
     * nation's default capital; leave renamed cities as stored.
     */
    function displayCapturedCity(nation, city) {
        const cityName = String(city || '').trim();
        if (!cityName) return displayNationName(nation);
        const entry = defaultCapitals[resolveDefaultCapitalNationKey(nation)];
        if (!entry) return cityName;
        const defaultEn = String(entry.en || '').trim();
        if (!defaultEn || cityName.toLowerCase() !== defaultEn.toLowerCase()) {
            return cityName;
        }
        if (window.IronLeagueI18n && IronLeagueI18n.getLang() === 'en') {
            return defaultEn;
        }
        return entry.ru || cityName;
    }

    function wonderIconUrl(englishName) {
        return CONFIG.wonderIconsPath + encodeURIComponent(englishName) + '.png';
    }

    /** Restart an animated GIF from the beginning by cache-busting its src. */
    function restartAnimatedGif(img) {
        if (!img) return;
        const base = img.dataset.replaySrc || String(img.getAttribute('src') || '').split('?')[0];
        if (!base) return;
        img.dataset.replaySrc = base;
        img.src = `${base}${base.includes('?') ? '&' : '?'}_r=${Date.now()}`;
    }

    /** Bind click-to-restart on replay GIFs inside a root element. */
    function bindReplayRestart(root) {
        if (!root) return;
        root.querySelectorAll('.replay-gif, .replay-gif-full').forEach(img => {
            if (img.dataset.replayBound === '1') return;
            img.dataset.replayBound = '1';
            if (!img.dataset.replaySrc) {
                img.dataset.replaySrc = String(img.getAttribute('src') || '').split('?')[0];
            }
            img.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                restartAnimatedGif(img);
            });
        });
    }

    function renderWonderItem(englishName) {
        const ru = wonderNameRu(englishName);
        const src = wonderIconUrl(englishName);
        const tip = wonderTitleAttr(englishName);
        return `<li>` +
            `<span class="wonder-icon-wrap">` +
            `<img class="wonder-icon" src="${src}" alt="${escapeAttr(ru)}" title="${tip}" ` +
            `loading="lazy" onerror="this.closest('.wonder-icon-wrap').style.display='none'">` +
            `</span>` +
            `<span title="${tip}">${ru}</span></li>`;
    }

    /** Wonder icon + localized name for chips/tables (no &lt;li&gt;). */
    function renderWonderLabel(englishName) {
        const raw = String(englishName || '').trim();
        if (!raw) return '—';
        const ru = wonderNameRu(raw);
        const safe = escapeAttr(ru);
        const tip = wonderTitleAttr(raw);
        const src = wonderIconUrl(raw);
        return `<span class="wonder-label" title="${tip}">` +
            `<span class="wonder-icon-wrap wonder-icon-wrap--mini">` +
            `<img class="wonder-icon" src="${src}" alt="${safe}" title="${tip}" ` +
            `loading="lazy" onerror="this.closest('.wonder-icon-wrap').style.display='none'">` +
            `</span>` +
            `<span class="wonder-label-text">${ru}</span></span>`;
    }

    /** Nation portrait + name with consistent gap/alignment. */
    function renderNationLabel(russianName, extraClass) {
        const name = String(russianName || '').trim();
        if (!name || name === '—') return '—';
        const cls = extraClass || 'player-nation-mini';
        return `<span class="nation-cell">${renderNationPortrait(name, cls)}` +
            `<span class="nation-cell-name">${displayNationName(name)}</span></span>`;
    }

    function renderNationPortrait(russianName, extraClass) {
        let size = 24;
        if (extraClass && extraClass.includes('profile-emblem-portrait')) size = 100;
        else if (extraClass && extraClass.includes('record-card-nation')) size = 28;
        else if (extraClass && extraClass.includes('player-nation-mini')) size = 20;
        else if (extraClass && extraClass.includes('record-runner-nation')) size = 18;
        const cls = ['nation-portrait', extraClass].filter(Boolean).join(' ');
        const safe = String(russianName || '').replace(/"/g, '&quot;');
        const shown = String(displayNationName(russianName) || russianName || '').replace(/"/g, '&quot;');
        return `<span class="${cls}" data-nation="${safe}" data-size="${size}" ` +
            `title="${shown}" role="img" aria-label="${shown}"></span>`;
    }

    async function hydrateNationPortraits(root) {
        const nodes = [...(root || document).querySelectorAll('.nation-portrait[data-nation]')];
        await Promise.all(nodes.map(async (el) => {
            if (el.querySelector('img')) return;
            const name = el.dataset.nation;
            const size = Number(el.dataset.size) || 24;
            try {
                const src = await buildNationPortraitDataUrl(name, size * 2);
                const img = document.createElement('img');
                img.src = src;
                img.alt = name;
                img.title = name;
                el.appendChild(img);
            } catch (e) {
                console.warn('hydrate portrait failed', name, e);
            }
        }));
    }

    // Заполняем фильтр наций
    function populateNationFilter() {
        const filterSelect = document.getElementById('nationFilter');
        const prev = filterSelect.value;
        const sortedNations = Array.from(allNations).sort((a, b) =>
            displayNationName(a).localeCompare(displayNationName(b), localeTag(), localeCompareOpts())
        );

        filterSelect.innerHTML = '';
        const allOpt = document.createElement('option');
        allOpt.value = 'all';
        allOpt.setAttribute('data-i18n', 'filter.nationAll');
        allOpt.textContent = tt('filter.nationAll');
        filterSelect.appendChild(allOpt);
        sortedNations.forEach(nation => {
            const option = document.createElement('option');
            option.value = nation;
            option.textContent = displayNationName(nation);
            filterSelect.appendChild(option);
        });
        if ([...filterSelect.options].some((o) => o.value === prev)) {
            filterSelect.value = prev;
        }
    }


    function canonicalizeMapName(name) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.canonicalizeMapName) return IronLeagueUiHelpers.canonicalizeMapName(name);
        if (window.IronLeagueI18n && IronLeagueI18n.canonicalizeMap) {
            return IronLeagueI18n.canonicalizeMap(name);
        }
        return String(name || '').trim();
    }

    function populatePlayerFilter() {
        const select = document.getElementById('playerFilter');
        if (!select) return;
        const prev = select.value;
        const names = new Set();
        for (const game of gamesData || []) {
            for (const p of game.players || []) {
                const n = String(p.name || '').trim();
                if (n) names.add(n);
            }
        }
        const sorted = [...names].sort((a, b) => a.localeCompare(b, localeTag(), localeCompareOpts()));
        select.innerHTML = '';
        const all = document.createElement('option');
        all.value = 'all';
        all.setAttribute('data-i18n', 'filter.playerAll');
        all.textContent = tt('filter.playerAll');
        select.appendChild(all);
        for (const name of sorted) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = displayPlayerName(name);
            select.appendChild(opt);
        }
        if ([...select.options].some((o) => o.value === prev)) {
            select.value = prev;
        }
    }

    function populateExtraFilters() {
        const victorySelect = document.getElementById('victoryFilter');
        const mapSelect = document.getElementById('mapFilter');
        if (victorySelect) {
            const prev = victorySelect.value;
            const values = [...new Set(
                gamesData.map((g) => String(g.victoryType || '').trim()).filter(Boolean)
            )].sort((a, b) =>
                victoryTypeLabel(a).localeCompare(victoryTypeLabel(b), localeTag(), localeCompareOpts())
            );
            victorySelect.innerHTML = '';
            const all = document.createElement('option');
            all.value = 'all';
            all.setAttribute('data-i18n', 'filter.victoryAll');
            all.textContent = tt('filter.victoryAll');
            victorySelect.appendChild(all);
            for (const v of values) {
                const opt = document.createElement('option');
                opt.value = v;
                opt.textContent = victoryTypeLabel(v);
                victorySelect.appendChild(opt);
            }
            if ([...victorySelect.options].some((o) => o.value === prev)) {
                victorySelect.value = prev;
            }
        }
        if (mapSelect) {
            const prev = mapSelect.value;
            const byCanon = new Map();
            for (const g of gamesData || []) {
                const raw = String(g.map || '').trim();
                if (!raw) continue;
                const canon = canonicalizeMapName(raw) || raw;
                if (!byCanon.has(canon)) byCanon.set(canon, raw);
            }
            const values = [...byCanon.keys()].sort((a, b) =>
                displayMapName(a).localeCompare(displayMapName(b), localeTag(), localeCompareOpts())
            );
            mapSelect.innerHTML = '';
            const all = document.createElement('option');
            all.value = 'all';
            all.setAttribute('data-i18n', 'filter.mapAll');
            all.textContent = tt('filter.mapAll');
            mapSelect.appendChild(all);
            for (const canon of values) {
                const opt = document.createElement('option');
                opt.value = canon;
                opt.textContent = displayMapName(canon) || canon;
                mapSelect.appendChild(opt);
            }
            if ([...mapSelect.options].some((o) => o.value === prev)) {
                mapSelect.value = prev;
            } else if (prev && prev !== 'all') {
                const canonPrev = canonicalizeMapName(prev);
                if ([...mapSelect.options].some((o) => o.value === canonPrev)) {
                    mapSelect.value = canonPrev;
                }
            }
        }
    }

    function setStatsTab(tab) {
        const name = tab || 'players';
        document.querySelectorAll('.stats-subnav-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.statsTab === name);
        });
        document.querySelectorAll('#viewStats .stats-section[data-stats-group]').forEach((sec) => {
            const show = sec.getAttribute('data-stats-group') === name;
            sec.hidden = !show;
        });
    }

    function playerLinkHtml(name) {
        const raw = String(name || '').trim();
        const safe = raw.replace(/"/g, '&quot;');
        const shown = displayPlayerName(raw);
        const flag = (window.IronLeaguePlayerMeta && IronLeaguePlayerMeta.flagHtml)
            ? IronLeaguePlayerMeta.flagHtml(raw, { lang: (window.IronLeagueI18n && IronLeagueI18n.getLang()) || 'ru' })
            : '';
        return `<span class="player-link-wrap">${flag}<button type="button" class="player-link" data-player="${safe}">${shown}</button></span>`;
    }

    function isInvalidFirstPolicy(name) {
        const s = String(name || '').trim().toLowerCase();
        return s === 'commerce' || s === 'коммерция';
    }

    function showStatsGameLinks() {
        const el = document.getElementById('statsShowGameLinks');
        return !!(el && el.checked);
    }

    function applyStatsGameLinksVisibility() {
        const on = showStatsGameLinks();
        document.body.classList.toggle('stats-game-links-on', on);
        try {
            localStorage.setItem('ironleague_stats_game_links', on ? '1' : '0');
        } catch (e) { /* ignore */ }
    }

    function initStatsGameLinksToggle() {
        const el = document.getElementById('statsShowGameLinks');
        if (!el) return;
        try {
            el.checked = localStorage.getItem('ironleague_stats_game_links') === '1';
        } catch (e) {
            el.checked = false;
        }
        applyStatsGameLinksVisibility();
        el.addEventListener('change', () => {
            applyStatsGameLinksVisibility();
            renderStatsTables();
        });
    }

    function topCounted(mapObj, n, labelFn) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.topCounted) return IronLeagueUiHelpers.topCounted(mapObj, n, labelFn);
        const label = labelFn || ((k) => String(k));
        const entries = [...(mapObj || new Map()).entries()]
            .sort((a, b) => b[1] - a[1]
                || label(a[0]).localeCompare(label(b[0]), localeTag(), localeCompareOpts()));
        return entries.slice(0, n || 3);
    }

    function avgOrDash(sum, count) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.avgOrDash) return IronLeagueUiHelpers.avgOrDash(sum, count);
        if (!count) return '—';
        return (sum / count).toFixed(1);
    }

    function avgOrDashSigned(sum, count) {
        if (window.IronLeagueUiHelpers && IronLeagueUiHelpers.avgOrDashSigned) return IronLeagueUiHelpers.avgOrDashSigned(sum, count);
        if (!count) return '—';
        const v = sum / count;
        const body = Math.abs(v).toFixed(1);
        if (v > 0) return `+${body}`;
        if (v < 0) return `-${body}`;
        return body;
    }

    function openPlayerProfile(playerName) {
        const name = String(playerName || '').trim();
        if (!name) return;
        const ranked = recordsGamesPool();
        const { playerRows } = computeArchiveStats(ranked);
        const row = playerRows.find((p) => p.name === name);
        const title = document.getElementById('profileTitle');
        const meta = document.getElementById('profileMeta');
        const flagsEl = document.getElementById('profileFlags');
        const hero = document.getElementById('profileHero');
        const ratingEl = document.getElementById('profileRating');
        const achEl = document.getElementById('profileAchievements');
        const chartsEl = document.getElementById('profileCharts');
        const summaryBody = document.querySelector('#profileSummaryTable tbody');
        const gamesBody = document.querySelector('#profileGamesTable tbody');
        const lang = (window.IronLeagueI18n && IronLeagueI18n.getLang()) || 'ru';

        if (hero && window.IronLeaguePlayerMeta) {
            hero.setAttribute('style', IronLeaguePlayerMeta.profileBackgroundStyle(name));
        }
        if (title) {
            title.dataset.playerName = name;
            const flag = (window.IronLeaguePlayerMeta && IronLeaguePlayerMeta.flagHtml)
                ? IronLeaguePlayerMeta.flagHtml(name, { lang })
                : '';
            title.innerHTML = `${flag} <span>${tt('profile.title', { name: displayPlayerName(name) })}</span>`;
        }
        if (flagsEl && window.IronLeaguePlayerMeta) {
            flagsEl.innerHTML = IronLeaguePlayerMeta.flagHtml(name, { lang });
        }
        if (meta) {
            meta.innerHTML = row
                ? `<span>${tt('stats.col.games')}: <b>${row.games}</b></span>
                   <span>${tt('stats.col.wins')}: <b>${row.wins}</b></span>
                   <span>${tt('stats.col.winrate')}: <b>${row.winrate}%</b></span>
                   <span>${tt('stats.col.survived')}: <b>${row.survived}</b></span>
                   <span>${tt('stats.col.eliminated')}: <b>${row.eliminated}</b></span>`
                : '';
        }

        if (ratingEl && window.IronLeagueRating) {
            try {
                const scaleEl = document.getElementById('ratingScaleSelect');
                const zeroBase = scaleEl ? scaleEl.value === 'zero' : false;
                const all = IronLeagueRating.computeAll(ranked, ratingK, {
                    zeroBase,
                    elimPenalty: lobbyElimPenalty,
                });
                const find = (rows) => (rows || []).find((r) => r.name === name);
                const comb = find(all.combined);
                const lob = find(all.lobbyWin);
                const lobAvg = find(all.lobbyAvg);
                ratingEl.innerHTML = `
                    <div class="profile-rating-card"><span>${tt('profile.ratingElo')}</span><b>${comb ? Number(comb.rating).toFixed(1) : '—'}</b></div>
                    <div class="profile-rating-card"><span>${tt('profile.ratingLobbyWin')}</span><b>${lob ? Number(lob.rating).toFixed(1) : '—'}</b></div>
                    <div class="profile-rating-card"><span>${tt('profile.ratingLobbyAvg')}</span><b>${lobAvg ? Number(lobAvg.rating).toFixed(1) : '—'}</b></div>
                `;
            } catch (e) {
                ratingEl.innerHTML = '';
            }
        }

        if (achEl && window.IronLeagueAchievements) {
            try {
                const items = getPoolMode() === 'tournaments'
                    ? (IronLeagueAchievements.computeDuelAchievements(ranked) || [])
                    : (IronLeagueAchievements.computeAchievements(ranked) || []);
                const owned = [];
                for (const it of items) {
                    const places = Array.isArray(it.top) && it.top.length
                        ? it.top
                        : (it.player && !it.vacant
                            ? [{ place: 1, player: it.player, value: it.value }]
                            : []);
                    for (const slot of places) {
                        if (slot.player !== name) continue;
                        owned.push({
                            id: it.id,
                            place: slot.place || 1,
                            value: slot.value != null ? slot.value : it.value,
                        });
                    }
                }
                achEl.innerHTML = owned.length
                    ? owned.map((it) => {
                        const label = tt(`records.item.${it.id}.title`);
                        const titleText = label.startsWith('records.') ? it.id : label;
                        const iconSrc = `img/records/${it.id}.png`;
                        const iconFb = `img/records/${it.id}.svg`;
                        const place = it.place || 1;
                        const placeHtml = place > 1
                            ? `<span class="profile-ach-place">#${place}</span>`
                            : '';
                        return `<div class="profile-ach-card${place > 1 ? ' profile-ach-card--runner' : ''}" title="${String(it.value || '').replace(/"/g, '&quot;')}">
                            <img src="${iconSrc}" alt="" width="40" height="40" loading="lazy"
                                 onerror="this.onerror=null;this.src='${iconFb}'">
                            <div class="profile-ach-main">
                                <span class="profile-ach-title">${placeHtml}${titleText}</span>
                                <span class="profile-ach-value">${it.value || ''}</span>
                            </div>
                        </div>`;
                    }).join('')
                    : `<p class="hint">${tt('profile.noAchievements')}</p>`;
                renderProfileEmblem(row, owned.filter((x) => (x.place || 1) === 1).length);
            } catch (e) {
                achEl.innerHTML = '';
                renderProfileEmblem(row, 0);
            }
        } else {
            renderProfileEmblem(row, 0);
        }

        void fillProfileLiveAwards(name);

        if (summaryBody) {
            const nationCell = (nationRu) => renderNationLabel(nationRu);
            const chip = (labelHtml, count) =>
                `<span class="profile-chip">${labelHtml}<span class="profile-chip-count">${count}</span></span>`;
            const topPol = topCounted(row && row.firstPolicyCounts, 3, displayPolicyName)
                .map(([k, v]) => chip(displayPolicyName(k), v)).join('') || '—';
            const topWonders = topCounted(row && row.wonderCounts, 5, wonderNameRu)
                .map(([k, v]) => chip(renderWonderLabel(k), v)).join('') || '—';
            const topNations = topCounted(row && row.nationCounts, 3, displayNationName)
                .map(([k, v]) => chip(nationCell(k), v)).join('') || '—';
            const topIdeologies = topCounted(row && row.ideologyCounts, 3, displayPolicyName)
                .map(([k, v]) => chip(displayPolicyName(k), v)).join('') || '—';
            summaryBody.innerHTML = row ? `
                <tr><th>${tt('stats.col.topNation')}</th><td>${nationCell(row.topNation)}</td></tr>
                <tr><th>${tt('profile.favNations')}</th><td class="profile-chip-cell">${topNations}</td></tr>
                <tr><th>${tt('stats.col.topIdeology')}</th><td>${displayPolicyName(row.topIdeology) || '—'}</td></tr>
                <tr><th>${tt('profile.favIdeologies')}</th><td class="profile-chip-cell">${topIdeologies}</td></tr>
                <tr><th>${tt('profile.favPolicies')}</th><td class="profile-chip-cell">${topPol}</td></tr>
                <tr><th>${tt('stats.col.topPolicies')}</th><td>${row.topPolicies || '—'}</td></tr>
                <tr><th>${tt('profile.favWonders')}</th><td class="profile-chip-cell">${topWonders}</td></tr>
                <tr><th>${tt('stats.col.wondersBuilt')}</th><td>${row.wondersBuilt}</td></tr>
                <tr><th>${tt('stats.col.conquered')}</th><td>${row.conquered}</td></tr>
                <tr><td colspan="2" class="profile-avg-hint">${tt('profile.avgHint')}</td></tr>
                <tr><th>${tt('profile.avgUnits')}</th><td>${avgOrDash(row.sumUnits, row.nUnits)}</td></tr>
                <tr><th>${tt('profile.avgCities')}</th><td>${avgOrDash(row.sumCities, row.nCities)}</td></tr>
                <tr><th>${tt('profile.avgPopulation')}</th><td>${avgOrDash(row.sumPopulation, row.nPopulation)}</td></tr>
                <tr><th>${tt('profile.avgCapitalPop')}</th><td>${avgOrDash(row.sumCapitalPop, row.nCapitalPop)}</td></tr>
                <tr><th>${tt('profile.avgProduction')}</th><td>${avgOrDash(row.sumProduction, row.nProduction)}</td></tr>
                <tr><th>${tt('profile.avgGold')}</th><td>${avgOrDash(row.sumGold, row.nGold)}</td></tr>
                <tr><th>${tt('profile.avgGoldIncome')}</th><td>${avgOrDashSigned(row.sumGoldIncome, row.nGoldIncome)}</td></tr>
                <tr><th>${tt('profile.avgTechs')}</th><td>${avgOrDash(row.sumTechs, row.nTechs)}</td></tr>
                <tr><th>${tt('profile.avgScience')}</th><td>${avgOrDash(row.sumScience, row.nScience)}</td></tr>
                <tr><th>${tt('profile.avgCulture')}</th><td>${avgOrDash(row.sumCulture, row.nCulture)}</td></tr>
                <tr><th>${tt('profile.avgIdeologyTurn')}</th><td>${avgOrDash(row.sumIdeologyTurn, row.nIdeologyTurn)}</td></tr>
                <tr><th>${tt('profile.avgGreatPeople')}</th><td>${avgOrDash(row.sumGreatPeople, row.nGreatPeople)}</td></tr>
                <tr><th>${tt('profile.avgStrength')}</th><td>${avgOrDash(row.sumStrength, row.nStrength)}</td></tr>
            ` : '';
            hydrateNationPortraits(summaryBody);
        }

        if (chartsEl && window.IronLeagueCharts && row) {
            const polRows = topCounted(row.firstPolicyCounts, 8).map(([label, value]) => ({
                label: displayPolicyName(label), value, colorKey: label,
            }));
            const natRows = topCounted(row.nationCounts, 8).map(([label, value]) => ({
                label: displayNationName(label), value,
            }));
            const ideoRows = topCounted(row.ideologyCounts, 8).map(([label, value]) => ({
                label: displayPolicyName(label), value, colorKey: label,
            }));
            chartsEl.innerHTML = `
                <div class="profile-chart-block"><h4>${tt('profile.chartPolicies')}</h4><div id="profilePolicyChart"></div></div>
                <div class="profile-chart-block"><h4>${tt('profile.chartIdeologies')}</h4><div id="profileIdeologyChart"></div></div>
                <div class="profile-chart-block"><h4>${tt('profile.chartNations')}</h4><div id="profileNationChart"></div></div>
            `;
            if (IronLeagueCharts.renderChartWithToggle) {
                IronLeagueCharts.renderChartWithToggle(
                    document.getElementById('profilePolicyChart'), polRows,
                    { storageKey: 'il_profile_pol_chart', pieLabel: tt('chart.pie'), barLabel: tt('chart.bar') },
                );
                IronLeagueCharts.renderChartWithToggle(
                    document.getElementById('profileIdeologyChart'), ideoRows,
                    { storageKey: 'il_profile_ideo_chart', pieLabel: tt('chart.pie'), barLabel: tt('chart.bar') },
                );
                IronLeagueCharts.renderChartWithToggle(
                    document.getElementById('profileNationChart'), natRows,
                    { storageKey: 'il_profile_nat_chart', pieLabel: tt('chart.pie'), barLabel: tt('chart.bar') },
                );
            }
        } else if (chartsEl) {
            chartsEl.innerHTML = '';
        }

        if (gamesBody) {
            const rows = [];
            const perfSeries = [];
            const gamesChrono = ranked.slice().sort((a, b) =>
                parseGameNum(a) - parseGameNum(b)
            );
            for (const game of gamesChrono) {
                const roster = Array.isArray(game.players) ? game.players : [];
                const me = roster.find((p) => (p.name || '').trim() === name);
                if (!me) continue;
                const won = (me.nation || '') === resolveWinnerNation(game);
                const surv = (game.survivors || []).find((s) => (s.name || '').trim() === name);
                const units = surv && Number.isFinite(Number(surv.units)) ? surv.units : '—';
                const cities = surv && Number.isFinite(Number(surv.cities)) ? surv.cities : '—';
                const gameLabel = formatGameLabel(game);
                rows.push(`<tr>
                    <td><button type="button" class="stats-game-link" data-game-id="${game.id}">${gameLabel}</button></td>
                    <td>${renderNationLabel(me.nation)}</td>
                    <td>${won ? tt('profile.win') : tt('profile.loss')}</td>
                    <td>${displayMapName(game.map) || '—'}</td>
                    <td class="num">${units}</td>
                    <td class="num">${cities}</td>
                </tr>`);
                if (surv) {
                    const num = (key) => {
                        const v = Number(surv[key]);
                        return Number.isFinite(v) ? v : null;
                    };
                    perfSeries.push({
                        game: parseGameNum(game),
                        gameLabel,
                        techs: num('techs'),
                        science: num('science'),
                        culture: num('culture'),
                        gold: num('gold'),
                        gold_income: num('gold_income'),
                        production: num('production'),
                        population: num('population'),
                        capital_population: num('capital_population'),
                        cities: num('cities'),
                        units: num('units'),
                        score: num('score'),
                        great_people: num('great_people'),
                        military_deaths: num('military_deaths'),
                    });
                }
            }
            gamesBody.innerHTML = rows.join('') || `<tr><td colspan="6">—</td></tr>`;
            hydrateNationPortraits(gamesBody);

            const perfWrap = document.getElementById('profilePerf');
            const perfCharts = document.getElementById('profilePerfCharts');
            if (perfWrap && perfCharts && window.IronLeagueCharts && IronLeagueCharts.renderProfilePerformance) {
                if (perfSeries.length) {
                    perfWrap.hidden = false;
                    IronLeagueCharts.renderProfilePerformance(perfCharts, perfSeries, {
                        storageKey: 'il_profile_perf_metric',
                        defaultMetric: 'techs',
                        avgLabel: tt('profile.perfAvg'),
                        emptyText: '—',
                        avgsAria: tt('profile.perfAvgsAria'),
                        metrics: [
                            { key: 'techs', label: tt('stats.col.techs') },
                            { key: 'science', label: tt('stats.col.science') },
                            { key: 'culture', label: tt('stats.col.culture') },
                            { key: 'gold', label: tt('stats.col.gold') },
                            { key: 'gold_income', label: tt('stats.col.goldIncome') },
                            { key: 'production', label: tt('stats.col.production') },
                            { key: 'population', label: tt('stats.col.population') },
                            { key: 'capital_population', label: tt('stats.col.capitalPop') },
                            { key: 'cities', label: tt('stats.col.cities') },
                            { key: 'units', label: tt('stats.col.units') },
                            { key: 'score', label: tt('stats.col.score') },
                            { key: 'great_people', label: tt('stats.col.greatPeople') },
                            { key: 'military_deaths', label: tt('stats.col.militaryDeaths') },
                        ],
                    });
                } else {
                    perfWrap.hidden = true;
                    perfCharts.innerHTML = '';
                }
            }
        }
        showSiteView('profile');
    }



    /** Archive summary counters — reflect the currently filtered list. */
    function updateStats(gamesList) {
        const list = Array.isArray(gamesList) ? gamesList : gamesData;
        const nations = new Set();
        const players = new Set();
        list.forEach((game) => {
            (Array.isArray(game.players) ? game.players : []).forEach((player) => {
                if (player && player.name) players.add(String(player.name).trim());
                if (player && player.nation) nations.add(player.nation);
            });
        });
        const totalEl = document.getElementById('totalGames');
        const nationsEl = document.getElementById('uniqueNations');
        const playersEl = document.getElementById('uniquePlayers');
        if (totalEl) totalEl.textContent = String(list.length);
        if (nationsEl) nationsEl.textContent = String(nations.size);
        if (playersEl) playersEl.textContent = String(players.size);
    }


    function sortSurvivorsByScore(rows) {
        return [...(rows || [])].sort((a, b) => {
            const as = (a && Number.isFinite(Number(a.score))) ? Number(a.score) : -1;
            const bs = (b && Number.isFinite(Number(b.score))) ? Number(b.score) : -1;
            if (bs !== as) return bs - as;
            return displayNationName((a && a.nation) || '').localeCompare(
                displayNationName((b && b.nation) || ''),
                localeTag(),
                localeCompareOpts(),
            );
        });
    }

    function isKnownTurn(value) {
        if (value === null || value === undefined || value === '') return false;
        const n = Number(value);
        // Number(null) === 0 — treat 0 / NaN as unknown.
        return Number.isFinite(n) && n > 0;
    }

    function formatIdeologyTurn(value) {
        return isKnownTurn(value) ? String(Number(value)) : tt('val.unknown');
    }

    function formatEliminatedTurn(value) {
        return isKnownTurn(value) ? String(Number(value)) : tt('val.notEliminated');
    }

    function formatCapitalLostTurn(value) {
        return isKnownTurn(value) ? String(Number(value)) : tt('val.neverLostCapital');
    }

    function dash(value) {
        if (value === null || value === undefined || value === '') return '—';
        return value;
    }

    function compactSurvivorStats(row, isAlive) {
        const items = [];
        const push = (label, value, opts) => {
            if (value === null || value === undefined || value === '') return;
            items.push({
                label,
                value,
                wide: Boolean(opts && opts.wide),
                title: (opts && opts.title) || '',
            });
        };
        // Fixed pair order keeps the 2-column grid aligned.
        if (Number.isFinite(Number(row.score))) push(tt('stat.score'), row.score);
        {
            const hasUnits = row.units !== null && row.units !== undefined && Number.isFinite(Number(row.units));
            const hasForce = row.strength !== null && row.strength !== undefined && Number.isFinite(Number(row.strength));
            if (hasUnits || hasForce) {
                const units = hasUnits ? Number(row.units) : '—';
                const force = hasForce ? Number(row.strength) : '—';
                push(tt('force.label'), `${units} / ${force}`, { title: tt('force.hint') });
            }
        }
        if (Number.isFinite(Number(row.science))) push(tt('stat.science'), row.science);
        if (Number.isFinite(Number(row.cities))) push(tt('stat.cities'), row.cities);
        if (Number.isFinite(Number(row.population))) push(tt('stat.population'), row.population);
        if (isAlive && Number.isFinite(Number(row.techs))) push(tt('stat.techs'), row.techs);
        if (isAlive && Number.isFinite(Number(row.policies))) push(tt('stat.policies'), row.policies);
        if (Number.isFinite(Number(row.military_deaths))) {
            push(tt('stat.militaryDeaths'), row.military_deaths);
        }
        if (row.first_policy) push(tt('stat.firstPolicy'), displayPolicyName(row.first_policy), { wide: true });
        const branches = Array.isArray(row.policy_branches)
            ? row.policy_branches.filter(Boolean) : [];
        if (branches.length) {
            push(tt('stat.policyBranches'), branches.map(displayPolicyName).join(', '), { wide: true });
        }
        const ship = Array.isArray(row.spaceship) ? row.spaceship.filter(Boolean) : [];
        if (ship.length) {
            push(tt('stat.spaceship'), ship.map(displaySpaceshipPart).join(', '), { wide: true });
        }
        return items;
    }

    function fullSurvivorStats(row, isAlive) {
        const items = compactSurvivorStats(row, isAlive);
        const push = (label, value) => items.push({ label, value });
        push(tt('stat.era'), displayPolicyName(dash(row.era)));
        if (row.religion || row.religion_state) {
            const rel = [row.religion, row.religion_state]
                .filter(Boolean)
                .map(displayPolicyName)
                .join(' · ');
            push(tt('stat.religion'), rel || '—');
        } else {
            push(tt('stat.religion'), '—');
        }
        if ((row.pantheon || '').trim()) {
            push(tt('stats.pantheons'), displayPolicyName(row.pantheon), { wide: true });
        }
        const founderB = Array.isArray(row.founder_beliefs) ? row.founder_beliefs.filter(Boolean) : [];
        if (founderB.length) {
            push(tt('stats.founderBeliefs'), founderB.map(displayPolicyName).join(', '), { wide: true });
        }
        const followerB = Array.isArray(row.follower_beliefs) ? row.follower_beliefs.filter(Boolean) : [];
        if (followerB.length) {
            push(tt('stats.followerBeliefs'), followerB.map(displayPolicyName).join(', '), { wide: true });
        }
        const ideologyRaw = dash(row.ideology);
        push(
            tt('stat.ideology'),
            ideologyRaw !== '—'
                ? displayPolicyName(ideologyRaw)
                : (isAlive ? tt('val.ideologyNotAdopted') : '—'),
        );
        push(tt('stat.ideologyTurn'), formatIdeologyTurn(row.ideology_turn));
        push(tt('stat.elimTurn'), formatEliminatedTurn(row.eliminated_turn));
        push(tt('stat.capitalLostTurn'), formatCapitalLostTurn(row.capital_lost_turn));
        const wd = Number.isFinite(Number(row.wars_declared)) ? row.wars_declared : '—';
        const wr = Number.isFinite(Number(row.wars_received)) ? row.wars_received : '—';
        push(tt('stat.wars'), `${wd} / ${wr}`);
        const atWar = Array.isArray(row.wars) ? row.wars.filter(Boolean) : [];
        if (atWar.length) push(tt('stat.atWar'), atWar.map(displayNationName).join(', '));
        return items;
    }

    function renderStatsList(items) {
        if (!items.length) return '';
        return `<ul class="survivor-stats-list">${items.map((it) => {
            const cls = it.wide ? ' class="wide"' : '';
            const title = it.title ? ` title="${String(it.title).replace(/"/g, '&quot;')}"` : '';
            return `<li${cls}${title}><span class="sk">${it.label}</span><span class="sv">${it.value}</span></li>`;
        }).join('')}</ul>`;
    }

    function renderSurvivorBlock(row, game, mode) {
        const isWinner = row.nation === resolveWinnerNation(game);
        const isBarbarian = !!(row.is_barbarian
            || row.nation === 'Варвары'
            || row.nation === 'Barbarians'
            || row.name === 'Barbarians');
        const isAlive = Object.prototype.hasOwnProperty.call(row, 'alive')
            ? Boolean(row.alive)
            : true;
        const ideology = (row.ideology || '').trim();
        const wonders = Array.isArray(row.wonders) ? row.wonders.filter(Boolean) : [];
        const wondersBuiltRaw = Array.isArray(row.wonders_built) ? row.wonders_built.filter(Boolean) : null;
        const name = (row.name || '').trim() || '—';
        const hasCapital = Object.prototype.hasOwnProperty.call(row, 'has_capital')
            ? Boolean(row.has_capital)
            : true;
        const takenBy = (row.capital_taken_by || '').trim();
        const conquered = Array.isArray(row.conquered_capitals)
            ? row.conquered_capitals.filter(c => c && (c.nation || c.city))
            : [];

        let flagHtml = '';
        if (isAlive && !hasCapital) {
            flagHtml = `<div class="survivor-flag">${tt('flag.noCapital')}</div>`;
        } else if (!isAlive && takenBy) {
            flagHtml = `<div class="survivor-flag">${tt('flag.capitalTaken', { who: takenBy })}</div>`;
        } else if (!isAlive) {
            flagHtml = `<div class="survivor-flag">${tt('flag.eliminatedUnknown')}</div>`;
        }

        const stats = mode === 'full'
            ? fullSurvivorStats(row, isAlive)
            : compactSurvivorStats(row, isAlive);
        const statsHtml = renderStatsList(stats);

        const capturedHtml = (conquered.length)
            ? `<div class="survivor-captured">${tt('captured.title')}<ul class="survivor-captured-list">${
                conquered.map(c => {
                    const nat = c.nation || '';
                    const city = c.city || '';
                    const label = city
                        ? displayCapturedCity(nat, city)
                        : displayNationName(nat);
                    const capWonders = Array.isArray(c.wonders) ? c.wonders.filter(Boolean) : [];
                    const wondersInner = capWonders.length
                        ? `<div class="survivor-captured-wonders">${tt('captured.wonders')}<ul class="survivor-wonders-list">${
                            capWonders.map((w) => renderWonderItem(w)).join('')
                          }</ul></div>`
                        : `<div class="survivor-captured-wonders hint">${tt('captured.wondersUnknown')}</div>`;
                    return `<li><details><summary>${renderNationPortrait(nat, 'player-nation-mini')}<span class="survivor-captured-city">${label}</span></summary>${wondersInner}</details></li>`;
                }).join('')
              }</ul></div>`
            : '';

        let wondersBlock = '';
        if (!isBarbarian) {
            if (wondersBuiltRaw !== null) {
                const builtSet = new Set(wondersBuiltRaw);
                const built = wonders.filter((w) => builtSet.has(w));
                for (const w of wondersBuiltRaw) {
                    if (!built.includes(w)) built.push(w);
                }
                const taken = wonders.filter((w) => !builtSet.has(w));
                if (!built.length && !taken.length) {
                    wondersBlock = `<div class="survivor-wonders">${tt('wonders.none')}</div>`;
                } else {
                    const parts = [];
                    if (built.length) {
                        parts.push(
                            `<div class="survivor-wonders">${tt('wonders.built')}<ul class="survivor-wonders-list">${
                                built.map((w) => renderWonderItem(w)).join('')
                            }</ul></div>`,
                        );
                    }
                    if (taken.length) {
                        parts.push(
                            `<div class="survivor-wonders survivor-wonders-taken">${tt('wonders.taken')}<ul class="survivor-wonders-list">${
                                taken.map((w) => renderWonderItem(w)).join('')
                            }</ul></div>`,
                        );
                    }
                    wondersBlock = parts.join('');
                }
            } else if (wonders.length) {
                wondersBlock = `<div class="survivor-wonders">${tt('wonders.title')}<ul class="survivor-wonders-list">${
                    wonders.map((w) => renderWonderItem(w)).join('')
                }</ul></div>`;
            } else {
                wondersBlock = `<div class="survivor-wonders">${tt('wonders.none')}</div>`;
            }
        }

        const ideologyMeta = ideology
            ? ` · <span class="survivor-ideology">${displayPolicyName(ideology)}</span>`
            : (isAlive ? ` · ${tt('flag.ideologyNone')}` : '');

        return `
            <div class="survivor-item ${isAlive ? '' : 'eliminated'}${isBarbarian ? ' survivor-barbarian' : ''}">
                <div class="survivor-head">
                    ${isBarbarian ? '' : renderNationPortrait(row.nation, 'player-nation-mini')}
                    <span class="player-name">${isBarbarian ? name : displayPlayerName(name)}</span>
                    ${isWinner ? `<span class="player-status">${tt('status.winner')}</span>` : ''}
                    ${!isAlive && !isBarbarian ? `<span class="player-status">${tt('status.eliminated')}</span>` : ''}
                    ${isBarbarian ? `<span class="player-status">${tt('status.barbarian')}</span>` : ''}
                </div>
                <div class="survivor-meta">
                    ${displayNationName(row.nation) || ''}${isBarbarian ? '' : ideologyMeta}
                </div>
                ${isBarbarian ? '' : flagHtml}
                ${statsHtml}
                ${isBarbarian ? '' : capturedHtml}
                ${isBarbarian ? '' : wondersBlock}
            </div>
        `;
    }

    function formatCcLine(game) {
        const league = game.league && typeof game.league === 'object' ? game.league : null;
        const cc = league && league.cc && typeof league.cc === 'object' ? league.cc : null;
        if (!cc || !cc.nation) return '';
        return (
            tt('cc.line', { nation: displayNationName(cc.nation), turn: cc.start ?? '—' })
            + (cc.plus && cc.plus.length
                ? ` · ${tt('cc.for')}: ${cc.plus.map(displayNationName).join(', ')}`
                : '')
            + (cc.minus && cc.minus.length
                ? ` · ${tt('cc.against')}: ${cc.minus.map(displayNationName).join(', ')}`
                : '')
            + (cc.abstain && cc.abstain.length
                ? ` · ${tt('cc.abstain')}: ${cc.abstain.map(displayNationName).join(', ')}`
                : '')
        );
    }

    function renderFinaleEnding(game) {
        const ccLine = formatCcLine(game);
        return `<div class="finale-ending">
            <div class="finale-ending-title">🏁 ${victoryTypeRu(game.victoryType)}</div>
            ${ccLine ? `<div class="finale-ending-cc">${ccLine}</div>` : ''}
        </div>`;
    }

    function renderLeagueBlock(game) {
        const league = game.league && typeof game.league === 'object' ? game.league : null;
        if (!league) return '';
        const bits = [];
        if (league.draft && league.draft.selected) {
            const picks = Object.values(league.draft.selected).filter(Boolean);
            if (picks.length) {
                bits.push(tt('league.draft', { list: picks.map(displayNationName).join(', ') }));
            }
        }
        if (league.draft && league.draft.banned) {
            const bans = Object.values(league.draft.banned).filter(Boolean);
            if (bans.length) bits.push(tt('league.bans', { list: bans.map(displayNationName).join(', ') }));
        }
        if (!bits.length) return '';
        return `<div class="survivor-stats" style="margin-top:10px">${bits.join('<br>')}</div>`;
    }

    function closeGameModal() {
        const modal = document.getElementById('gameModal');
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        document.getElementById('gameModalBody').innerHTML = '';
    }

    function openGameModal(gameId) {
        const game = gamesData.find((g) => String(g.id) === String(gameId));
        if (!game) return;
        const modal = document.getElementById('gameModal');
        const title = document.getElementById('gameModalTitle');
        const meta = document.getElementById('gameModalMeta');
        const body = document.getElementById('gameModalBody');
        title.textContent = formatGameLabel(game);
        meta.textContent = [
            game.version || '',
            displayMapName(game.map) || '',
            `${tt('modal.finish')}: ${victoryTypeLabel(game.victoryType)}`,
            game.endedOnTurn ? `${tt('modal.turn')} ${game.endedOnTurn}` : '',
        ].filter(Boolean).join(' · ');

        const winnerNation = resolveWinnerNation(game);
        const roster = (Array.isArray(game.players) ? game.players : []).map((player) => {
            const isWinner = player.nation === winnerNation;
            return `<div class="player-item">
                ${renderNationPortrait(player.nation, 'player-nation-mini')}
                <span class="player-name">${displayPlayerName(player.name)}</span>
                ${isWinner ? `<span class="player-status">${tt('status.winner')}</span>` : ''}
            </div>`;
        }).join('');

        const survivors = sortSurvivorsByScore(Array.isArray(game.survivors) ? game.survivors : []);
        const survivorsHtml = survivors.length
            ? survivors.map((row) => renderSurvivorBlock(row, game, 'full')).join('')
            : `<div class="survivors-empty">${tt('card.noFinaleShort')}</div>`;

        const hasGif = game.gif && game.gif.trim() !== '';
        body.innerHTML = `
            <div class="winner-section">
                <div class="winner-label">${tt('card.winner')}</div>
                <div class="winner-nation">
                    ${renderNationPortrait(winnerNation, 'nation-icon-small')}
                    <span>${displayNationName(winnerNation) || '—'}</span>
                </div>
            </div>
            ${renderGameFlags(game)}
            <div class="game-modal-section">
                <h3>${tt('card.roster')}</h3>
                <div class="players-list">${roster}</div>
            </div>
            <div class="game-modal-section">
                <h3>${tt('card.finaleFull')}</h3>
                ${renderFinaleEnding(game)}
                <div class="players-list">${survivorsHtml}</div>
                ${renderLeagueBlock(game)}
            </div>
            <div class="game-modal-section game-modal-section--replays">
                ${renderWebReplayButton(game)}
                ${hasGif ? `<h3>${tt('modal.replay')}</h3>
                <div class="replay-wrap replay-wrap--modal">
                    <img class="replay-gif-full" src="${game.gif}" alt="Replay"
                         loading="lazy"
                         title="${tt('replay.title')}"
                         data-replay-src="${game.gif}"
                         onerror="this.closest('.replay-wrap').style.display='none'">
                    <div class="replay-hint">${tt('replay.hint')}</div>
                </div>` : ''}
            </div>
        `;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        hydrateNationPortraits(body);
        bindReplayRestart(body);
    }


    // Отображение игр
    function displayGames(gamesToShow) {
        const grid = document.getElementById('gamesGrid');
        grid.innerHTML = '';

        if (gamesToShow.length === 0) {
            grid.innerHTML = `<div class="no-games">${tt('empty.games')}</div>`;
            return;
        }

        const searchQuery = document.getElementById('playerFilter')?.value || 'all';
        const highlightName = searchQuery !== 'all' ? searchQuery : '';

        gamesToShow.forEach(game => {
            const card = document.createElement('div');
            card.className = 'game-card';

            const winnerNation = resolveWinnerNation(game);
            const playersHtml = (Array.isArray(game.players) ? game.players : []).map(player => {
                const isWinner = player.nation === winnerNation;
                const isHighlighted = highlightName
                    && String(player.name || '').trim() === highlightName;

                return `
                    <div class="player-item ${isHighlighted ? 'highlighted' : ''}">
                        ${renderNationPortrait(player.nation, 'player-nation-mini')}
                        <span class="player-name">${displayPlayerName(player.name)}</span>
                        ${isWinner ? `<span class="player-status">${tt('status.winner')}</span>` : ''}
                    </div>
                `;
            }).join('');

            const survivors = sortSurvivorsByScore(Array.isArray(game.survivors) ? game.survivors : []);
            const survivorsHtml = survivors.length
                ? survivors.map(row => renderSurvivorBlock(row, game, 'compact')).join('')
                : `<div class="survivors-empty">${tt('card.noFinale')}</div>`;

            const leagueHtml = renderLeagueBlock(game);

            const hasGif = game.gif && game.gif.trim() !== '';

            card.innerHTML = `
                <div class="game-header">
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <span class="game-number">🌍 ${formatGameLabel(game)}</span>
                        <span class="game-version">${game.version || tt('card.versionUnknown')}</span>
                    </div>
                    <button type="button" class="game-expand-btn" data-expand-id="${game.id}">${tt('card.expand')}</button>
                </div>
                ${game.map ? `<div class="game-map">🗺️ ${displayMapName(game.map)}</div>` : ''}
                ${renderGameFlags(game)}
                <div class="winner-section">
                    <div class="winner-label">${tt('card.winner')}</div>
                    <div class="winner-nation">
                        ${renderNationPortrait(winnerNation, 'nation-icon-small')}
                        <span>${displayNationName(winnerNation)}</span>
                    </div>
                </div>
                <div class="card-tabs">
                    <button type="button" class="card-tab active" data-tab="roster">${tt('card.roster')}</button>
                    <button type="button" class="card-tab" data-tab="survivors">${tt('card.finale')}</button>
                </div>
                <div class="card-tab-panel active" data-panel="roster">
                    <div class="players-list">${playersHtml}</div>
                </div>
                <div class="card-tab-panel" data-panel="survivors">
                    ${renderFinaleEnding(game)}
                    <div class="players-list">${survivorsHtml}</div>
                    ${leagueHtml}
                </div>
                ${renderWebReplayButton(game)}
                ${hasGif ? `
                    <div class="replay-preview" data-gif-preview="${game.gif}">
                        <canvas class="replay-preview-canvas" hidden></canvas>
                        <img class="replay-preview-fallback" alt="" loading="lazy" hidden>
                        <span class="replay-preview-badge" hidden data-i18n="replay.previewTail">хвост реплея</span>
                    </div>
                    <button class="replay-button" data-replay="${game.gif}">${tt('card.replay')}</button>
                    <div class="replay-wrap">
                        <img class="replay-gif" src="${game.gif}" alt="Replay" data-game-id="${game.id}"
                             title="${tt('replay.title')}"
                             data-replay-src="${game.gif}"
                             onerror="this.closest('.replay-wrap').style.display='none'; const b=this.closest('.replay-wrap').previousElementSibling; if(b) b.style.display='none'; const p=this.closest('.game-card')?.querySelector('.replay-preview'); if(p) p.style.display='none';">
                        <div class="replay-hint">${tt('replay.hint')}</div>
                    </div>
                ` : ''}
            `;

            grid.appendChild(card);
        });

        hydrateNationPortraits(grid);

        grid.querySelectorAll('.game-card').forEach(card => {
            const tabs = card.querySelectorAll('.card-tab');
            const panels = card.querySelectorAll('.card-tab-panel');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const target = tab.dataset.tab;
                    tabs.forEach(t => t.classList.toggle('active', t === tab));
                    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));
                });
            });
            const expandBtn = card.querySelector('[data-expand-id]');
            if (expandBtn) {
                expandBtn.addEventListener('click', () => openGameModal(expandBtn.dataset.expandId));
            }
        });

        // Обработчики для кнопок GIF-реплея (не трогаем ссылку на unciv-web)
        document.querySelectorAll('.replay-button[data-replay]').forEach(button => {
            const wrap = button.nextElementSibling;
            const replayGif = wrap?.querySelector?.('.replay-gif');
            if (replayGif) {
                replayGif.addEventListener('error', () => {
                    button.style.display = 'none';
                    if (wrap) wrap.style.display = 'none';
                });
                button.addEventListener('click', function() {
                    replayGif.classList.toggle('show');
                    this.textContent = replayGif.classList.contains('show') ? tt('card.hideReplay') : tt('card.replay');
                });
            }
        });

        bindReplayRestart(grid);
        if (window.IronLeagueGifPreview) {
            IronLeagueGifPreview.mount(grid);
            grid.querySelectorAll('.replay-preview-badge').forEach((el) => {
                el.textContent = tt('replay.previewTail');
            });
        }
    }

    // Фильтрация
    function filterGames() {
        const nationFilter = document.getElementById('nationFilter').value;
        const playerFilter = document.getElementById('playerFilter')?.value || 'all';
        const sortFilter = document.getElementById('sortFilter').value;
        const relevanceEl = document.getElementById('relevanceFilter');
        const relevance = relevanceEl ? relevanceEl.value : 'hide';

        const victoryFilter = document.getElementById('victoryFilter')?.value || 'all';
        const mapFilter = document.getElementById('mapFilter')?.value || 'all';
        const tourMode = getPoolMode() === 'tournaments';
        const tn = getTournamentNameFilter();

        let filtered = gamesData.filter(game => {
            const roster = Array.isArray(game.players) ? game.players : [];
            if (tourMode) {
                if (!isTournamentGame(game)) return false;
                if (tn && tn !== 'all' && String(game.tournamentName || '').trim() !== tn) return false;
            } else {
                if (!IronLeaguePool.gameMatchesSeasonFilter(game)) return false;
                const excluded = isExcludedGame(game);
                if (relevance === 'hide' && excluded) return false;
                if (relevance === 'only' && !excluded) return false;
            }
            if (nationFilter !== 'all' && !roster.some(p => p.nation === nationFilter))
                return false;
            if (playerFilter !== 'all' && !roster.some(p => String(p.name || '').trim() === playerFilter))
                return false;
            if (victoryFilter !== 'all' && String(game.victoryType || '') !== victoryFilter)
                return false;
            if (mapFilter !== 'all') {
                const gameMap = canonicalizeMapName(game.map);
                if (gameMap !== mapFilter) return false;
            }
            return true;
        });

        filtered.sort((a, b) => sortFilter === 'newest' ? b.id - a.id : a.id - b.id);
        updateStats(filtered);
        displayGames(filtered);
    }

    // Загрузка данных
    async function loadGamesData() {
        try {
            const [gamesResponse, colorsResponse, wondersResponse, wonderDetailsResponse, capitalsResponse, nationsResponse] = await Promise.all([
                fetchFresh('Games.json'),
                fetchFresh(CONFIG.colorsPath),
                fetchFresh(CONFIG.wonderNamesPath),
                fetchFresh(CONFIG.wonderDetailsPath),
                fetchFresh(CONFIG.defaultCapitalsPath),
                fetchFresh(CONFIG.nationsNamesPath),
            ]);
            if (!gamesResponse.ok) throw new Error(`HTTP ${gamesResponse.status}`);

            if (colorsResponse.ok) {
                const colorsData = await colorsResponse.json();
                nationColors = colorsData.colors || {};
                if (colorsData.fallback) {
                    nationColorFallback = colorsData.fallback;
                }
            } else {
                console.warn('nation_colors.json не загружен, иконки без tint');
            }

            if (wondersResponse.ok) {
                const wondersData = await wondersResponse.json();
                wonderNamesRu = wondersData.names || wondersData || {};
            } else {
                console.warn('wonder_names_ru.json не загружен');
            }

            if (wonderDetailsResponse.ok) {
                const detailsData = await wonderDetailsResponse.json();
                wonderDetails = detailsData.wonders || detailsData || {};
            } else {
                console.warn('wonder_details.json не загружен');
            }

            if (capitalsResponse.ok) {
                defaultCapitals = await capitalsResponse.json() || {};
            } else {
                console.warn('default_capitals.json не загружен');
            }

            if (nationsResponse.ok) {
                const nationsData = await nationsResponse.json();
                nations = Object.entries(nationsData).map(([eng, v]) => ({
                    eng: String(v.en || eng),
                    rus: String(v.ru || eng),
                }));
                rebuildNationMap();
            } else {
                console.warn('nation_names.json не загружен');
            }

            const data = await gamesResponse.json();
            gamesData = data.games;
            if (window.IronLeagueAchievements && typeof IronLeagueAchievements.invalidateAchievementsCache === 'function') {
                IronLeagueAchievements.invalidateAchievementsCache();
            }

            gamesData.forEach(game => {
                game.players?.forEach(player => allNations.add(player.nation));
            });

            populateNationFilter();
            populatePlayerFilter();
            populateExtraFilters();
            fillTournamentNameSelects();
            fillFfaSeasonSelects();
            syncPoolModeUi();
            updateStats();
            filterGames();
            renderStatsTables();
            renderRatingTables();

        } catch (error) {
            console.error('Ошибка:', error);
            document.getElementById('gamesGrid').innerHTML =
                `<div class="error">${tt('error.load')}</div>`;
        }
    }

    document.getElementById('gameModalClose')?.addEventListener('click', closeGameModal);
    document.getElementById('gameModal')?.addEventListener('click', (ev) => {
        if (ev.target && ev.target.id === 'gameModal') closeGameModal();
    });
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape') closeGameModal();
    });

    function viewTitle(key, fallback) {
        return (window.IronLeagueI18n && IronLeagueI18n.t(key)) || fallback;
    }

    function applyViewMeta(view) {
        const homeTitle = `<span class="page-title-icon" aria-hidden="true"><img src="img/icons/capital.svg" alt=""></span>`
            + `<span class="page-title-text">${viewTitle('title.home', 'Главная')}</span>`;
        const titles = {
            home: homeTitle,
            archive: viewTitle('title.archive', 'Архив игр'),
            stats: viewTitle('title.stats', 'Статистика лиги'),
            paths: viewTitle('title.paths', 'Техи и институты'),
            rating: viewTitle('title.rating', 'Рейтинг'),
            seasons: viewTitle('title.seasons', 'Сезоны'),
            tierlist: viewTitle('title.tierlist', 'Тирлист наций'),
            records: viewTitle('title.records', 'Рекорды'),
            faq: viewTitle('title.faq', 'FAQ'),
            profile: viewTitle('title.profile', 'Профиль'),
        };
        const footers = {
            home: viewTitle('footer.home', 'Iron League — главная'),
            archive: viewTitle('footer.archive', 'Данные обновляются автоматически'),
            stats: viewTitle('footer.stats', 'Статистика по играм архива (без teams/scrap)'),
            paths: viewTitle('footer.paths', 'Порядок открытия по бэкапам ходов'),
            rating: viewTitle('footer.rating', 'Рейтинг: шкала от 1000 или от нуля'),
            seasons: viewTitle('footer.seasons', 'Сезоны и награды (live)'),
            tierlist: viewTitle('footer.tierlist', 'Тирлист наций лиги'),
            records: viewTitle('footer.records', 'Рекорды и достижения (без teams/scrap)'),
            faq: viewTitle('footer.faq', 'Частые вопросы'),
            profile: viewTitle('footer.profile', 'Профиль игрока'),
        };
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            const next = titles[view] || titles.home;
            if (view === 'home') titleEl.innerHTML = next;
            else titleEl.textContent = next;
        }
        const footer = document.querySelector('footer p');
        if (footer) footer.textContent = footers[view] || footers.home;
    }

    const RATING_K_KEY = 'ironleague_rating_k';
    const RATING_ELIM_KEY = 'ironleague_rating_elim_penalty';
    const RATING_MIN_GAMES_KEY = 'ironleague_rating_min_games';
    const RATING_SCALE_KEY = 'ironleague_rating_scale';
    let ratingK = 24;
    let lobbyElimPenalty = 0;
    let ratingMinGames = 0;
    let ratingScale = '1000';

    function loadRatingScale() {
        let saved = '1000';
        try {
            saved = localStorage.getItem(RATING_SCALE_KEY) || '1000';
        } catch (e) { /* ignore */ }
        applyRatingScale(saved, true);
    }

    function applyRatingScale(next, silent) {
        ratingScale = next === 'zero' ? 'zero' : '1000';
        try {
            localStorage.setItem(RATING_SCALE_KEY, ratingScale);
        } catch (e) { /* ignore */ }
        const select = document.getElementById('ratingScaleSelect');
        if (select) select.value = ratingScale;
        const pane1000 = document.getElementById('ratingPane1000');
        const paneZero = document.getElementById('ratingPaneZero');
        if (pane1000) pane1000.hidden = ratingScale !== '1000';
        if (paneZero) paneZero.hidden = ratingScale !== 'zero';
        if (!silent) {
            applyViewMeta('rating');
            renderRatingTables();
        }
    }

    function loadRatingK() {
        let saved = 24;
        try {
            saved = Number(localStorage.getItem(RATING_K_KEY));
        } catch (e) { /* ignore */ }
        setRatingK(saved, true);
    }

    function loadLobbyElimPenalty() {
        let saved = 0;
        try {
            saved = Number(localStorage.getItem(RATING_ELIM_KEY));
        } catch (e) { /* ignore */ }
        setLobbyElimPenalty(saved, true);
    }

    function loadRatingMinGames() {
        let saved = 0;
        try {
            saved = Number(localStorage.getItem(RATING_MIN_GAMES_KEY));
        } catch (e) { /* ignore */ }
        setRatingMinGames(saved, true);
    }

    function setRatingK(next, silent) {
        if (window.IronLeagueRating && IronLeagueRating.normalizeK) {
            ratingK = IronLeagueRating.normalizeK(next);
        } else {
            ratingK = [20, 24, 32].includes(Number(next)) ? Number(next) : 24;
        }
        try {
            localStorage.setItem(RATING_K_KEY, String(ratingK));
        } catch (e) { /* ignore */ }
        document.querySelectorAll('.rating-k-btn').forEach((btn) => {
            btn.classList.toggle('active', Number(btn.dataset.k) === ratingK);
        });
        if (!silent) renderRatingTables();
    }

    function setLobbyElimPenalty(next, silent) {
        const n = Number(next);
        lobbyElimPenalty = n === 5 ? 5 : 0;
        try {
            localStorage.setItem(RATING_ELIM_KEY, String(lobbyElimPenalty));
        } catch (e) { /* ignore */ }
        document.querySelectorAll('.rating-elim-btn').forEach((btn) => {
            btn.classList.toggle('active', Number(btn.dataset.elim) === lobbyElimPenalty);
        });
        if (!silent) renderRatingTables();
    }

    function setRatingMinGames(next, silent) {
        const n = Number(next);
        ratingMinGames = n === 5 ? 5 : 0;
        try {
            localStorage.setItem(RATING_MIN_GAMES_KEY, String(ratingMinGames));
        } catch (e) { /* ignore */ }
        document.querySelectorAll('.rating-mingames-btn').forEach((btn) => {
            btn.classList.toggle('active', Number(btn.dataset.mingames) === ratingMinGames);
        });
        if (!silent) renderRatingTables();
    }

    function filterRatingRows(rows) {
        const list = Array.isArray(rows) ? rows : [];
        if (!ratingMinGames) return list;
        const filtered = list.filter((r) => Number(r.games || 0) >= ratingMinGames);
        return filtered.map((r, i) => Object.assign({}, r, { place: i + 1 }));
    }

    function renderRatingTables() {
        if (!window.IronLeagueRating || !gamesData.length) return;
        const pool = seasonScopedPool();
        const result = IronLeagueRating.computeAll(pool, ratingK);
        const zero = IronLeagueRating.computeAll(pool, ratingK, {
            zeroBase: true,
            elimPenalty: lobbyElimPenalty,
        });
        const simpleRow = (r) => `<tr>
            <td class="num">${r.place}</td>
            <td>${playerLinkHtml(r.name)}</td>
            <td class="num">${r.rating.toFixed(2)}</td>
            <td class="num">${r.games}</td>
        </tr>`;
        const lobbyRow = (r) => `<tr>
            <td class="num">${r.place}</td>
            <td>${playerLinkHtml(r.name)}</td>
            <td class="num">${r.rating.toFixed(2)}</td>
            <td class="num">${r.perGame != null ? r.perGame.toFixed(2) : '—'}</td>
            <td class="num">${r.games}</td>
        </tr>`;
        const combinedRow = (r) => `<tr>
            <td class="num">${r.place}</td>
            <td>${playerLinkHtml(r.name)}</td>
            <td class="num">${r.rating.toFixed(2)}</td>
            <td class="num">${r.avgPlace != null ? r.avgPlace.toFixed(2) : '—'}</td>
            <td class="num">${r.placeFfa ?? '—'}</td>
            <td class="num">${r.placePairwise ?? '—'}</td>
            <td class="num">${r.placeFinish ?? '—'}</td>
            <td class="num">${r.games}</td>
        </tr>`;
        fillSortableTable(
            document.getElementById('ratingCombinedTable'),
            filterRatingRows(result.combined),
            combinedRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingFfaTable'),
            filterRatingRows(result.ffa),
            simpleRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingPairwiseTable'),
            filterRatingRows(result.pairwise),
            simpleRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingFinishTable'),
            filterRatingRows(result.finish),
            simpleRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingZeroCombinedTable'),
            filterRatingRows(zero.combined),
            combinedRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingLobbyWinTable'),
            filterRatingRows(zero.lobbyWin),
            lobbyRow,
            'rating',
            'desc',
        );
        fillSortableTable(
            document.getElementById('ratingLobbyAvgTable'),
            filterRatingRows(zero.lobbyAvg),
            lobbyRow,
            'rating',
            'desc',
        );
    }

    const RECORD_SECTIONS = {
        glory: [
            'most_wins',
            'best_winrate',
            'longest_win_streak',
            'longest_play_streak',
            'fastest_win',
            'slowest_win',
            'most_wins_same_nation',
            'most_achievements',
        ],
        epic: [
            'epic_most_broken',
            'epic_science_underdog',
            'epic_bait_throne',
            'epic_first_culture',
            'epic_meat_cosmos',
            'epic_cc_not_lead',
            'epic_lobby_bloodbath',
            'epic_war_hawk_game',
            'epic_score_crush',
            'epic_wonder_no_crown',
        ],
        war: [
            'wins_all_with_caps',
            'most_caps_single_win',
            'most_caps',
            'most_wars_declared',
            'most_wars_received',
            'most_military_deaths',
            'max_military_deaths_single',
            'most_capital_takes',
        ],
        style: [
            'piety_first_count',
            'piety_first_streak',
            'tradition_first_count',
            'liberty_first_count',
            'honor_first_count',
            'ideology_order_count',
            'ideology_freedom_count',
            'ideology_autocracy_count',
            'late_ideology_win',
            'most_wonders_built',
            'most_wonders_owned',
            'two_wonders_one_turn',
            'zeus_statue_win',
            'most_unique_nations',
        ],
        peaks: [
            'max_score_finale',
            'max_cities_finale',
            'max_population_finale',
            'max_capital_population_finale',
            'max_production_finale',
            'max_gold_finale',
            'max_gold_income_finale',
            'max_science_finale',
            'max_culture_finale',
            'most_great_people_finale',
            'most_great_scientists_finale',
            'most_great_engineers_finale',
            'most_great_merchants_finale',
            'most_great_admirals_finale',
            'most_great_culture_people_finale',
            'most_great_generals_finale',
            'max_units_finale',
            'max_strength_finale',
            'max_techs_finale',
            'fastest_ideology',
        ],
        curious: [
            'most_games_no_win',
            'never_eliminated',
            'best_survival_rate',
            'pacifist_games',
            'survived_no_capital',
            'fewest_military_deaths',
            'underdog_win',
            'wonder_race_loss',
            'no_war_win',
        ],
    };

    const DUEL_RECORD_SECTIONS = {
        glory: [
            'duel_most_wins',
            'duel_best_winrate',
            'duel_longest_win_streak',
            'duel_fastest_win',
            'duel_slowest_win',
            'duel_tournament_titles',
            'duel_shortest_final',
        ],
        war: [
            'duel_most_military_deaths',
            'duel_fewest_military_deaths',
        ],
        style: [
            'duel_most_wonders_built',
            'duel_fastest_ideology',
            'duel_patriot',
            'duel_mirror',
            'duel_nation_hopper',
            'duel_capital_only_win',
            'duel_no_capital_win',
            'duel_tech_lead_loss',
            'duel_fiasco',
            'duel_empire',
            'duel_comeback',
            'duel_tradition_first',
            'duel_liberty_first',
            'duel_honor_first',
            'duel_piety_first',
        ],
        peaks: [
            'duel_max_score_finale',
            'duel_max_strength_finale',
            'duel_max_units_finale',
            'duel_max_techs_finale',
            'duel_max_science_finale',
            'duel_max_culture_finale',
            'duel_max_production_finale',
            'duel_max_gold_finale',
        ],
        rivalry: [
            'duel_sweep',
            'duel_rematch_king',
            'duel_nemesis',
        ],
    };

    function recordIconSrc(id) {
        // Prefer painted PNG badges; fall back to SVG silhouette if missing.
        return `img/records/${id}.png`;
    }

    function formatRecordCard(item) {
        const title = tt(`records.item.${item.id}.title`);
        const flavorKey = `records.item.${item.id}.flavor`;
        let flavor = tt(flavorKey);
        if (flavor === flavorKey) flavor = '';
        const vacant = !!item.vacant;
        const playerLabel = vacant ? tt('records.vacantPlayer') : displayPlayerName(item.player);
        let body;
        if (vacant) {
            const vacantKey = `records.item.${item.id}.bodyVacant`;
            body = tt(vacantKey);
            if (body === vacantKey) body = tt('records.empty');
        } else {
            body = tt(`records.item.${item.id}.body`, {
                player: displayPlayerName(item.player),
                value: item.value,
                games: item.games != null ? String(item.games) : '',
                wins: item.wins != null ? String(item.wins) : '',
                survived: item.survived != null ? String(item.survived) : '',
                opponent: item.opponent != null ? displayPlayerName(item.opponent) : '',
                game: (() => {
                    if (item.gameNumber == null) return '';
                    const g = (gamesData || []).find((x) => parseGameNum(x) === Number(item.gameNumber));
                    return g ? formatGameLabel(g) : `IronLeague-${item.gameNumber}`;
                })(),
            });
            if (body === `records.item.${item.id}.body`) {
                body = `${displayPlayerName(item.player)}: ${item.value}`;
            }
        }
        const runners = (Array.isArray(item.top) ? item.top : []).filter((t) => t && t.place > 1);
        const runnersHtml = (!vacant && runners.length)
            ? `<ol class="record-card-runners" aria-label="${tt('records.runners')}">${
                runners.map((t) => {
                    const nat = t.nation
                        ? renderNationPortrait(t.nation, 'record-runner-nation')
                        : '';
                    return `<li>
                    <span class="record-runner-place">#${t.place}</span>
                    ${nat}
                    <span class="record-runner-name">${displayPlayerName(t.player)}</span>
                    <span class="record-runner-value">${t.value}</span>
                </li>`;
                }).join('')
            }</ol>`
            : '';
        const nationHtml = (!vacant && item.nation)
            ? renderNationPortrait(item.nation, 'record-card-nation')
            : '';
        const iconSrc = recordIconSrc(item.id);
        const iconFallback = `img/records/${item.id}.svg`;
        return `<article class="record-card${vacant ? ' record-card--vacant' : ''}" id="record-${item.id}">
            <div class="record-card-top">
                <div class="record-card-media">
                    <img class="record-card-icon" src="${iconSrc}" alt="" width="80" height="80" loading="lazy"
                         onerror="this.onerror=null;this.src='${iconFallback}'">
                    <p class="record-card-value">${item.value}</p>
                </div>
                <div class="record-card-meta">
                    <p class="record-card-flavor">${flavor}</p>
                    <h3 class="record-card-title">${title === `records.item.${item.id}.title` ? item.id : title}</h3>
                    <p class="record-card-player">${nationHtml}<span class="record-card-player-name">${playerLabel}</span></p>
                </div>
            </div>
            <p class="record-card-body">${body}</p>
            ${runnersHtml}
        </article>`;
    }

    function renderRecords() {
        if (!window.IronLeagueAchievements || !gamesData.length) return;
        const pool = recordsGamesPool();
        const duel = getPoolMode() === 'tournaments';
        const sections = duel ? DUEL_RECORD_SECTIONS : RECORD_SECTIONS;
        const items = duel
            ? IronLeagueAchievements.computeDuelAchievements(pool)
            : [
                ...(IronLeagueAchievements.computeAchievements(pool) || []),
                ...(IronLeagueAchievements.computeEpicPlaques
                  ? IronLeagueAchievements.computeEpicPlaques(pool)
                  : []),
              ];
        const byId = new Map(items.map((x) => [x.id, x]));
        const map = {
            glory: document.getElementById('recordsGlory'),
            epic: document.getElementById('recordsEpic'),
            war: document.getElementById('recordsWar'),
            style: document.getElementById('recordsStyle'),
            peaks: document.getElementById('recordsPeaks'),
            curious: document.getElementById('recordsCurious'),
            rivalry: document.getElementById('recordsRivalry'),
        };
        Object.keys(sections).forEach((section) => {
            const el = map[section];
            if (!el) return;
            const cards = sections[section]
                .map((id) => byId.get(id))
                .filter(Boolean)
                .map(formatRecordCard);
            el.innerHTML = cards.length
                ? cards.join('')
                : `<p class="hint">${tt('records.empty')}</p>`;
            hydrateNationPortraits(el);
        });
        // Clear unused section grids
        if (duel && map.curious) map.curious.innerHTML = '';
        if (duel && map.epic) map.epic.innerHTML = '';
        if (!duel && map.rivalry) map.rivalry.innerHTML = '';
    }

    // Запуск
    (async function boot() {
        await initAssetCacheBust();
        if (window.IronLeagueI18n) IronLeagueI18n.initLang();
        IronLeaguePool.configure({
            getGames: () => gamesData,
            onChange: () => refreshPoolDependentViews(),
            tt,
        });
        loadPoolMode();
        IronLeaguePool.bindUi();

        applyViewMeta('home');
        loadRatingK();
        loadLobbyElimPenalty();
        loadRatingMinGames();
        loadRatingScale();
        syncPoolModeUi();

        document.querySelectorAll('.rating-k-btn').forEach((btn) => {
            btn.addEventListener('click', () => setRatingK(btn.dataset.k));
        });
        document.querySelectorAll('.rating-elim-btn').forEach((btn) => {
            btn.addEventListener('click', () => setLobbyElimPenalty(btn.dataset.elim));
        });
        document.querySelectorAll('.rating-mingames-btn').forEach((btn) => {
            btn.addEventListener('click', () => setRatingMinGames(btn.dataset.mingames));
        });
        document.getElementById('ratingScaleSelect')?.addEventListener('change', (e) => {
            applyRatingScale(e.target.value);
        });
        document.querySelectorAll('.policy-stats-filter').forEach((select) => {
            select.addEventListener('change', () => {
                const wrap = select.closest('[data-policy-filter-for]');
                const tableId = wrap?.getAttribute('data-policy-filter-for');
                if (!tableId) return;
                setPolicyFilterMode(tableId, select.value);
                const cache = window._policyStatsCache;
                if (!cache) {
                    renderStatsTables();
                    return;
                }
                const map = {
                    firstPolicyStatsTable: [cache.firstPolicyRows, cache.policyLabel, cache.policyLabel],
                    policyBranchStatsTable: [cache.policyBranchRows, cache.policyLabel, cache.policyLabel],
                    policyComboStatsTable: [
                        cache.policyComboRows,
                        cache.policyComboLabel,
                        cache.policyComboSortLabel,
                    ],
                    policyIdeologyPairStatsTable: [
                        cache.policyIdeologyPairRows,
                        cache.policyPairLabel,
                        cache.policyPairSortLabel,
                    ],
                };
                const entry = map[tableId];
                if (!entry) return;
                const sortLabel = entry[2] || entry[1];
                fillSortableTable(
                    document.getElementById(tableId),
                    filterPolicyStatRows(entry[0], select.value),
                    (r) => pickStatRowHtml(r, entry[1]),
                    'picks',
                    'desc',
                    { name: (r) => sortLabel(r.name) },
                );
            });
        });
        document.getElementById('viewStats')?.addEventListener('click', (e) => {
            const btn = e.target.closest?.('.stats-game-link');
            if (!btn) return;
            e.preventDefault();
            openGameModal(btn.dataset.gameId);
        });
        initStatsGameLinksToggle();
        await loadGamesData();
        await Promise.all([loadFaqData(), loadTierlistData()]);
        renderStatsTables();
        renderRatingTables();
        renderRecords();
    })();

    // --- Live seasons + awards (unciv.icanseeforever.com) ---
    let seasonsState = {
        selected: null,
        rating: null,
        awards: null,
        playersIndex: null,
        loaded: false,
        loading: false,
        error: null,
    };

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderSeasonPicker(data) {
        const select = document.getElementById('seasonSelect');
        const labelEl = document.getElementById('seasonLabel');
        const link = document.getElementById('seasonLiveLink');
        if (!select || !data) return;
        const seasons = Array.isArray(data.seasons) ? data.seasons : [];
        const cur = seasonsState.selected != null ? seasonsState.selected : data.season;
        select.innerHTML = seasons.map((s) => {
            const v = Number(s.value);
            const lab = s.label || `Season ${v}`;
            return `<option value="${v}"${v === Number(cur) ? ' selected' : ''}>${escapeHtml(lab)}</option>`;
        }).join('');
        if (labelEl) labelEl.textContent = data.label || '';
        if (link && window.IronLeagueLive) {
            link.href = IronLeagueLive.seasonPageUrl(cur);
        }
    }

    function renderSeasonRatingTable(data) {
        const tbody = document.querySelector('#seasonRatingTable tbody');
        const status = document.getElementById('seasonsRatingStatus');
        if (!tbody) return;
        const rows = Array.isArray(data && data.players) ? [...data.players] : [];
        rows.sort((a, b) => (b.ilWins - a.ilWins) || (b.wins - a.wins) || String(a.nick).localeCompare(String(b.nick)));
        if (status) {
            status.textContent = rows.length
                ? tt('seasons.ratingCount', { n: String(rows.length) })
                : tt('seasons.empty');
        }
        tbody.innerHTML = rows.map((r, i) => {
            const nick = escapeHtml(displayPlayerName(r.nick));
            const href = window.IronLeagueLive
                ? IronLeagueLive.playerCardUrl(r.id)
                : '#';
            return `<tr>
                <td class="num">${i + 1}</td>
                <td><a class="stats-game-link seasons-player-link" href="${href}" target="_blank" rel="noopener noreferrer">${nick}</a></td>
                <td class="num">${r.games ?? 0}</td>
                <td class="num">${r.ilGames ?? 0}</td>
                <td class="num">${r.ilWins ?? 0}</td>
                <td class="num">${r.duelGames ?? 0}</td>
                <td class="num">${r.duelWins ?? 0}</td>
                <td class="num">${r.tournaments ?? 0}</td>
            </tr>`;
        }).join('');
    }

    function renderLiveAwardsGrid(awards) {
        const grid = document.getElementById('liveAwardsGrid');
        const status = document.getElementById('seasonsAwardsStatus');
        if (!grid) return;
        const list = Array.isArray(awards) ? awards : [];
        if (!list.length) {
            grid.innerHTML = `<div class="no-games">${tt('seasons.awardsEmpty')}</div>`;
            if (status) status.textContent = tt('seasons.awardsEmpty');
            return;
        }
        if (status) status.textContent = tt('seasons.awardsHint');
        grid.innerHTML = list.map((a) => {
            const img = a.imageUrl && window.IronLeagueLive
                ? `<img src="${escapeHtml(IronLeagueLive.absUrl(a.imageUrl))}" alt="" loading="lazy">`
                : `<span class="live-award-fallback" aria-hidden="true">🏅</span>`;
            const holders = Array.isArray(a.holderList) ? a.holderList : [];
            const holdersHtml = holders.length
                ? holders.map((h) => {
                    const href = window.IronLeagueLive ? IronLeagueLive.playerCardUrl(h.id) : '#';
                    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(displayPlayerName(h.nick))}</a>`;
                }).join(', ')
                : `<span class="hint">${tt('seasons.noHolders')}</span>`;
            return `<article class="live-award-card">
                <div class="live-award-media">${img}</div>
                <div class="live-award-body">
                    <h3 class="live-award-title">${escapeHtml(a.title || '')}</h3>
                    <p class="live-award-desc">${escapeHtml(a.description || '')}</p>
                    <div class="live-award-holders"><span>${tt('seasons.holders')}:</span> ${holdersHtml}</div>
                </div>
            </article>`;
        }).join('');
    }

    async function loadSeasonRating(season) {
        if (!window.IronLeagueLive) throw new Error('live module missing');
        const data = await IronLeagueLive.fetchSeasonRating(season);
        seasonsState.rating = data;
        seasonsState.selected = data.season;
        renderSeasonPicker(data);
        renderSeasonRatingTable(data);
        return data;
    }

    async function loadLiveAwards() {
        if (!window.IronLeagueLive) throw new Error('live module missing');
        const data = await IronLeagueLive.fetchAwardsPublic();
        seasonsState.awards = data.awards || [];
        renderLiveAwardsGrid(seasonsState.awards);
        return seasonsState.awards;
    }

    async function ensureSeasonsView(force) {
        if (!window.IronLeagueLive) {
            const status = document.getElementById('seasonsRatingStatus');
            if (status) status.textContent = tt('seasons.unavailable');
            return;
        }
        if (seasonsState.loading) return;
        if (seasonsState.loaded && !force) {
            renderSeasonPicker(seasonsState.rating);
            renderSeasonRatingTable(seasonsState.rating);
            renderLiveAwardsGrid(seasonsState.awards);
            return;
        }
        seasonsState.loading = true;
        const status = document.getElementById('seasonsRatingStatus');
        if (status) status.textContent = tt('seasons.loading');
        try {
            await Promise.all([
                loadSeasonRating(seasonsState.selected),
                loadLiveAwards(),
            ]);
            seasonsState.loaded = true;
            seasonsState.error = null;
        } catch (e) {
            seasonsState.error = String(e);
            if (status) status.textContent = tt('seasons.error', { err: String(e.message || e) });
            const aStatus = document.getElementById('seasonsAwardsStatus');
            if (aStatus) aStatus.textContent = tt('seasons.error', { err: String(e.message || e) });
        } finally {
            seasonsState.loading = false;
        }
    }

    async function ensureLivePlayersIndex() {
        if (seasonsState.playersIndex || !window.IronLeagueLive) return seasonsState.playersIndex;
        try {
            const data = await IronLeagueLive.fetchPlayers();
            seasonsState.playersIndex = IronLeagueLive.nickIndex(data.players || []);
        } catch (e) {
            seasonsState.playersIndex = new Map();
        }
        return seasonsState.playersIndex;
    }

    async function fillProfileLiveAwards(playerName) {
        const el = document.getElementById('profileLiveAwards');
        if (!el) return;
        el.innerHTML = `<span class="hint">${tt('seasons.loading')}</span>`;
        if (!window.IronLeagueLive) {
            el.innerHTML = `<span class="hint">${tt('seasons.unavailable')}</span>`;
            return;
        }
        try {
            const index = await ensureLivePlayersIndex();
            const hit = IronLeagueLive.findPlayerByNick(index, playerName);
            if (!hit) {
                el.innerHTML = `<span class="hint">${tt('profile.liveAwardsNone')}</span>`;
                return;
            }
            const card = await IronLeagueLive.fetchPlayer(hit.id);
            const awards = Array.isArray(card.awards) ? card.awards : [];
            if (!awards.length) {
                el.innerHTML = `<span class="hint">${tt('profile.liveAwardsNone')}</span>`;
                return;
            }
            const liveLink = `<a class="seasons-ext-link" href="${IronLeagueLive.playerCardUrl(hit.id)}" target="_blank" rel="noopener noreferrer">${tt('profile.openLiveCard')}</a>`;
            el.innerHTML = awards.map((a) => {
                const img = a.imageUrl
                    ? `<img src="${escapeHtml(IronLeagueLive.absUrl(a.imageUrl))}" alt="" loading="lazy">`
                    : `<span class="live-award-fallback" aria-hidden="true">🏅</span>`;
                const when = a.grantedAt ? String(a.grantedAt).slice(0, 10) : '';
                return `<div class="profile-ach-card" title="${escapeHtml(a.description || '')}">
                    ${img}
                    <div class="profile-ach-main">
                        <span class="profile-ach-title">${escapeHtml(a.title || '')}</span>
                        <span class="profile-ach-value">${escapeHtml(when)}</span>
                    </div>
                </div>`;
            }).join('') + `<div class="profile-live-link">${liveLink}</div>`;
        } catch (e) {
            el.innerHTML = `<span class="hint">${tt('seasons.error', { err: String(e.message || e) })}</span>`;
        }
    }

    document.getElementById('seasonSelect')?.addEventListener('change', (e) => {
        const n = Number(e.target.value);
        seasonsState.selected = Number.isFinite(n) ? n : null;
        seasonsState.loaded = false;
        void ensureSeasonsView(true);
    });

    function showSiteView(view) {
        const allowed = new Set(['home', 'archive', 'stats', 'paths', 'rating', 'seasons', 'tierlist', 'records', 'faq', 'profile']);
        const next = allowed.has(view) ? view : 'home';
        document.querySelectorAll('.site-nav-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.view === next);
        });
        document.getElementById('viewHome')?.classList.toggle('active', next === 'home');
        document.getElementById('viewArchive').classList.toggle('active', next === 'archive');
        document.getElementById('viewStats').classList.toggle('active', next === 'stats');
        document.getElementById('viewPaths')?.classList.toggle('active', next === 'paths');
        document.getElementById('viewProfile')?.classList.toggle('active', next === 'profile');
        document.getElementById('viewRating')?.classList.toggle('active', next === 'rating');
        document.getElementById('viewSeasons')?.classList.toggle('active', next === 'seasons');
        document.getElementById('viewTierlist').classList.toggle('active', next === 'tierlist');
        document.getElementById('viewRecords')?.classList.toggle('active', next === 'records');
        document.getElementById('viewFaq').classList.toggle('active', next === 'faq');
        if (next !== 'profile') applyViewMeta(next);
        if (next === 'stats') {
            renderStatsTables();
            setStatsTab(document.querySelector('.stats-subnav-btn.active')?.dataset.statsTab || 'players');
        }
        if (next === 'paths' && window.IronLeaguePaths) window.IronLeaguePaths.show();
        if (next === 'rating') {
            applyRatingScale(ratingScale, true);
            renderRatingTables();
        }
        if (next === 'seasons') void ensureSeasonsView();
        if (next === 'records') renderRecords();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Переключение разделов
    document.querySelectorAll('.site-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => showSiteView(btn.dataset.view));
    });
    document.querySelectorAll('[data-go-view]').forEach((el) => {
        el.addEventListener('click', () => showSiteView(el.getAttribute('data-go-view')));
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                showSiteView(el.getAttribute('data-go-view'));
            }
        });
    });

    function engToRusNation(eng) {
        if (window.IronLeagueNationNames) return IronLeagueNationNames.engToRusNation(eng);
        const hit = nations.find(n => n.eng.toLowerCase() === String(eng || '').toLowerCase());
        return (hit && hit.rus) || eng;
    }

    function rusToEngNation(rus) {
        if (window.IronLeagueNationNames) return IronLeagueNationNames.rusToEngNation(rus);
        const hit = nations.find(n => n.rus === rus);
        return (hit && hit.eng) || rus;
    }

    /** Tierlist average for a Russian nation name (or null). */
    function tierlistAvgForNation(nationRu) {
        if (!tierlistData || !Array.isArray(tierlistData.entries)) return null;
        const ru = String(nationRu || '').trim();
        if (!ru) return null;
        const engRaw = String(rusToEngNation(ru) || '').trim();
        const eng = engRaw.toLowerCase().replace(/^the\s+/, '');
        const engAliases = {
            yugoslavia: 'yugolslavia',
            yugolslavia: 'yugolslavia',
            aztecs: 'aztec',
            gauls: 'gaul',
            ottomans: 'ottomans',
            moors: 'moors',
        };
        const engKey = engAliases[eng] || eng;
        for (const e of tierlistData.entries) {
            const civ = String(e.civ || '').trim();
            const civNorm = civ.toLowerCase().replace(/^the\s+/, '');
            const civRu = engToRusNation(civ);
            if (
                civRu === ru
                || civNorm === eng
                || civNorm === engKey
                || civ.toLowerCase() === ru.toLowerCase()
            ) {
                const avg = Number(e.avg);
                return Number.isFinite(avg) ? avg : null;
            }
        }
        return null;
    }

    function displayNationName(russianName) {
        if (window.IronLeagueNationNames && IronLeagueNationNames.displayNationName) {
            return IronLeagueNationNames.displayNationName(russianName);
        }
        if (window.IronLeagueI18n && IronLeagueI18n.getLang && IronLeagueI18n.getLang() === 'en') {
            return rusToEngNation(russianName);
        }
        return russianName || '';
    }

    function displayPolicyName(name) {
        if (window.IronLeagueNationNames && IronLeagueNationNames.displayPolicyName) {
            return IronLeagueNationNames.displayPolicyName(name);
        }
        if (window.IronLeagueI18n && IronLeagueI18n.translateTerm) {
            return IronLeagueI18n.translateTerm(name);
        }
        if (window.IronLeagueI18n && IronLeagueI18n.translatePolicy) {
            return IronLeagueI18n.translatePolicy(name);
        }
        return name;
    }

    /** Map first policy / ideology name → record badge asset id. */
    function profileTraitBadgeId(raw) {
        const s = String(raw || '').trim().toLowerCase();
        if (!s || s === '—') return '';
        if (s.includes('tradition') || s.includes('традиц')) return 'tradition_first_count';
        if (s.includes('liberty') || s.includes('воля')) return 'liberty_first_count';
        if (s.includes('honor') || s.includes('honour') || s.includes('честь')) return 'honor_first_count';
        if (s.includes('piety') || s.includes('набож')) return 'piety_first_count';
        if (s.includes('order') || s.includes('порядок')) return 'ideology_order_count';
        if (s.includes('autocracy') || s.includes('автократ') || s.includes('самодерж')) {
            return 'ideology_autocracy_count';
        }
        if (s.includes('freedom') || s.includes('свобод')) return 'ideology_freedom_count';
        return '';
    }

    function profileBadgeSrc(id) {
        if (!id) return '';
        return `img/records/${id}.png`;
    }

    /**
     * Dossier emblem: top nation portrait + ideology/policy/wonder badges + ach count.
     * Эмблема «личного дела»: портрет частой нации + бейджи + число ачивок.
     */
    function renderProfileEmblem(row, achCount) {
        const el = document.getElementById('profileEmblem');
        if (!el) return;
        if (!row || !row.topNation || row.topNation === '—') {
            el.hidden = true;
            el.innerHTML = '';
            return;
        }
        const nation = row.topNation;
        const nationLabel = displayNationName(nation) || nation;
        const topPolicy = (topCounted(row.firstPolicyCounts, 1)[0] || [])[0] || '';
        const ideology = row.topIdeology || '';
        const topWonder = (topCounted(row.wonderCounts, 1)[0] || [])[0] || '';
        const ideoBadge = profileBadgeSrc(profileTraitBadgeId(ideology));
        const polBadge = profileBadgeSrc(profileTraitBadgeId(topPolicy));
        const wonderSrc = topWonder ? wonderIconUrl(topWonder) : '';
        const wonderTip = topWonder ? wonderTitleAttr(topWonder) : '';
        const subBits = [
            ideology ? displayPolicyName(ideology) : '',
            topPolicy ? displayPolicyName(topPolicy) : '',
        ].filter(Boolean);
        const ach = Number(achCount) || 0;
        el.hidden = false;
        el.innerHTML = `
            <div class="profile-emblem-plate" title="${nationLabel.replace(/"/g, '&quot;')}">
                <div class="profile-emblem-nation">
                    ${renderNationPortrait(nation, 'profile-emblem-portrait')}
                </div>
                ${ideoBadge ? `<img class="profile-emblem-badge profile-emblem-badge--ideo" src="${ideoBadge}" alt="" title="${(displayPolicyName(ideology) || '').replace(/"/g, '&quot;')}" width="40" height="40" loading="lazy" onerror="this.style.display='none'">` : ''}
                ${polBadge ? `<img class="profile-emblem-badge profile-emblem-badge--policy" src="${polBadge}" alt="" title="${(displayPolicyName(topPolicy) || '').replace(/"/g, '&quot;')}" width="40" height="40" loading="lazy" onerror="this.style.display='none'">` : ''}
                ${wonderSrc ? `<span class="profile-emblem-badge profile-emblem-badge--wonder"><img class="wonder-icon" src="${wonderSrc}" alt="" title="${wonderTip}" loading="lazy" onerror="this.closest('.profile-emblem-badge--wonder').style.display='none'"></span>` : ''}
            </div>
            <div class="profile-emblem-caption">
                <strong>${nationLabel}</strong>
                ${subBits.length ? `<span>${subBits.join(' · ')}</span>` : ''}
                ${ach > 0 ? `<span class="profile-emblem-ach">${tt('profile.emblemAchievements', { n: String(ach) })}</span>` : ''}
            </div>
        `;
        hydrateNationPortraits(el);
    }

    function displaySpaceshipPart(name) {
        if (window.IronLeagueI18n && IronLeagueI18n.translateSpaceship) {
            return IronLeagueI18n.translateSpaceship(name);
        }
        return name;
    }

    const MAP_NAME_RU = {
        Fractal: 'Фрактал',
        'Inner Sea': 'Внутреннее море',
        Perlin: 'Шум Перлина',
        Pangaea: 'Пангея',
        Archipelago: 'Архипелаги',
    };
    function displayMapName(name) {
        if (window.IronLeagueI18n && IronLeagueI18n.translateMap) {
            return IronLeagueI18n.translateMap(name);
        }
        const raw = String(name || '').trim();
        if (!raw) return '';
        if (localeTag() === 'en') return raw;
        if (MAP_NAME_RU[raw]) return MAP_NAME_RU[raw];
        const key = Object.keys(MAP_NAME_RU).find((k) => k.toLowerCase() === raw.toLowerCase());
        return key ? MAP_NAME_RU[key] : raw;
    }

    function starsHtml(n) {
        if (n == null || Number.isNaN(n)) return '—';
        return `<span class="tier-stars">${'⭐'.repeat(n)}</span>`;
    }

    function pct(wins, games) {
        if (!games) return 0;
        return Math.round((wins / games) * 1000) / 10;
    }


    function numOrNull(value) {
        if (value === null || value === undefined || value === '') return null;
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function avg(sum, count) {
        if (!count) return null;
        return Math.round((sum / count) * 10) / 10;
    }

    function topNFromCounts(countsMap, n) {
        return [...countsMap.entries()]
            .sort((a, b) => b[1] - a[1]
                || displayPolicyName(a[0]).localeCompare(
                    displayPolicyName(b[0]),
                    localeTag(),
                    localeCompareOpts(),
                ))
            .slice(0, n)
            .map(([name, count]) => `${displayPolicyName(name)} (${count})`)
            .join(', ') || '—';
    }

    function topKeyFromCounts(countsMap) {
        let best = '';
        let bestCount = 0;
        for (const [name, count] of countsMap.entries()) {
            if (count > bestCount) {
                bestCount = count;
                best = name;
            }
        }
        return best || '—';
    }

    function ensurePickStat(map, name) {
        if (!map.has(name)) {
            map.set(name, {
                name,
                picks: 0,
                wins: 0,
                placeSum: 0,
                placeN: 0,
                winGames: [],
            });
        }
        return map.get(name);
    }

    function recordPick(map, name, won, placeScore, gameRef) {
        const key = String(name || '').trim();
        if (!key) return;
        const row = ensurePickStat(map, key);
        row.picks += 1;
        if (won) {
            row.wins += 1;
            if (gameRef && row.winGames.length < 8) {
                const id = gameRef.id != null ? String(gameRef.id) : '';
                const number = gameRef.number != null ? Number(gameRef.number) : null;
                if (id && !row.winGames.some((g) => String(g.id) === id)) {
                    row.winGames.push({ id, number });
                }
            }
        }
        if (placeScore !== null && placeScore !== undefined && Number.isFinite(placeScore)) {
            row.placeSum += placeScore;
            row.placeN += 1;
        }
    }

    function finalizePickRows(map) {
        return [...map.values()].map((row) => ({
            ...row,
            winrate: pct(row.wins, row.picks),
            avgPlace: row.placeN ? Math.round((row.placeSum / row.placeN) * 1000) / 1000 : null,
        }));
    }

    function filterPolicyStatRows(rows, mode) {
        const list = Array.isArray(rows) ? rows : [];
        if (mode === 'wins') return list.filter((r) => Number(r.wins || 0) > 0);
        if (mode === 'multi') return list.filter((r) => Number(r.picks || 0) >= 2);
        if (mode === 'hide-noise') {
            return list.filter((r) => Number(r.wins || 0) > 0 || Number(r.picks || 0) >= 2);
        }
        return list;
    }

    function policyFilterModeFor(tableId) {
        const key = `ironleague_policy_filter_${tableId}`;
        let mode = 'hide-noise';
        try {
            mode = localStorage.getItem(key) || 'hide-noise';
        } catch (e) { /* ignore */ }
        const allowed = new Set(['all', 'hide-noise', 'multi', 'wins']);
        return allowed.has(mode) ? mode : 'hide-noise';
    }

    function setPolicyFilterMode(tableId, mode) {
        const key = `ironleague_policy_filter_${tableId}`;
        try {
            localStorage.setItem(key, mode);
        } catch (e) { /* ignore */ }
    }

    function pickWinGameHtml(row) {
        if (!row.wins || !Array.isArray(row.winGames) || !row.winGames.length) {
            return `<td class="num">${row.wins}</td>`;
        }
        if (!showStatsGameLinks()) {
            return `<td class="num">${row.wins}</td>`;
        }
        const g = row.winGames[0];
        const full = (gamesData || []).find((x) => String(x.id) === String(g.id));
        const label = full
            ? formatGameLabel(full)
            : (Number.isFinite(g.number) ? `IronLeague-${g.number}` : 'IronLeague');
        const extra = row.winGames.length > 1
            ? ` title="${tt('stats.winGamesMore', { n: String(row.winGames.length) })}"`
            : ` title="${tt('stats.winGameOpen')}"`;
        return `<td class="num">${row.wins}
            <button type="button" class="stats-game-link" data-game-id="${g.id}"${extra}>${label}</button>
        </td>`;
    }

    function pickStatRowHtml(row, labelFn) {
        const label = labelFn ? labelFn(row.name) : row.name;
        const avg = row.avgPlace === null || row.avgPlace === undefined
            ? '—'
            : row.avgPlace.toFixed(3);
        return `<tr>
            <td>${label}</td>
            <td class="num">${row.picks}</td>
            ${pickWinGameHtml(row)}
            <td class="num">${row.winrate}%</td>
            <td class="num">${avg}</td>
        </tr>`;
    }

    function computeArchiveStats(games) {
        const players = new Map();
        const nationStats = new Map();
        const firstPolicyStats = new Map();
        const policyBranchStats = new Map();
        const policyComboStats = new Map();
        const policyIdeologyPairStats = new Map();
        const ideologyStats = new Map();
        const wonderBuiltStats = new Map();
        const wonderOwnedStats = new Map();
        const pantheonStats = new Map();
        const founderBeliefStats = new Map();
        const followerBeliefStats = new Map();

        const ensurePlayer = (name) => {
            if (!players.has(name)) {
                players.set(name, {
                    name,
                    games: 0,
                    wins: 0,
                    capitalLosses: 0,
                    eliminated: 0,
                    survived: 0,
                    nationCounts: new Map(),
                    ideologyCounts: new Map(),
                    wonders: 0,
                    wondersBuilt: 0,
                    conquered: 0,
                    militaryDeaths: 0,
                    statsGames: 0,
                    sumScore: 0,
                    sumUnits: 0,
                    sumStrength: 0,
                    sumScience: 0,
                    sumCities: 0,
                    sumPopulation: 0,
                    sumTechs: 0,
                    sumCapitalPop: 0,
                    sumProduction: 0,
                    sumGold: 0,
                    sumGoldIncome: 0,
                    sumCulture: 0,
                    sumIdeologyTurn: 0,
                    sumGreatPeople: 0,
                    nScore: 0,
                    nUnits: 0,
                    nStrength: 0,
                    nScience: 0,
                    nCities: 0,
                    nPopulation: 0,
                    nTechs: 0,
                    nCapitalPop: 0,
                    nProduction: 0,
                    nGold: 0,
                    nGoldIncome: 0,
                    nCulture: 0,
                    nIdeologyTurn: 0,
                    nGreatPeople: 0,
                    firstPolicyCounts: new Map(),
                    wonderCounts: new Map(),
                });
            }
            return players.get(name);
        };

        const ensureNation = (nation) => {
            if (!nationStats.has(nation)) {
                nationStats.set(nation, {
                    nation, picks: 0, wins: 0, placeSum: 0, placeN: 0,
                });
            }
            return nationStats.get(nation);
        };

        for (const n of nations) {
            if (n && n.rus) ensureNation(n.rus);
        }

        for (const game of games || []) {
            // Pool is already FFA-ranked or tournament-only — do not re-apply
            // isExcludedGame (it treats tournaments as excluded from FFA).
            const roster = Array.isArray(game.players) ? game.players : [];
            const winnerNation = resolveWinnerNation(game);
            const placeOrder = (window.IronLeagueRating && IronLeagueRating.placementOrder)
                ? IronLeagueRating.placementOrder(game)
                : roster.map((p) => String(p.name || '').trim()).filter(Boolean);
            const placeIndex = new Map(placeOrder.map((name, i) => [name, i]));
            const lobbyN = placeOrder.length;

            for (const p of roster) {
                const name = (p.name || '').trim();
                const nation = (p.nation || '').trim();
                if (!name || !nation) continue;
                const row = ensurePlayer(name);
                row.games += 1;
                row.nationCounts.set(nation, (row.nationCounts.get(nation) || 0) + 1);
                const nat = ensureNation(nation);
                nat.picks += 1;
                if (nation === winnerNation) {
                    row.wins += 1;
                    nat.wins += 1;
                }
                const idx = placeIndex.has(name) ? placeIndex.get(name) : null;
                if (idx !== null && lobbyN > 1) {
                    nat.placeSum += (lobbyN - 1 - idx) / (lobbyN - 1);
                    nat.placeN += 1;
                }
            }

            for (const s of Array.isArray(game.survivors) ? game.survivors : []) {
                if (s.is_barbarian
                    || s.nation === 'Варвары'
                    || s.nation === 'Barbarians'
                    || s.name === 'Barbarians') {
                    continue;
                }
                const name = (s.name || '').trim();
                if (!name) continue;
                const row = ensurePlayer(name);
                if (s.has_capital === false) row.capitalLosses += 1;
                if (s.alive === false) row.eliminated += 1;
                if (s.alive === true) row.survived += 1;
                if (Array.isArray(s.wonders)) row.wonders += s.wonders.length;
                const built = Array.isArray(s.wonders_built) ? s.wonders_built : null;
                if (built) {
                    row.wondersBuilt += built.length;
                    for (const w of built) {
                        const wn = String(w || '').trim();
                        if (!wn) continue;
                        row.wonderCounts.set(wn, (row.wonderCounts.get(wn) || 0) + 1);
                    }
                }
                if (Array.isArray(s.conquered_capitals)) row.conquered += s.conquered_capitals.length;
                if (Number.isFinite(Number(s.military_deaths))) {
                    row.militaryDeaths += Number(s.military_deaths);
                }

                row.statsGames += 1;
                const add = (keySum, keyN, raw) => {
                    const v = numOrNull(raw);
                    if (v === null) return;
                    row[keySum] += v;
                    row[keyN] += 1;
                };
                add('sumScore', 'nScore', s.score);
                add('sumUnits', 'nUnits', s.units);
                add('sumStrength', 'nStrength', s.strength);
                add('sumScience', 'nScience', s.science);
                add('sumCities', 'nCities', s.cities);
                add('sumPopulation', 'nPopulation', s.population);
                add('sumTechs', 'nTechs', s.techs);
                add('sumCapitalPop', 'nCapitalPop', s.capital_population);
                add('sumProduction', 'nProduction', s.production);
                add('sumGold', 'nGold', s.gold);
                add('sumGoldIncome', 'nGoldIncome', s.gold_income);
                add('sumCulture', 'nCulture', s.culture);
                add('sumIdeologyTurn', 'nIdeologyTurn', s.ideology_turn);
                add('sumGreatPeople', 'nGreatPeople', s.great_people);

                const firstPol = (s.first_policy || '').trim();
                if (firstPol && !isInvalidFirstPolicy(firstPol)) {
                    row.firstPolicyCounts.set(
                        firstPol,
                        (row.firstPolicyCounts.get(firstPol) || 0) + 1,
                    );
                }
                const ideology = (s.ideology || '').trim();
                if (ideology) {
                    row.ideologyCounts.set(
                        ideology,
                        (row.ideologyCounts.get(ideology) || 0) + 1,
                    );
                }

                const idx = placeIndex.has(name) ? placeIndex.get(name) : null;
                const placeScore = (idx !== null && lobbyN > 1)
                    ? (lobbyN - 1 - idx) / (lobbyN - 1)
                    : null;
                const won = (s.nation || '') === winnerNation;
                const gNum = (window.IronLeagueRating && IronLeagueRating.parseGameNum)
                    ? IronLeagueRating.parseGameNum(game)
                    : Number((String(game.number || '').match(/(\d+)/) || [])[1]) || null;
                const gameRef = { id: game.id, number: gNum };

                if (firstPol && !isInvalidFirstPolicy(firstPol)) {
                    recordPick(firstPolicyStats, firstPol, won, placeScore, gameRef);
                }
                const branches = (Array.isArray(s.policy_branches) ? s.policy_branches : [])
                    .map((b) => String(b || '').trim())
                    .filter(Boolean);
                for (const branch of branches) {
                    recordPick(policyBranchStats, branch, won, placeScore, gameRef);
                }
                if (branches.length) {
                    // Same order as archive finale card (policy_branches).
                    recordPick(policyComboStats, branches.join(' · '), won, placeScore, gameRef);
                }
                if (ideology) {
                    recordPick(ideologyStats, ideology, won, placeScore, gameRef);
                    for (const branch of branches) {
                        recordPick(
                            policyIdeologyPairStats,
                            `${branch} + ${ideology}`,
                            won,
                            placeScore,
                            gameRef,
                        );
                    }
                }
                for (const wonder of (built || [])) {
                    recordPick(wonderBuiltStats, wonder, won, placeScore, gameRef);
                }
                for (const wonder of (Array.isArray(s.wonders) ? s.wonders : [])) {
                    recordPick(wonderOwnedStats, wonder, won, placeScore, gameRef);
                }
                if ((s.pantheon || '').trim()) {
                    recordPick(pantheonStats, s.pantheon, won, placeScore, gameRef);
                }
                for (const belief of (Array.isArray(s.founder_beliefs) ? s.founder_beliefs : [])) {
                    recordPick(founderBeliefStats, belief, won, placeScore, gameRef);
                }
                for (const belief of (Array.isArray(s.follower_beliefs) ? s.follower_beliefs : [])) {
                    recordPick(followerBeliefStats, belief, won, placeScore, gameRef);
                }
            }
        }

        const playerRows = [...players.values()].map((p) => {
            let topNation = '—';
            let topCount = 0;
            for (const [nation, count] of p.nationCounts.entries()) {
                if (count > topCount) {
                    topCount = count;
                    topNation = nation;
                }
            }
            return {
                ...p,
                winrate: pct(p.wins, p.games),
                topNation,
                topIdeology: topKeyFromCounts(p.ideologyCounts),
                uniqueNations: p.nationCounts.size,
                gamesWithStats: p.statsGames,
                avgScore: avg(p.sumScore, p.nScore),
                avgUnits: avg(p.sumUnits, p.nUnits),
                avgStrength: avg(p.sumStrength, p.nStrength),
                avgScience: avg(p.sumScience, p.nScience),
                avgCities: avg(p.sumCities, p.nCities),
                avgPopulation: avg(p.sumPopulation, p.nPopulation),
                avgTechs: avg(p.sumTechs, p.nTechs),
                avgCapitalPop: avg(p.sumCapitalPop, p.nCapitalPop),
                avgProduction: avg(p.sumProduction, p.nProduction),
                avgGold: avg(p.sumGold, p.nGold),
                avgGoldIncome: avg(p.sumGoldIncome, p.nGoldIncome),
                avgCulture: avg(p.sumCulture, p.nCulture),
                avgIdeologyTurn: avg(p.sumIdeologyTurn, p.nIdeologyTurn),
                avgGreatPeople: avg(p.sumGreatPeople, p.nGreatPeople),
                topPolicies: topNFromCounts(p.firstPolicyCounts, 3),
            };
        });

        const nationRows = [...nationStats.values()].map((n) => ({
            ...n,
            winrate: pct(n.wins, n.picks),
            avgPlace: n.placeN
                ? Math.round((n.placeSum / n.placeN) * 1000) / 1000
                : null,
        }));

        return {
            playerRows,
            nationRows,
            firstPolicyRows: finalizePickRows(firstPolicyStats),
            policyBranchRows: finalizePickRows(policyBranchStats),
            policyComboRows: finalizePickRows(policyComboStats),
            policyIdeologyPairRows: finalizePickRows(policyIdeologyPairStats),
            ideologyRows: finalizePickRows(ideologyStats),
            wonderBuiltRows: finalizePickRows(wonderBuiltStats),
            wonderOwnedRows: finalizePickRows(wonderOwnedStats),
            pantheonRows: finalizePickRows(pantheonStats),
            founderBeliefRows: finalizePickRows(founderBeliefStats),
            followerBeliefRows: finalizePickRows(followerBeliefStats),
        };
    }

    function fillSortableTable(table, rows, renderRow, defaultSort, defaultDir, labelFns) {
        if (!table) return;
        const tbody = table.querySelector('tbody');
        let sortKey = defaultSort;
        let sortDir = defaultDir || 'desc';
        const labels = labelFns || null;

        const paintHeaders = () => {
            table.querySelectorAll('th[data-sort]').forEach((th) => {
                th.classList.remove('sort-asc', 'sort-desc');
                if (th.dataset.sort === sortKey) {
                    th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            });
        };

        const paint = () => {
            const loc = localeTag();
            const cmpOpts = localeCompareOpts();
            const sorted = [...rows].sort((a, b) => {
                const av = a[sortKey];
                const bv = b[sortKey];
                const aDisp = sortDisplayText(a, sortKey, labels);
                const bDisp = sortDisplayText(b, sortKey, labels);
                if (aDisp !== null || bDisp !== null
                    || typeof av === 'string' || typeof bv === 'string') {
                    const as = aDisp !== null ? aDisp : String(av ?? '');
                    const bs = bDisp !== null ? bDisp : String(bv ?? '');
                    return sortDir === 'asc'
                        ? as.localeCompare(bs, loc, cmpOpts)
                        : bs.localeCompare(as, loc, cmpOpts);
                }
                const an = Number(av);
                const bn = Number(bv);
                const aNull = av === null || av === undefined || Number.isNaN(an);
                const bNull = bv === null || bv === undefined || Number.isNaN(bn);
                if (aNull && bNull) return 0;
                if (aNull) return 1;
                if (bNull) return -1;
                return sortDir === 'asc' ? (an - bn) : (bn - an);
            });
            tbody.innerHTML = sorted.map(renderRow).join('');
            paintHeaders();
            hydrateNationPortraits(tbody);
        };

        table.querySelectorAll('th[data-sort]').forEach((th) => {
            th.onclick = () => {
                const key = th.dataset.sort;
                if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
                else {
                    sortKey = key;
                    sortDir = th.classList.contains('num') ? 'desc' : 'asc';
                }
                paint();
            };
        });
        paint();
    }

    function renderStatsTables() {
        if (!gamesData.length) return;
        const {
            playerRows,
            nationRows,
            firstPolicyRows,
            policyBranchRows,
            policyComboRows,
            policyIdeologyPairRows,
            ideologyRows,
            wonderBuiltRows,
            wonderOwnedRows,
            pantheonRows,
            founderBeliefRows,
            followerBeliefRows,
        } = computeArchiveStats(seasonScopedPool());

        fillSortableTable(
            document.getElementById('playerWinrateTable'),
            playerRows.filter((p) => p.games > 0),
            (p) => `<tr>
                <td>${playerLinkHtml(p.name)}</td>
                <td class="num">${p.games}</td>
                <td class="num">${p.wins}</td>
                <td class="num">${p.winrate}%</td>
                <td class="num">${p.survived}</td>
                <td class="num">${p.capitalLosses}</td>
                <td class="num">${p.eliminated}</td>
            </tr>`,
            'winrate',
            'desc',
        );

        fillSortableTable(
            document.getElementById('nationStatsTable'),
            nationRows,
            (n) => {
                const avg = n.avgPlace === null || n.avgPlace === undefined
                    ? '—'
                    : n.avgPlace.toFixed(3);
                return `<tr>
                <td><span class="nation-cell">${renderNationPortrait(n.nation, 'player-nation-mini')}${displayNationName(n.nation)}</span></td>
                <td class="num">${n.picks}</td>
                <td class="num">${n.wins}</td>
                <td class="num">${n.winrate}%</td>
                <td class="num">${avg}</td>
            </tr>`;
            },
            'picks',
            'desc',
        );

        fillSortableTable(
            document.getElementById('winnerNationsTable'),
            nationRows.filter((n) => n.wins > 0).map((n) => Object.assign({}, n, {
                tierAvg: tierlistAvgForNation(n.nation),
            })),
            (n) => `<tr>
                <td><span class="nation-cell">${renderNationPortrait(n.nation, 'player-nation-mini')}${displayNationName(n.nation)}</span></td>
                <td class="num">${n.wins}</td>
                <td class="num">${n.picks}</td>
                <td class="num">${n.winrate}%</td>
                <td class="num" title="${n.tierAvg != null ? '' : tt('stats.tierMissing')}">${n.tierAvg != null ? Number(n.tierAvg).toFixed(2) : '—'}</td>
            </tr>`,
            'wins',
            'desc',
        );

        fillSortableTable(
            document.getElementById('playerDetailTable'),
            playerRows.filter((p) => p.games > 0),
            (p) => `<tr>
                <td>${playerLinkHtml(p.name)}</td>
                <td><span class="nation-cell">${p.topNation !== '—' ? renderNationPortrait(p.topNation, 'player-nation-mini') : ''}${p.topNation !== '—' ? displayNationName(p.topNation) : '—'}</span></td>
                <td>${p.topIdeology !== '—' ? displayPolicyName(p.topIdeology) : '—'}</td>
                <td class="num">${p.uniqueNations}</td>
                <td class="num">${p.wonders}</td>
                <td class="num">${p.wondersBuilt}</td>
                <td class="num">${p.conquered}</td>
                <td class="num">${p.militaryDeaths}</td>
            </tr>`,
            'games',
            'desc',
        );

        const fmtAvg = (v) => (v === null || v === undefined ? '—' : v);
        const fmtAvgSigned = (v) => {
            if (v === null || v === undefined) return '—';
            if (v > 0) return `+${v}`;
            return String(v);
        };
        fillSortableTable(
            document.getElementById('playerAveragesTable'),
            playerRows.filter((p) => p.gamesWithStats > 0),
            (p) => `<tr>
                <td>${playerLinkHtml(p.name)}</td>
                <td class="num">${p.gamesWithStats}</td>
                <td class="num">${fmtAvg(p.avgScore)}</td>
                <td class="num">${fmtAvg(p.avgUnits)}</td>
                <td class="num">${fmtAvg(p.avgStrength)}</td>
                <td class="num">${fmtAvg(p.avgScience)}</td>
                <td class="num">${fmtAvg(p.avgCities)}</td>
                <td class="num">${fmtAvg(p.avgPopulation)}</td>
                <td class="num">${fmtAvg(p.avgTechs)}</td>
                <td>${p.topPolicies || '—'}</td>
            </tr>`,
            'gamesWithStats',
            'desc',
        );

        const ecoCell = (labelKey, valueHtml) =>
            `<td class="num" data-label="${tt(labelKey)}">${valueHtml}</td>`;
        fillSortableTable(
            document.getElementById('playerEconomyAveragesTable'),
            playerRows.filter((p) => p.gamesWithStats > 0),
            (p) => `<tr>
                <td data-label="${tt('stats.col.player')}">${playerLinkHtml(p.name)}</td>
                ${ecoCell('stats.col.gamesWithStats', p.gamesWithStats)}
                ${ecoCell('stats.col.population', fmtAvg(p.avgPopulation))}
                ${ecoCell('stats.col.capitalPop', fmtAvg(p.avgCapitalPop))}
                ${ecoCell('stats.col.production', fmtAvg(p.avgProduction))}
                ${ecoCell('stats.col.gold', fmtAvg(p.avgGold))}
                ${ecoCell('stats.col.goldIncome', fmtAvgSigned(p.avgGoldIncome))}
                ${ecoCell('stats.col.science', fmtAvg(p.avgScience))}
                ${ecoCell('stats.col.culture', fmtAvg(p.avgCulture))}
                ${ecoCell('stats.col.ideologyTurn', fmtAvg(p.avgIdeologyTurn))}
                ${ecoCell('stats.col.greatPeople', fmtAvg(p.avgGreatPeople))}
            </tr>`,
            'gamesWithStats',
            'desc',
        );

        const policyLabel = (name) => displayPolicyName(name);
        const policyComboLabel = (name) => {
            const parts = String(name || '').split(' · ').filter(Boolean).map((p) => displayPolicyName(p));
            if (parts.length <= 2) return parts.join(' · ');
            const shortLabel = `${parts.slice(0, 2).join(' · ')} · +${parts.length - 2}`;
            const full = parts.join(' · ').replace(/"/g, '&quot;');
            return `<span title="${full}">${shortLabel}</span>`;
        };
        const policyPairLabel = (name) => {
            const raw = String(name || '');
            const sep = ' + ';
            const idx = raw.indexOf(sep);
            if (idx < 0) return displayPolicyName(raw);
            return `${displayPolicyName(raw.slice(0, idx))}${sep}${displayPolicyName(raw.slice(idx + sep.length))}`;
        };
        const policyComboSortLabel = (name) => String(name || '')
            .split(' · ')
            .filter(Boolean)
            .map((p) => displayPolicyName(p))
            .join(' · ');
        const policyPairSortLabel = (name) => {
            const raw = String(name || '');
            const sep = ' + ';
            const idx = raw.indexOf(sep);
            if (idx < 0) return displayPolicyName(raw);
            return `${displayPolicyName(raw.slice(0, idx))}${sep}${displayPolicyName(raw.slice(idx + sep.length))}`;
        };
        const wonderLabel = (name) => renderWonderLabel(name);

        window._policyStatsCache = {
            firstPolicyRows,
            policyBranchRows,
            policyComboRows,
            policyIdeologyPairRows,
            policyLabel,
            policyComboLabel,
            policyPairLabel,
            policyComboSortLabel,
            policyPairSortLabel,
        };

        const fillPolicyTable = (tableId, rows, labelFn, sortLabelFn) => {
            const mode = policyFilterModeFor(tableId);
            const select = document.querySelector(
                `[data-policy-filter-for="${tableId}"] .policy-stats-filter`,
            );
            if (select) select.value = mode;
            const sortFn = sortLabelFn || labelFn;
            fillSortableTable(
                document.getElementById(tableId),
                filterPolicyStatRows(rows, mode),
                (r) => pickStatRowHtml(r, labelFn),
                'picks',
                'desc',
                { name: (r) => sortFn(r.name) },
            );
        };

        fillPolicyTable('firstPolicyStatsTable', firstPolicyRows, policyLabel);
        fillPolicyTable('policyBranchStatsTable', policyBranchRows, policyLabel);
        fillPolicyTable(
            'policyComboStatsTable',
            policyComboRows,
            policyComboLabel,
            policyComboSortLabel,
        );
        fillPolicyTable(
            'policyIdeologyPairStatsTable',
            policyIdeologyPairRows,
            policyPairLabel,
            policyPairSortLabel,
        );
        fillSortableTable(
            document.getElementById('ideologyStatsTable'),
            ideologyRows,
            (r) => pickStatRowHtml(r, policyLabel),
            'picks',
            'desc',
            { name: (r) => policyLabel(r.name) },
        );
        fillSortableTable(
            document.getElementById('wonderBuiltStatsTable'),
            wonderBuiltRows,
            (r) => pickStatRowHtml(r, wonderLabel),
            'picks',
            'desc',
            { name: (r) => wonderNameRu(r.name) },
        );
        fillSortableTable(
            document.getElementById('wonderOwnedStatsTable'),
            wonderOwnedRows,
            (r) => pickStatRowHtml(r, wonderLabel),
            'picks',
            'desc',
            { name: (r) => wonderNameRu(r.name) },
        );
        fillSortableTable(
            document.getElementById('pantheonStatsTable'),
            pantheonRows,
            (r) => pickStatRowHtml(r, displayPolicyName),
            'picks',
            'desc',
            { name: (r) => displayPolicyName(r.name) },
        );
        fillSortableTable(
            document.getElementById('founderBeliefStatsTable'),
            founderBeliefRows,
            (r) => pickStatRowHtml(r, displayPolicyName),
            'picks',
            'desc',
            { name: (r) => displayPolicyName(r.name) },
        );
        fillSortableTable(
            document.getElementById('followerBeliefStatsTable'),
            followerBeliefRows,
            (r) => pickStatRowHtml(r, displayPolicyName),
            'picks',
            'desc',
            { name: (r) => displayPolicyName(r.name) },
        );

        // Charts: opening policies, ideologies, maps
        const chartOpts = {
            pieLabel: tt('chart.pie'),
            barLabel: tt('chart.bar'),
            emptyText: '—',
        };
        if (window.IronLeagueCharts && IronLeagueCharts.renderChartWithToggle) {
            IronLeagueCharts.renderChartWithToggle(
                document.getElementById('firstPolicyChart'),
                firstPolicyRows.map((r) => ({
                    label: displayPolicyName(r.name),
                    value: r.picks,
                    colorKey: r.name,
                })),
                Object.assign({}, chartOpts, {
                    aria: tt('stats.firstPolicyChart'),
                    storageKey: 'il_chart_first_policy',
                }),
            );
            IronLeagueCharts.renderChartWithToggle(
                document.getElementById('ideologyChart'),
                ideologyRows.map((r) => ({
                    label: displayPolicyName(r.name),
                    value: r.picks,
                    colorKey: r.name,
                })),
                Object.assign({}, chartOpts, {
                    aria: tt('stats.ideologies'),
                    storageKey: 'il_chart_ideology',
                }),
            );
        }
        {
            const mapCounts = new Map();
            for (const game of seasonScopedPool()) {
                const m = canonicalizeMapName(game.map);
                if (!m) continue;
                mapCounts.set(m, (mapCounts.get(m) || 0) + 1);
            }
            const mapRows = [...mapCounts.entries()].map(([name, games]) => ({
                name,
                games,
                share: 0,
            }));
            const mapTotal = mapRows.reduce((s, r) => s + r.games, 0) || 1;
            for (const r of mapRows) r.share = Math.round((r.games / mapTotal) * 1000) / 10;
            if (window.IronLeagueCharts && IronLeagueCharts.renderChartWithToggle) {
                IronLeagueCharts.renderChartWithToggle(
                    document.getElementById('mapTypeChart'),
                    mapRows.map((r) => ({ label: displayMapName(r.name), value: r.games })),
                    Object.assign({}, chartOpts, {
                        aria: tt('stats.maps'),
                        storageKey: 'il_chart_maps',
                    }),
                );
            }
            const preview = (raw) => (window.IronLeaguePlayerMeta && IronLeaguePlayerMeta.mapPreviewHtml)
                ? IronLeaguePlayerMeta.mapPreviewHtml(raw)
                : '';
            fillSortableTable(
                document.getElementById('mapStatsTable'),
                mapRows,
                (r) => `<tr>
                    <td class="map-preview-cell">${preview(r.name)}</td>
                    <td>${displayMapName(r.name)}</td>
                    <td class="num">${r.games}</td>
                    <td class="num">${r.share}%</td>
                </tr>`,
                'games',
                'desc',
                { name: (r) => displayMapName(r.name) },
            );
        }
    }

    let tierlistData = null;

    async function loadTierlistData() {
        const sourceEl = document.getElementById('tierlistSource');
        const legendEl = document.getElementById('tierlistLegend');
        try {
            const response = await fetchFresh('data/tierlist.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            tierlistData = await response.json();
            if (tierlistData.source) {
                const link = `<a href="${tierlistData.source}" target="_blank" rel="noopener">Google Sheet</a>`;
                sourceEl.innerHTML = tt('tier.source', { link });
            } else {
                sourceEl.textContent = '';
            }
            legendEl.innerHTML = (tierlistData.legend || []).map((item) => {
                const stars = Number(item.stars) || 0;
                const label = tt(`tier.legend.${stars}`) || item.label || '';
                return `<span class="tier-pill">${starsHtml(stars)} ${label}</span>`;
            }).join('');

            const rawRows = (tierlistData.entries || []).map((e) => ({
                civ: e.civ,
                civRu: engToRusNation(e.civ),
                avg: e.avg || 0,
                Community: e.ratings?.Community,
                note: e.note || '',
            }));
            // Prefer canonical eng name / poll note when sheet has aliases (Gaul vs Gauls).
            const byRu = new Map();
            for (const r of rawRows) {
                const key = String(r.civRu || r.civ || '').trim();
                if (!key) continue;
                const prev = byRu.get(key);
                if (!prev) {
                    byRu.set(key, r);
                    continue;
                }
                const canon = String(rusToEngNation(key) || '').toLowerCase();
                const prevCanon = String(prev.civ || '').toLowerCase() === canon;
                const nextCanon = String(r.civ || '').toLowerCase() === canon;
                if (nextCanon && !prevCanon) {
                    byRu.set(key, r);
                    continue;
                }
                if (prevCanon && !nextCanon) continue;
                if (r.note && !prev.note) byRu.set(key, r);
            }
            const rows = [...byRu.values()];

            fillSortableTable(
                document.getElementById('tierlistTable'),
                rows,
                (r) => `<tr title="${(r.note || '').replace(/"/g, '&quot;')}">
                    <td><span class="nation-cell">${renderNationPortrait(r.civRu, 'player-nation-mini')}${displayNationName(r.civRu)}</span></td>
                    <td class="num">${r.avg ? r.avg.toFixed(2) : '—'}</td>
                    <td class="num">${starsHtml(r.Community)}</td>
                </tr>`,
                'avg',
                'desc',
            );
            if (gamesData && gamesData.length) renderStatsTables();
        } catch (error) {
            console.error('Tierlist error:', error);
            sourceEl.textContent = tt('error.tierlist');
        }
    }

    async function loadFaqData() {
        const content = document.getElementById('faqContent');
        const toc = document.getElementById('faqToc');
        const sourceEl = document.getElementById('faqSource');
        try {
            const response = await fetchFresh(
                (window.IronLeagueI18n && IronLeagueI18n.getLang() === 'en')
                    ? 'data/faq_en.json'
                    : 'data/faq.json'
            );
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const sections = Array.isArray(data.sections) ? data.sections : [];

            if (data.source) {
                const link = `<a href="${data.source}" target="_blank" rel="noopener">Google Doc</a>`;
                sourceEl.innerHTML = tt('faq.source', { link });
            } else {
                sourceEl.textContent = '';
            }

            toc.innerHTML = sections.map((section, idx) => {
                const id = `faq-sec-${idx}`;
                return `<a href="#${id}">${section.title}</a>`;
            }).join('');

            content.innerHTML = sections.map((section, idx) => {
                const id = `faq-sec-${idx}`;
                return `
                    <section class="faq-section" id="${id}">
                        <h2>${section.title}</h2>
                        <div class="faq-body">${section.html || ''}</div>
                    </section>
                `;
            }).join('');
        } catch (error) {
            console.error('FAQ error:', error);
            sourceEl.textContent = '';
            content.innerHTML = `<div class="error">${tt('error.faq')}</div>`;
        }
    }

    // События фильтров
    document.getElementById('nationFilter').addEventListener('change', filterGames);
    document.getElementById('playerFilter')?.addEventListener('change', filterGames);
    document.getElementById('sortFilter').addEventListener('change', filterGames);
    document.getElementById('relevanceFilter')?.addEventListener('change', filterGames);
    document.getElementById('victoryFilter')?.addEventListener('change', filterGames);
    document.getElementById('mapFilter')?.addEventListener('change', filterGames);

    document.getElementById('statsSubnav')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.stats-subnav-btn');
        if (!btn) return;
        setStatsTab(btn.dataset.statsTab);
    });
    setStatsTab('players');

    document.getElementById('profileBackBtn')?.addEventListener('click', () => showSiteView('stats'));
    document.body.addEventListener('click', (e) => {
        const link = e.target.closest('.player-link');
        if (link) {
            e.preventDefault();
            openPlayerProfile(link.dataset.player);
        }
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (!window.IronLeagueI18n) return;
            IronLeagueI18n.setLang(btn.dataset.lang);
            const active = document.querySelector('.site-nav-btn.active');
            applyViewMeta(active?.dataset.view || 'home');
            populateNationFilter();
            populatePlayerFilter();
            populateExtraFilters();
            fillTournamentNameSelects();
            fillFfaSeasonSelects();
            syncPoolModeUi();
            filterGames();
            renderStatsTables();
            renderRatingTables();
            renderRecords();
            if (tierlistData) loadTierlistData();
            loadFaqData();
            const openModal = document.getElementById('gameModal');
            if (openModal && openModal.classList.contains('open')) {
                const expandId = document.querySelector('[data-expand-id].active')?.dataset?.expandId;
                // re-open current modal body if any game was shown
                const title = document.getElementById('gameModalTitle')?.textContent;
                if (title) {
                    const g = gamesData.find((x) => formatGameLabel(x) === title);
                    if (g) openGameModal(g.id);
                }
            }
        });
    });

    window.onIronLeagueLangChange = function () {
        // static data-i18n already refreshed in setLang; refresh dynamic tables/titles
        fillTournamentNameSelects();
        fillFfaSeasonSelects();
        syncPoolModeUi();
        if (document.getElementById('viewStats')?.classList.contains('active')) {
            renderStatsTables();
        }
        if (document.getElementById('viewRecords')?.classList.contains('active')) {
            renderRecords();
        }
        if (document.getElementById('viewRating')?.classList.contains('active')) {
            renderRatingTables();
        }
        if (document.getElementById('viewArchive')?.classList.contains('active')) {
            filterGames();
        }
        if (document.getElementById('viewSeasons')?.classList.contains('active')) {
            if (seasonsState.rating) {
                renderSeasonPicker(seasonsState.rating);
                renderSeasonRatingTable(seasonsState.rating);
            }
            renderLiveAwardsGrid(seasonsState.awards);
        }
        if (window.IronLeaguePaths) window.IronLeaguePaths.refreshLabels();
    };



    // Register view modules so other code can call them without touching app locals.
    if (window.IronLeagueArchiveStats) {
        IronLeagueArchiveStats.register({
            computeArchiveStats,
            renderStatsTables,
        });
    }
    if (window.IronLeagueRecordsUi) {
        IronLeagueRecordsUi.register({
            renderRecords,
            formatRecordCard,
            RECORD_SECTIONS,
            DUEL_RECORD_SECTIONS,
        });
    }
    if (window.IronLeagueRatingUi) {
        IronLeagueRatingUi.register({ renderRatingTables });
    }
    if (window.IronLeaguePlayerProfile) {
        IronLeaguePlayerProfile.register({ openPlayerProfile });
    }

    // Back to top when site nav scrolls out of view
    (function setupBackToTop() {
        const btn = document.getElementById('backToTop');
        const nav = document.querySelector('.site-nav');
        if (!btn || !nav || !('IntersectionObserver' in window)) return;
        const obs = new IntersectionObserver((entries) => {
            const entry = entries[0];
            btn.classList.toggle('visible', entry && !entry.isIntersecting);
        }, { threshold: 0 });
        obs.observe(nav);
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();
