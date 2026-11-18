# JevRAG

> [!SUMMARY]
> 一個早期研究專案，問的是：RAG 管線裡那些「不是生成」的判斷步驟（這段相關嗎？證據夠不夠？要不要檢索？），能不能交給輸出機率分布的小型決策模型，而不是再叫一次大型語言模型？重點放在繁體中文。

## 為什麼做這個

一個 RAG 系統除了最後的生成，中間還要做很多小判斷：段落是否相關、證據是否足以回答、問題需不需要檢索、某句話有沒有來源支持。這些步驟通常靠任務專用分類器、再 prompt 一次 LLM，或是寫死的規則。

Jev、Kev、Laya 這類「System One」模型不生成文字，而是對固定的答案空間回傳**機率分布**。如果這些機率是校準良好的，就可以用簡單的門檻策略（直接回答 / 再檢索 / 拒答）取代上述步驟，而且不需要訓練任何新模型。繁體中文在這方面幾乎沒有公開評估，這是我想補上的空白。

## 核心功能

- **統一的後端協定**：一個 `/v1/systemone` 客戶端，內建 Jev、Kev、Laya 的設定與磁碟快取。
- **決策點模組**：段落評分、證據充分性、路由、壓縮、主張檢查。
- **中文檢索**：字元 bigram BM25，選用 bge-m3，並做排名融合。
- **嚴謹的統計**：排序、校準與選擇性預測指標，bootstrap、McNemar 檢定、Holm 校正。
- **本機展示台**：瀏覽最新實驗結果，並把同一題同時送給多個後端比較。

## 技術架構

| 層級 | 技術 |
|---|---|
| AI / 模型 | Jev（OpenRouter）、Kev 4B / 0.8B（本機 GPU）、Laya 多語模型（CPU 即可） |
| 檢索 | 字元 bigram BM25、選用 bge-m3、rank fusion |
| 資料 | 以 DRCD 建構的繁中評估資料（CC BY-SA） |
| 測試 / CI | Python `unittest`，附 mock server |

核心只使用 Python 標準函式庫；OpenCC、sentence-transformers、PyYAML 都是選用套件。

## 技術亮點

### 把「判斷」從「生成」中拆出來

每個決策點都定義成一個有版本的問題模板與固定答案空間，讓不同後端的輸出可以直接比較，也能分析校準程度。

> [!HIGHLIGHT] 如果機率是準的，門檻就是策略
> 研究假設是：只要決策模型的信心值校準良好，「信心 > 門檻才回答，否則再檢索或拒答」這種簡單規則就足以構成可靠的 RAG 控制流程。

### 可重現的研究基礎建設

所有後端呼叫都會快取到磁碟、實驗腳本集中在 `experiments/`、統計檢定一併內建，讓之後的每個結論都有顯著性檢定支撐。

## 成果展示

```bash
python scripts/mock_server.py &
python scripts/run_toy.py --backends mock
python -m jevrag demo        # http://127.0.0.1:8900
```

> [!WIP]
> 目前在基礎建設階段，尚無實驗結果。評估資料完成後將以 CC BY-SA 4.0 釋出。

## 連結

- **GitHub**：<https://github.com/ShiYu0318/JevRAG>
- **相關專案**：[ScholaRAGent](project.html?id=scholaragent)、[EmbAId Agent](project.html?id=embaid-agent)
