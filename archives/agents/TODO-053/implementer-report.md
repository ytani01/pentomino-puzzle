# TODO-053 実装の報告（implementer）

## 変えた点

- `src/config.js:252` `TRAY_SLOT_PAD` を 12 → 6。`TRAY_SPAN`・`trayCellFor`・`traySlotFor` を消した
- `src/config.js:256-298` `packTray(length)` を足した（export しない）。長い辺は `PIECES[i].cells` の
  行・列の最大値から出す（`logic.js` は import しない）。`TRAY_CELL_MAX` から始め、一番大きいスロットが
  `length` に収まるまでマスを 1 ずつ下げる。大きい順（安定ソート）に next fit で棚へ詰め、
  沿う向きはトレイの中央へ、奥行きは棚の中で中央へ寄せる。返すのは `{ cell, slots(along/depth/size), depth }`
- `src/config.js:320-329` `makeLayout()` の JSDoc を棚詰めに合わせて書き直した
- `src/config.js:369-383` 等分の見積もりを、`packTray()` の棚の奥行きの合計 + `PANEL_PAD * 2` を盤の取り分から引く形にした
- `src/config.js:402-403` トレイの枠のコメント（等分前提の文言）を直した
- `src/config.js:420-440` 枠の内側 `trayInner` からスロットの画面座標を出し、`tray: { x, y, width, height, cell, slots }` を返す。
  `tray.cols` / `tray.rows` は消した。スロットは枠の盤側の端（横 `tray.x`、縦 `tray.y`）から並ぶ
- `src/scenes/game.js:235-252` `createTraySlots()` を `this.layout.tray.slots[piece.slot]` の中心と一辺 `size` の正方形にした。JSDoc に理由を追記
- `src/scenes/game.js:589` `pieceTransform()` の中心を `tray.slots[piece.slot]` から読む
- `tests.html:41` `makeLayout` を import。`tests.html:173-210` グループ「トレイのスロット（makeLayout, TODO-053）」を追加。
  横・縦 × 8×8・6×10 の 4 通り × 4 件（12 個で重ならない／トレイに収まる／長い辺 × `tray.cell` 以上／盤とトレイが重ならない）

## 検証

- `node archives/agents/TODO-053/distance.mjs` … 終了コード 0。結果は `distance-after.txt` に保存
- `python3 -m http.server 8765` を立て、Playwright 同梱の `chrome-headless-shell`（`--dump-dom --virtual-time-budget`）で
  `tests.html` を開いて `#summary` を読んだ … 「293 件すべて通った」（変更前は 277 件。追加 16 件）。
  サーバは PID 324285 を `ps` で確かめて `kill` で止めた

## 距離の比較（スロットの中心から盤まで。平均 / 最大）

| 配置 | 前 | 後 | 盤のマス 前→後 | トレイのマス 前→後 |
|---|---|---|---|---|
| 横 8×8 | 252 / 399 | 141 / 237 | 55 → 55 | 19 → 20 |
| 横 6×10 | 197 / 307 | 141 / 237 | 55 → 64 | 19 → 20 |
| 縦 8×8 | 203 / 317 | 121 / 171 | 64 → 74 | 20 → 20 |
| 縦 6×10 | 282 / 449 | 121 / 171 | 59 → 59 | 20 → 20 |

## 設計から外れた点・気づいたこと

- 設計どおり。外れた点は無い
- 横画面ではトレイのマスが 19 → 20 に上がった（パッドを 6 に減らし、`I` のスロット 106 が沿う向きの 446 に収まるため）。
  設計の「今の 4 通りでは 20 のまま収まるはず」と合う
- 棚の並び（実測でなく計算）: 横は 5 個（I L N Y F）/ 6 個 / 1 個の 3 段、縦は 7 個 / 5 個の 2 段。
  横の 3 段目は 1 個だけがトレイの沿う向きの中央に来る
- 画面の見た目（実機での並び）は確かめていない。確認の担当に任せる
