# TODO-053 の設計（main）

## 目的

トレイのピースを盤の側へ詰め、指を動かす距離を短くする。仕様の背景は `TODO.md` の TODO-053 節。

## 今の作り

- `src/config.js` の `makeLayout()` が、トレイを縦画面 4 列 3 段／横画面 3 列 4 段の
  **5 マス角の等分スロット**として見積もり（`trayCellFor` / `traySlotFor`）、
  その分を盤の取り分から引く。トレイの枠は盤の残りを全部使う
- `src/scenes/game.js` の `createTraySlots()`（当たり判定）と `pieceTransform()`
  （トレイ上の位置）が、どちらも `tray.width / tray.cols` の**等分**でスロットの中心を出す。
  枠が広いほどピースが離れる

## 変えること

### 1. `src/config.js`：スロットを詰めて並べる

- `tray.slots` を足す。`PIECES` と同じ順の 12 個の `{ x, y, size }`（中心の座標と一辺。
  画面の座標）。`tray.cols` / `tray.rows` と `trayCellFor` / `traySlotFor` は消す
- 一辺は **`長い辺のマス数 × tray.cell + TRAY_SLOT_PAD`**。長い辺はピースの定義
  （`PIECES[i].cells`）の外接矩形の縦横の大きいほう。`I` 5、`L`・`N`・`Y` 4、他 3。
  回しても長い辺は変わらないので、どの向きでもはみ出さない。
  長い辺は `logic.js` を import せず、`cells` の行・列の最大値から出してよい
  （`config.js` は `logic.js` を import していないので、依存を増やさない）
- `TRAY_SLOT_PAD` は 12 → 6
- 並べ方は **棚詰め（大きい順、next fit）**：
  - 盤の辺に沿う向きを「沿う向き」、盤から離れる向きを「奥行き」と呼ぶ。
    横画面は沿う向き＝縦（長さ `bottom - top - PANEL_PAD * 2`）、奥行き＝右。
    縦画面は沿う向き＝横（長さ `width - MARGIN * 2 - PANEL_PAD * 2`）、奥行き＝下
  - スロットを一辺の大きい順に並べる（同じ大きさは `PIECES` の順のまま。安定ソート）
  - 盤に近い棚から、沿う向きへ詰めていく。入らなくなったら次の棚へ。
    棚の奥行きはその棚で一番大きいスロットの一辺
  - 棚の中身は、沿う向きには**トレイの中央へ寄せる**、奥行きは**棚の中で中央へ寄せる**
- マスの大きさ `tray.cell` は `TRAY_CELL_MAX` から始め、一番大きいスロット（`I`）が
  沿う向きの長さに収まらなければ 1 ずつ下げる（今の 4 通りでは 20 のまま収まるはず）
- **盤の取り分から引くのは、棚の奥行きの合計 + `PANEL_PAD * 2`**（今の等分の見積もりの代わり）。
  「トレイを先に決めて、余りを全部盤に回す」という今の方針のまま。
  結果として、横 6×10 と縦 8×8 では盤が大きくなる
- トレイの枠（`trayPanel`）は今どおり残りを全部使う。スロットは枠の盤側の端から詰める
  （横画面：`tray.x` から右へ、縦画面：`tray.y` から下へ）
- 並べ方の計算は `makeLayout()` の中に閉じた小さな関数にしてよい。
  `export` するかどうかは、`tests.html` から確かめるのに要るかで決める

### 2. `src/scenes/game.js`

`createTraySlots()` と `pieceTransform()` の等分の計算を、
`this.layout.tray.slots[piece.slot]` の中心と一辺を読む形にする。
当たり判定の矩形は一辺 `size` の正方形。

### 3. `tests.html`

既存の書き方に合わせて足す。4 通り（横・縦 × 8×8・6×10。`makeLayout` を直接呼ぶ）で:

- スロットが 12 個あり、どの 2 つも重ならない
- どのスロットもトレイ（`tray.x`〜`tray.x + tray.width`、`tray.y`〜`tray.y + tray.height`）に収まる
- どのスロットも、そのピースの長い辺 × `tray.cell` 以上の一辺がある
- 盤（`board`）とトレイが重ならない

### 4. JSDoc とコメント

`makeLayout()` の JSDoc と、等分を前提にしたコメント（`src/config.js` の 334〜336 行目、
369 行目、`game.js` の `createTraySlots()` の JSDoc）を今の作りに合わせる。
「なぜ」を書く（等分をやめたのは、枠が広いほどピースが離れて指を動かす距離が延びるため）。

## 保つもの

- 盤・HUD・メッセージの帯の位置の決め方（トレイの奥行き以外）
- トレイのマスの上限 `TRAY_CELL_MAX` = 20
- `piece.slot` は `PIECES` の添字のまま（保存した遊びかけの `snapshot.pieces[piece.slot]` が使う）
- デモ（`DEMO_LAYOUTS`）も同じ `makeLayout()` を通るので、別扱いにしない

## 確かめ方

- `node archives/agents/TODO-053/distance.mjs` で距離を出し、`distance-before.txt` と比べる
- `tests.html` が全件通る
