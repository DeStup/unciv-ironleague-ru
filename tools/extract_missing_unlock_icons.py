#!/usr/bin/env python3
"""Extract missing path-tab unlock icons from RekMOD / Unciv atlases."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image

SITE = Path(__file__).resolve().parents[1]
REKMOD = Path(r"D:\PythonProjects\RekMOD-iron")
UNCIV_ASSETS = Path(r"D:\PythonProjects\Unciv\android\assets")

KIND_DIR = {
    "unit": "Unit_icons",
    "building": "Building_icons",
    "wonder": "Wonder_icons",
    "improvement": "Improvement_icons",
    "improvement_bonus": "Improvement_icons",
    "building_bonus": "Building_icons",
    "resource": "Resource_icons",
}


def parse_atlas(atlas_path: Path) -> dict[str, tuple[Path, int, int, int, int]]:
    """name -> (png_path, x, y, w, h). LibGDX atlas xy is top-left (Pillow)."""
    text = atlas_path.read_text(encoding="utf-8")
    pages: dict[str, tuple[Path, int, int, int, int]] = {}
    current_png: Path | None = None
    name: str | None = None
    xy = size = None
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line:
            continue
        if not line.startswith(" ") and line.endswith(".png"):
            current_png = atlas_path.parent / line.strip()
            name = None
            continue
        if line.startswith("size:") and current_png is not None:
            # page size — ignore for crop (xy already top-left)
            continue
        if not line.startswith(" ") and ":" not in line:
            name = line.strip()
            xy = size = None
            continue
        if name is None or current_png is None:
            continue
        if line.strip().startswith("xy:"):
            m = re.search(r"xy:\s*(\d+)\s*,\s*(\d+)", line)
            if m:
                xy = (int(m.group(1)), int(m.group(2)))
        elif line.strip().startswith("size:"):
            m = re.search(r"size:\s*(\d+)\s*,\s*(\d+)", line)
            if m:
                size = (int(m.group(1)), int(m.group(2)))
        if xy and size and name not in pages:
            x, y = xy
            w, h = size
            pages[name] = (current_png, x, y, w, h)
            name = None
            xy = size = None
    return pages


def load_all_atlases() -> dict[str, tuple[Path, int, int, int, int]]:
    regions: dict[str, tuple[Path, int, int, int, int]] = {}
    for atlas in sorted(REKMOD.glob("*.atlas")):
        regions.update(parse_atlas(atlas))
    for atlas_name in ("ConstructionIcons.atlas", "Icons.atlas"):
        p = UNCIV_ASSETS / atlas_name
        if p.exists():
            # don't overwrite RekMOD-specific art
            for k, v in parse_atlas(p).items():
                regions.setdefault(k, v)
    return regions


def candidates_for(name: str, kind: str) -> list[str]:
    out = []
    if kind == "unit":
        out += [f"UnitIcons/{name}", f"BuildingIcons/{name}"]
    elif kind in ("building", "building_bonus"):
        out += [f"BuildingIcons/{name}", f"WonderIcons/{name}"]
    elif kind == "wonder":
        out += [f"WonderIcons/{name}", f"BuildingIcons/{name}"]
    elif kind.startswith("improvement"):
        out += [f"ImprovementIcons/{name}", f"BuildingIcons/{name}"]
    elif kind == "resource":
        out += [f"ResourceIcons/{name}", f"StatIcons/{name}"]
    else:
        out += [f"BuildingIcons/{name}", f"UnitIcons/{name}"]
    return out


def main() -> None:
    details = json.loads((SITE / "data" / "tech_details.json").read_text(encoding="utf-8"))
    regions = load_all_atlases()
    print("atlas regions", len(regions))

    png_cache: dict[Path, Image.Image] = {}
    wrote = 0
    missing = 0
    skipped_ok = 0
    for tech in details["techs"].values():
        for item in (tech.get("unlocks") or []) + (tech.get("nation_unlocks") or []):
            kind = item.get("kind") or "building"
            if kind == "unique":
                continue
            name = item["name"]
            folder = KIND_DIR.get(kind, "Building_icons")
            targets = [SITE / folder / f"{name}.png"]
            if kind == "wonder":
                targets.append(SITE / "Building_icons" / f"{name}.png")
            if kind == "building_bonus" and item.get("is_wonder"):
                targets.append(SITE / "Wonder_icons" / f"{name}.png")

            region = None
            for key in candidates_for(name, kind):
                if key in regions:
                    region = regions[key]
                    break
            if region is None:
                if not targets[0].exists():
                    missing += 1
                else:
                    skipped_ok += 1
                continue

            png_path, x, y, w, h = region
            if png_path not in png_cache:
                png_cache[png_path] = Image.open(png_path).convert("RGBA")
            crop = png_cache[png_path].crop((x, y, x + w, y + h))
            # Skip near-empty crops (bad region / wrong page).
            opaque = sum(1 for px in crop.getdata() if px[3] > 10)
            if opaque < 50:
                missing += 1
                print("empty crop", name, "from", png_path.name, opaque)
                continue

            for dest in targets:
                if dest.exists():
                    try:
                        existing = Image.open(dest).convert("RGBA")
                        existing_opaque = sum(1 for px in existing.getdata() if px[3] > 10)
                    except Exception:
                        existing_opaque = 0
                    if existing_opaque >= 50:
                        skipped_ok += 1
                        continue
                dest.parent.mkdir(parents=True, exist_ok=True)
                crop.save(dest, optimize=True)
                wrote += 1
                print("wrote", dest.relative_to(SITE), "from", png_path.name, "opaque", opaque)

    print("wrote", wrote, "still missing", missing, "already-ok-no-region", skipped_ok)


if __name__ == "__main__":
    main()
