"""Telegram-бот: бесплатно выдаёт ключи для программы.

Переменные окружения:
    BOT_TOKEN         токен от @BotFather
    BOT_SECRET        тот же секрет, что у сервера
    API_URL           адрес сервера лицензий (в docker-compose: http://api:8000)
    REQUIRED_CHANNEL  необязательно: @канал, подписка на который нужна для ключа
    ADMIN_IDS         Telegram ID админов через запятую
    DOWNLOAD_URL      ссылка на скачивание программы
"""
import asyncio
import logging
import os

import httpx
from aiogram import Bot, Dispatcher, F
from aiogram.enums import ChatMemberStatus, ParseMode
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from aiogram.client.default import DefaultBotProperties

BOT_TOKEN = os.environ["BOT_TOKEN"]
BOT_SECRET = os.environ["BOT_SECRET"]
API_URL = os.getenv("API_URL", "http://api:8000").rstrip("/")
REQUIRED_CHANNEL = os.getenv("REQUIRED_CHANNEL", "").strip()
ADMIN_IDS = {int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()}
DOWNLOAD_URL = os.getenv("DOWNLOAD_URL", "")

dp = Dispatcher()
api = httpx.AsyncClient(base_url=API_URL, headers={"X-Bot-Secret": BOT_SECRET}, timeout=10)


def kb(*rows: list[tuple[str, str]]) -> InlineKeyboardMarkup:
    def btn(text, data):
        return InlineKeyboardButton(text=text, url=data) if data.startswith("http") else \
            InlineKeyboardButton(text=text, callback_data=data)
    return InlineKeyboardMarkup(inline_keyboard=[[btn(t, d) for t, d in row] for row in rows])


MAIN_KB = kb([("🔑 Получить ключ", "key")], [("♻️ Новый ключ", "newkey"), ("💻 Отвязать ПК", "reset")])


async def subscribed(bot: Bot, user_id: int) -> bool:
    if not REQUIRED_CHANNEL:
        return True
    try:
        m = await bot.get_chat_member(REQUIRED_CHANNEL, user_id)
    except Exception:
        logging.exception("get_chat_member failed (бот должен быть админом канала)")
        return False
    return m.status in (ChatMemberStatus.MEMBER, ChatMemberStatus.ADMINISTRATOR, ChatMemberStatus.CREATOR)


def sub_kb() -> InlineKeyboardMarkup:
    return kb([("📢 Подписаться", f"https://t.me/{REQUIRED_CHANNEL.lstrip('@')}")],
              [("✅ Я подписался", "key")])


async def give_key(bot: Bot, chat_id: int, user, force: bool):
    if not await subscribed(bot, user.id):
        await bot.send_message(chat_id, "Ключ бесплатный — нужна только подписка на канал.",
                               reply_markup=sub_kb())
        return
    r = await api.post("/internal/issue", json={"tg_id": user.id, "username": user.username, "force": force})
    if r.status_code == 403:
        await bot.send_message(chat_id, "⛔️ Ваш аккаунт заблокирован.")
        return
    r.raise_for_status()
    data = r.json()
    if data["exists"]:
        await bot.send_message(
            chat_id,
            "У вас уже есть ключ. Из соображений безопасности бот не хранит его в открытом виде.\n"
            "Потеряли? Нажмите «Новый ключ» — старый перестанет работать.",
            reply_markup=kb([("♻️ Новый ключ", "newkey")]))
        return
    text = (f"Ваш ключ:\n\n<code>{data['key']}</code>\n\n"
            "1. Запустите программу\n2. Вставьте ключ и нажмите «Активировать»\n"
            "Ключ работает максимум на 2 компьютерах.")
    if DOWNLOAD_URL:
        text += f'\n\n<a href="{DOWNLOAD_URL}">Скачать программу</a>'
    await bot.send_message(chat_id, text)


@dp.message(CommandStart())
async def start(m: Message):
    await m.answer("Привет! Здесь выдаются бесплатные ключи для программы.\n\n"
                   "/key — получить ключ\n/newkey — перевыпустить ключ\n/reset — отвязать все компьютеры",
                   reply_markup=MAIN_KB)


@dp.message(Command("key"))
async def cmd_key(m: Message, bot: Bot):
    await give_key(bot, m.chat.id, m.from_user, force=False)


@dp.message(Command("newkey"))
async def cmd_newkey(m: Message, bot: Bot):
    await give_key(bot, m.chat.id, m.from_user, force=True)


@dp.message(Command("reset"))
async def cmd_reset(m: Message):
    r = await api.post("/internal/reset_devices", json={"tg_id": m.from_user.id})
    r.raise_for_status()
    await m.answer(f"Отвязано компьютеров: {r.json()['removed']}. Теперь ключ можно активировать заново.")


@dp.callback_query(F.data.in_({"key", "newkey", "reset"}))
async def on_button(c: CallbackQuery, bot: Bot):
    await c.answer()
    if c.data == "reset":
        r = await api.post("/internal/reset_devices", json={"tg_id": c.from_user.id})
        r.raise_for_status()
        await bot.send_message(c.message.chat.id, f"Отвязано компьютеров: {r.json()['removed']}.")
    else:
        await give_key(bot, c.message.chat.id, c.from_user, force=c.data == "newkey")


# --- админка ---

@dp.message(Command("stats"), F.from_user.id.in_(ADMIN_IDS))
async def cmd_stats(m: Message):
    r = await api.get("/internal/stats")
    r.raise_for_status()
    s = r.json()
    await m.answer(f"Пользователей: {s['users']} (бан: {s['banned']})\n"
                   f"Активных ключей: {s['active_keys']}\n"
                   f"Устройств: {s['devices']}, активных за 24ч: {s['devices_seen_24h']}")


@dp.message(Command("ban", "unban"), F.from_user.id.in_(ADMIN_IDS))
async def cmd_ban(m: Message, command: CommandObject):
    if not command.args or not command.args.strip().isdigit():
        await m.answer(f"Использование: /{command.command} <telegram_id>")
        return
    r = await api.post("/internal/ban", json={"tg_id": int(command.args), "banned": command.command == "ban"})
    await m.answer("Готово." if r.status_code == 200 else "Пользователь не найден.")


async def main():
    logging.basicConfig(level=logging.INFO)
    bot = Bot(BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
