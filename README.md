# unciv-ironleague-ru

Iron League (Unciv) — архив, статистика, рейтинг, сезоны, рекорды и пути техов/институтов.

Сайт: https://destup.github.io/unciv-ironleague-ru/

## Что это

Статический сайт на GitHub Pages. Источник партий — `Games.json`; бот (**unciv-core-service**, админ-команды `/syncironleague`, `/addironleague`) открывает PR с новыми завершёнными играми.

Правила лиги и unlock-данные на вкладке **Техи и институты** берутся из **RekMOD-iron** (не из vanilla G&K).

## Разделы сайта

| Раздел | Что делает |
|--------|------------|
| **Главная** | Карточки-переходы, контакты |
| **Архив** | Партии из `Games.json`, фильтры (пул FFA/турниры, **сезон**, teams/scrap, нация, игрок, победа, карта), карточки финала, GIF / web-replay. Счётчики сверху отражают текущий отфильтрованный список |
| **Статистика** | Таблицы по игрокам/нациям/институтам/чудесам/картам; профиль игрока. Пул + **сезон** (общий с рейтингом/рекордами) |
| **Техи и институты** | Порядок анлоков по бэкапам (`data/tech_policy_timelines.json`), древо RekMOD-iron |
| **Рейтинг** | Elo / очки лобби из `Games.json` (клиент). Пул + **сезон** |
| **Сезоны** | Live API (`unciv.icanseeforever.com/api/home`): рейтинг сезона и каталог наград |
| **Тирлист** | `data/tierlist.json` vs частота побед в архиве |
| **Рекорды** | Ачивки / пики / эпос (`js/achievements.js`). Пул + **сезон** |
| **FAQ** | `data/faq.json` / `faq_en.json` |

### Сезоны FFA (архив)

Маппинг IL → сезон живёт в `js/games-core.js` (`SEASON_FIRST_IL`):

- **Сезон 0** — `IronLeague-1` … `IronLeague-11` (легаси)
- **Сезон 1** — `IronLeague-12+` (пока сезон 2 не начат)
- Если в `Games.json` появится поле `game.season`, оно имеет приоритет

Общий фильтр `ironleague_ffa_season` (localStorage) синхронизирован на **Архив / Статистика / Рейтинг / Рекорды**. Турниры сезон не режут.

## Архитектура фронта

```
index.html          — разметка + js/boot.js
js/boot.js          — build-id → единый ?v= для CSS/JS
js/app.js           — оркестрация UI (навигация, архив, сезоны live, boot)
js/pool.js          — пул FFA/турниры + сезон (IronLeaguePool)
js/games-core.js    — флаги, exclusion, season, winner, labels
js/site-core.js     — CONFIG, fetchFresh, web-replay
js/ui-helpers.js    — tt, escape, averages
js/i18n.js          — RU/EN
js/achievements.js  — compute* рекордов
js/rating.js        — Elo / lobby math
js/archive-stats.js / records-ui.js / rating-ui.js / player-profile.js
                    — фасады API; реализация регистрируется из app.js
js/tech-policy-paths.js, live-league.js, stats-charts.js, …
```

Клиентские скрипты — IIFE с `global` (как `window`):

```js
(function (global) {
  global.IronLeagueSomething = { … };
})(typeof window !== 'undefined' ? window : globalThis);
```

Порядок загрузки задаёт **только** `js/boot.js` (`LIBS`). Ручные `?v=` на тегах больше не нужны.

### Cache-bust

1. Push / merge в `main` → Pages + workflow **Bump build id** пишет UTC timestamp в `build-id.txt`.
2. `boot.js` читает `build-id.txt` и грузит `css/site.css` и все модули с `?v=<build-id>`.
3. `fetchFresh` / `IronLeagueCacheBust` используют ту же метку для `Games.json` и `data/*`.

Если после merge билд не стартовал: Actions → **Bump build id** → Run workflow.

## Структура репозитория

| Путь | Назначение |
|------|------------|
| `index.html` | Разметка |
| `css/site.css` | Стили |
| `js/boot.js` | Загрузчик + cache-bust |
| `js/app.js` | Page UI |
| `js/pool.js` | Пул и сезон |
| `js/games-core.js` | Общие правила архива |
| `js/achievements.js` | Рекорды |
| `js/rating.js` | Рейтинг (математика) |
| `Games.json` | Архив игр |
| `data/` | FAQ, тирлист, имена, древо/таймлайны |
| `tools/` | Экспорт из RekMOD-iron / Unciv |
| `Replays/`, `*_icons/`, `img/`, `bg/` | Медиа |
| `build-id.txt` | Метка деплоя |
| `.github/workflows/bump-build-id.yml` | Автобамп `build-id.txt` |

### Ключевые файлы `data/`

| Файл | Назначение |
|------|------------|
| `tech_tree.json` / `tech_details.json` | Древо и анлоки RekMOD-iron |
| `tech_policy_timelines.json` | Порядок техов/политик (бэкапы) |
| `nation_names.json`, `policy_names.json`, … | Подписи |
| `default_capitals.json` | Столицы по умолчанию |
| `faq.json` / `faq_en.json`, `tierlist.json` | FAQ, тирлист |

## Обновление данных (мейнтейнеры)

### Техи / анлоки (RekMOD-iron)

```powershell
cd D:\PythonProjects\unciv-ironleague-ru
py -3 tools\export_tech_details.py
# опционально:
py -3 tools\extract_missing_unlock_icons.py
```

### Таймлайны

Sidecar собирается из бэкапов game-server (скрипт в монолите Civ_bot):

```powershell
cd D:\PythonProjects\Civ_bot
py -3 scripts\extract_ironleague_timelines.py
```

Игры без бэкапов (сейчас 4–11, 14) в таймлайнах отсутствуют.

### Архив игр

PR от **unciv-core-service** (`Games.json`, иногда `Replays/`).

Когда стартует **сезон 2**, добавь первый IL в `SEASON_FIRST_IL` в `js/games-core.js` (или прокинь `season` в JSON).

## Локальный просмотр

Нужен статический HTTP-сервер из корня:

```powershell
npx --yes serve -l 3000 .
# или: py -3 -m http.server 3000
```

Открой http://localhost:3000/ — `boot.js` подтянет модули.

## Синхронизация с ботом

Админ-команды **unciv-core-service**:

- `/syncironleague` / `dry` — недостающие `gameN` → PR
- `/addironleague <uuid> [N]` — одна игра по GAME_ID
- `/ironleaguegifs` — записи без `gif`

Нужен `GITHUB_TOKEN` с правом PR в fork / `DeStup/unciv-ironleague-ru`.
