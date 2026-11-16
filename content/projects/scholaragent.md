# ScholaRAGent

> [!SUMMARY]
> Scholar + RAG + Agent。一個全端、開源的學術研究助理：持續從 arXiv 等來源蒐集論文、自動摘要並建立知識庫，讓你用自然語言提問，每個回答都附上可追溯到「哪篇論文、哪個章節」的引用。

## 為什麼做這個

在變化很快的研究領域跟上進度，是每天都要繳的稅。相關工作散落在 arXiv、研討會、社群討論與程式碼倉庫；全部讀完不可能，什麼都不讀又會錯過關鍵論文。而就算讀了，知識也被困在 PDF 資料夾或書籤裡，沒辦法回答問題。

我想做的是一個把「蒐集 → 閱讀 → 提問 → 綜整 → 寫作」串在一起的工具，而且**能在免費、本機的元件上跑起來**。

## 核心功能

- **多來源蒐集**：arXiv、AI 新聞 RSS、Hacker News、Reddit、GitHub trending，並支援使用者自訂 RSS；每篇都由 LLM 產生摘要與重點。
- **可追溯的問答**：混合檢索 + 重排序，回答串流輸出，引用精確到論文章節與連結。
- **知識圖譜**：方法、資料集、任務、指標的概念圖，加上引用網路與 PageRank 影響力排序。
- **研究專案工作流**：以「研究專案」為單位，引導走完 collect → read → ask → synthesize → write 五個階段。
- **寫作輔助**：文獻回顧與研究缺口、多論文方法比較表、LaTeX 草稿、BibTeX / Obsidian 匯出。
- **三種介面**：React 網頁儀表板、17 個 slash command 的 Discord bot、REST / SSE API。

## 技術架構

| 層級 | 技術 |
|---|---|
| 前端 | React 19、Vite、Primer |
| 後端 | FastAPI（routers → services → domain modules）、APScheduler |
| AI / 模型 | Groq（OpenAI 相容 API）、sentence-transformers 本機 embedding |
| 檢索 | FAISS / HNSW、BM25、RRF 融合、cross-encoder rerank、知識圖譜 |
| 資料 | SQLite + FAISS，或 Postgres + pgvector（同一個 store 介面） |
| 測試 / CI | 600+ 個測試、GitHub Actions |

API 層刻意做得很薄：router 只處理 HTTP 驗證與 SSE 封裝，用例邏輯在 service，領域模組（`rag/`、`graph/`、`agent/`、`recommend/`、`crawlers/`）彼此獨立、以建構子注入協作者。所有持久化都經過單一 store 介面，所以從 SQLite + FAISS 換成 Postgres + pgvector 不需要改任何呼叫端程式碼。

## 技術亮點

### 兩種互補的檢索表示

同一份語料同時建成「向量 + 詞彙索引」與「知識圖譜」：前者用來找具體段落，後者用來推理整個領域的結構（社群偵測與社群摘要支援 global search）。查詢會依問題類型路由到 local 或 global 檢索。

### 進階 RAG 技術組合

查詢改寫（HyDE、multi-query、decomposition）、parent-document retrieval、contextual chunk embedding、語意答案快取，以及 self-reflective / corrective retrieval 與多代理的「撰寫—批評」迴圈。

> [!HIGHLIGHT] 自己實作評估，而不是多裝 41 個套件
> 引入 `ragas` 會帶進 41 個間接相依與兩個版本衝突，所以我直接用幾百行程式碼實作 RAGAS 風格的 faithfulness、answer relevancy、context precision / recall。另一條「純離線」評估軌（precision@k、MRR、引用正確率）不需要 LLM，可以當 CI 的回歸關卡。

### 個人化推薦

用 Bradley-Terry 偏好模型從點擊、按讚、訂閱、評分與提問中學習排序權重，並用 LSTM 對關鍵字時間序列做趨勢預測，產生每週摘要。

## 成果展示

| 項目 | 規模 |
|---|---|
| 測試 | 600+ 個通過 |
| Discord 指令 | 17 個 slash command（`/ask`、`/deepresearch`、`/litreview`…） |
| 資料來源 | arXiv、RSS、Hacker News、Reddit、GitHub、X，以及 OpenAlex DOI 解析 |

```bash
POST /api/eval  {"engine": "offline"}   # 決定性指標，永遠可用
POST /api/eval  {"engine": "judge"}     # LLM-as-judge 指標
```

## 連結

- **GitHub**：<https://github.com/ShiYu0318/ScholaRAGent>
- **相關專案**：[EmbAId Agent](project.html?id=embaid-agent)、[JevRAG](project.html?id=jevrag)
