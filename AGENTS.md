# AGENTS.md — ShiYu 作品集（shiyu-portfolio）

> 這份文件寫給「要在這個專案裡新增或修改內容的 AI（以及人類）」。
> 動手前請完整讀過一次。規則與使用者當下的指示衝突時，以使用者指示為準，並在回覆中說明你偏離了哪一條。

---

## 1. 專案目的

這是 **黃士育（ShiYu, GitHub: [@ShiYu0318](https://github.com/ShiYu0318)）** 的個人作品集網站，用來介紹他在 GitHub 上的專案。

- **讀者**：教授、實驗室、競賽評審、實習面試官、想合作的同學。他們通常只會花 30 秒掃過首頁，再挑 1～2 個專案點進去看。
- **一個專案 = 一篇 Markdown 介紹頁**，首頁的精選、索引、篩選、專案編號與上一個 / 下一個全部由 `content/projects.json` 驅動。
- 站點是**純靜態網站**（HTML + CSS + 原生 JS），部署在 GitHub Pages，**沒有 build step**。

> **新增一個作品 = 新增一個 `.md` 檔 + 在 `content/projects.json` 加一筆資料（+ 選擇性放截圖）。不需要寫任何 HTML。**

---

## 2. 檔案結構

```
shiyu-portfolio/
├── AGENTS.md                 ← 本文件：專案規則的唯一真相來源
├── CLAUDE.md                 ← 只是指向 AGENTS.md，不要在裡面寫規則
├── README.md                 ← 給人類看的簡介
├── index.html                ← 首頁：自我介紹 + 精選專案 + 專案索引（JS 讀 projects.json 產生）
├── project.html              ← 專案介紹頁：project.html?id=<project-id>
├── .nojekyll                 ← 讓 GitHub Pages 不要跑 Jekyll
├── assets/
│   ├── style.css             ← 全站唯一的樣式表
│   └── app.js                ← 全站唯一的 JS
├── content/
│   ├── projects.json         ← 個人資料 + 分類 + 專案清單（manifest）
│   ├── projects/
│   │   └── <project-id>.md   ← 每個專案一個介紹檔
│   └── img/
│       ├── profile/          ← avatar.webp（favicon）、portrait.webp（首頁照片）
│       └── <project-id>/     ← 該專案的截圖
├── templates/
│   └── project-template.md   ← 新專案介紹的起手式
└── scripts/
    └── check.py              ← 一致性檢查，改完內容一定要跑
```

### 禁止事項

- ❌ 不要為某個專案新增獨立的 `.html`；所有介紹頁都由 `project.html` 渲染。
- ❌ 不要新增第二個 CSS / JS 檔，也不要在 Markdown 裡寫 `<style>`、`<script>`、行內 `style=""`。
- ❌ 不要引入 npm、打包工具或前端框架。外部函式庫只允許 `project.html` 已經從 CDN 載入的 `marked`、`highlight.js`。
- ❌ **不要介紹私有（private）repo，也不要介紹 fork 來的 repo**，除非使用者明確要求。私有 repo 的名稱、內容都不能出現在網站上。
- ❌ 不要捏造數據。星數、測試數量、效能數字、得獎紀錄只能寫 **repo README 或使用者親口提供** 的內容。
- ❌ 不要改已發佈專案的 `id`（會讓舊連結失效）。

---

## 3. 命名與放置規則

### 3.1 專案 id

- 由 repo 名稱轉成**小寫 kebab-case**：`EmbAId-Agent` → `embaid-agent`、`Isaac-Sim2Sim-RL` → `isaac-sim2sim-rl`、`mAIjong` → `maijong`。
- 只能包含 `a-z`、`0-9`、`-`。
- 介紹檔放在 `content/projects/<id>.md`，**檔名與 id 完全一致**。
- 一個 repo 只對應一個 id；多個 repo 屬於同一個主題時（例如 SCIST 寒訓教材 + 授課紀錄），合併成一篇並在 `repo` 放主要那個，其他寫在「連結」章節。

### 3.2 圖片

- 放在 `content/img/<id>/`，檔名 kebab-case，格式一律 **`.webp`**、寬度最大 1400px（用 Pillow 轉檔，quality 82 左右）。
- 優先取用 repo 裡**既有的截圖**（`assets/screenshots/`、`media/`、`.github/assets/` 等），不要自己生成假截圖。
- Markdown 用**相對網站根目錄**的路徑：`![替代文字](content/img/maijong/table.webp)`。替代文字必填，描述畫面內容。
- 單一專案圖片總量建議 < 500 KB。

---

## 4. `content/projects.json` 格式

```jsonc
{
  "profile": {                       // 首頁上方個人簡介，通常不用動
    "name": "黃士育", "nameEn": "ShiYu Huang", "handle": "ShiYu0318",
    "avatar": "content/img/profile/avatar.webp",      // 方形小圖，當 favicon
    "portrait": "content/img/profile/portrait.webp",  // 首頁右側照片，會裁成 4:5
    "tagline": "國立中央大學資訊工程學系",              // 標題上方那行小字
    "headline": "把研究問題做成真的能用的系統",        // 首頁主標題，一句話、不加句號
    "bio": "...",                                     // 一段話，只寫查得到出處的事實
    "links": [{ "label": "GitHub", "url": "https://github.com/ShiYu0318" }]
  },
  "categories": [                    // 篩選按鈕，順序 = 顯示順序
    { "id": "ai-rag", "title": "LLM・RAG・Agent" }
  ],
  "projects": [
    {
      "id": "maijong",                                // = 檔名
      "title": "mAIjong 麥醬",                         // 顯示名稱，可用專案自己的大小寫
      "tagline": "一句話，30 字以內",                   // 卡片副標
      "category": "games-rl",                         // 必須存在於 categories
      "tags": ["python", "fastapi", "pytorch"],       // 小寫 kebab-case，最多 5 個，放技術名
      "repo": "https://github.com/ShiYu0318/mAIjong", // 必填
      "demo": null,                                   // 有線上展示才填網址，否則 null
      "cover": "content/img/maijong/table.webp",      // 主要畫面；精選與專案頁標頭使用，可為 null（就不顯示圖）
      "year": 2026,                                   // 主要開發年份
      "featured": true,                               // true 且有 cover 才會以圖文大列呈現，全站最多 3 個
      "status": "published",                          // published | draft（draft 不出現在首頁）
      "updated": "2026-11-16"                         // YYYY-MM-DD，每次改內容都要更新
    }
  ]
}
```

規則：

1. `projects` 陣列的**順序就是首頁顯示順序**，也決定**專案編號**（已發佈的第 1 個是 `No. 01`）與「上一個 / 下一個」。精選放最前面，其他依重要性排。
2. `featured: true` 的專案最多 **3** 個，而且**必須有 `cover`**。首頁用圖文交錯的大列呈現它們，其餘專案進「索引」條列（編號、名稱、一句話、領域、年份），**不顯示縮圖**。
3. `cover` 優先用最能代表專案的真實截圖，比例最好接近 16:10；比例差很多時（例如 2:1 的品牌圖），用圖片原本的底色補邊到 16:10，不要讓它被裁切。
4. JSON 必須合法（不能有註解、尾逗號）；上面的 `jsonc` 只是說明。

---

## 5. 專案介紹頁寫作規範

**每篇都必須依照 `templates/project-template.md` 的骨架**，`##` 章節名稱與順序固定：

```markdown
# <專案名稱>                ← 與 projects.json 的 title 完全相同，全篇唯一 H1

> [!SUMMARY]
> 兩三句話：這是什麼、解決什麼問題、給誰用。

## 為什麼做這個             ← 動機 / 要解決的問題，1～2 段
## 核心功能                 ← 條列，3～6 點，每點粗體開頭
## 技術架構                 ← 一張「層級 | 技術」表格 + 簡短資料流說明
## 技術亮點                 ← 2～4 個 ### 小節，寫「難在哪、怎麼解」
## 成果展示                 ← 截圖、數據表格；沒有截圖就寫目前進度
## 連結                     ← 固定條列格式（見 5.5）
```

可以在章節底下加 `###`，但**不要新增或改名 `##` 章節**——介紹頁左側目錄由 `##`/`###` 自動產生，結構一致讀者才好比較不同專案。

### 5.1 語氣與用字

- **繁體中文（台灣用語）**：「程式碼」不是「代碼」、「資料庫」不是「數據庫」、「影片」不是「視頻」。
- 專有名詞保留英文原文：RAG、FastAPI、PPO、Isaac Lab，不要硬翻。
- 中文與英文、數字之間加半形空格：`用 FastAPI 寫了 20 個端點`。
- 以第一人稱「我」敘述，語氣像在面試時介紹自己的專案：具體、有自信、不浮誇。**不要**用「極致」、「革命性」、「完美」這類空泛形容詞。
- 每一段都要能回答「所以呢？」——寫功能時順便說它對使用者或研究的意義。

### 5.2 「技術架構」表格

固定兩欄：

```markdown
| 層級 | 技術 |
|---|---|
| 前端 | Next.js 15、React 19、PixiJS 8 |
| 後端 | FastAPI、WebSocket、SQLAlchemy |
```

層級名稱從這些選：`前端`、`後端`、`AI / 模型`、`檢索`、`資料`、`模擬`、`基礎設施`、`測試 / CI`。用不到的列不要寫。

### 5.3 提示框（Callout）

只有以下四種，不要自創：

| 語法 | 用途 |
|---|---|
| `> [!SUMMARY]` | 開頭的摘要，每篇恰好一個，放在 H1 正下方；會顯示成大字導言，沒有框 |
| `> [!HIGHLIGHT] 標題` | 「技術亮點」中最想讓人記住的一點，全篇最多 2 個 |
| `> [!NOTE]` | 補充說明、限制、授權資訊 |
| `> [!WIP]` | 開發中 / 尚無成果的誠實說明 |

`[!TYPE]` 後面同一行的文字會成為標題（可省略）。提示框只是左側一條細線，**不要在標題或內文放 emoji**。

### 5.4 程式碼與數據

- 程式碼區塊一定要標語言：` ```python `、` ```bash `、` ```ts `。介紹頁不是教學，**一段程式碼不超過 15 行**，只放最能代表設計的片段（API 用法、指令）。
- 數據表格要寫清楚條件（測試環境、次數），並與 repo README 一致。

### 5.5 「連結」章節格式

固定使用以下條列，沒有的項目整行刪掉：

```markdown
- **GitHub**：<https://github.com/ShiYu0318/xxx>
- **線上展示**：<https://...>
- **文件 / 簡報**：<https://...>
- **相關專案**：[mAIjong 麥醬](project.html?id=maijong)
```

站內互連一律寫 `project.html?id=<id>`。

---

## 6. 視覺風格（給要改 CSS / JS 的人）

這一節是設計的規則。版面方向參考 [unslop](https://github.com/heydamir/unslop)（Damir Sokolovsky，CC BY 4.0）的原則改寫：**外框保持安靜，把顏色與細節留給一兩個真正的內容**。改任何樣式前先讀完。

### 6.1 方向

| 項目 | 內容 |
|---|---|
| 產品 | 讓教授、實驗室與面試官 30 秒內看懂 ShiYu 做了什麼、最值得點開哪一個 |
| 個性 | 安靜、精確、像實驗室筆記 |
| 世界 | 深夜的研究室：頭像的海軍藍帽 T 與冷白牆面 |
| 重點畫面 | 首頁的照片與精選專案的真實截圖；整頁只有它們有顏色 |
| 標誌細節 | 專案編號 `No. 01`（等寬字、灰色），只出現在首頁精選 / 索引、專案頁標頭與上一個 / 下一個 |

**模板檢查**：把名字換成別人，這個頁面還成立嗎？成立的話，代表文案或畫面不夠具體。

### 6.2 顏色

只用 `assets/style.css` 開頭 `:root` 的變數，**禁止在其他地方寫死色碼**。

| 變數 | 色碼 | 用途 |
|---|---|---|
| `--bg` | `#081227` | 頁面底色（帽 T 最深處） |
| `--surface` | `#0c1a31` | 程式碼區、分段控制、hover 底 |
| `--raised` | `#12233f` | 選取中的項目、行內程式碼 |
| `--line` / `--line-strong` | 冷白 8% / 14% | 所有分隔線與邊框 |
| `--text` / `--text-2` / `--muted` | `#e6e5ea` / `#a7aec0` / `#7d879e` | 文字只有這三種角色 |
| `--accent` | `#8aa9e8` | **唯一**的強調色：hover、目錄目前位置、HIGHLIGHT。一頁不超過幾處 |
| `--wip` | `#d9b26a` | 只給 WIP 提示框 |

主要按鈕是冷白底、深色字（`--button-bg`），不是藍色按鈕。

**禁止**：漸層（背景、文字、按鈕都不行）、發光陰影、放射狀色塊、彩色邊框。深度只靠底色深淺與細線；唯一的陰影是截圖底下的中性陰影（`--image-shadow`）。

### 6.3 字體與文字

- 介面 `IBM Plex Sans` + `Noto Sans TC`，編號、日期、技術清單用 `IBM Plex Mono`。
- 字重只用 400、500，600 只給文字 logo。**不要 700 以上的粗標題**，層級靠大小與顏色。
- 不用全大寫加寬字距的標籤，不用斜體強調。數字一律 `tabular-nums`。
- 技術標籤不做成膠囊，寫成等寬灰字 `python / fastapi / pytorch`。
- 介面文字不用驚嘆號、不放 emoji；按鈕、標籤、標題結尾不加句號。

### 6.4 間距、圓角與版面

- 所有間距是 4 的倍數（4、8、12、16、20、24、32、40、48、64、80、96、112、128）。
- 圓角：小東西 6、按鈕 / 輸入 8、卡片與截圖 12–16。不是每樣東西都是膠囊。
- 首頁：自我介紹是 7:5 左右分欄（文字 + 照片），下面是「專案」標題 + 分段篩選 → 精選大列（圖文左右交錯）→ 索引條列。**不要回到等寬卡片牆。**
- 專案頁：標頭（編號、標題、一句話、GitHub 按鈕、技術清單）→ 封面截圖 → 左側目錄 + 720px 內文。
- 手機（< 760px）全部改單欄，索引只留編號與名稱。

### 6.5 動態

- 只有一次進場：淡入並上移 8px（`.enter`），最多錯開 3 個元素。
- hover 只改顏色或底色，不放大、不位移、不加光暈。按下按鈕可縮到 0.98。
- 只用一條曲線 `--ease`，時間 120–180ms（hover）、300–500ms（進場）。不要 `transition: all`。

---

## 7. AI 的標準工作流程

### 情境 A：「幫我把 repo X 加進作品集」

1. **確認是公開、非 fork 的 repo**；不是的話先停下來問使用者。
2. 讀 repo 的 `README`（含 `README.zh-TW.md`）、目錄結構、`package.json` / `pyproject.toml`，蒐集：用途、功能、技術、可用截圖、數據。
3. 決定 `id`（§3.1），把截圖轉成 webp 放到 `content/img/<id>/`（§3.2）。
4. 複製 `templates/project-template.md` 為 `content/projects/<id>.md`，依 §5 填寫。**所有事實都要能在 repo 裡找到出處。**
5. 在 `projects.json` 的 `projects` 陣列加一筆，`status` 預設 `"draft"`；使用者要求發佈才改 `"published"`。若要設 `featured`，先確認它有 `cover` 且總數不超過 3。
6. 執行 `python3 scripts/check.py`，修到沒有錯誤。
7. 回報：新增的檔案、`id`、你不確定而需要使用者確認的地方。

### 情境 B：「更新某個專案的介紹」

1. 只改該篇 `.md`，並把 `projects.json` 中該筆的 `updated` 改成今天。
2. 不要順手改寫其他章節的語氣，除非使用者要求。
3. 執行 `python3 scripts/check.py`。

### 情境 C：「改網站外觀 / 功能」

1. 只能動 `assets/style.css`、`assets/app.js`、`index.html`、`project.html`。
2. 改完至少打開首頁（桌面與手機寬度）與一篇介紹頁確認：篩選、精選大列、索引、編號、提示框、程式碼上色、目錄、上一個 / 下一個都正常。
3. 對照 §6 再檢查一次：有沒有出現漸層、光暈、膠囊標籤、粗標題、emoji、hover 放大。
4. 若新增了 Markdown 語法，**同步更新本文件 §5 與 `templates/project-template.md`**，並更新 `scripts/check.py`。

### 本機預覽

網站用 `fetch()` 讀檔，不能直接雙擊 HTML，請在專案根目錄執行：

```bash
python3 -m http.server 8000
# 打開 http://localhost:8000
```

---

## 8. 完成前檢查清單

- [ ] `python3 scripts/check.py` 通過
- [ ] H1 與 `projects.json` 的 `title` 完全一致
- [ ] 恰好一個 `[!SUMMARY]`，六個 `##` 章節齊全且順序正確
- [ ] 所有圖片都是 `.webp`、在 `content/img/<id>/` 下、有替代文字
- [ ] 沒有私有 repo 的資訊、沒有捏造的數字
- [ ] 全文繁體中文、中英之間有空格
- [ ] `updated` 已更新
- [ ] 沒有違反 §6 的視覺規則（若改了樣式）
