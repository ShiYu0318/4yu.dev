#!/usr/bin/env python3
"""把 Notion「經歷」表格裡「網站」打勾的列，轉成 content/experience.json。

只輸出公開欄位（AGENTS.md §9）：Title、身分、成果、主辦單位、類型、領域、含金量、年級、Date、補充連結。
備註、證書、原始標題、類別、CV、放、編號等欄位一律不讀進輸出，Notion 頁面網址也不輸出。

用法：
  # 從 Notion API 讀（GitHub Actions 每天跑一次）
  NOTION_TOKEN=secret_xxx NOTION_DATA_SOURCE_ID=452fc424-... python3 scripts/sync_notion.py

  # 從已匯出的 JSON 讀（MCP 查詢結果，欄位同上，日期欄叫 s / e）
  python3 scripts/sync_notion.py --from rows.json

只用標準函式庫，不需要 pip install。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "experience.json"
API = "https://api.notion.com/v1"
NOTION_VERSION = "2025-09-03"

# Notion 欄位名稱 → 輸出欄位。只有這些會被讀取。欄位改過名，新舊名稱都認得。
PUBLIC = {
    "Title": "title", "身分": "role", "成果": "result", "主辦單位": "org", "單位": "org",
    "類型": "type", "領域": "fields", "含金量": "priority", "優先級": "priority", "年級": "grade",
    "補充連結": "link", "連結": "link",
}
pick = lambda row, *names: next((row[n] for n in names if row.get(n) not in (None, "", [])), None)
CHECK = "網站"


def plain(prop: dict | None):
    """把 Notion API 的屬性值轉成 Python 值。"""
    if not prop:
        return None
    t = prop.get("type")
    v = prop.get(t)
    if t in ("title", "rich_text"):
        return "".join(x.get("plain_text", "") for x in v).strip() or None
    if t in ("select", "status"):
        return v["name"] if v else None
    if t == "multi_select":
        return [x["name"] for x in v]
    if t == "date":
        return v
    if t in ("url", "email", "phone_number", "checkbox", "number"):
        return v
    if t == "formula":
        return v.get(v.get("type"))
    return None


def fetch_api(token: str, source: str) -> list[dict]:
    rows, cursor = [], None
    while True:
        body = {"filter": {"property": CHECK, "checkbox": {"equals": True}}, "page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        req = urllib.request.Request(
            f"{API}/data_sources/{source}/query",
            data=json.dumps(body).encode(),
            headers={"Authorization": f"Bearer {token}", "Notion-Version": NOTION_VERSION,
                     "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as res:
            data = json.load(res)
        for page in data["results"]:
            props = page["properties"]
            row = {k: plain(props.get(k)) for k in PUBLIC}
            d = plain(props.get("Date")) or {}
            row["s"], row["e"] = d.get("start"), d.get("end")
            rows.append(row)
        if not data.get("has_more"):
            return rows
        cursor = data["next_cursor"]


def stars(v) -> int:
    return str(v or "").count("⭐")


def normalize(row: dict) -> dict | None:
    if not row.get("Title") or not row.get("s"):
        return None
    fields = pick(row, "領域")
    if isinstance(fields, str):  # MCP 匯出時 multi_select 是 JSON 字串
        fields = json.loads(fields)
    org, result = pick(row, "主辦單位", "單位"), pick(row, "成果")
    if org and org == result:  # 單位欄重複填了成果時只留成果
        org = None
    return {
        "title": row["Title"].strip(),
        "role": pick(row, "身分"),
        "result": result,
        "org": org,
        "type": pick(row, "類型") or "其他",
        "fields": fields or [],
        "priority": stars(pick(row, "含金量", "優先級")),
        "grade": pick(row, "年級"),
        "start": row["s"][:10],
        "end": (row.get("e") or "")[:10] or None,
        "link": pick(row, "補充連結", "連結"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="src", help="改從 JSON 檔讀取（不連 Notion）")
    args = ap.parse_args()

    if args.src:
        rows = json.loads(Path(args.src).read_text(encoding="utf-8"))
        if isinstance(rows, dict):
            rows = rows.get("results", [])
    else:
        token, source = os.environ.get("NOTION_TOKEN"), os.environ.get("NOTION_DATA_SOURCE_ID")
        if not token or not source:
            print("沒有 NOTION_TOKEN / NOTION_DATA_SOURCE_ID，略過同步", file=sys.stderr)
            return 0
        rows = fetch_api(token, source)

    items = [x for x in (normalize(r) for r in rows) if x]
    items.sort(key=lambda x: x["start"], reverse=True)
    if not items:
        print("沒有任何勾選的列，保留原本的 experience.json", file=sys.stderr)
        return 1

    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    if old.get("items") == items:
        print(f"沒有變動（{len(items)} 筆）")
        return 0
    OUT.write_text(json.dumps({"updated": date.today().isoformat(), "items": items},
                              ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"已寫入 {OUT.relative_to(ROOT)}：{len(items)} 筆")
    return 0


if __name__ == "__main__":
    sys.exit(main())
