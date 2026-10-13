"""python -m app.keygen — создать (если нет) ключ подписи и напечатать публичный ключ.

Публичный ключ кладётся в client/pubkey.txt перед сборкой клиента.
"""
from .config import get_settings
from .tokens import load_or_create_signing_key, public_key_hex

if __name__ == "__main__":
    s = get_settings()
    print(public_key_hex(load_or_create_signing_key(s.signing_key_path)))
