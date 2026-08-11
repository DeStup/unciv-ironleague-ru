# unciv-ironleague-ru

Iron League (Unciv) — архив, статистика, рейтинг и пути техов/институтов.

Сайт: https://destup.github.io/unciv-ironleague-ru/

## Что это

Статический сайт на GitHub Pages. Источник партий — `Games.json`; бот **Civ Bot** открывает PR с новыми завершёнными играми (`/syncironleague`, `/addironleague`).

Правила лиги и unlock-данные на вкладке **Техи и институты** берутся из **RekMOD-iron** (не из vanilla G&K).

## Разделы сайта

| Раздел | Содержание |
|--------|------------|
| Архив игр | Список партий, фильтры, карточки, реплеи GIF |
| Статистика / профиль | Winrate, экономика, институты, нации |
| Техи и институты | Древо техов игрока, таймлайны, «что открывали первым» |
| Рейтинг | Elo / очки лобби |
| Рекорды | Ачивки из `Games.json` (без teams/scrap) |
| FAQ | RU/EN |

### Вкладка «Техи и институты»

- Полное древо по **RekMOD-iron**: узлы, связи, эпохи (полосы как в Unciv TechPicker).
- Иконки анлоков: юниты, здания, чудеса, ресурсы, улучшения, бонусы `<after discovering>`, пассивы теха.
- UU/UB выбранной нации — в основном ряду (как TechButton); остальные нации — панель **★**.
- Эффекты UA наций с `<after discovering [Tech]>` — в ★ как `nation_effect`.
- Переводы эпох как в Unciv (`Древнейший мир`, `Античность`, …).

## Структура репозитория

| Путь | Назначение |
|------|------------|
| `index.html` | Разметка + bootstrap UI / cache-bust |
| `css/site.css` | Стили |
| `js/i18n.js` | RU/EN строки |
| `js/tech-policy-paths.js` | Вкладка техов/институтов |
| `js/rating.js` | Рейтинг |
| `js/achievements.js` | Рекорды |
| `js/stats-charts.js`, `player-meta.js`, `gif-preview.js` | Статистика / мета / GIF |
| `Games.json` | Архив игр (стабильный URL для бота) |
| `data/` | FAQ, тирлист, имена, древо/детали техов, таймлайны |
| `tools/export_tech_details.py` | Сборка `tech_details.json` / `tech_tree.json` из RekMOD-iron |
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
| `paths_roster.json` | Ники игроков для путей |
| `faq.json` / `faq_en.json`, `tierlist.json`, `nation_colors.json` | FAQ, тирлист, цвета портретов |

## Обновление данных техов (RekMOD)

Локально нужен клон **RekMOD-iron** по пути `D:\PythonProjects\RekMOD-iron` (или поправь путь в скрипте).

```powershell
cd D:\PythonProjects\unciv-ironleague-ru
py -3 tools\export_tech_details.py
# при нехватке PNG анлоков (опционально, нужен Pillow + атласы Unciv/RekMOD):
py -3 tools\extract_missing_unlock_icons.py
```

После экспорта закоммить `data/tech_details.json`, `data/tech_tree.json` и новые иконки при необходимости.

## Локальный просмотр

Нужен статический HTTP-сервер из корня (иначе `fetch` к JSON упрётся в `file://` / CORS):

```powershell
npx --yes serve -l 3000 .
# или: py -3 -m http.server 3000
```

Открой http://localhost:3000/

## Кэш и пересборка Pages

1. Push / merge в `main` → GitHub Pages собирает сайт.
2. Workflow **Bump build id** пишет новый UTC timestamp в `build-id.txt`.
3. Страница читает `build-id.txt` и добавляет `?v=…` к `Games.json` и др., чтобы не залипала старая копия в браузере/CDN.

Если после merge в `main` билд не стартовал: в Actions вручную **Run workflow** у `Bump build id` (`workflow_dispatch`), либо минимальный push в `main`.

Скрипты/CSS также версионируются query-параметрами в `index.html` (`?v=…`) при смысловых правках UI.

## Синхронизация с ботом

Админ-команды Civ Bot (категория «Сайт IronLeague» в `/admin`):

- `/syncironleague` / `dry` — недостающие завершённые `gameN` → PR в этот репозиторий
- `/addironleague <uuid> [N]` — одна игра по Unciv `GAME_ID`
- `/ironleaguegifs` — записи без поля `gif`

Нужен `GITHUB_TOKEN` у бота с правом открывать PR в fork / `DeStup/unciv-ironleague-ru`.

## PR

Для этого репозитория: **русский** title / Summary / Test plan (см. правила Civ Bot / Iron League).
PRs в upstream Unciv и ravignir/RekMOD — только на английском.
