# AI Games Lab

> [!SUMMARY]
> 一個 JavaFX 桌面應用，把 20 款經典遊戲包在同一個視窗裡，而每一款遊戲都是一種 AI 演算法的視覺化示範，從 Minimax、MCTS 到 DQN、策略梯度與神經演化，強化學習是貫穿全場的主軸。

## 為什麼做這個

學 AI 演算法時，課本上的虛擬碼很難讓人「感覺」到它在做什麼。遊戲是最好的容器：規則清楚、結果看得見。這個專案的目標**不是做很多遊戲，而是用遊戲把整個演算法光譜裝起來**，讓人可以看著 AI 一邊訓練一邊變強。

## 核心功能

- **20 款遊戲、3 個層級**：完全資訊棋類、單人解謎、即時街機。
- **一款遊戲一種 AI**：Minimax + Alpha-Beta、MCTS / UCT、Expectimax、A*、IDA*、回溯、資訊熵，以及五種學習方法。
- **看得見的訓練**：背景執行緒訓練、進度條顯示，訓練完才上場。
- **三種模式**：PvP、PvE、EvE（AI 自我對弈，同時當作大廳的即時預覽）。

## 技術架構

| 層級 | 技術 |
|---|---|
| 前端 | JavaFX 21 |
| AI / 模型 | 手寫 MLP、Q-table、遺傳演算法，無外部 ML 函式庫 |
| 基礎設施 | Java 21、Maven |

所有遊戲共用統一的架構介面，每款遊戲只是包住一種 AI 技術的薄殼，大廳用 EvE 模式做即時預覽。

## 技術亮點

### 完整的強化學習光譜

| 範式 | 遊戲 | 方法 | 網路 |
|---|---|---|---|
| Value-based（表格） | Pong | Q-learning | Q-table |
| Value-based（深度） | Breakout | DQN | MLP(5, 32, 32, 3) |
| Value-based（自我對弈） | Backgammon | TD-Gammon / TD(0) | MLP(196, 40, 1) |
| Policy-based | CartPole | REINFORCE | MLP(4, 64, 64, 2) |
| 演化 | Flappy Bird | 遺傳演算法 | NN(3, 6, 1) |

> [!HIGHLIGHT] 一個手寫 MLP，同時跑 DQN 與 REINFORCE
> 兩者共用同一個只會做 MSE 反向傳播的 MLP，差別只在「訓練目標」怎麼設：DQN 設成 Bellman target `r + γ·max Q'`，REINFORCE 設成 `logits + advantage·(onehot − softmax)`，讓一步 MSE 更新剛好等於一步策略梯度上升。

### 搜尋與規劃演算法

| 遊戲 | 核心演算法 |
|---|---|
| 井字遊戲 | 完整 Minimax（不敗） |
| 四子棋、五子棋、西洋跳棋、西洋棋、黑白棋 | Minimax + Alpha-Beta |
| 9×9 圍棋 | MCTS / UCT |
| 2048 | Expectimax |
| 貪食蛇 | A* + flood fill |
| 數獨 | 回溯 + MRV |
| 15-Puzzle | IDA*（曼哈頓距離 + linear conflict） |
| Wordle | 資訊熵 |

## 成果展示

![AI Games Lab 大廳：20 款遊戲的卡片與 EvE 即時預覽](content/img/ai-games-lab/lobby.webp)

## 連結

- **GitHub**：<https://github.com/ShiYu0318/AI-Games-Lab-JavaFX>
- **相關專案**：[mAIjong 麥醬](project?id=maijong)
