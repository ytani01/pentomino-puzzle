# TODO-087 レビュー（reviewer）

対象: 作業ツリーの `git diff`（未コミット。CLAUDE.md, docs/UsersGuide.md,
src/config.js, src/icons.js, src/scenes/records.js, src/scenes/title.js, src/ui.js）。

実測は Playwright（npx の置き場の 1.63.0）で `http://localhost:8765/` を開き、
`window.game.scene.getScene('Title')` の `time._active` などを読んだ。
横画面 960×640・縦画面 640×1136 の両方で実行した。スクリプトは
`/tmp/claude-649/-home-ytani-work-pentomino-puzzle/4cc36fcd-3330-4a9c-abd1-e5309091b753/scratchpad/probe.mjs`・`probe2.mjs`。

## 要修正（1 件）

### 1. `src/scenes/title.js:30-31` 横画面の STACK の合計が JSDoc と合わない

- 問題: JSDoc には「合わせて 634 で下端に 6 ほどしか余らない」とあるが、横画面の
  `STACK` を足すと **638**（高さ 584 + 間隔 54）。余りは **2**。
  縦画面は 930（1136 に対して 206 余る）。
- 根拠: 配列の値を `node` で足した（`CHOICE_ROW` = 60）。変える前は 632 で、元の
  JSDoc の値と一致していた。`stackTops()`（`src/ui.js:65`）も `height + gap` をそのまま足す。
- なぜ問題か: この数字は「行を足すなら間隔から削る」判断の材料。余りを 3 倍に
  見誤る。数字を直すか、実際に 6 残すなら間隔を 4 詰めるかは管理者の判断。

## 検討（6 件）

### 2. `src/scenes/title.js:341-346` 盤面の更新を手で書いている（`logic.js` の `place()` / `remove()` がある）

- 問題: `place` の手はマスを 1 つずつ書き込み、`remove` の手は `map` で作り直している。
  `src/logic.js:345` の `place(board, name, cells, row, col)` と `:351` の
  `remove(board, name)` が同じことをして、盤面を作り直して返す。
- なぜ問題か: CLAUDE.md の「盤面は書き換えず、作り直して返す」に対し、`place` の枝は
  `this.previewCells` をその場で書き換えている（本編の盤面ではないので実害は無い）。
  同じ処理が 2 か所にあり、place と remove で流儀も揃っていない。
  `this.previewBoard = createBoard(spec)` と持ち、`place(...)` / `remove(...)` で作り直し、
  描くときに `.grid` を渡せば、`cols` を引く行も要らなくなる。

### 3. `docs/developer.md:55,59` ファイル構成が更新されていない

- 問題: CLAUDE.md の表は `ui.js` に `drawMiniBoard()`、`title.js` に動く盤を書き足したが、
  developer.md のファイル構成（`ui.js … ボタンと枠（5 つのシーンで共通）、穴のアクリルの板`、
  `title.js … タイトル`）はそのまま。
- 根拠: CLAUDE.md の表で、developer.md が「ファイル構成」を持つとしている。対で保守するものの片方しか変わっていない。

### 4. `CLAUDE.md:72`・`src/scenes/title.js:4` 「題字の下で」は横画面では違う

- 問題: 横画面では、動く盤は遊び方の枠の**左**に置かれる（実測: `previewBox` = x 14, y 117.4,
  200×186。枠は x 230 から）。題字の下に 1 行として置くのは縦画面だけ
  （x 120, y 229, 400×240）。docs/UsersGuide.md:21 は「遊び方の枠の横（縦画面では題字の下）」と
  正しく書いてある。

### 5. `docs/UsersGuide.md:22` 「[デモ] と同じ探索」

- 問題: デモの探し方は深さ優先とランダムの 2 種類で、タイトルはランダム（`solveStepsRandom`）
  だけを動かす。コード側の JSDoc（title.js:4「デモと同じランダムな探索」、config.js の
  `TITLE_DEMO`）はランダムと書いている。利用者向けの文だけ曖昧。

### 6. `docs/UsersGuide.md:8` タイトルのキャプチャ（`docs/images/title.png`）が古くなる

- 盤・色のボタンの高さと図、動く盤が変わったので、①〜⑥ の付いたキャプチャは
  今の画面と合わない。`tools/capture.mjs` での撮り直しが要る（撮影は別の担当の範囲なので、
  ここでは指摘だけ。丸の位置は `getBounds()` から取るので、撮り直せば付いてくるはず。未確認）。

### 7. タイトルを開くだけで全解のデータを組み立てるようになった（実害は未確認）

- 変える前は、本編・記録・デモに入ったときだけ `ensureSolutions()` を呼んでいた。今は
  タイトルを開くと 8×8 を、6×10 を選ぶと 6×10 を組み立てる。
- 実測（headless、このマシン）: `buildSolutions` 込みで 8×8 が 64ms、6×10 が 175ms
  （import 済みで組み立てだけの時間）。6×10 のボタンを初めて押したときに、この時間だけ
  メインスレッドが止まる。一度組めば registry に残るので、本編に入る時間はそのぶん短くなる。
  遅い端末で引っかかって見えるかどうかは未確認。

## 好みの範囲（1 件）

### 8. `src/scenes/title.js:25-35` STACK の JSDoc が `CHOICE_ROW` に付いている

- `/** 上から順に積む部品 … */` のすぐ下が `const CHOICE_ROW = CHOICE_ICON_HEIGHT + 2;`
  になり、JSDoc は `STACK` ではなく `CHOICE_ROW` の説明として扱われる。`+ 2` の理由
  （変える前の 46 のボタンに 48 の行、と同じ余白）も書かれていない。`CHOICE_ROW` を JSDoc の上へ移せば直る。

## 作り込みすぎ

- `src/scenes/title.js:341-346`: shrink/reuse。手書きの place/remove → `logic.js` の `place()` / `remove()`（上の 2 と同じ）。約 -4 行。
- `src/scenes/title.js:125`: shrink。`cx - (PREVIEW.width + PREVIEW.gap + panelWidth) / 2 + PREVIEW.width + PREVIEW.gap` は `cx + (PREVIEW.width + PREVIEW.gap - panelWidth) / 2` と同じ値（好みの範囲）。
- net: -5 lines possible.

## 問題なし（確かめたこと）

- タイマー: 起動直後・盤を 3 回続けて選び直す（データを消して読み込み直させた状態）・データが届く前に記録へ移ってタイトルへ戻る・解けたあとの一時停止中に盤を選び直す・色を選び直す、のどれでも、タイトルの Clock に残るタイマーは 1 本だけ（横・縦とも）。`setTimeout` / `setInterval` は差分に無い（`rg`）。
- `previewToken` は必要。記録の画面の `this.boardKey !== spec.key` の比べ方では、A→B→A と選び直したときに A の Promise が 2 つとも通り、タイマーが 2 本になる（コードを読んで判断。この比べ方に差し替えたコードは動かしていない）。
- ループのタイマーを自分のコールバックの中で `remove(false)` しても消える（解けたあとに残るのは 3000ms の `delayedCall` だけ）。
- remove の手の写し: `stepPreview()` を解けるまで回した（横 664 手・縦 116 手）。毎手、どのピースも 0 マスか 5 マスで、解けた時点で空きは 0。穴は 4 マスのまま。
- `drawMiniBoard()`: 記録の完成形は、元のコードと同じ描き方。全解のデータの穴は `'#'`（= `HOLE`）なので、新しく足した空きのマスの枝は記録の画面では通らない。
- `ui.js` → `scenes/boot.js` の import で循環は起きない（boot.js は config・logic・storage だけを読み、`ui.js` を読むのはシーンだけ）。`icons.js` も同じ向きで既に読んでいる。
- `createChoiceRow()` の `height` は省くと 46。記録の画面（`records.js:185`）は渡していないので変わらない。
- `paletteIcon()`: F・W・X はどれも 0〜2 の 3×3 に収まる。幅は 3×36 + 2×9 = 126（ボタン 150 に収まる）、高さは 36（ボタン 58 に収まる）。
- `MINI_EDGE` の「20〜56px」: タイトルのマスは 20・23・30・40、記録は 44〜56 で合う。
- `TITLE_DEMO.intervalMs` 200 は `DEMO.speeds.fast` と同じ。`pauseMs` 3000 は `DEMO.pauseMs` 10000 より短い。JSDoc のとおり。
- 新しく足した JSDoc（`drawMiniBoard`・`CHOICE_ICON_HEIGHT`・`TITLE_DEMO`・`startPreview`・`stepPreview`・`PREVIEW`）は、どれも「なぜ」を書いている。中身の無い `/** */` は無い。
- 横画面の遊び方の文字（幅 552）は、狭めた枠（716）に収まる。
- ブラウザのエラー: WebGL の性能の警告だけで、pageerror は無し。
