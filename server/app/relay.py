"""Relay — то, что стоит на VPS в стране без ограничений.

Это HTTP CONNECT-прокси с двумя жёсткими правилами:
  1. Пускает только с действующим токеном (Proxy-Authorization: Bearer <token>):
     подпись Ed25519 сервера, срок не истёк, ключ не отозван и не забанен.
  2. Пускает только на хосты/порты из RELAY_HOSTS/RELAY_PORTS — открытым
     прокси для всего интернета он не становится.
TLS не расшифровывается: после CONNECT байты просто перекладываются в обе стороны.

Запуск: python -m app.relay
"""
import asyncio
import logging
import time

from .config import Settings, get_settings
from .db import DB
from .tokens import TokenError, load_or_create_signing_key, verify_token

log = logging.getLogger("relay")
MAX_HEADER = 8192


class Relay:
    def __init__(self, settings: Settings, db: DB | None):
        self.s = settings
        self.db = db
        self.pk = load_or_create_signing_key(settings.signing_key_path).public_key()
        self.hosts = {h.lower() for h in settings.relay_hosts}
        self._valid_cache: dict[int, tuple[bool, float]] = {}

    def key_valid(self, kid: int) -> bool:
        """Отзыв/бан из базы, с кэшем на 60 секунд."""
        if self.db is None:
            return True
        hit = self._valid_cache.get(kid)
        if hit and hit[1] > time.time():
            return hit[0]
        ok = self.db.key_is_valid(kid)
        self._valid_cache[kid] = (ok, time.time() + 60)
        return ok

    def check(self, target: str, auth: str | None) -> tuple[int, str] | None:
        """None - можно соединять, иначе (HTTP-код, причина)."""
        host, _, port = target.rpartition(":")
        if not host or not port.isdigit():
            return 400, "bad target"
        host = host.strip("[]").lower()
        if host not in self.hosts or int(port) not in self.s.relay_ports:
            return 403, "host not allowed"
        if not auth or not auth.lower().startswith("bearer "):
            return 407, "token required"
        try:
            p = verify_token(self.pk, auth[7:].strip())
        except TokenError as e:
            return 407, str(e)
        if host not in {h.lower() for h in p.get("hosts", [])}:
            return 403, "host not in token"
        if not self.key_valid(p["kid"]):
            return 407, "key revoked"
        return None

    async def handle(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        try:
            head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 15)
        except (asyncio.IncompleteReadError, asyncio.LimitOverrunError, asyncio.TimeoutError):
            writer.close()
            return
        lines = head.decode("latin-1").split("\r\n")
        parts = lines[0].split(" ")
        headers = {}
        for ln in lines[1:]:
            k, sep, v = ln.partition(":")
            if sep:
                headers[k.strip().lower()] = v.strip()
        if len(parts) != 3 or parts[0].upper() != "CONNECT":
            await self._reply(writer, 405, "only CONNECT")
            return
        target = parts[1]
        err = self.check(target, headers.get("proxy-authorization"))
        if err:
            log.info("deny %s -> %s: %s", peer, target, err[1])
            await self._reply(writer, *err)
            return
        host, _, port = target.rpartition(":")
        try:
            up_r, up_w = await asyncio.wait_for(asyncio.open_connection(host.strip("[]"), int(port)), 15)
        except (OSError, asyncio.TimeoutError) as e:
            log.warning("upstream %s failed: %s", target, e)
            await self._reply(writer, 502, "upstream unreachable")
            return
        writer.write(b"HTTP/1.1 200 Connection Established\r\n\r\n")
        await writer.drain()
        await asyncio.gather(self._pipe(reader, up_w), self._pipe(up_r, writer))

    @staticmethod
    async def _pipe(r: asyncio.StreamReader, w: asyncio.StreamWriter):
        try:
            while data := await r.read(65536):
                w.write(data)
                await w.drain()
        except (ConnectionError, asyncio.CancelledError):
            pass
        finally:
            try:
                w.close()
            except Exception:
                pass

    @staticmethod
    async def _reply(writer, code: int, reason: str):
        extra = 'Proxy-Authenticate: Bearer realm="ag"\r\n' if code == 407 else ""
        body = reason.encode()
        writer.write(f"HTTP/1.1 {code} {reason}\r\n{extra}Content-Length: {len(body)}\r\n"
                     f"Connection: close\r\n\r\n".encode() + body)
        try:
            await writer.drain()
        finally:
            writer.close()

    async def serve(self):
        host, _, port = self.s.relay_listen.rpartition(":")
        server = await asyncio.start_server(self.handle, host, int(port), limit=MAX_HEADER)
        log.info("relay listening on %s, hosts=%s", self.s.relay_listen, sorted(self.hosts))
        async with server:
            await server.serve_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    s = get_settings()
    asyncio.run(Relay(s, DB(s.db_path)).serve())
