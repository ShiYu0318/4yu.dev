# TQR

> [!SUMMARY]
> 會「看角度」的 QR code：一個 3D 列印的小物件，從上方、正面、側面看分別是三個不同的 QR code。我用圖論、拓撲與組合最佳化合成出能一次列印成形、而且每個視角都能被手機掃描的幾何結構。

## 為什麼做這個

QR code 通常是平面的，一張圖只能放一個連結。我好奇的是：**能不能讓一個實體物件在不同視角下各自是一個合法的 QR code？** 這聽起來像視覺錯覺藝術，但真的要做出來，會撞上幾個硬問題：三個剪影的交集常常碎成一堆不相連的小方塊，根本印不出來；補材料又可能破壞某個視角的解碼。

## 核心功能

- **剪影雕塑（Silhouette sculpture）**：一組方塊，沿三個軸的投影分別是三個 QR code，在背光下用長焦鏡頭掃描。
- **蛋格磚（Egg-crate tile）**：每個 QR 模組是一個開口小格，四面牆與底面分別上色，從正上方與東南西北四個方向看到五個不同的 code，手機在 30 公分內就能掃。
- **TQR Studio**：瀏覽器裡的設計工具，輸入連結、轉動 3D 模型、即時顯示目前角度會解出哪個連結，並匯出可列印的 STL。
- **列印前驗證**：每個視角都附檢查，確認被修改的 codeword 仍在 QR 錯誤更正能力之內。

## 技術架構

| 層級 | 技術 |
|---|---|
| 前端 | Vite、React、TypeScript、react-three-fiber（可離線使用的 PWA） |
| 後端 | 無；求解器同時有 Python 與 JavaScript 版本，在瀏覽器內執行 |
| 資料 | QR 結構對應表、STL 網格輸出 |
| 測試 / CI | Python 測試、JS 與 Python 求解器的一致性比對 |

核心是 `src/tqr/` 的 Python 函式庫（QR 結構、剪影求解器、蛋格磚、網格輸出），網頁版用同一套演算法的 JavaScript 移植，兩者以固定測資做**一致性檢查**，確保在瀏覽器設計出來的模型和命令列產生的一模一樣。

## 技術亮點

### 讓碎片連成一體

三個剪影的共同體積很好算，但通常會散成許多懸空的小塊。求解器只在 **QR 錯誤更正能吸收的位置** 補材料，真的沒有空間時才加細支柱，讓物件能一次列印成形，同時每個視角仍然可以解碼。

> [!HIGHLIGHT] 把 QR 的容錯當成設計預算
> QR code 本來就允許一定比例的 codeword 出錯。TQR 把這個容錯量當成「可以拿來補結構的預算」，用最佳化決定要花在哪裡。

### Python 與 JavaScript 雙實作

研究實驗在 Python 做，產品在瀏覽器跑；`npm run test:js` 會要求 JavaScript 求解器的輸出與 Python 的結構對應表完全一致。

## 成果展示

![TQR 品牌圖：多面 QR 方塊的標誌](content/img/tqr/social-preview.webp)

```bash
# 產生三視角的剪影雕塑
python scripts/make_sculpture.py --mode 3qr URL_TOP URL_FRONT URL_SIDE --out sculpture.stl
# 產生五視角的蛋格磚
python scripts/make_tile.py URL_TOP URL_NORTH URL_EAST URL_SOUTH URL_WEST
```

repo 的 `models/` 內附可直接列印的 STL，`experiments/` 保存實驗腳本、資料、紀錄與圖表。

## 連結

- **GitHub**：<https://github.com/ShiYu0318/TQR>
