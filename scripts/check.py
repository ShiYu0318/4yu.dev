#!/usr/bin/env python3
"""一致性檢查：驗證 content/ 是否符合 AGENTS.md 的規則。

用法：在專案根目錄執行  python3 scripts/check.py
有錯誤時以非零狀態結束；警告不會讓檢查失敗。
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "content" / "projects.json"
PROJECT_DIR = ROOT / "content" / "projects"

SECTIONS = ["為什麼做這個", "核心功能", "技術架構", "技術亮點", "成果展示", "連結"]
CALLOUTS = {"SUMMARY", "HIGHLIGHT", "NOTE", "WIP"}
LAYERS = {"前端", "後端", "AI / 模型", "檢索", "資料", "模擬", "基礎設施", "測試 / CI"}
ID_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
TAG_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SIMPLIFIED = ["代碼", "數據庫", "視頻", "軟件", "默認", "鏈接", "質量", "信息"]

errors, warnings = [], []
err = lambda where, msg: errors.append(f"✗ {where}: {msg}")
warn = lambda where, msg: warnings.append(f"! {where}: {msg}")


def check_manifest():
    try:
        data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        err("projects.json", f"不是合法 JSON：{e}")
        return None

    for key in ("profile", "categories", "projects"):
        if key not in data:
            err("projects.json", f"缺少 `{key}`")
    if errors:
        return None

    for key in ("portrait", "githubAvatar"):
        if not (ROOT / data["profile"].get(key, "")).is_file():
            err(f"profile.{key}", "圖片檔案不存在")
    for key in ("name", "tagline", "bio", "email"):
        if not data["profile"].get(key):
            err("profile", f"缺少 `{key}`")

    cats = {c["id"] for c in data["categories"]}
    seen = set()
    required = ["id", "title", "tagline", "category", "tags", "repo", "demo", "cover", "year", "team", "status", "updated"]
    for p in data["projects"]:
        pid = p.get("id", "<無 id>")
        where = f"projects.json[{pid}]"
        for k in required:
            if k not in p:
                err(where, f"缺少欄位 `{k}`")
        if not ID_RE.match(pid):
            err(where, "id 必須是小寫 kebab-case")
        if pid in seen:
            err(where, "id 重複")
        seen.add(pid)
        if p.get("category") not in cats:
            err(where, f"category `{p.get('category')}` 不在 categories 中")
        tags = p.get("tags", [])
        if len(tags) > 5:
            err(where, "tags 最多 5 個")
        for t in tags:
            if not TAG_RE.match(t):
                err(where, f"tag `{t}` 必須是小寫 kebab-case")
        if not str(p.get("repo", "")).startswith("https://github.com/"):
            err(where, "repo 必須是 GitHub 網址")
        if not isinstance(p.get("team"), bool):
            err(where, "team 必須是 true 或 false")
        if p.get("status") not in ("published", "draft"):
            err(where, "status 只能是 published 或 draft")
        try:
            date.fromisoformat(p.get("updated", ""))
        except ValueError:
            err(where, "updated 必須是 YYYY-MM-DD")
        if len(p.get("tagline", "")) > 32:
            warn(where, f"tagline {len(p['tagline'])} 字，建議 30 字以內")
        cover = p.get("cover")
        if cover:
            if not (ROOT / cover).is_file():
                err(where, f"cover 檔案不存在：{cover}")
            if not cover.startswith(f"content/img/{pid}/"):
                err(where, f"cover 必須放在 content/img/{pid}/")
        if not (PROJECT_DIR / f"{pid}.md").is_file():
            err(where, f"找不到 content/projects/{pid}.md")

    for md in PROJECT_DIR.glob("*.md"):
        if md.stem not in seen:
            err(f"projects/{md.name}", "沒有登記在 projects.json")
    return data


def check_markdown(p):
    pid = p["id"]
    path = PROJECT_DIR / f"{pid}.md"
    if not path.is_file():
        return
    where = f"projects/{pid}.md"
    text = path.read_text(encoding="utf-8")
    # 移除程式碼區塊，避免誤判
    body = re.sub(r"```.*?```", "", text, flags=re.S)
    lines = body.splitlines()

    h1 = [l[2:].strip() for l in lines if l.startswith("# ")]
    if len(h1) != 1:
        err(where, f"必須恰好一個 H1，目前 {len(h1)} 個")
    elif h1[0] != p["title"]:
        err(where, f"H1「{h1[0]}」與 title「{p['title']}」不一致")

    h2 = [l[3:].strip() for l in lines if l.startswith("## ")]
    if h2 != SECTIONS:
        err(where, f"## 章節必須依序為 {SECTIONS}，目前是 {h2}")

    found = re.findall(r"^>\s*\[!(\w+)\]", body, flags=re.M)
    for c in found:
        if c not in CALLOUTS:
            err(where, f"不支援的提示框 [!{c}]，只能用 {sorted(CALLOUTS)}")
    if found.count("SUMMARY") != 1:
        err(where, "必須恰好一個 [!SUMMARY]")
    if found.count("HIGHLIGHT") > 2:
        err(where, "[!HIGHLIGHT] 最多 2 個")

    # 技術架構表格的層級名稱
    arch = re.search(r"^## 技術架構\n(.*?)(?=^## )", body, flags=re.S | re.M)
    if arch:
        for row in re.findall(r"^\|\s*([^|]+?)\s*\|", arch.group(1), flags=re.M):
            if row in ("層級",) or set(row) <= set("-: "):
                continue
            if row not in LAYERS:
                err(where, f"技術架構層級「{row}」不在允許清單 {sorted(LAYERS)}")

    for alt, src in re.findall(r"!\[([^\]]*)\]\(([^)]+)\)", body):
        if not alt.strip():
            err(where, f"圖片缺少替代文字：{src}")
        if not src.startswith(f"content/img/{pid}/"):
            err(where, f"圖片必須放在 content/img/{pid}/：{src}")
        if not src.endswith(".webp"):
            err(where, f"圖片必須是 .webp：{src}")
        if not (ROOT / src).is_file():
            err(where, f"圖片不存在：{src}")

    for target in re.findall(r"\]\(project\.html\?id=([^)#]+)\)", body):
        if not (PROJECT_DIR / f"{target}.md").is_file():
            err(where, f"站內連結指向不存在的專案：{target}")

    if f"<{p['repo']}>" not in body and p["repo"] not in body:
        err(where, "「連結」章節必須包含 repo 網址")

    if p.get("team") and "### 我負責的部分" not in body:
        err(where, "團隊專案必須在「技術亮點」加上 ### 我負責的部分")
    plain = re.sub(r"`[^`]*`", "", body)  # 行內程式碼中的文字不算
    for bad in ("<script", "<style", "style="):
        if bad in plain:
            err(where, f"Markdown 中不能使用 `{bad}`")
    if re.search(r"[\U0001F300-\U0001FAFF\u2600-\u27BF]", body):
        err(where, "介紹頁不能使用 emoji")
    for word in SIMPLIFIED:
        if word in body:
            warn(where, f"疑似非台灣用語「{word}」")
    if re.search(r"[一-鿿][A-Za-z0-9]|[A-Za-z0-9][一-鿿]", re.sub(r"`[^`]*`|\(.*?\)|<[^>]*>", "", body)):
        warn(where, "有中英文 / 數字之間沒加空格的地方")


def main():
    data = check_manifest()
    if data:
        for p in data["projects"]:
            check_markdown(p)
    for w in warnings:
        print(w)
    for e in errors:
        print(e)
    n = len(data["projects"]) if data else 0
    if errors:
        print(f"\n檢查失敗：{len(errors)} 個錯誤、{len(warnings)} 個警告")
        sys.exit(1)
    print(f"✓ 檢查通過：{n} 個專案、{len(warnings)} 個警告")


if __name__ == "__main__":
    main()
