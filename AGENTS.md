# AGENTS.md — ShiYu 作品集（shiyu-portfolio）

> 這份文件寫給「要在這個專案裡新增或修改內容的 AI（以及人類）」。
> 動手前請完整讀過一次。規則與使用者當下的指示衝突時，以使用者指示為準，並在回覆中說明你偏離了哪一條。

---

## 1. 專案目的

這是 **黃士育（ShiYu, GitHub: [@ShiYu0318](https://github.com/ShiYu0318)）** 的個人作品集網站，用來介紹他在 GitHub 上的專案。

- **讀者**：教授、實驗室、競賽評審、實習面試官、想合作的同學。他們通常只會花 30 秒掃過首頁，再挑 1～2 個專案點進去看。
- **一個專案 = 一篇 Markdown 介紹頁**，首頁的三種檢視（交錯 / 矩陣 / 表格）、篩選、專案編號與上一個 / 下一個全部由 `content/projects.json` 驅動。
- 站點是**純靜態網站**（HTML + CSS + 原生 JS），部署在 GitHub Pages，**沒有 build step**。用到的函式庫都放在 `assets/vendor/`，不依賴 CDN。

> **新增一個作品 = 新增一個 `.md` 檔 + 在 `content/projects.json` 加一筆資料（+ 選擇性放截圖）。不需要寫任何 HTML。**

---

## 2. 檔案結構

```
shiyu-portfolio/
├── AGENTS.md                 ← 本文件：專案規則的唯一真相來源
├── CLAUDE.md                 ← 只是指向 AGENTS.md，不要在裡面寫規則
├── README.md                 ← 給人類看的簡介
├── index.html                ← 首頁：自我介紹 + 專案（交錯 / 矩陣 / 表格三種檢視，JS 讀 projects.json 產生）
├── project.html              ← 專案介紹頁：project.html?id=<project-id>
├── favicon.ico               ← 分頁圖示（GitHub 頭像的黑貓，16/32/48px）
├── .nojekyll                 ← 讓 GitHub Pages 不要跑 Jekyll
├── assets/
│   ├── style.css             ← 全站唯一的樣式表
│   ├── app.js                ← 全站唯一的自寫 JS
│   └── vendor/               ← 第三方函式庫（只放 minified 檔，不要修改）
│       ├── gsap.min.js、ScrollTrigger.min.js、SplitText.min.js、Flip.min.js   ← 動態
│       ├── marked.min.js     ← Markdown 轉 HTML
│       └── highlight.min.js、github-dark.min.css                         ← 程式碼上色
├── content/
│   ├── projects.json         ← 個人資料 + 分類 + 專案清單（manifest）
│   ├── projects/
│   │   └── <project-id>.md   ← 每個專案一個介紹檔
│   └── img/
│       ├── profile/          ← favicon-32.png、favicon-180.png（分頁圖示，取自 GitHub 頭像的黑貓）、portrait.webp（首頁圓形照片）、github-avatar.webp（頁尾點陣用的黑貓頭像）
│       └── <project-id>/     ← 該專案的截圖
├── templates/
│   └── project-template.md   ← 新專案介紹的起手式
└── scripts/
    └── check.py              ← 一致性檢查，改完內容一定要跑
```

### 禁止事項

- ❌ 不要為某個專案新增獨立的 `.html`；所有介紹頁都由 `project.html` 渲染。
- ❌ 不要新增第二個自寫的 CSS / JS 檔，也不要在 Markdown 裡寫 `<style>`、`<script>`、行內 `style=""`。
- ❌ 不要引入打包工具或前端框架（React、Vue、Tailwind…）。函式庫只能是 `assets/vendor/` 裡已有的那幾個；真的要加新的，先問使用者，並同步更新本節。
- ❌ **不要介紹私有（private）repo**，除非使用者明確要求。私有 repo 的名稱、內容都不能出現在網站上。
- ❌ **fork 來的 repo 只有在裡面有 ShiYu 的 commit 時才能放**（用 `git log --all --author` 確認，作者可能是 `ShiYu`、`士育`、`4yü` 或 `89064538+ShiYu0318@users.noreply.github.com`）。放上去時 `team` 設 `true`，並在「技術亮點」加一個 `### 我負責的部分` 小節，寫清楚 commit 數與負責的內容。
- ❌ 不放課程作業（例如 `NCKU-Intro2AI`、`NTHU-NLP-HW`、`NCU-CSIE-*-HW`）、空 repo，以及只有檔案、沒有說明的 repo（例如只放講義 PDF 或題目測資）。
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
    "portrait": "content/img/profile/portrait.webp",  // 首頁右側的圓形照片（正方形原圖，顯示 280px）
    "githubAvatar": "content/img/profile/github-avatar.webp", // GitHub 頭像，頁尾用點陣畫出來
    "tagline": "國立中央大學資訊工程學系",              // 標題上方那行小字
    "bio": "...",                                     // 自我介紹，見下方規則 5
    "email": "hi@4yu.dev",                            // 頁尾的大字聯絡信箱，點擊會複製
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
      "cover": "content/img/maijong/table.webp",      // 主要畫面；交錯、矩陣、表格預覽與專案頁標頭都用它。null 時自動畫一張專案資訊卡
      "year": 2026,                                   // 主要開發年份
      "team": false,                                  // 團隊專案（含有貢獻的 fork）設 true，會標示「團隊」
      "status": "published",                          // published | draft（draft 不出現在首頁）
      "updated": "2026-11-16"                         // YYYY-MM-DD，每次改內容都要更新
    }
  ]
}
```

規則：

1. `projects` 陣列的**順序就是首頁顯示順序**，也決定**專案編號**（已發佈的第 1 個是 `No. 01`）與「上一個 / 下一個」。最想讓人看到的放前面。
2. 首頁的**每一個**已發佈專案都會出現在三種檢視裡，沒有「精選才能用大版面」這種區別：
   - **交錯**（預設）：圖文左右交錯的大列。
   - **矩陣**：所有專案排成一整面格子，一眼看完。
   - **表格**：編號、名稱、一句話、領域、年份的條列；滑過有 `cover` 的列會浮出預覽。
   使用者的選擇會記在 localStorage，切換時同一個專案用 Flip 變形過去。
3. `cover` 優先用最能代表專案的真實截圖，論文類可以用論文裡的圖；**真的沒有圖就設 `null`**，網站會用程式畫一張專案資訊卡（路徑、名稱、技術、編號），不要自己做假截圖，比例最好接近 16:10；比例差很多時（例如 2:1 的品牌圖），用圖片原本的底色補邊到 16:10，不要讓它被裁切。
4. 首頁沒有大標題，`bio` 就是首頁的主要文字（大字）。`bio` 寫的是**人**，不是專案：身分、研究方向、經歷與教學。來源是 CV（`ShiYu0318/ShiYu-CV`）與使用者說過的近況。**不要在自我介紹裡列舉特定專案**，專案會增減，介紹不該跟著過時；年級、職位這類會變的資訊，變動時要一起更新。
5. JSON 必須合法（不能有註解、尾逗號）；上面的 `jsonc` 只是說明。

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
| 世界 | 深夜的研究室：GitHub 頭像裡戴耳機的黑貓，背後一片電光藍的當機畫面 |
| 重點畫面 | 專案的真實截圖，以及頁尾用點陣畫出的 GitHub 頭像（黑貓）；首頁的本人照片是一般照片、圓形小框 |
| 標誌細節 | 專案編號 `No. 01`（等寬字、灰色），出現在首頁三種檢視、專案頁標頭與上一個 / 下一個 |

**模板檢查**：把名字換成別人，這個頁面還成立嗎？成立的話，代表文案或畫面不夠具體。

### 6.2 顏色

配色取自 **GitHub 頭像（戴耳機的黑貓 + 電光藍背景）**。首頁顯示的是本人照片（`portrait.webp`，一般照片、圓形框、不加效果）；點陣效果只用在頁尾的 GitHub 頭像，**不要套在本人照片上**。

只用 `assets/style.css` 開頭 `:root` 的變數，**禁止在其他地方寫死色碼**。

| 變數 | 色碼 | 來源 / 用途 |
|---|---|---|
| `--bg` | `#07081a` | 黑貓的黑帶一點靛色，頁面底色 |
| `--surface` | `#0d0f24` | 程式碼區、分段控制、hover 底 |
| `--raised` | `#161a33` | 耳機的靛灰，選取中的項目、行內程式碼 |
| `--line` / `--line-strong` | 白 8% / 14% | 所有分隔線與邊框 |
| `--text` / `--text-2` / `--muted` | `#eef0ff` / `#abb4dc` / `#7c84ab` | 眼睛的白、字幕的淡藍白；文字只有這三種角色 |
| `--brand` | `#1533f3` | 頭像背景的電光藍，**只當填色**：主要按鈕（白字，對比 8.7:1）、游標的「複製」標籤、頁尾點陣頭像的藍色背景、頂端 2px 進度條 |
| `--accent` | `#7f93ff` | 電光藍提亮後的文字版：hover、目錄目前位置、HIGHLIGHT。一頁不超過幾處 |
| `--wip` | `#e0b866` | 只給 WIP 提示框 |

- `--brand` 放在深底上當文字只有 2.3:1，太暗，**不能拿來寫字或當細線**，文字一律用 `--accent`。
- `--brand` 只出現在上面列的地方，不要再加新的用途。

**禁止**：漸層文字與彩色漸層背景、發光陰影、放射狀色塊、彩色邊框，也不要把頭像的電光藍鋪成大面積背景（資訊卡的點狀底紋、等高線游標附近的提亮與邊緣淡出遮罩是允許的 `radial-gradient` 用法）。深度只靠底色深淺與細線；唯一的陰影是截圖底下的中性陰影（`--image-shadow`）。

### 6.3 字體與文字

- 左上角回首頁的標誌是等寬字的 `~/4yü`（`~/` 用 `--accent`），不用本名、不放圖片；換頁布幕中間也用同一個標誌。

- 介面 `IBM Plex Sans` + `Noto Sans TC`，編號、日期、技術清單用 `IBM Plex Mono`。
- 字重只用 400、500，600 以上不用。**不要 700 以上的粗標題**，層級靠大小與顏色。
- 不用全大寫加寬字距的標籤，不用斜體強調。數字一律 `tabular-nums`。
- 技術標籤不做成膠囊，寫成等寬灰字 `python / fastapi / pytorch`。
- 介面文字不用驚嘆號、不放 emoji；按鈕、標籤、標題結尾不加句號。

### 6.4 間距、圓角與版面

- 所有間距是 4 的倍數（4、8、12、16、20、24、32、40、48、64、80、96、112、128）。
- 圓角：小東西 6、按鈕 / 輸入 8、卡片與截圖 12–16。不是每樣東西都是膠囊。
- 首頁：自我介紹是 7:5 左右分欄（文字 + 280px 圓形照片，手機版縮成 120px 放在最上面）→ 技術標籤跑馬燈 →「專案」標題 + 分段篩選（附數量）+ 檢視切換（交錯 / 矩陣 / 表格）→ 頁尾（大字信箱 + 點陣頭像）。
- 專案頁：標頭（編號、標題、一句話、GitHub 按鈕、技術清單）→ 封面截圖 → 左側目錄 + 720px 內文。
- 手機（< 760px）全部改單欄，索引只留編號與名稱。

### 6.5 動態與互動

網站刻意做了很多動態與滑鼠互動，參考 GSAP、Lenis、Motion、anime.js、Fluid Functionalism、threeui 等函式庫與網站的手法。全部寫在 `assets/app.js` 的 `FX` 物件與各 render 函式中，用 `assets/vendor/` 的 GSAP（ScrollTrigger、SplitText、Flip、ScrambleText）與 Lenis 實作。**新增效果時，在這張表加一列。**

| 位置 | 效果 |
|---|---|
| 全站捲動 | Lenis 平滑捲動，與 ScrollTrigger 同步；站內錨點也用 Lenis 捲過去 |
| 游標 | 自訂游標：小點緊跟、圓圈延遲跟隨；移到連結與專案時圓圈放大、移到信箱變成電光藍的「複製」標籤 |
| 按鈕與連結 | 磁吸：游標靠近時被吸過去一點，離開後彈回 |
| 換頁 | 布幕從下蓋上、中間出現 `~/4yü`，新頁面載入後布幕往上收 |
| 導覽列 | 流體 hover：底色滑到游標所在的連結 |
| 頂端進度條 | 2px 電光藍，跟著捲動 / 閱讀進度 |
| Hero 背景 | 等高線地形：Perlin noise 高度場用 marching squares 畫成細線，約 30fps 緩慢流動；游標處隆起一座小山、附近的線變成 `--accent`；邊緣用 mask 淡出，畫面外暫停 |
| Hero 照片 | 依游標位置做 3D 傾斜；載入時淡入放大 |
| Hero 文字 | 上方小字用 ScrambleText 解碼出現，自我介紹與按鈕依序淡入上移 |
| 跑馬燈 | 所有專案的技術標籤；捲動越快跑越快，方向跟著捲動方向 |
| 專案數量 | 捲到時從 0 數到總數 |
| 篩選 / 檢視切換 | 選取底色滑動；清單用 Flip 重排，切換檢視時同一個專案從舊位置變形到新位置 |
| 交錯檢視 | 截圖捲到時裁切展開、捲動時圖片視差、hover 時 3D 傾斜；編號列用 ScrambleText 解碼 |
| 矩陣檢視 | hover 時封面微放大、標題變 `--accent` |
| 表格檢視 | hover 時標題右移、出現箭頭、編號解碼；有 `cover` 的列浮出預覽，預覽依游標速度傾斜；捲動速度越快清單越歪（skew，最多 2.5°） |
| 內文與清單 | 捲到時淡入上移 16px，錯開 0.06 秒 |
| 頁尾 | 信箱字母靠近游標時浮起；點陣頭像聚合、被游標推開 |
| 專案頁 | 標題逐字浮現、封面裁切展開並隨捲動縮放、章節標題解碼、內文圖片裁切展開、目錄指示線滑動 |
| 搜尋 | `⌘K` / `Ctrl+K` / `/` 打開，方向鍵選、Enter 開啟 |

規則：

- 曲線用 `expo.out`（CSS 用 `--ease`），彈回用 `elastic.out`。hover 120–300ms，滑動指示 350–450ms，進場 600–1200ms。
- 只動 `transform`、`opacity`、`clip-path`、顏色；不要動 `width`、`top` 等版面屬性，也不要 `transition: all`。
- 一定要尊重 `prefers-reduced-motion: reduce`：Lenis、游標、磁吸、布幕與所有 GSAP 動態都關閉，等高線與點陣靜止不動，跑馬燈靜止。
- 觸控裝置（沒有 `hover: hover` 與 `pointer: fine`）不做游標、磁吸、傾斜、hover 預覽與等高線的游標互動。
- GSAP 或 Lenis 沒載入時，內容要完整顯示；初始隱藏狀態只能由 JS 在確定要播動畫時設定。
- 對話框（⌘K）打開時暫停 Lenis，可捲動的清單加 `data-lenis-prevent`。

---

## 7. AI 的標準工作流程

### 情境 A：「幫我把 repo X 加進作品集」

1. **確認是公開 repo**；私有的先停下來問使用者。是 fork 的話，先用 `git log --all --author` 確認有 ShiYu 的 commit，沒有就不放（§2 禁止事項）。
2. 讀 repo 的 `README`（含 `README.zh-TW.md`）、目錄結構、`package.json` / `pyproject.toml`，蒐集：用途、功能、技術、可用截圖、數據。
3. 決定 `id`（§3.1），把截圖轉成 webp 放到 `content/img/<id>/`（§3.2）。
4. 複製 `templates/project-template.md` 為 `content/projects/<id>.md`，依 §5 填寫。**所有事實都要能在 repo 裡找到出處。**
5. 在 `projects.json` 的 `projects` 陣列加一筆，`status` 預設 `"draft"`；使用者要求發佈才改 `"published"`。
6. 執行 `python3 scripts/check.py`，修到沒有錯誤。
7. 回報：新增的檔案、`id`、你不確定而需要使用者確認的地方。

### 情境 B：「更新某個專案的介紹」

1. 只改該篇 `.md`，並把 `projects.json` 中該筆的 `updated` 改成今天。
2. 不要順手改寫其他章節的語氣，除非使用者要求。
3. 執行 `python3 scripts/check.py`。

### 情境 C：「改網站外觀 / 功能」

1. 只能動 `assets/style.css`、`assets/app.js`、`index.html`、`project.html`；`assets/vendor/` 裡的檔案不要改。
2. 改完至少打開首頁（桌面與手機寬度）與一篇介紹頁確認：圓形照片、頁尾點陣頭像、篩選、三種檢視切換（交錯 / 矩陣 / 表格）、表格 hover 預覽、自訂游標與磁吸、換頁布幕、⌘K 搜尋、提示框、程式碼上色、目錄、上一個 / 下一個都正常，瀏覽器 console 沒有錯誤；再用「減少動態效果」模式看一次。
3. 對照 §6 再檢查一次：有沒有出現漸層文字、光暈、膠囊標籤、粗標題、emoji，以及 §6.5 沒列到的動畫。
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
