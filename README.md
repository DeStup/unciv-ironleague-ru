# unciv-ironleague-ru

Iron League (Unciv) — архив, статистика, рейтинг и пути техов/институтов.

Сайт: https://destup.github.io/unciv-ironleague-ru/

## Что это

Статический сайт на GitHub Pages. Источник партий — `Games.json`; бот (**unciv-core-service**, админ-команды `/syncironleague`, `/addironleague`) открывает PR с новыми завершёнными играми.

Правила лиги и unlock-данные на вкладке **Техи и институты** берутся из **RekMOD-iron** (не из vanilla G&K).

## Разделы сайта

### Главная

Карточки-переходы на остальные разделы, краткие описания.

### Архив игр

Список завершённых партий из `Games.json`: фильтры (в т.ч. teams/scrap), карточки финала, победители, нации, чудеса/верования при наличии, ссылки на GIF в `Replays/`.

### Статистика

Сводные таблицы по игрокам и нациям (winrate, экономика, институты, чудеса, верования). Профиль игрока — его партии и агрегаты. Игры с тегами teams/scrap в рейтинг/агрегаты не входят (в архиве остаются).

### Техи и институты

Порядок открытия техов и политик по партии и игроку: полное древо (RekMOD-iron), эпохи как в Unciv, таймлайны, статистика «что открывали первым». Анлоки на узлах (здания/юниты/чудеса/ресурсы/улучшения/бонусы); UU/UB своей нации в основном ряду, остальные нации и UA-эффекты — в панели ★.

Данные вкладки:

- `data/tech_policy_timelines.json` — порядок открытий по играм (из бэкапов ходов)
- `data/paths_roster.json` — ники игроков (из `Games.json`)
- `data/tech_tree.json` / `tech_details.json` — древо и анлоки RekMOD-iron

Игры без бэкапов (сейчас 4–11, 14) в таймлайнах отсутствуют; в UI они не попадают в селектор. Статистика «что открывали первым» считается только по полным архивам (`status: ok`), не по `partial`.

### Рейтинг

Таблица рейтинга по архиву: Elo и/или очки лобби (настройки шкалы на вкладке). Считает клиентски из `Games.json`.

### Тирлист

Оценка силы наций мода из `data/tierlist.json` (лист лиги), сравнение с частотой побед в архиве.

### Рекорды

Клиентские «ачивки» / пики по архиву (без teams/scrap): серии, экономика, великие люди и т.п. — `js/achievements.js`.

### FAQ

Инструкции по клиенту, серверу, типичным ошибкам; RU и EN (`data/faq.json`, `data/faq_en.json`).

## Структура репозитория

| Путь | Назначение |
|------|------------|
| `index.html` | Разметка + bootstrap UI / cache-bust |
| `css/site.css` | Стили |
| `js/i18n.js` | RU/EN строки |
| `js/player-meta.js` | Ники/флаги/мета игрока (`IronLeaguePlayerMeta`) |
| `js/tech-policy-paths.js` | Вкладка техов/институтов (зависит от `player-meta.js`) |
| `js/rating.js` | Рейтинг |
| `js/achievements.js` | Рекорды |
| `js/stats-charts.js`, `gif-preview.js` | Статистика / GIF |
| `Games.json` | Архив игр (стабильный URL для бота) |
| `data/` | FAQ, тирлист, имена, древо/детали техов, таймлайны |
| `tools/export_tech_details.py` | Сборка `tech_details.json` / `tech_tree.json` из RekMOD-iron |
| `tools/unciv_tr.py` | Перевод уникалей в стиле цивилопедии Unciv (для экспорта) |
| `tools/export_default_capitals.py` | Сборка `default_capitals.json` из Nations.json + RU properties |
| `tools/extract_missing_unlock_icons.py` | Вырезание иконок из атласов Unciv/RekMOD |
| `Tech_icons/`, `Unit_icons/`, `Building_icons/`, `Wonder_icons/`, `Improvement_icons/`, `Resource_icons/`, `Policy_icons/`, `Nation_icons/`, `Unique_icons/` | Иконки |
| `Replays/` | GIF (`gif` в `Games.json`) |
| `bg/`, `faq_images/`, `img/` | Фоны и картинки FAQ |
| `build-id.txt` | Метка деплоя для cache-bust |
| `.github/workflows/bump-build-id.yml` | После пуша в `main` обновляет `build-id.txt` |

### Ключевые файлы `data/`

| Файл | Назначение |
|------|------------|
| `tech_tree.json` | Колонки/ряды/пререквизиты (RekMOD-iron) |
| `tech_details.json` | Анлоки, бонусы, `nation_unlocks`, цитаты |
| `tech_policy_timelines.json` | Порядок техов/политик по играм |
| `tech_names.json`, `policy_names.json`, `construction_names.json`, `nation_names.json` | RU/EN подписи |
| `default_capitals.json` | Столицы по умолчанию (EN/RU) для архива |
| `wonder_details.json` | Описания чудес (статы/unique) для подсказок |
| `paths_roster.json` | Ники игроков для путей |
| `faq.json` / `faq_en.json`, `tierlist.json`, `nation_colors.json` | FAQ, тирлист, цвета портретов |

### Конвенция JS-модулей

Клиентские скрипты — IIFE с явным `global` (как `window`):

```js
(function (global) {
  global.IronLeagueSomething = { … };
})(typeof window !== 'undefined' ? window : globalThis);
```

Нельзя обращаться к голому `global` внутри модуля без параметра IIFE: в браузере `global` не определён (в Node — да, поэтому баг легко пропустить локально). Порядок `<script>` в `index.html` важен: `player-meta.js` до `tech-policy-paths.js`.

## Обновление данных (мейнтейнеры)

### Техи / анлоки (RekMOD-iron)

Локально нужен клон **RekMOD-iron** (по умолчанию `D:\PythonProjects\RekMOD-iron`, иначе поправь путь в скрипте).

```powershell
cd D:\PythonProjects\unciv-ironleague-ru
py -3 tools\export_tech_details.py
# опционально, если не хватает PNG (Pillow + атласы Unciv/RekMOD):
py -3 tools\extract_missing_unlock_icons.py
```

Закоммить `data/tech_details.json`, `data/tech_tree.json` и новые иконки при необходимости.

### Таймлайны техов/институтов

Sidecar `data/tech_policy_timelines.json` пока собирается вручную из бэкапов game-server (скрипт ещё в монолите Civ_bot, не в sync-командах сайта):

```powershell
cd D:\PythonProjects\Civ_bot
py -3 scripts\extract_ironleague_timelines.py
# или точечно: py -3 scripts\extract_ironleague_timelines.py --game 29
```

Скрипт пишет в `unciv-ironleague-ru/data/tech_policy_timelines.json` (нужны `GAME_SERVER_*` в `.env`). PR на сайт — отдельно. После новых игр без обновления sidecar вкладка «Техи и институты» их не увидит, даже если `Games.json` уже обновлён.

Ники: при необходимости обновить `data/paths_roster.json` из `Games.json` (или руками).

### Архив игр

Новые партии обычно приходят PR от **unciv-core-service** (`Games.json`, иногда `Replays/`). Тирлист / FAQ правятся вручную в `data/`.

## Локальный просмотр

Нужен статический HTTP-сервер из корня (иначе `fetch` к JSON упрётся в `file://` / CORS):

```powershell
npx --yes serve -l 3000 .
# или: py -3 -m http.server 3000
```

Открой http://localhost:3000/ → вкладка **Техи и институты**: выбери игру — должны появиться чипы наций/игроков, затем древо.

## Кэш и пересборка Pages

1. Push / merge в `main` → GitHub Pages собирает сайт.
2. Workflow **Bump build id** пишет новый UTC timestamp в `build-id.txt`.
3. Страница читает `build-id.txt` и добавляет `?v=…` к `Games.json` и др., чтобы не залипала старая копия в браузере/CDN.

Если после merge в `main` билд не стартовал: в Actions вручную **Run workflow** у `Bump build id` (`workflow_dispatch`), либо минимальный push в `main`.

Скрипты/CSS также версионируются query-параметрами в `index.html` (`?v=…`) при смысловых правках UI.

## Синхронизация с ботом

Админ-команды **unciv-core-service** (категория Iron League / сайт):

- `/syncironleague` / `dry` — недостающие завершённые `gameN` → PR в этот репозиторий
- `/addironleague <uuid> [N]` — одна игра по Unciv `GAME_ID`
- `/ironleaguegifs` — записи без поля `gif`

Нужен `GITHUB_TOKEN` у сервиса с правом открывать PR в fork / `DeStup/unciv-ironleague-ru`.

Монолит `ICanSeeForever/Civ_bot` для новой логики не используется.
