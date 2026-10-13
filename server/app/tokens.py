"""Ключи и токены.

Ключ — то, что пользователь получает в боте: AG-XXXX-XXXX-XXXX-XXXX.
В базе хранится только его SHA-256, сам ключ сервер не помнит.

Токен — то, что сервер выдаёт программе после активации:
    base64url(payload_json) + "." + base64url(подпись Ed25519)
Подписать может только сервер (приватный ключ), проверить может кто угодно
по публичному ключу, вшитому в клиент и известному relay.
"""
import base64
import hashlib
import json
import os
import secrets
import time

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.exceptions import InvalidSignature

# без 0/O/1/I, чтобы ключ было легко переписать руками
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def new_license_key() -> str:
    groups = ["".join(secrets.choice(_ALPHABET) for _ in range(4)) for _ in range(4)]
    return "AG-" + "-".join(groups)  # 16 символов * 5 бит = 80 бит


def normalize_key(key: str) -> str:
    return key.strip().upper().replace(" ", "")


def hash_key(key: str) -> str:
    return hashlib.sha256(normalize_key(key).encode()).hexdigest()


def _b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _b64d(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def load_or_create_signing_key(path: str) -> Ed25519PrivateKey:
    if os.path.exists(path):
        with open(path, "rb") as f:
            return serialization.load_pem_private_key(f.read(), password=None)
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    key = Ed25519PrivateKey.generate()
    pem = key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                            serialization.NoEncryption())
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as f:
        f.write(pem)
    return key


def public_key_hex(key: Ed25519PrivateKey) -> str:
    raw = key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return raw.hex()


def sign_token(key: Ed25519PrivateKey, payload: dict) -> str:
    body = _b64e(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = key.sign(body.encode())
    return body + "." + _b64e(sig)


class TokenError(Exception):
    pass


def verify_token(pub: Ed25519PublicKey, token: str, now: float | None = None) -> dict:
    try:
        body, sig = token.split(".")
        pub.verify(_b64d(sig), body.encode())
        payload = json.loads(_b64d(body))
    except (ValueError, InvalidSignature) as e:
        raise TokenError("bad signature") from e
    if payload.get("exp", 0) < (now if now is not None else time.time()):
        raise TokenError("expired")
    return payload
