import pytest
from fastapi.testclient import TestClient

from app.api import create_app
from app.config import Settings
from app.db import DB
from app.tokens import load_or_create_signing_key, verify_token

SECRET = "s3cret"
HW1, HW2, HW3 = "a" * 32, "b" * 32, "c" * 32


@pytest.fixture
def env(tmp_path):
    s = Settings(db_path=":memory:", signing_key_path=str(tmp_path / "k.pem"), bot_secret=SECRET,
                 max_devices=2, relay_addr="relay.example:8443")
    app = create_app(s, DB(":memory:"))
    return TestClient(app), s


def issue(c, tg=1, force=False):
    r = c.post("/internal/issue", json={"tg_id": tg, "force": force}, headers={"X-Bot-Secret": SECRET})
    assert r.status_code == 200, r.text
    return r.json()


def test_internal_requires_secret(env):
    c, _ = env
    assert c.post("/internal/issue", json={"tg_id": 1}).status_code == 403
    assert c.post("/internal/issue", json={"tg_id": 1}, headers={"X-Bot-Secret": "x"}).status_code == 403


def test_activate_and_refresh(env):
    c, s = env
    key = issue(c)["key"]
    assert key.startswith("AG-")
    r = c.post("/v1/activate", json={"key": key.lower(), "hwid": HW1, "version": "1.0"})
    assert r.status_code == 200, r.text
    tok = r.json()["token"]
    p = verify_token(load_or_create_signing_key(s.signing_key_path).public_key(), tok)
    assert p["hwid"] == HW1 and p["relay"] == "relay.example:8443"
    assert "cloudcode-pa.googleapis.com" in p["hosts"]
    assert c.post("/v1/refresh", json={"token": tok}).status_code == 200


def test_unknown_key(env):
    c, _ = env
    assert c.post("/v1/activate", json={"key": "AG-NOPE", "hwid": HW1}).status_code == 404


def test_device_limit_and_reset(env):
    c, _ = env
    key = issue(c)["key"]
    for hw in (HW1, HW2, HW1):  # повторная активация того же компьютера не тратит слот
        assert c.post("/v1/activate", json={"key": key, "hwid": hw}).status_code == 200
    assert c.post("/v1/activate", json={"key": key, "hwid": HW3}).status_code == 409
    c.post("/internal/reset_devices", json={"tg_id": 1}, headers={"X-Bot-Secret": SECRET})
    assert c.post("/v1/activate", json={"key": key, "hwid": HW3}).status_code == 200


def test_reissue_revokes_old(env):
    c, _ = env
    old = issue(c)["key"]
    tok = c.post("/v1/activate", json={"key": old, "hwid": HW1}).json()["token"]
    assert issue(c) == {"key": None, "exists": True}
    new = issue(c, force=True)["key"]
    assert new != old
    assert c.post("/v1/activate", json={"key": old, "hwid": HW1}).status_code == 404
    assert c.post("/v1/refresh", json={"token": tok}).status_code == 401
    assert c.post("/v1/activate", json={"key": new, "hwid": HW1}).status_code == 200


def test_ban(env):
    c, _ = env
    key = issue(c)["key"]
    tok = c.post("/v1/activate", json={"key": key, "hwid": HW1}).json()["token"]
    c.post("/internal/ban", json={"tg_id": 1}, headers={"X-Bot-Secret": SECRET})
    assert c.post("/v1/activate", json={"key": key, "hwid": HW1}).status_code == 403
    assert c.post("/v1/refresh", json={"token": tok}).status_code == 401
    r = c.post("/internal/issue", json={"tg_id": 1, "force": True}, headers={"X-Bot-Secret": SECRET})
    assert r.status_code == 403


def test_forged_token_rejected(env):
    c, _ = env
    key = issue(c)["key"]
    tok = c.post("/v1/activate", json={"key": key, "hwid": HW1}).json()["token"]
    body, sig = tok.split(".")
    assert c.post("/v1/refresh", json={"token": body[:-2] + "AA." + sig}).status_code == 401
