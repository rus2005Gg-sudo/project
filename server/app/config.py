"""Настройки сервера. Всё берётся из переменных окружения (см. .env.example)."""
import os
from dataclasses import dataclass, field


def _list(name: str, default: str) -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    db_path: str = field(default_factory=lambda: os.getenv("DB_PATH", "data/license.db"))
    signing_key_path: str = field(default_factory=lambda: os.getenv("SIGNING_KEY_PATH", "data/signing_key.pem"))
    # общий секрет между ботом и сервером для /internal/*
    bot_secret: str = field(default_factory=lambda: os.getenv("BOT_SECRET", ""))
    # сколько живёт токен без обновления; отзыв ключа срабатывает не позже этого срока
    token_ttl_hours: int = field(default_factory=lambda: int(os.getenv("TOKEN_TTL_HOURS", "72")))
    max_devices: int = field(default_factory=lambda: int(os.getenv("MAX_DEVICES", "2")))
    # публичный адрес relay, который клиент получит в токене
    relay_addr: str = field(default_factory=lambda: os.getenv("RELAY_PUBLIC_ADDR", "127.0.0.1:8443"))
    # только эти хосты клиент отправляет через relay, и только их relay пропускает
    relay_hosts: list[str] = field(default_factory=lambda: _list(
        "RELAY_HOSTS", "cloudcode-pa.googleapis.com,daily-cloudcode-pa.googleapis.com"))
    relay_ports: list[int] = field(default_factory=lambda: [int(p) for p in _list("RELAY_PORTS", "443")])
    relay_listen: str = field(default_factory=lambda: os.getenv("RELAY_LISTEN", "0.0.0.0:8443"))


def get_settings() -> Settings:
    return Settings()
