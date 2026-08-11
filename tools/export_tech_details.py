#!/usr/bin/env python3
"""Export Iron League tech_details (+ tech_tree) from RekMOD-iron.

Зеркалит Unciv TechButton / TechnologyDescriptions.getTechEnabledIcons:
units, buildings/wonders, resources, improvements, improvement bonuses
(<after discovering>), building bonuses, tech uniques.
Nation-unique (uniqueTo) items go to nation_unlocks, not the common tray.

Export Iron League tech details from RekMOD-iron for the paths tab.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from unciv_tr import UncivTranslator, english_display_translator

REKMOD = Path(r"D:\PythonProjects\RekMOD-iron\jsons")
UNCIV_RU = Path(
    r"D:\PythonProjects\Unciv\android\assets\jsons\translations\Russian.properties"
)
OUT_DIR = Path(__file__).resolve().parents[1] / "data"

AFTER_DISCOVERING = re.compile(
    r"<after discovering \[([^\]]+)\]>", re.IGNORECASE
)
HIDDEN = re.compile(r"<hidden from users>", re.IGNORECASE)
AI_WEIGHT = re.compile(r"weight to this choice for AI", re.IGNORECASE)


def load_jsonc(path: Path):
    """Load Unciv-style JSON with // and /* */ comments and trailing commas."""
    raw = path.read_text(encoding="utf-8")
    # Strip block comments first (outside strings — good enough for these files).
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.DOTALL)
    out_lines = []
    for line in raw.splitlines():
        in_str = False
        esc = False
        cut = len(line)
        for i, ch in enumerate(line):
            if esc:
                esc = False
                continue
            if ch == "\\" and in_str:
                esc = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if not in_str and ch == "/" and i + 1 < len(line) and line[i + 1] == "/":
                cut = i
                break
        out_lines.append(line[:cut])
    text = "\n".join(out_lines)
    text = re.sub(r",\s*([}\]])", r"\1", text)
    return json.loads(text)


def is_hidden_construction(obj: dict) -> bool:
    texts = unique_texts(obj) if "uniques" in obj else []
    joined = " | ".join(texts)
    if "Will not be displayed in Civilopedia" in joined:
        return True
    if "Unbuildable" in joined and "Piety Complete Building" in joined:
        return True
    return False


def unique_texts(obj) -> list[str]:
    uniques = obj.get("uniques") or []
    out = []
    for u in uniques:
        if isinstance(u, dict):
            text = u.get("text") or ""
        else:
            text = str(u)
        if not text or HIDDEN.search(text) or AI_WEIGHT.search(text):
            continue
        out.append(text)
    return out


STAT_FIELDS = (
    ("production", "Production"),
    ("food", "Food"),
    ("gold", "Gold"),
    ("science", "Science"),
    ("culture", "Culture"),
    ("happiness", "Happiness"),
    ("faith", "Faith"),
)


def is_wonder(building: dict) -> bool:
    return bool(building.get("isWonder") or building.get("isNationalWonder"))


def format_base_stats(obj: dict) -> str | None:
    """Unciv Stats.toString form from JSON fields (+2 Food, +1 Faith, …).

    Форма Stats.toString Unciv из полей JSON (+2 Food, +1 Faith, …).
    """
    parts: list[str] = []
    for field, label in STAT_FIELDS:
        raw = obj.get(field)
        if raw is None:
            continue
        try:
            val = float(raw)
        except (TypeError, ValueError):
            continue
        if val == 0:
            continue
        num = int(val) if val == int(val) else val
        sign = "+" if num > 0 else ""
        parts.append(f"{sign}{num} {label}")
    return ", ".join(parts) if parts else None


def construction_meta_lines(obj: dict, tr: UncivTranslator) -> list[str]:
    """Civilopedia short-description lines (stats / % / city / resource req).

    Короткие строки цивилопедии (статы / % / город / ресурсы рядом).
    """
    lines: list[str] = []
    base = format_base_stats(obj)
    if base:
        lines.append(tr.tr(base))

    percent = obj.get("percentStatBonus") or {}
    if isinstance(percent, dict):
        for field, label in STAT_FIELDS:
            raw = percent.get(field)
            if raw is None:
                continue
            try:
                val = int(float(raw))
            except (TypeError, ValueError):
                continue
            if val == 0:
                continue
            sign = "+" if val > 0 else ""
            lines.append(f"{sign}{val}% {tr.tr(label)}")

    nearby = obj.get("requiredNearbyImprovedResources")
    if nearby:
        # Keep English names inside [] so Unciv placeholder tr fills them.
        joined = "/".join(str(x) for x in nearby)
        lines.append(tr.tr(f"Requires improved [{joined}] near city"))

    strength = obj.get("cityStrength")
    if strength:
        lines.append(tr.tr(f"{{City strength}} +{strength}"))

    health = obj.get("cityHealth")
    if health:
        lines.append(tr.tr(f"{{City health}} +{health}"))

    return lines


def unlock_entry(kind: str, obj: dict, **extra) -> dict:
    entry = {"kind": kind, "name": obj["name"], "uniques": unique_texts(obj)}
    if obj.get("uniqueTo"):
        entry["uniqueTo"] = obj["uniqueTo"]
    if obj.get("quote"):
        entry["quote"] = obj["quote"]
    if kind == "wonder" or (kind == "building" and is_wonder(obj)):
        entry["kind"] = "wonder"
    # Raw English stats for debugging / EN fallback before tr.
    stats = format_base_stats(obj)
    if stats:
        entry["stats"] = stats
    if obj.get("percentStatBonus"):
        entry["percentStatBonus"] = obj["percentStatBonus"]
    if obj.get("requiredNearbyImprovedResources"):
        entry["requiredNearbyImprovedResources"] = list(
            obj["requiredNearbyImprovedResources"]
        )
    if obj.get("cityStrength"):
        entry["cityStrength"] = obj["cityStrength"]
    if obj.get("cityHealth"):
        entry["cityHealth"] = obj["cityHealth"]
    entry.update(extra)
    return entry


def apply_unique_translations(
    entry: dict,
    tr_ru: UncivTranslator,
    tr_en: UncivTranslator,
    source_obj: dict | None = None,
) -> None:
    """Fill uniques_* and short_lines_* (Civilopedia-style) for an unlock.

    Заполняет uniques_* и short_lines_* (стиль цивилопедии) для анлока.
    """
    raw = entry.get("uniques") or []
    if raw:
        entry["uniques_en"] = tr_en.tr_unique_list(raw)
        entry["uniques_ru"] = tr_ru.tr_unique_list(raw)
    else:
        entry.pop("uniques_en", None)
        entry.pop("uniques_ru", None)

    if entry.get("kind") in ("building", "wonder", "improvement"):
        meta_src = source_obj if isinstance(source_obj, dict) else entry
        en_lines = construction_meta_lines(meta_src, tr_en)
        ru_lines = construction_meta_lines(meta_src, tr_ru)
        if en_lines:
            entry["short_lines_en"] = en_lines
        else:
            entry.pop("short_lines_en", None)
        if ru_lines:
            entry["short_lines_ru"] = ru_lines
        else:
            entry.pop("short_lines_ru", None)
    else:
        entry.pop("short_lines_en", None)
        entry.pop("short_lines_ru", None)


def main() -> None:
    tr_ru = UncivTranslator.from_files(
        UNCIV_RU,
        REKMOD / "translations" / "Russian.properties",
    )
    tr_en = english_display_translator()
    techs_raw = load_jsonc(REKMOD / "Techs.json")
    units = load_jsonc(REKMOD / "Units.json")
    buildings = load_jsonc(REKMOD / "Buildings.json")
    improvements = load_jsonc(REKMOD / "TileImprovements.json")
    resources = load_jsonc(REKMOD / "TileResources.json")
    nations = load_jsonc(REKMOD / "Nations.json")

    # Preserve hand-tuned quote_ru from previous export when names match.
    old_path = OUT_DIR / "tech_details.json"
    old = {}
    if old_path.exists():
        old = json.loads(old_path.read_text(encoding="utf-8")).get("techs") or {}

    techs: dict[str, dict] = {}
    tree_techs: list[dict] = []

    for column in techs_raw:
        col_num = column["columnNumber"]
        era = column["era"]
        for tech in column.get("techs") or []:
            name = tech["name"]
            entry = {
                "era": era,
                "column": col_num,
                "row": tech.get("row", 0),
                "prerequisites": list(tech.get("prerequisites") or []),
                "quote": tech.get("quote") or "",
                "unlocks": [],
                "nation_unlocks": [],
                "uniques": [
                    u
                    for u in (tech.get("uniques") or [])
                    if isinstance(u, str)
                    and not AI_WEIGHT.search(u)
                    and not HIDDEN.search(u)
                ],
            }
            prev = old.get(name) or {}
            if prev.get("quote_ru"):
                entry["quote_ru"] = prev["quote_ru"]
            techs[name] = entry
            tree_techs.append(
                {
                    "name": name,
                    "era": era,
                    "column": col_num,
                    "row": tech.get("row", 0),
                    "prerequisites": list(tech.get("prerequisites") or []),
                }
            )

    def add_unlock(tech_name: str, entry: dict, source_obj: dict | None = None) -> None:
        tech = techs.get(tech_name)
        if not tech:
            return
        bucket = "nation_unlocks" if entry.get("uniqueTo") else "unlocks"
        # de-dupe by kind+name+uniqueTo
        key = (entry["kind"], entry["name"], entry.get("uniqueTo") or "")
        existing = {(u["kind"], u["name"], u.get("uniqueTo") or "") for u in tech[bucket]}
        if key in existing:
            return
        # Carry hand-tuned quote_ru only; uniques_* are regenerated via Unciv tr.
        prev_list = (old.get(tech_name) or {}).get("unlocks") or []
        for prev in prev_list:
            if prev.get("name") == entry["name"] and prev.get("kind") in (
                entry["kind"],
                "building",
                "wonder",
            ):
                if prev.get("quote_ru") and not entry.get("quote_ru"):
                    entry["quote_ru"] = prev["quote_ru"]
                break
        apply_unique_translations(entry, tr_ru, tr_en, source_obj=source_obj)
        tech[bucket].append(entry)

    # Units / buildings by requiredTech
    for unit in units:
        tech_name = unit.get("requiredTech")
        if not tech_name or is_hidden_construction(unit):
            continue
        add_unlock(tech_name, unlock_entry("unit", unit), unit)

    for building in buildings:
        tech_name = building.get("requiredTech")
        if not tech_name or is_hidden_construction(building):
            continue
        kind = "wonder" if is_wonder(building) else "building"
        add_unlock(tech_name, unlock_entry(kind, building), building)

    # Improvements by techRequired
    for imp in improvements:
        tech_name = imp.get("techRequired")
        if not tech_name:
            continue
        # Skip Remove X / repair helpers from tray noise if excluded
        name = imp.get("name") or ""
        if name.startswith("Remove ") or name.startswith("Repair "):
            continue
        if "Excluded from map editor" in unique_texts(imp) and name.startswith("Remove"):
            continue
        add_unlock(tech_name, unlock_entry("improvement", imp), imp)

    # Resources revealedBy
    for res in resources:
        tech_name = res.get("revealedBy")
        if not tech_name:
            continue
        add_unlock(
            tech_name,
            {
                "kind": "resource",
                "name": res["name"],
                "uniques": unique_texts(res),
            },
        )

    # Improvement / building bonuses gated by <after discovering [Tech]>
    # (Unciv TechButton second improvement loop / see-also buildings)
    for imp in improvements:
        texts = unique_texts(imp)
        by_tech: dict[str, list[str]] = defaultdict(list)
        for text in texts:
            for m in AFTER_DISCOVERING.finditer(text):
                by_tech[m.group(1)].append(text)
        for tech_name, gated in by_tech.items():
            entry = {
                "kind": "improvement_bonus",
                "name": imp["name"],
                "uniques": gated,
            }
            if imp.get("uniqueTo"):
                entry["uniqueTo"] = imp["uniqueTo"]
            add_unlock(tech_name, entry)

    for building in buildings:
        texts = unique_texts(building)
        by_tech: dict[str, list[str]] = defaultdict(list)
        for text in texts:
            for m in AFTER_DISCOVERING.finditer(text):
                by_tech[m.group(1)].append(text)
        for tech_name, gated in by_tech.items():
            entry = {
                "kind": "building_bonus",
                "name": building["name"],
                "uniques": gated,
            }
            if building.get("uniqueTo"):
                entry["uniqueTo"] = building["uniqueTo"]
            if is_wonder(building):
                entry["is_wonder"] = True
            add_unlock(tech_name, entry)

    # Nation UA / civ effects gated by <after discovering [Tech]> (RekMOD-heavy).
    # These are not requiredTech unlocks; Unciv civilopedia "see also" / league archive.
    for nation in nations:
        nation_name = nation.get("name")
        if not nation_name or nation.get("isCityState"):
            continue
        texts = unique_texts(nation)
        by_tech: dict[str, list[str]] = defaultdict(list)
        for text in texts:
            for m in AFTER_DISCOVERING.finditer(text):
                by_tech[m.group(1)].append(text)
        for tech_name, gated in by_tech.items():
            add_unlock(
                tech_name,
                {
                    "kind": "nation_effect",
                    "name": nation_name,
                    "uniqueTo": nation_name,
                    "uniques": gated,
                },
            )

    # Stable sort unlocks like Unciv: unit, building, wonder, resource, improvement, bonuses
    order = {
        "unit": 0,
        "building": 1,
        "wonder": 2,
        "resource": 3,
        "improvement": 4,
        "improvement_bonus": 5,
        "building_bonus": 6,
        "nation_effect": 7,
    }

    def sort_key(u: dict):
        return (order.get(u["kind"], 9), u["name"], u.get("uniqueTo") or "")

    for tech in techs.values():
        tech["unlocks"].sort(key=sort_key)
        tech["nation_unlocks"].sort(key=sort_key)
        raw_tech_uniques = tech.get("uniques") or []
        if raw_tech_uniques:
            tech["uniques_en"] = tr_en.tr_unique_list(raw_tech_uniques)
            tech["uniques_ru"] = tr_ru.tr_unique_list(raw_tech_uniques)
        else:
            tech.pop("uniques", None)
        if not tech.get("quote"):
            tech.pop("quote", None)

    details = {
        "source": "RekMOD-iron",
        "techs": techs,
    }
    tree = {"source": "RekMOD-iron", "techs": tree_techs}

    # Flat wonder catalog for archive / stats / profile tooltips (same text as tech tree).
    wonders_out: dict[str, dict] = {}
    for tech in techs.values():
        for bucket in ("unlocks", "nation_unlocks"):
            for u in tech.get(bucket) or []:
                if u.get("kind") != "wonder" and not u.get("is_wonder"):
                    continue
                name = u.get("name")
                if not name or name in wonders_out:
                    continue
                slim = {
                    "kind": "wonder",
                    "name": name,
                }
                for key in (
                    "uniques",
                    "uniques_en",
                    "uniques_ru",
                    "short_lines_en",
                    "short_lines_ru",
                    "quote",
                    "quote_ru",
                    "uniqueTo",
                    "stats",
                ):
                    if u.get(key):
                        slim[key] = u[key]
                wonders_out[name] = slim

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "tech_details.json").write_text(
        json.dumps(details, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "tech_tree.json").write_text(
        json.dumps(tree, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    (OUT_DIR / "wonder_details.json").write_text(
        json.dumps(
            {"source": "RekMOD-iron", "wonders": wonders_out},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    rr = techs.get("Railroads") or {}
    print("Railroads unlocks:", [u["name"] for u in rr.get("unlocks", [])])
    print("Railroads nation:", [u["name"] for u in rr.get("nation_unlocks", [])])
    print("Railroads uniques:", rr.get("uniques"))
    chem = techs.get("Chemistry") or {}
    print(
        "Chemistry nation:",
        [(u["kind"], u["name"], (u.get("uniques") or [""])[0][:60]) for u in chem.get("nation_unlocks", [])],
    )
    print(
        "totals:",
        len(techs),
        "common",
        sum(len(t["unlocks"]) for t in techs.values()),
        "nation",
        sum(len(t["nation_unlocks"]) for t in techs.values()),
        "nation_effects",
        sum(
            1
            for t in techs.values()
            for u in t.get("nation_unlocks") or []
            if u.get("kind") == "nation_effect"
        ),
        "wonders",
        len(wonders_out),
    )


if __name__ == "__main__":
    main()
