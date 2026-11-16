# shiyu-portfolio

黃士育（ShiYu）的 GitHub 專案作品集。

🔗 **網站**：<https://shiyu0318.github.io/NCCU-GenAI-HW/>

這是一個「**用規則驅動 AI 持續擴充**」的靜態網站：每個專案是一篇 Markdown，網站外觀與內容格式全部由 [`AGENTS.md`](./AGENTS.md) 規範。想新增作品時，只要對 AI 說：

> 依照 AGENTS.md，把 `ShiYu0318/某個repo` 加進作品集。

AI 就會讀 repo、轉檔截圖、照範本寫介紹、登記到 `content/projects.json`，最後跑 `scripts/check.py` 驗證。

## 結構

```
index.html / project.html   兩個頁面，內容全部由 JS 從 content/ 讀取
assets/                     唯一的 style.css 與 app.js
content/projects.json       個人資料、分類、專案清單
content/projects/*.md       每個專案一篇介紹
content/img/<id>/           截圖（webp）
templates/                  新專案介紹的範本
scripts/check.py            規則檢查
```

## 本機預覽

```bash
python3 -m http.server 8000
python3 scripts/check.py
```

## 技術

純 HTML / CSS / JavaScript，無 build step；Markdown 由 [marked](https://github.com/markedjs/marked) 渲染，程式碼由 [highlight.js](https://highlightjs.org/) 上色。部署於 GitHub Pages。
