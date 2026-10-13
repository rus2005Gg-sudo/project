import asyncio
import time

import pytest

from app.config import Settings
from app.db import DB
from app.relay import Relay
from app.tokens import hash_key, load_or_create_signing_key, sign_token


@pytest.fixture
def setup(tmp_path):
    s = Settings(db_path=":memory:", signing_key_path=str(tmp_path / "k.pem"),
                 relay_hosts=["127.0.0.1"], relay_ports=[0], relay_listen="127.0.0.1:0")
    db = DB(":memory:")
    db.upsert_user(1, None)
    kid = db.add_key(1, hash_key("AG-TEST"))
    sk = load_or_create_signing_key(s.signing_key_path)
    return s, db, sk, kid


def tok(sk, kid, hosts=("127.0.0.1",), exp_in=3600):
    return sign_token(sk, {"kid": kid, "hwid": "x", "exp": int(time.time()) + exp_in, "hosts": list(hosts)})


async def roundtrip(relay: Relay, target: str, auth: str | None) -> bytes:
    """Поднимает echo-сервер и relay, делает CONNECT, шлёт ping."""
    async def echo(r, w):
        w.write(await r.read(100))
        await w.drain()
        w.close()

    echo_srv = await asyncio.start_server(echo, "127.0.0.1", 0)
    eport = echo_srv.sockets[0].getsockname()[1]
    relay.s.relay_ports.clear()
    relay.s.relay_ports.append(eport)
    rsrv = await asyncio.start_server(relay.handle, "127.0.0.1", 0)
    rport = rsrv.sockets[0].getsockname()[1]
    r, w = await asyncio.open_connection("127.0.0.1", rport)
    hdr = f"CONNECT {target.format(port=eport)} HTTP/1.1\r\n"
    if auth:
        hdr += f"Proxy-Authorization: Bearer {auth}\r\n"
    w.write((hdr + "\r\n").encode())
    status = await r.readuntil(b"\r\n\r\n")
    if b" 200 " in status:
        w.write(b"ping")
        status += await r.read(100)
    w.close()
    rsrv.close()
    echo_srv.close()
    return status


def run(relay, target, auth):
    return asyncio.run(roundtrip(relay, target, auth))


def test_tunnel_ok(setup):
    s, db, sk, kid = setup
    out = run(Relay(s, db), "127.0.0.1:{port}", tok(sk, kid))
    assert out.startswith(b"HTTP/1.1 200") and out.endswith(b"ping")


def test_no_token(setup):
    s, db, sk, kid = setup
    assert b" 407 " in run(Relay(s, db), "127.0.0.1:{port}", None)


def test_expired_token(setup):
    s, db, sk, kid = setup
    assert b" 407 " in run(Relay(s, db), "127.0.0.1:{port}", tok(sk, kid, exp_in=-1))


def test_foreign_signature(setup, tmp_path):
    s, db, sk, kid = setup
    other = load_or_create_signing_key(str(tmp_path / "other.pem"))
    assert b" 407 " in run(Relay(s, db), "127.0.0.1:{port}", tok(other, kid))


def test_host_not_allowed(setup):
    s, db, sk, kid = setup
    assert b" 403 " in run(Relay(s, db), "localhost:{port}", tok(sk, kid))


def test_revoked_key(setup):
    s, db, sk, kid = setup
    db.revoke_user_keys(1)
    assert b" 407 " in run(Relay(s, db), "127.0.0.1:{port}", tok(sk, kid))
