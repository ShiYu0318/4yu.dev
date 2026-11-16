# AI 授課紀錄與教材

> [!SUMMARY]
> 從高中資訊社到大學 GDG on Campus，我累積了 10 場 AI 課程、共 43.5 小時、495+ 位學員。教材以 Jupyter Notebook 與持續迭代的公開簡報形式開源，涵蓋 ML 入門、影像辨識與生成、LLM 應用與 RAG。

## 為什麼做這個

我自己是靠社群與營隊學會程式的，所以很想把這條路繼續傳下去。AI 的名詞多、門檻看起來高，很多高中生還沒開始就被嚇跑。我希望設計一套**零基礎也能跟上、但會講到原理**的課程，並把教材公開，讓其他社團也能直接拿去用。

## 核心功能

- **系統化的理論課**：從經典機器學習、深度學習架構到強化學習，分成「基礎、加深、加廣、延伸」四部分循序漸進。
- **生成式 AI 實作**：以 Discord Bot 為介面串接 OpenRouter 與 Ollama，實際練習 system prompt 與 context engineering。
- **RAG 實作**：從 embedding 概念到建立向量知識庫，把檢索結果組裝成結構化 prompt。
- **成對的教材**：每個主題都有 📘 Tutorial 與 📝 Exercise 兩份 Notebook，一份上課講解、一份讓學員自己動手。

## 技術架構

| 層級 | 技術 |
|---|---|
| AI / 模型 | 梯度下降手刻實作、MNIST、LLM API（OpenRouter）、Ollama 本機模型 |
| 檢索 | Embedding、向量資料庫 |
| 基礎設施 | Jupyter Notebook、slides.com 公開簡報、HackMD 學員共筆 |

## 技術亮點

### 一份持續迭代的簡報

所有課程共用同一份永久公開的簡報，每次授課後把新內容整合回最新版，而不是每場都另起爐灶。

> [!HIGHLIGHT] 2026 寒訓：三天、7.5 小時、110 位學員
> 在 SCIST × SCAICT Camp 2026 聯合寒訓中負責整個 AI 系列：Day 1 AI 理論全攻略、Day 2 LLM + Discord Bot、Day 3 RAG 進階實作。

### 授課紀錄

| 時間 | 主辦單位 | 主題 | 時數 | 學員 |
|---|---|---|:-:|:-:|
| 2024/06 | 臺南四校資訊社聯合社課 | AI 入門課程 | 2 | 40 |
| 2025/01 | SCIST × 南 15 校 Camp 2025 | AI 概論與 ML 實作入門 | 8 | 120 |
| 2025/03 | SCINT × 北 4 校聯合工作坊 | AI 概論與 ML 實作入門 | 3 | 70 |
| 2025/11 | GDG on Campus @NCU | AI 導論與 ML 實作 | 6 | 10+ |
| 2026/02 | SCIST × SCAICT Camp 2026 | AI 系列課程（ML / LLM / RAG） | 7.5 | 110 |
| 2026/04 | 南 5 校資訊社聯合社課 | AI 影像辨識與生成 | 5 | 40 |
| 2026/04–05 | 嘉義高中資訊研究社 | MNIST、Diffusion、RL 遊戲 | 6 | 20 |
| 2026/05 | GDG on Campus @NCU | GenAI 實戰：LLM × RAG | 2.5 | 15+ |

完整 10 場紀錄見 GitHub。

## 成果展示

![SCIST × SCAICT Camp 2026 聯合寒訓 AI 系列課程的封面投影片](content/img/ai-courses/camp-2026.webp)

| 指標 | 數值 |
|---|---|
| 授課場次 | 10 場 |
| 總時數 | 43.5 小時 |
| 學員人數 | 495+ 人 |

## 連結

- **GitHub**：<https://github.com/ShiYu0318/ShiYu-AI-Courses-Archive>
- **文件 / 簡報**：<https://slides.com/shiyu/ai/>
- **Camp 2026 完整資源庫**：<https://github.com/ShiYu0318/ShiYu-AI-Courses-SCIST-Camp-2026>
- **相關專案**：[CP-Code](project.html?id=cp-code)
