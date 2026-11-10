# TODO-115 レビュー（`git show 382af27`）

要修正: 0 件 / 検討: 1 件 / 好みの範囲: 1 件

## 検討

- `src/scenes/clear.js:106`（`computeLayout`）・`:126`（`createFrame`）・`:138`（`createInfoPanel`）・
  `:177`（`createBestLine`）、`src/scenes/title.js:152-155`（`computeLayout` の 1 行目）
  — 新しく足した JSDoc が「何をするか」の説明になっている。`CLAUDE.md` の規約は
  「何をするか」でなく「なぜそうするのか」を書く。元のコメントから動かしたもの
  （`createBackdrop`・`createChoices`・`createDemoButton` など）は「なぜ」を保っている。
  新しく書いた分は消すか、理由（例: `createBestLine` はおまかせだと最短に入らないため言い方を分ける）
  に寄せるかを決める

## 好みの範囲

- `src/scenes/clear.js:100`・`src/scenes/title.js:127,135` — `COMPLETE`・`bestText`・
  `keyHint` の 1 文だけは `create()` に残り、ほかは `createXxx()` に出ている。順番を保つための
  置き方で問題は無い。揃えるかは任意

## 作り込みすぎ: なし

## 前と同じと確かめたもの

- title.js の作る順番: previewGraphics → 題字 2 つ → 遊び方の枠と文 → 選択 2 行 → bestText →
  はじめる/つづきから/記録 → refreshBoard/refreshPalette → keyHint → デモ → キー登録 →
  版 → tooltip。直す前と一致
- clear.js の作る順番: 幕 → 外枠 → COMPLETE → 情報の枠（時間・解の番号・状態・最短・補助）→ ボタン 4 つ。一致
- `stackTops()` への引数（title: `stack`・`screen.height`・`STACK_BIAS[orientation]`、
  clear: `STACK`・`screen.height`・`STACK_BIAS[orientationOf(this)]`）と結果の使い方は不変
- `heightOf(key)` は元の `stack[indexOf(key)].height` と同じ式。`centerOf` の値も同じ
- `orientationOf()`・`screen.portrait` の分岐は `computeLayout()` に移っただけで条件は同じ
- clear.js の `countsForBest` は `createBestLine()` 内の `shouldRecordBest(this.usedAuto)` に
  なった。`shouldRecordBest` は `return !usedAuto` の純関数（`src/storage.js:117`）で、
  呼ぶ位置が `audio.fanfare()` の後ろへ動いても値は変わらない
- `this` のプロパティ（`previewBox`・`previewGraphics`・`previewTimer`・`boardButtons`・
  `paletteButtons`・`bestText`・`tooltip`、clear.js の `relayouting`）は同じものを同じ順で設定
- キーボードの登録（`keydown-SPACE`/`ENTER`）は `create()` に残り不変。shutdown 等の解除は差分に無い
- 新しいメソッド名（`computeLayout`・`createFrame`・`createButtons` ほか）は Phaser.Scene の
  プロパティや既存メソッドと重ならない。`game.js`・`records.js` の `createXxx()` と名付けが揃っている
- 中身の無い `/** */` は無い。`setTimeout`・色の直書きなどの規約違反は無い
- 文書（`CLAUDE.md`・`docs/`・README）に `create()` の行数や構成を書いた箇所は無く、直しは要らない
