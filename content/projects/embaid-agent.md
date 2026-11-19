# EmbAId Agent

> [!SUMMARY]
> 用一個 `<script>` 標籤，就能把可自訂、可自架的 AI 助理嵌進任何網站。它根據你自己的內容回答問題，即時顯示檢索進度、附上來源引用，並在證據不足時誠實拒答。

## 為什麼做這個

很多網站想要一個「懂自己內容」的客服或導覽助理，但現成方案不是要把資料交給第三方，就是只會照著 prompt 亂答。我想做一個**資料自己掌握、回答可以追溯、不確定時會說不知道**的平台，並且讓非工程背景的人也能幾分鐘內嵌進網站。

## 核心功能

- **多種資料來源**：上傳 PDF / DOCX / Markdown、爬取網站（遵守 `robots.txt`、支援 sitemap）、連接 Notion 與 Google Docs。
- **看得見的推理過程**：回答前以串流事件顯示「理解問題 → 檢索 → 比對候選段落 → 判斷證據」，接著逐字輸出答案。
- **可設定的信心門檻**：證據分數不足時以多語言拒答，而不是硬掰。
- **引用回溯**：每個答案都連回原始文件標題與網址。
- **多租戶平台**：組織 / 使用者 / 專案、三種 API key、每把 key 的來源白名單與速率限制。
- **零依賴嵌入元件**：Vanilla TypeScript + Shadow DOM，不會污染宿主網站的樣式。

## 技術架構

| 層級 | 技術 |
|---|---|
| 前端 | Next.js 15 儀表板、Vanilla TS widget（esbuild、Shadow DOM）、原生 WebGL 首頁 |
| 後端 | FastAPI、SSE 串流、arq + Redis 背景工作 |
| AI / 模型 | LangChain 整合 Anthropic / OpenAI / Ollama，每個專案可選 |
| 檢索 | FAISS 或 pgvector、SQLite FTS5 或 Postgres `tsvector`、cross-encoder rerank |
| 資料 | SQLAlchemy 2 async、S3 / MinIO（可退回本機檔案系統） |
| 測試 / CI | pytest、Vitest、ruff、mypy、GitHub Actions、Docker Compose |

訪客在 widget 提問 → 後端依對話脈絡改寫問題 → 平行執行向量與詞彙檢索 → RRF 融合、重排序、套用可信度與過期懲罰 → 通過信心門檻才生成答案，並以 SSE 逐字回傳。

## 技術亮點

### 為中文調校的 RAG 管線

切塊策略針對中英混排調整，詞彙檢索用 jieba 斷詞、OpenCC 做繁簡正規化，讓繁體中文內容也能被準確召回。

> [!HIGHLIGHT] 不是「永遠有答案」，而是「答得出來才答」
> 檢索結果在進入生成前會先經過可信度加權與過期懲罰，再和專案設定的門檻比較；不夠就拒答。這讓助理在面對知識庫以外的問題時不會胡說。

### 本機與雲端兩套後端，同一份程式碼

本機開發用 FAISS + SQLite FTS5，部署時切到 pgvector + Postgres `tsvector`；佇列、物件儲存也都有本機退路，沒有 Redis 或 S3 也能完整跑起來。

## 成果展示

![EmbAId Agent 首頁：銀河背景與展開的對話框，顯示推理步驟與附引用的回答](content/img/embaid-agent/hero.webp)

![嵌入在示範網站中的聊天元件](content/img/embaid-agent/widget-demo.webp)

![管理後台的 Playground：調整模型與門檻後即時測試](content/img/embaid-agent/dashboard-playground.webp)

> [!WIP]
> 目前是預先定義的檢索管線。由模型自行選擇工具、主動澄清問題、多輪檢索等 agentic 功能列在研究 roadmap 上。

## 連結

- **GitHub**：<https://github.com/ShiYu0318/EmbAId-Agent>
- **線上展示**：<https://embaid-agent.vercel.app>
- **相關專案**：[ScholaRAGent](project?id=scholaragent)
