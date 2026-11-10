# TODO-114 reviewer 報告（b58446d）

要修正: 0 件 / 検討: 2 件 / 好みの範囲: 1 件

## 検討
1. `src/icons.js:292,302,303`（`strokeArrowHead`・`strokeRotateMark`）— `icons.js` がグローバルの `Phaser` を初めて使う
   （`git show HEAD~1:src/icons.js` に `Phaser` は 0 件）。`docs/developer.md:110` は「Phaser を読むのはシーンだけ」と書く。
   ただし `src/ui.js:557,591` も既に `Phaser` を使っており、この記述は元から実態とずれていた。今回の差分で悪化したわけではないので、
   直すなら別項目。関数の中でしか使わないため node での import は通る（implementer が確認済み、こちらでも `logic.js` は通った）。実害は未確認。
2. `src/icons.js:1-11`（ファイル先頭のコメント）— HUD のアイコンとタイトルの図しか書いていない。`strokePieceEdges`（TODO-111）に続き
   `strokeTurnMark` も足されたが、先頭の説明には反映されていない。`CLAUDE.md` と `docs/developer.md` の表は直してある。コメントだけが古い。

## 好みの範囲
1. `src/scenes/game.js:497-500` — `turnMarkKind(piece)` を 1 行のメソッドで残した理由（`tools/capture.mjs:211` が呼ぶ）はコメントに書いてあり、妥当。
   `capture.mjs` 側を `logic.js` の関数に直せば消せるが、`window.game` から `import` できないので、メソッドを残す選択でよい。

## 一致を確かめたもの
- 種類・中心: 全 12 ピース × 全向き（63 通り）× 4 通りの `cell`（37, 41.3, 53.7, 0.1）の 252 件で、直す前の式（`game.js` の旧コード）と
  今の `turnMarkKind(cells, origin)`・`turnMarkCenter(cells).x * cell` を `Object.is` で比べ、差は 0 件（実測、node。スクリプトは
  `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/4541f4d9-725d-4cb5-9515-e5c9ac5556ae/scratchpad/cmp.mjs`）。`(best + 0.5)` を先に計算して `cell` を掛ける順も同じ。
- 線: 矢じり・円弧・矢印の式は、`this.layout.board.cell` を引数 `cell` に替えただけ。角度・`DegToRad` の値・`beginPath` / `arc` / `strokePath` の順も同じ。
  `lineStyle(width * cell, color, alpha)`、2 回描きの順（縁取り→本線）、`TURN_MARK` の参照も同じ。
- 条件: `drawTurnMark()` に `g.clear()`・`this.playing`・`piece.location !== 'tray'`・掴んでいる間は出さない、が残っている。`demo.js:470` の `drawTurnMark() {}` の上書きも有効
  （呼び出しは `this.drawTurnMark` 経由: `game.js:489,749,896`）。
- 古い名前: `rg` の結果、`strokeArrowHead`・`strokeRotateMark`・`strokeFlipMark` は `icons.js` 内だけ。`this.turnMarkCenter` を呼ぶ箇所は無し。
  `turnMarkKind` は `tools/capture.mjs:211`（残したメソッド経由）だけ。`TODO.md` の言及は項目の本文。
- import: `game.js` の `TURN_MARK`・`rotateCw` は他で使わず外してあり、`nextTurn`・`sameShape`・`shapeSize` は他の箇所（562, 679-691, 929-944）で使っているので残してよい。
  `icons.js` の import に `TURN_MARK` 追加済み。
- 規約: `logic.js` に Phaser・DOM は入っていない（`Phaser` の出現はコメントだけ）。色・数値の直書きは無く、`TURN_MARK` を使っている。
  JSDoc は「なぜ」を書いている。
- 文書: `CLAUDE.md`（`logic.js`・`icons.js` の行）と `docs/developer.md`（ファイル構成の `icons.js` の行、3 層の分け方）は今のコードと合っている。
  `config.js` の `TURN_MARK` のコメントに旧関数名は無い。
- テスト: `tests.html` への追加は未実施だが、`TODO.md` の 3 つ目の項目として別の担当の分担と明記されているので、今回は指摘しない。
