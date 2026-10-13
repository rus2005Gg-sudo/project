"""SQLite-хранилище: пользователи Telegram, ключи, привязанные устройства."""
import sqlite3
import time
import os

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    tg_id      INTEGER PRIMARY KEY,
    username   TEXT,
    banned     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS keys (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    tg_id      INTEGER NOT NULL REFERENCES users(tg_id),
    key_hash   TEXT NOT NULL UNIQUE,
    revoked    INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS devices (
    key_id     INTEGER NOT NULL REFERENCES keys(id),
    hwid       TEXT NOT NULL,
    version    TEXT,
    first_seen INTEGER NOT NULL,
    last_seen  INTEGER NOT NULL,
    PRIMARY KEY (key_id, hwid)
);
"""


class DB:
    def __init__(self, path: str):
        if path != ":memory:":
            os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        self.conn = sqlite3.connect(path, check_same_thread=False, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.executescript(SCHEMA)

    # --- пользователи и ключи (вызывает бот) ---

    def upsert_user(self, tg_id: int, username: str | None) -> sqlite3.Row:
        self.conn.execute(
            "INSERT INTO users(tg_id, username, created_at) VALUES(?,?,?) "
            "ON CONFLICT(tg_id) DO UPDATE SET username=excluded.username",
            (tg_id, username, int(time.time())))
        return self.conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()

    def active_key(self, tg_id: int) -> sqlite3.Row | None:
        return self.conn.execute(
            "SELECT * FROM keys WHERE tg_id=? AND revoked=0 ORDER BY id DESC LIMIT 1", (tg_id,)).fetchone()

    def add_key(self, tg_id: int, key_hash: str) -> int:
        cur = self.conn.execute("INSERT INTO keys(tg_id, key_hash, created_at) VALUES(?,?,?)",
                                (tg_id, key_hash, int(time.time())))
        return cur.lastrowid

    def revoke_user_keys(self, tg_id: int) -> None:
        self.conn.execute("UPDATE keys SET revoked=1 WHERE tg_id=?", (tg_id,))

    def set_banned(self, tg_id: int, banned: bool) -> bool:
        cur = self.conn.execute("UPDATE users SET banned=? WHERE tg_id=?", (int(banned), tg_id))
        return cur.rowcount > 0

    def reset_devices(self, tg_id: int) -> int:
        cur = self.conn.execute(
            "DELETE FROM devices WHERE key_id IN (SELECT id FROM keys WHERE tg_id=?)", (tg_id,))
        return cur.rowcount

    def stats(self) -> dict:
        q = lambda sql: self.conn.execute(sql).fetchone()[0]
        day = int(time.time()) - 86400
        return {
            "users": q("SELECT COUNT(*) FROM users"),
            "banned": q("SELECT COUNT(*) FROM users WHERE banned=1"),
            "active_keys": q("SELECT COUNT(*) FROM keys WHERE revoked=0"),
            "devices": q("SELECT COUNT(*) FROM devices"),
            "devices_seen_24h": q(f"SELECT COUNT(*) FROM devices WHERE last_seen>{day}"),
        }

    # --- активация (вызывает программа) ---

    def key_by_hash(self, key_hash: str) -> sqlite3.Row | None:
        return self.conn.execute(
            "SELECT k.*, u.banned FROM keys k JOIN users u ON u.tg_id=k.tg_id WHERE k.key_hash=?",
            (key_hash,)).fetchone()

    def key_by_id(self, key_id: int) -> sqlite3.Row | None:
        return self.conn.execute(
            "SELECT k.*, u.banned FROM keys k JOIN users u ON u.tg_id=k.tg_id WHERE k.id=?",
            (key_id,)).fetchone()

    def key_is_valid(self, key_id: int) -> bool:
        row = self.key_by_id(key_id)
        return bool(row) and not row["revoked"] and not row["banned"]

    def device_exists(self, key_id: int, hwid: str) -> bool:
        return self.conn.execute("SELECT 1 FROM devices WHERE key_id=? AND hwid=?",
                                 (key_id, hwid)).fetchone() is not None

    def device_count(self, key_id: int) -> int:
        return self.conn.execute("SELECT COUNT(*) FROM devices WHERE key_id=?", (key_id,)).fetchone()[0]

    def touch_device(self, key_id: int, hwid: str, version: str | None) -> None:
        now = int(time.time())
        self.conn.execute(
            "INSERT INTO devices(key_id, hwid, version, first_seen, last_seen) VALUES(?,?,?,?,?) "
            "ON CONFLICT(key_id, hwid) DO UPDATE SET last_seen=excluded.last_seen, version=excluded.version",
            (key_id, hwid, version, now, now))
