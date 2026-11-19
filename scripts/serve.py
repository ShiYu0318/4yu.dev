#!/usr/bin/env python3
"""本機預覽：和 GitHub Pages 一樣，/experience 會回傳 experience.html。

用法：python3 scripts/serve.py [port]   （預設 8000，在專案根目錄提供檔案）
"""
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        local = Path(super().translate_path(path))
        if not local.exists() and local.with_suffix(".html").is_file():
            return str(local.with_suffix(".html"))
        return str(local)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"http://localhost:{port}")
    http.server.ThreadingHTTPServer(("", port), Handler).serve_forever()
