# TODO-115 implementer 報告

## 分けたメソッド（作る順。`create()` から呼ぶ順で、元の `create()` の順と同じ）

### title.js
1. `create()` … 背景色・`boardKey`・`paletteKey` → `computeLayout()`
2. `createPreviewArea()` … `previewBox`・`previewGraphics`（最初に作るので最奥）・`previewTimer = null`
3. `createHeading()` … PENTOMINO / PUZZLE
4. `createHowTo()` … 枠と遊び方の文
5. `createChoices()` … ボード・色の 2 行（`boardButtons`・`paletteButtons`）
6. `bestText`（`create()` に残した 1 行）
7. `createStartButtons()` … はじめる / つづきから / 記録
8. `refreshBoard()`・`refreshPalette()`、キーヒント文（`create()` に残した）
9. `createDemoButton()`
10. キーボードの登録（SPACE → ENTER の順）、`createVersionText()`、`tooltip`（最後）
- `computeLayout()` は `stackTops()` に渡す `STACK[orientation]` と `STACK_BIAS` を元のまま使う。
  結果は `{ screen, orientation, preview, cx, topOf, heightOf, centerOf, panelWidth, panelX }`
  として引数で各メソッドへ渡す（`heightOf` は元の `stack[indexOf(key)].height` の置き換え）。

### clear.js
1. `create()` … `fanfare`（`relayouting` の判定）→ `computeLayout()`
2. `createBackdrop()` 幕
3. `createFrame()` 外枠
4. COMPLETE の文字（`create()` に残した）
5. `createInfoPanel()` … 枠 → 時間 → 番号 → 状態 → `createBestLine()`（最短の行）→ 補助の行
6. `createButtons()` … 4 つのボタン
- `computeLayout()` は `stackTops(STACK, screen.height, STACK_BIAS[orientationOf(this)])` をそのまま使う。
- `countsForBest` の変数は `createBestLine()` で `shouldRecordBest(this.usedAuto)` を直接呼ぶ
  （純関数で `!usedAuto` を返すだけ。値は同じ）。

作る順の根拠: 元の `create()` の本体を上から切り出し、呼ぶ順を元の記述順のままにした
（差分で確認。`setDepth` の有無・イベント登録の順・解除も元のまま）。

## 増やしたプロパティ
無し。受け渡しは引数だけ。

## 検証
- `node --check src/scenes/title.js src/scenes/clear.js` → 終了コード 0
- ブラウザ・`tests.html` は依頼により流していない。

## 残る懸念
- 無し（描かれる絵の一致は screens の撮り比べで確かめる）。

## レビューの検討 1 件への直し（JSDoc）
- `clear.js` の `computeLayout`・`createInfoPanel` の JSDoc は、書ける「なぜ」が無いので消した。
- `clear.js` の `createFrame` は「後ろの HUD やピースが透けないよう外枠を先に敷く」に、
  `createBestLine` は「おまかせは最短に入らないので更新と読めない言い方にする（TODO-020・TODO-088）」に直した。
  どちらも元のコメント・定数の JSDoc にあった理由。
- `title.js` の `computeLayout` は「何をするか」の 1 行目を消し、「なぜ」の 1 行（TODO-095）だけ残した。
- コードは変えていない。`node --check` は 2 ファイルとも通った。
