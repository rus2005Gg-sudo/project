"""HTTP API сервера лицензий.

Публичное (вызывает программа):
    POST /v1/activate  {key, hwid, version}  -> {token, expires_at}
    POST /v1/refresh   {token}               -> {token, expires_at}
    GET  /v1/pubkey
Внутреннее (вызывает только бот, заголовок X-Bot-Secret):
    POST /internal/issue          {tg_id, username, force}
    POST /internal/reset_devices  {tg_id}
    POST /internal/ban            {tg_id, banned}
    GET  /internal/stats
"""
import hmac
import time

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .config import Settings, get_settings
from .db import DB
from .tokens import (TokenError, hash_key, load_or_create_signing_key, new_license_key,
                     public_key_hex, sign_token, verify_token)


class ActivateIn(BaseModel):
    key: str = Field(max_length=64)
    hwid: str = Field(min_length=16, max_length=128)
    version: str = Field(default="", max_length=32)


class RefreshIn(BaseModel):
    token: str = Field(max_length=4096)


class IssueIn(BaseModel):
    tg_id: int
    username: str | None = None
    force: bool = False  # выпустить новый ключ, отозвав старый


class TgIn(BaseModel):
    tg_id: int


class BanIn(BaseModel):
    tg_id: int
    banned: bool = True


def create_app(settings: Settings | None = None, db: DB | None = None) -> FastAPI:
    s = settings or get_settings()
    db = db or DB(s.db_path)
    sk = load_or_create_signing_key(s.signing_key_path)
    pk = sk.public_key()

    app = FastAPI(title="AG License Server", docs_url=None, redoc_url=None)
    app.state.db = db
    app.state.settings = s

    def make_token(key_id: int, hwid: str) -> dict:
        now = int(time.time())
        exp = now + s.token_ttl_hours * 3600
        payload = {"kid": key_id, "hwid": hwid, "iat": now, "exp": exp,
                   "relay": s.relay_addr, "hosts": s.relay_hosts}
        return {"token": sign_token(sk, payload), "expires_at": exp}

    def require_bot(x_bot_secret: str = Header(default="")) -> None:
        if not s.bot_secret or not hmac.compare_digest(x_bot_secret, s.bot_secret):
            raise HTTPException(403, "forbidden")

    @app.get("/v1/pubkey")
    def pubkey():
        return {"ed25519": public_key_hex(sk)}

    @app.post("/v1/activate")
    def activate(body: ActivateIn):
        row = db.key_by_hash(hash_key(body.key))
        if not row or row["revoked"]:
            raise HTTPException(404, "Ключ не найден или заменён. Получите актуальный в боте.")
        if row["banned"]:
            raise HTTPException(403, "Ключ заблокирован.")
        if not db.device_exists(row["id"], body.hwid) and db.device_count(row["id"]) >= s.max_devices:
            raise HTTPException(409, f"Ключ уже используется на {s.max_devices} устройствах. "
                                     "Отвяжите старые командой /reset в боте.")
        db.touch_device(row["id"], body.hwid, body.version)
        return make_token(row["id"], body.hwid)

    @app.post("/v1/refresh")
    def refresh(body: RefreshIn):
        try:
            p = verify_token(pk, body.token)
        except TokenError:
            raise HTTPException(401, "Токен недействителен, активируйте ключ заново.")
        if not db.key_is_valid(p["kid"]) or not db.device_exists(p["kid"], p["hwid"]):
            raise HTTPException(401, "Ключ отозван или устройство отвязано.")
        db.touch_device(p["kid"], p["hwid"], None)
        return make_token(p["kid"], p["hwid"])

    @app.post("/internal/issue", dependencies=[Depends(require_bot)])
    def issue(body: IssueIn):
        user = db.upsert_user(body.tg_id, body.username)
        if user["banned"]:
            raise HTTPException(403, "banned")
        if db.active_key(body.tg_id) and not body.force:
            # сам ключ сервер не хранит, поэтому показать старый нельзя - только перевыпустить
            return {"key": None, "exists": True}
        db.revoke_user_keys(body.tg_id)
        key = new_license_key()
        db.add_key(body.tg_id, hash_key(key))
        return {"key": key, "exists": False}

    @app.post("/internal/reset_devices", dependencies=[Depends(require_bot)])
    def reset_devices(body: TgIn):
        return {"removed": db.reset_devices(body.tg_id)}

    @app.post("/internal/ban", dependencies=[Depends(require_bot)])
    def ban(body: BanIn):
        if not db.set_banned(body.tg_id, body.banned):
            raise HTTPException(404, "user not found")
        return {"ok": True}

    @app.get("/internal/stats", dependencies=[Depends(require_bot)])
    def stats():
        return db.stats()

    return app


def application() -> FastAPI:
    """Фабрика для uvicorn: uvicorn --factory app.api:application"""
    return create_app()
