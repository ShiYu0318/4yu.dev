# Isaac Sim2Sim RL

> [!SUMMARY]
> 在 NVIDIA Isaac Lab 訓練人形機器人（Unitree G1, 29 自由度）的行走策略，再把「同一個」匯出的策略透過我寫的轉接層放進 MuJoCo 執行，在上真機之前先找出只在某個模擬器才成立的行為。

## 為什麼做這個

在一個模擬器裡訓練出來的運動策略，常常偷偷依賴那個模擬器的細節：接觸模型、關節驅動方式、時間步長。直接上真機時才發現問題，代價很高。**Sim2Sim 驗證**就是先把策略丟到另一個獨立的模擬器跑一次，讓這些隱藏的依賴提早浮現。

## 核心功能

- **Isaac Lab 訓練**：使用 RSL-RL 的 PPO 與 unitree_rl_lab 環境（原封不動放在 `third_party/`）。
- **策略匯出**：Actor 匯出為 ONNX，並保留記錄觀測、動作與 PD 增益介面的 `deploy.yaml`。
- **MuJoCo 轉接層**：`isaac_sim2sim/` 在 MuJoCo 重建 Isaac Lab 的觀測與動作介面，讓同一個 ONNX 不用重訓就能跑。
- **雙模擬器比較**：速度追蹤、跌倒率、力矩飽和、機身高度等指標並排比較。

## 技術架構

| 層級 | 技術 |
|---|---|
| 模擬 | NVIDIA Isaac Sim 5.1.0 + Isaac Lab v2.3.0、MuJoCo 3.3.6 |
| AI / 模型 | RSL-RL 3.0.1（PPO）、ONNX Runtime |
| 測試 / CI | 轉接層的單元測試與驗證腳本 |

訓練 → 匯出 ONNX 與 `deploy.yaml` → 轉接層依 `deploy.yaml` 在 MuJoCo 重建觀測向量、套用 PD 控制 → 記錄並比較兩邊的行為。

## 技術亮點

### 忠實重建觀測與動作介面

Sim2Sim 最容易出錯的不是物理，而是「介面」：觀測的順序、縮放、關節排列、動作如何轉成力矩。轉接層完全由 `deploy.yaml` 驅動並有測試覆蓋，避免手抄參數出錯。

> [!HIGHLIGHT] PD 的離散化方式會決定機器人會不會跌倒
> 同一個策略，在 MuJoCo 用 2 ms 顯式 PD 完全不會跌倒；改成 Isaac Lab 訓練時的 5 ms 顯式 PD，就有 16.7% 的回合跌倒、35.7% 的馬達步驟撞到力矩上限——輕的手臂關節在 kd = 10 下開始震盪。

## 成果展示

![Unitree G1 在 MuJoCo 中由 Isaac Lab 訓練的策略控制行走](content/img/isaac-sim2sim-rl/g1-mujoco.webp)

以下皆為 upstream 預訓練的 G1 速度策略在 MuJoCo 中的結果（3 回合平均，每回合 10 秒，顯式 PD 2 ms）：

| 指令 (vx, vy, wz) | 跌倒 | 速度追蹤誤差 \|v_xy err\| |
|---|---|---|
| 0, 0, 0 | 0/3 | 0.002 |
| 0.5, 0, 0 | 0/3 | 0.059 |
| 1.0, 0, 0 | 0/3 | 0.095 |
| 0, 0.3, 0 | 0/3 | 0.063 |
| −0.5, 0, 0 | 0/3 | 0.091 |

![指令速度與實測速度的追蹤曲線](content/img/isaac-sim2sim-rl/velocity-tracking.webp)

![三種 PD 設定下的跌倒率與力矩飽和比較](content/img/isaac-sim2sim-rl/pd-mode-comparison.webp)

> [!NOTE]
> 結果顯示 upstream 策略不需重訓就能遷移到 MuJoCo，前進與側移速度追蹤誤差在 0.06–0.1 m/s 內。

## 連結

- **GitHub**：<https://github.com/ShiYu0318/Isaac-Sim2Sim-RL>
- **相關專案**：[mAIjong 麥醬](project.html?id=maijong)、[AI Games Lab](project.html?id=ai-games-lab)
