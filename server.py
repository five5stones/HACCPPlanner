#!/usr/bin/env python3
"""Serve the HACCP app and persist the document library to disk."""

from __future__ import annotations

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
LIBRARY_FILE = DATA_DIR / "library.json"
HOST = os.environ.get("HACCP_HOST", "127.0.0.1")
PORT = int(os.environ.get("HACCP_PORT", "8765"))


from urllib.parse import unquote, urlparse


def read_library() -> dict:
    if not LIBRARY_FILE.exists():
        return {"activeDocId": None, "documents": {}, "settings": {"businessName": ""}}
    with LIBRARY_FILE.open(encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict) or not isinstance(data.get("documents"), dict):
        raise ValueError("Invalid library file")
    data.setdefault("activeDocId", None)
    data.setdefault("settings", {"businessName": ""})
    if not isinstance(data["settings"], dict):
        data["settings"] = {"businessName": ""}
    data["settings"].setdefault("businessName", "")
    return data


def write_library(payload: dict) -> None:
    if not isinstance(payload, dict) or not isinstance(payload.get("documents"), dict):
        raise ValueError("Invalid library payload")
    settings = payload.get("settings") if isinstance(payload.get("settings"), dict) else {}
    business_name = settings.get("businessName", "")
    if not isinstance(business_name, str):
        business_name = ""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = LIBRARY_FILE.with_suffix(".json.tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "activeDocId": payload.get("activeDocId"),
                "documents": payload["documents"],
                "settings": {"businessName": business_name.strip()},
            },
            handle,
            indent=2,
            ensure_ascii=False,
        )
        handle.write("\n")
    temp_path.replace(LIBRARY_FILE)


def get_document(doc_id: str) -> dict | None:
    library = read_library()
    document = library.get("documents", {}).get(doc_id)
    if not document:
        return None
    settings = library.get("settings") if isinstance(library.get("settings"), dict) else {}
    business_name = settings.get("businessName", "")
    if not isinstance(business_name, str):
        business_name = ""
    return {
        "document": document,
        "settings": {"businessName": business_name.strip()},
    }


class HaccpRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        if self.path.startswith("/api/"):
            super().log_message(format, *args)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/library":
            try:
                self.send_json(read_library())
            except (OSError, json.JSONDecodeError, ValueError) as exc:
                self.send_error_json(500, str(exc))
            return
        if path.startswith("/api/documents/"):
            doc_id = unquote(path[len("/api/documents/") :]).strip("/")
            if not doc_id:
                self.send_error_json(400, "Document id required")
                return
            try:
                payload = get_document(doc_id)
                if payload is None:
                    self.send_error_json(404, "Document not found")
                    return
                self.send_json(payload)
            except (OSError, json.JSONDecodeError, ValueError) as exc:
                self.send_error_json(500, str(exc))
            return
        if path == "/api/health":
            self.send_json({"ok": True})
            return
        super().do_GET()

    def do_PUT(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/library":
            self.send_error(404)
            return
        try:
            payload = self.read_json_body()
            write_library(payload)
            self.send_json({"ok": True})
        except (json.JSONDecodeError, ValueError) as exc:
            self.send_error_json(400, str(exc))
        except OSError as exc:
            self.send_error_json(500, str(exc))

    def read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Expected a JSON object")
        return data

    def send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, status: int, message: str) -> None:
        self.send_json({"ok": False, "error": message}, status=status)


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), HaccpRequestHandler)
    print(f"HACCP server running at http://{HOST}:{PORT}/")
    print(f"Documents saved to {LIBRARY_FILE}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()


if __name__ == "__main__":
    main()
