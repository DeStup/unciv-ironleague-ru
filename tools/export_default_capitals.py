#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Export default nation capitals (EN + RU) for the Iron League archive UI.

Экспорт столиц по умолчанию (EN + RU) для архива Iron League.

Reads RekMOD-iron Nations.json (first city = capital) and merges Unciv +
RekMOD Russian.properties. Writes data/default_capitals.json.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
REK = Path(r"D:\PythonProjects\RekMOD-iron")
UNCIV = Path(r"D:\PythonProjects\Unciv")

# Manual RU when missing from properties (mod/vanilla gaps).
MANUAL_CITY_RU = {
    "Sucre": "Сукре",
}


def load_jsonc(path: Path):
    """Load JSON allowing // and /* */ comments.

    Загрузка JSON с комментариями // и /* */.
    """
    raw = path.read_text(encoding="utf-8")
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    out = []
    for line in raw.splitlines():
        in_s = False
        esc = False
        cut = len(line)
        for i, ch in enumerate(line):
            if esc:
                esc = False
                continue
            if ch == "\\" and in_s:
                esc = True
                continue
            if ch == '"':
                in_s = not in_s
                continue
            if not in_s and ch == "/" and i + 1 < len(line) and line[i + 1] == "/":
                cut = i
                break
        out.append(line[:cut])
    return json.loads(re.sub(r",\s*([}\]])", r"\1", "\n".join(out)))


def load_props(path: Path) -> dict[str, str]:
    """Parse Unciv-style key = value properties.

    Разбор properties в стиле Unciv (key = value).
    """
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or " = " not in line:
            continue
        key, val = line.split(" = ", 1)
        out[key] = val
    return out


def main() -> None:
    """Build data/default_capitals.json from RekMOD-iron + translations.

    Собирает data/default_capitals.json из RekMOD-iron и переводов.
    """
    nations_path = REK / "jsons" / "Nations.json"
    nations = load_jsonc(nations_path)
    unciv_ru = load_props(
        UNCIV / "android" / "assets" / "jsons" / "translations" / "Russian.properties"
    )
    rek_ru = load_props(REK / "jsons" / "translations" / "Russian.properties")
    city_ru = {**unciv_ru, **rek_ru, **MANUAL_CITY_RU}

    result: dict[str, dict[str, str]] = {}
    missing: list[tuple[str, str]] = []
    for nation in nations:
        name = nation.get("name")
        if not name or nation.get("cityStateType"):
            continue
        cities = nation.get("cities") or []
        if not cities:
            continue
        capital = cities[0]
        ru = city_ru.get(capital)
        if not ru:
            missing.append((name, capital))
            ru = capital
        result[name] = {"en": capital, "ru": ru}

    out_path = SITE / "data" / "default_capitals.json"
    out_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {out_path} ({len(result)} nations)")
    if missing:
        print(f"Missing RU ({len(missing)}):")
        for nation, capital in missing:
            print(f"  {nation}: {capital}")


if __name__ == "__main__":
    main()
