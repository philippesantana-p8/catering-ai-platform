#!/usr/bin/env python3
"""Gera PNG quadrado (contain, #f5f5f5) e atualiza image_url dos 4 pacotes base."""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / ".env.local"
SOURCE_DIR = ROOT / "assets" / "packages" / "source"
OUT_DIR = ROOT / "assets" / "packages" / "square-1x1"
BUCKET = "package-images"
SQUARE_SIZE = 1200
BG = (245, 245, 245)

SOURCE_MAP = {
    "BBQTRAD": SOURCE_DIR / "BBQTRAD-original.png",
    "BBQSEL": SOURCE_DIR / "BBQSEL-original.png",
    "BBQCHO": SOURCE_DIR / "BBQCHO-original.png",
    "BBQPRI": SOURCE_DIR / "BBQPRI-original.png",
}


def load_env() -> dict[str, str]:
    if not ENV_PATH.exists():
        raise SystemExit(f"Arquivo não encontrado: {ENV_PATH}")
    env: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if m:
            env[m.group(1)] = m.group(2).strip()
    return env


def fit_square(input_path: Path, output_path: Path) -> bytes:
    with Image.open(input_path) as img:
        img = img.convert("RGBA")
        w, h = img.size
        scale = min(SQUARE_SIZE / w, SQUARE_SIZE / h)
        new_w = max(1, round(w * scale))
        new_h = max(1, round(h * scale))
        resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (SQUARE_SIZE, SQUARE_SIZE), BG + (255,))
        left = (SQUARE_SIZE - new_w) // 2
        top = (SQUARE_SIZE - new_h) // 2
        canvas.paste(resized, (left, top), resized)
        rgb = Image.new("RGB", canvas.size, BG)
        rgb.paste(canvas, mask=canvas.split()[3])
        output_path.parent.mkdir(parents=True, exist_ok=True)
        rgb.save(output_path, format="PNG", optimize=True)
        return output_path.read_bytes()


def supabase_request(
    env: dict[str, str],
    method: str,
    path: str,
    *,
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, str]:
    base = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
    url = f"{base}{path}"
    req_headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        **(headers or {}),
    }
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {path} -> {err.code}: {body}") from err


def fetch_packages(env: dict[str, str], keys: list[str]) -> list[dict]:
    quoted = ",".join(f'"{k}"' for k in keys)
    path = (
        "/rest/v1/packages?select=id,package_key,image_url"
        f"&package_key=in.({quoted})"
        "&order=package_key"
    )
    _, body = supabase_request(
        env,
        "GET",
        path,
        headers={"Accept": "application/json"},
    )
    return json.loads(body)


def list_storage_objects(env: dict[str, str], package_id: str) -> list[str]:
    prefix = urllib.parse.quote(f"{package_id}", safe="")
    path = f"/storage/v1/object/list/{BUCKET}"
    payload = json.dumps({"prefix": package_id, "limit": 100}).encode("utf-8")
    try:
        _, body = supabase_request(
            env,
            "POST",
            path,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
    except RuntimeError:
        return []
    items = json.loads(body)
    return [f"{package_id}/{item['name']}" for item in items if item.get("name")]


def delete_storage_objects(env: dict[str, str], paths: list[str]) -> None:
    if not paths:
        return
    payload = json.dumps({"prefixes": paths}).encode("utf-8")
    supabase_request(
        env,
        "DELETE",
        f"/storage/v1/object/{BUCKET}",
        data=payload,
        headers={"Content-Type": "application/json"},
    )


def upload_and_update(
    env: dict[str, str],
    package_id: str,
    package_key: str,
    png_bytes: bytes,
) -> str:
    object_path = f"{package_id}/{package_key}-square.png"
    encoded = urllib.parse.quote(object_path, safe="/")
    supabase_request(
        env,
        "POST",
        f"/storage/v1/object/{BUCKET}/{encoded}",
        data=png_bytes,
        headers={
            "Content-Type": "image/png",
            "x-upsert": "true",
        },
    )
    public_url = (
        f"{env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')}"
        f"/storage/v1/object/public/{BUCKET}/{object_path}"
    )
    patch = json.dumps({"image_url": public_url}).encode("utf-8")
    supabase_request(
        env,
        "PATCH",
        f"/rest/v1/packages?id=eq.{package_id}",
        data=patch,
        headers={
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    return public_url


def main() -> None:
    env = load_env()
    packages = fetch_packages(env, list(SOURCE_MAP.keys()))
    if not packages:
        raise SystemExit("Nenhum pacote encontrado no Supabase.")

    print("Pacotes:", ", ".join(p["package_key"] for p in packages))

    for pkg in packages:
        key = pkg["package_key"]
        source = SOURCE_MAP.get(key)
        if not source or not source.exists():
            print(f"[{key}] arquivo ausente: {source}")
            continue

        out_path = OUT_DIR / f"{key}-square.png"
        print(f"\n[{key}] gerando quadrado...")
        png_bytes = fit_square(source, out_path)
        print(f"  salvo: {out_path}")

        print(f"[{key}] removendo imagens antigas...")
        old_paths = list_storage_objects(env, pkg["id"])
        if old_paths:
            delete_storage_objects(env, old_paths)
            print(f"  removidos {len(old_paths)} arquivo(s)")

        print(f"[{key}] enviando para Supabase...")
        url = upload_and_update(env, pkg["id"], key, png_bytes)
        print(f"  image_url: {url}")

    print("\nConcluído.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(exc, file=sys.stderr)
        sys.exit(1)
