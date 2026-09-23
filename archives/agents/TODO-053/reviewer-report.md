# TODO-053 レビューの報告（reviewer）

対象: 未コミットの `git diff`（`src/config.js`・`src/scenes/game.js`・`tests.html`）。
設計 `design.md` との食い違いは無い。

## 実測したこと

計測スクリプトはスクラッチ領域の `check.mjs` / `t.mjs`（`tools/window-shim.mjs` 経由で
`makeLayout()` を Node から呼ぶ）。本編 6 ボタンとデモ 7 ボタン × 横・縦 × 8×8・6×10 の 8 通り。

- **HUD・盤の枠・トレイの枠・メッセージの帯（下端 40）の重なり**: 8 通りすべて重ならず、
  画面の外にも出ない。例: 横 8×8 は HUD y10–122、盤 14,137 460×460、トレイ 486,134 460×466、帯 y600〜。
  縦 8×8 は HUD y10–178、盤 14,190 612×612、トレイ 14,814 612×282、帯 y1096〜
- **どの向きに回してもスロットからはみ出さないか**: 全ピースの `orientations()` を
  `shapeSize()` で測り、`size - cols*cell` と `size - rows*cell` の最小を見た。
  8 通りすべてで余白は最小 3（= `TRAY_SLOT_PAD / 2`）、はみ出しは 0
- **スロットがトレイの内側に収まるか**: 8 通りすべて収まる。スロットの一辺は 66 / 86 / 106、
  トレイのマスは 4 通りとも 20
- **`piece.slot` の意味**: `game.js:187` の `slot: index`（`PIECES` の添字）のまま。
  `config.js:427` の `tray.slots` も `PIECES` の順で、`game.js:796` の
  `snapshot.pieces[piece.slot]` は影響を受けない
- **`rg -n "tray\.(cols|rows)|trayCellFor|traySlotFor" src`**: 0 件。等分のスロットの中心を
  出していたのは `createTraySlots()` と `pieceTransform()` の 2 か所だけで、どちらも直っている。
  records・clear・demo のシーンは `layout.tray` を読んでいない（`rg -n "layout\.tray|\.tray\b" src`）
- **テストの強さ**（`config.js` を写して壊し、tests.html の 4 件を移した `t.mjs` で試した）:

  | 壊し方 | 結果 |
  |---|---|
  | 次の棚へ移らない | 落ちる（収まる） |
  | 棚の中の位置を 0 にする | 落ちる（重なり） |
  | 棚の奥行きを足さない | 落ちる（重なり） |
  | スロットの一辺を 3 マス固定 | 落ちる（長い辺） |
  | `slots[i]` を `push` にする（添字がずれる） | 落ちる（長い辺） |
  | 縦画面で x/y を入れ替える | 落ちる（収まる） |
  | 盤の取り分からトレイの奥行きを引かない | 落ちる（収まる） |
  | **スロットを盤から遠い側の端から並べる** | **全件通る** |
  | 大きい順に並べない／中央に寄せない／`TRAY_SLOT_PAD` を 0 や 30 にする | 全件通る |

## 要修正

1. **`docs/developer.md:79` / `:57-75` / `:114-115` が等分のスロットのままになっている。**
   79 行目は「並びは横画面が 3 列 × 4 行、縦画面が 4 列 × 3 行（盤に残る場所が広くなるほう。
   `makeLayout()` にある）」で、`makeLayout()` はもうこの形では並べない。57〜75 行目の図も
   3 列の格子になっている。114〜115 行目の「`pieceTransform()` がそこから中心の座標を計算する」も、
   今は `LAYOUT.tray.slots[slot]` を読むだけ。根拠: `src/config.js:256-299` と
   `src/scenes/game.js:589` を読んだ。差分の範囲外のファイルなので、直すかどうかは管理者の判断。

## 検討

2. **`tests.html:173-210` のテストは「盤の側に詰める」を守っていない。** スロットを
   トレイの盤から遠い側の端から並べるように壊しても（横は `trayInner.x + trayInner.width - depth`、
   縦は `trayInner.y + trayInner.height - depth`）、4 件すべて通った（上の表）。これは
   TODO-053 の目的（指を動かす距離を短くする）を戻してしまう壊し方。たとえば「盤に一番近い
   スロットの端が `tray.x`（縦は `tray.y`）に接している」を足せば落ちる。実害は未確認。

3. **`tests.html:180` の `longSide` が `packTray()` の式を写したものになっている。** どちらも
   `1 + Math.max(行の最大, 列の最大)` で、式が同じなら同じ誤りを共有する。tests.html は
   `orientations` と `shapeSize` を既に import しているので、「そのピースのどの向きも
   `cols * tray.cell` と `rows * tray.cell` がスロットの一辺以下」を直接確かめられる。
   依頼の「どの向きに回してもはみ出さない」をそのまま確かめる形になる。

4. **トレイの当たり判定が小さくなった。** `createTraySlots()` の矩形は、前は
   147×112（横 8×8）〜148×167（縦 6×10）の等分だったが、今は 3 マスのピース
   （9 種）で 66×66（内部解像度）。JSDoc（`game.js:236-238`）は「指のタップ目標としては
   狭すぎるため、スロット全体を覆う」と理由を書いており、その目的に対して狭まっている。
   568×320 の画面（倍率 0.5 前後）では 33 CSS px 程度。設計（`TRAY_SLOT_PAD` 12 → 6、
   スロットを詰める）どおりの結果で、実害は未確認。

5. **`tests.html:171-173` の見出しの位置。** 新しいグループが
   `// ---- logic：向きの計算 ----` の見出しの下、`group('src/logic.js — 向きの生成')` の前に
   入っている。config のテストが logic の見出しの下に来ている。見出しの上（PALETTES の
   テストの直後）が合う。

## 好みの範囲

- `src/config.js:252` `TRAY_SLOT_PAD` のコメントに 12 → 6 にした理由が無い
  （スロットが詰まって隣と接するようになり、周りの空きが見た目の隙間そのものになった、など）。

## 規約

- 数値は `config.js` に置かれている（`game.js` に新しい数値は無い）。色の直書き無し
- JSDoc: `packTray()`（`config.js:256-266`）は等分をやめた理由・長い辺で決める理由・
  大きい順の理由を書いており「なぜ」になっている。`makeLayout()` の JSDoc と
  `config.js:402-403`、`game.js:236-240` も今の作りに合っている
- 範囲: 差分は設計に書かれた 3 ファイルだけ。指示に無い変更は無い

## 作り込みすぎ

- `src/config.js:271-272`: shrink: `while` で 1 ずつ下げている。
  `let cell = Math.min(TRAY_CELL_MAX, Math.floor((length - TRAY_SLOT_PAD) / Math.max(...longSides)));`
  の 1 行で同じ値になる（今の 4 通りでは一度も回らず 20 のまま）。重大度: 好みの範囲
- `tests.html:180`: shrink: ループの中で `longSide` を 4 回作り直している。上の 3 の
  `shapeSize` を使えば定義ごと消える。重大度: 検討（3 と同じ件）

net: -3 lines possible.
