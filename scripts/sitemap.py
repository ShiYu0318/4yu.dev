#!/usr/bin/env python3
"""依 content/projects.json 重新產生 sitemap.xml（新增或發佈專案後執行；check.py 會檢查是否過期）。"""
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://4yu.dev"


def build() -> str:
    data = json.loads((ROOT / "content" / "projects.json").read_text(encoding="utf-8"))
    pubs = [p for p in data["projects"] if p.get("status") == "published"]
    latest = max((p.get("updated", "") for p in pubs), default="") or date.today().isoformat()
    exp = ROOT / "content" / "experience.json"
    exp_updated = json.loads(exp.read_text(encoding="utf-8")).get("updated", latest) if exp.exists() else latest
    urls = [(f"{SITE}/", latest, "1.0"), (f"{SITE}/projects", latest, "0.8"), (f"{SITE}/experience", exp_updated, "0.8")]
    urls += [(f"{SITE}/project?id={p['id']}", p.get("updated", latest), "0.7") for p in pubs]
    rows = "\n".join(f"  <url><loc>{u}</loc><lastmod>{m}</lastmod><priority>{pr}</priority></url>" for u, m, pr in urls)
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{rows}\n</urlset>\n'


if __name__ == "__main__":
    (ROOT / "sitemap.xml").write_text(build(), encoding="utf-8")
    print("已寫入 sitemap.xml")
