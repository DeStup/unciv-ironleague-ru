#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Unciv-like unique string translator (Civilopedia style).

Порт String.tr() из Unciv Translations.kt для подсказок сайта:
плейсхолдеры [], условные <> , Stats вроде [+1 Food].
"""

from __future__ import annotations

import re
from pathlib import Path

POINTY = re.compile(r"<([^>]*)>")
CURLY = re.compile(r"\{([^}]*)\}")
STAT_NAMES = ("Production", "Food", "Gold", "Science", "Culture", "Happiness", "Faith")
STAT_RE = re.compile(
    r"^([+-]\d+) (" + "|".join(STAT_NAMES) + r")(?:, ([+-]\d+) (" + "|".join(STAT_NAMES) + r"))*$"
)
SINGLE_STAT_RE = re.compile(r"([+-])(\d+) (" + "|".join(STAT_NAMES) + r")")


def load_props(path: Path) -> dict[str, str]:
    """Parse Unciv key = value properties (comments / blanks skipped).

    Разбор Unciv properties (комментарии и пустые строки пропускаются).
    """
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#") or " = " not in raw:
            continue
        key, val = raw.split(" = ", 1)
        # Strip surrounding quotes used for space-equivalent etc.
        if len(val) >= 2 and val[0] == '"' and val[-1] == '"':
            val = val[1:-1]
        out[key] = val
    return out


def get_placeholder_parameters(text: str) -> list[str]:
    """Outer [] parameters, ignoring nested depth (Unciv getPlaceholderParameters).

    Внешние параметры в [], с учётом вложенности (как в Unciv).
    """
    base = remove_conditionals(text)
    if "[" not in base:
        return []
    params: list[str] = []
    depth = 0
    start = -1
    for i, ch in enumerate(base):
        if ch == "[":
            if depth == 0:
                start = i + 1
            depth += 1
        elif ch == "]" and depth > 0:
            depth -= 1
            if depth == 0:
                params.append(base[start:i])
    return params


def get_placeholder_text(text: str) -> str:
    """Collapse [param] → [] after stripping conditionals.

    Схлопывает [param] → [] после снятия условных.
    """
    s = remove_conditionals(text)
    for param in get_placeholder_parameters(s):
        s = s.replace(f"[{param}]", "[]", 1)
    return s


def remove_conditionals(text: str) -> str:
    """Strip <conditional> blocks (Unciv removeConditionals).

    Убирает блоки <условных> (как Unciv removeConditionals).
    """
    if "<" not in text:
        return text
    s = POINTY.sub("", text)
    while "  " in s:
        s = s.replace("  ", " ")
    return s.strip()


def is_stats(text: str) -> bool:
    """True if text is Unciv Stats.toString form (+1 Food, -2 Gold, …).

    True, если строка в форме Stats Unciv (+1 Food, -2 Gold, …).
    """
    if not text or text[0] not in "+-":
        return False
    return bool(STAT_RE.fullmatch(text))


class UncivTranslator:
    """Translate Unciv unique / construction strings like Civilopedia.

    Перевод уникалей/строк Unciv в стиле цивилопедии.
    """

    def __init__(self, props: dict[str, str], *, language: str = "Russian") -> None:
        self.language = language
        self.conditionals_after = True
        self.should_capitalize = language != "English"
        self.space = " "
        self._exact: dict[str, str] = {}
        self._by_placeholder: dict[str, tuple[str, str]] = {}
        # Meta keys from properties header
        if props.get("ConditionalsPlacement", "").strip().lower() == "before":
            self.conditionals_after = False
        if props.get("StartWithCapitalLetter", "true").strip().lower() == "false":
            self.should_capitalize = False
        space_val = props.get('" "', props.get(" ", " "))
        if space_val is not None:
            self.space = space_val

        for key, val in props.items():
            if key in (
                '" "',
                " ",
                "StartWithCapitalLetter",
                "EffectBeforeCause",
                "ConditionalsPlacement",
                "ConditionalsOrder",
            ) or key.startswith("diacritics") or key.startswith("unicode_") or key.startswith(
                "left_"
            ) or key.startswith("right_") or key.startswith("Fastlane"):
                continue
            if "[" in key and "<" not in key:
                ph = get_placeholder_text(key)
                # First wins — Unciv keeps first TranslationEntry
                if ph not in self._by_placeholder:
                    self._by_placeholder[ph] = (key, val)
            else:
                self._exact[key] = val

    @classmethod
    def from_files(cls, *paths: Path, language: str = "Russian") -> "UncivTranslator":
        """Merge properties files (later paths override) into a translator.

        Объединяет properties (поздние файлы перекрывают) в переводчик.
        """
        merged: dict[str, str] = {}
        for path in paths:
            merged.update(load_props(path))
        return cls(merged, language=language)

    def tr(self, text: str) -> str:
        """Translate one string (Unciv String.tr without icons).

        Перевод одной строки (Unciv String.tr без иконок).
        """
        if text is None:
            return ""
        text = str(text)
        if not text:
            return text

        if "<" in text and ">" in text and POINTY.search(text):
            return self._translate_conditionals(text)

        idx_sq = text.find("[")
        idx_cu = text.find("{")
        square_first = idx_sq >= 0 and not (0 <= idx_cu <= idx_sq)
        curly_first = idx_cu >= 0 and not (0 <= idx_sq <= idx_cu)

        if square_first:
            return self._translate_placeholders(text)
        if curly_first:
            return CURLY.sub(lambda m: self.tr(m.group(1)), text)
        return self._translate_word(text)

    def tr_unique_list(self, uniques: list[str]) -> list[str]:
        """Translate a list of unique strings.

        Перевод списка уникалей.
        """
        return [self.tr(u) for u in uniques]

    def _translate_conditionals(self, text: str) -> str:
        conditionals = [m.group(1) for m in POINTY.finditer(text)]
        translated_conds = [self.tr(c) for c in conditionals]
        base = self.tr(remove_conditionals(text))
        parts: list[str] = []
        if self.conditionals_after:
            parts.append(base)
            parts.extend(translated_conds)
        else:
            parts.extend(translated_conds)
            if self.should_capitalize and base:
                parts.append(base[:1].lower() + base[1:])
            else:
                parts.append(base)
        joined = self.space.join(p for p in parts if p)
        if self.should_capitalize and joined:
            joined = joined[:1].upper() + joined[1:]
        return joined

    def _translate_placeholders(self, text: str) -> str:
        ph = get_placeholder_text(text)
        entry = self._by_placeholder.get(ph)
        terms_msg = get_placeholder_parameters(text)
        if entry is None:
            language_specific = text
            terms_placeholder = terms_msg
        else:
            original_key, language_specific = entry
            terms_placeholder = get_placeholder_parameters(original_key)
            if len(terms_msg) != len(terms_placeholder):
                # Mismatch — fall back to English structure
                language_specific = text
                terms_placeholder = terms_msg

        for i, term in enumerate(terms_msg):
            needle = f"[{terms_placeholder[i]}]"
            language_specific = language_specific.replace(needle, self.tr(term), 1)
        return language_specific

    def _translate_word(self, text: str) -> str:
        if is_stats(text):
            return self._format_stats(text)
        hit = self._exact.get(text)
        if hit is not None:
            return hit
        # Digits-only passthrough / simple numbers
        return text

    def _format_stats(self, text: str) -> str:
        parts = []
        for m in SINGLE_STAT_RE.finditer(text):
            sign, num, stat = m.group(1), m.group(2), m.group(3)
            parts.append(f"{sign}{num} {self.tr(stat)}")
        return ", ".join(parts) if parts else text


def english_display_translator() -> UncivTranslator:
    """Translator with no props — still formats Stats and strips <> for EN UI.

    Переводчик без словаря: всё равно форматирует Stats и снимает <> для EN.
    """
    return UncivTranslator({}, language="English")
