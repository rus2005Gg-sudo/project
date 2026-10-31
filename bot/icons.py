"""Кастомные эмодзи из пака https://t.me/addemoji/AdaptivePixelEmoji.

Обычные эмодзи в боте больше не используются. Каждое место, где раньше стоял
эмодзи, ссылается на «смысл» (key, refresh, pc, ...). При запуске бот загружает
пак через getStickerSet и для каждого смысла подбирает кастомный эмодзи, у
которого привязанный обычный эмодзи совпадает с одним из кандидатов.

Если автоподбор выбрал не тот значок, его можно задать вручную через
переменную окружения EMOJI_OVERRIDES (JSON: {"key": "<custom_emoji_id>", ...}).
Список всех значков пака с их ID выводит админ-команда /emoji.

Чтобы Telegram показывал кастомные эмодзи от бота, у владельца бота должен быть
Telegram Premium (или у бота должен быть купленный username на Fragment).
Иначе вместо них будут показаны обычные эмодзи-заглушки.
"""
import json
import logging
import os
from html import escape

from aiogram import Bot
from aiogram.types import Sticker

EMOJI_PACK = os.getenv("EMOJI_PACK", "AdaptivePixelEmoji")

# смысл -> кандидаты (обычные эмодзи) в порядке предпочтения.
# Первый кандидат также служит заглушкой внутри <tg-emoji>.
MEANINGS: dict[str, list[str]] = {
    "key":      ["🔑", "🗝", "🔐", "🔒"],
    "refresh":  ["♻️", "🔄", "🔁", "🔃"],
    "pc":       ["💻", "🖥", "⌨️", "🖱"],
    "unlink":   ["🔓", "✂️", "❌", "🗑"],
    "channel":  ["📢", "📣", "🔔", "💬"],
    "ok":       ["✅", "✔️", "☑️", "👍"],
    "ban":      ["⛔️", "🚫", "❌", "🛑"],
    "hello":    ["👋", "🤖", "😊", "🙂"],
    "gift":     ["🎁", "🆓", "💎", "⭐️"],
    "warning":  ["⚠️", "❗️", "‼️", "🔔"],
    "download": ["⬇️", "📥", "💾", "📦"],
    "info":     ["ℹ️", "📝", "📄", "💡"],
    "lock":     ["🔒", "🔐", "🛡", "🔑"],
    "stats":    ["📊", "📈", "📉", "🧮"],
    "users":    ["👥", "👤", "🧑", "🙂"],
    "devices":  ["🖥", "💻", "📱", "🖱"],
    "time":     ["⏱", "⏰", "🕒", "⌛️"],
    "error":    ["❌", "⛔️", "🚫", "❗️"],
    "done":     ["✅", "👌", "✔️", "👍"],
}

_ids: dict[str, str] = {}
_fallback: dict[str, str] = {}  # смысл -> обычный эмодзи выбранного значка
_pack: list[Sticker] = []


def _norm(s: str) -> str:
    return s.replace("️", "").strip()


async def load(bot: Bot) -> None:
    """Загружает пак и сопоставляет значки со смыслами."""
    global _pack
    try:
        st = await bot.get_sticker_set(EMOJI_PACK)
        _pack = [s for s in st.stickers if s.custom_emoji_id]
    except Exception:
        logging.exception("Не удалось загрузить пак эмодзи %s", EMOJI_PACK)
        _pack = []

    by_emoji: dict[str, Sticker] = {}
    for s in _pack:
        if s.emoji:
            by_emoji.setdefault(_norm(s.emoji), s)

    _ids.clear()
    _fallback.clear()
    for meaning, candidates in MEANINGS.items():
        for c in candidates:
            if (s := by_emoji.get(_norm(c))):
                _ids[meaning] = s.custom_emoji_id
                _fallback[meaning] = s.emoji
                break

    try:
        overrides = json.loads(os.getenv("EMOJI_OVERRIDES", "") or "{}")
        for k, v in overrides.items():
            if k in MEANINGS and v:
                _ids[k] = str(v)
                _fallback.pop(k, None)
    except ValueError:
        logging.error("EMOJI_OVERRIDES: некорректный JSON")

    missing = sorted(set(MEANINGS) - set(_ids))
    logging.info("Пак %s: %d значков, сопоставлено %d/%d%s", EMOJI_PACK, len(_pack),
                 len(_ids), len(MEANINGS), f", без значка: {', '.join(missing)}" if missing else "")


def e(meaning: str) -> str:
    """HTML-вставка кастомного эмодзи с пробелом после; пусто, если значок не найден."""
    cid = _ids.get(meaning)
    if not cid:
        return ""
    return f'<tg-emoji emoji-id="{cid}">{_fallback.get(meaning, MEANINGS[meaning][0])}</tg-emoji> '


def icon(meaning: str) -> str | None:
    """custom_emoji_id для иконки кнопки (InlineKeyboardButton.icon_custom_emoji_id)."""
    return _ids.get(meaning)


def report() -> list[str]:
    """Текст для /emoji: сопоставление смыслов и весь пак с ID (разбит на части)."""
    lines = [f"Пак: {escape(EMOJI_PACK)}, значков: {len(_pack)}", "", "Сопоставление:"]
    for meaning in MEANINGS:
        lines.append(f"{e(meaning) or '— '}{meaning}: <code>{_ids.get(meaning, 'нет')}</code>")
    lines += ["", "Все значки пака:"]
    for s in _pack:
        lines.append(f'<tg-emoji emoji-id="{s.custom_emoji_id}">{escape(s.emoji or "▫️")}</tg-emoji> '
                     f'<code>{s.custom_emoji_id}</code>')

    chunks, cur = [], ""
    for line in lines:
        if len(cur) + len(line) + 1 > 3500:
            chunks.append(cur)
            cur = ""
        cur += line + "\n"
    if cur:
        chunks.append(cur)
    return chunks
