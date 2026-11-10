# TODO-120 reviewer の報告

対象: `e5314a7`（`src/scenes/game.js`・`src/scenes/demo.js`）。「挙動を変えない」として、前と同じかだけを見た。
TODO-119 の作業中の差分は見ていない。

## 要修正

なし。

## 検討

なし。

## 好みの範囲

なし。

## 観点ごと（問題なし）

- create() の呼ぶ順: 前と同じ（背景色 → 控えの受け取りと破棄 → ボード・レイアウト・色の組・空の盤面 → 状態（`ready = false` を含む）→ 部品 → 全解 → 入力・shutdown → 控え／遊びかけを戻す → `refreshHud()` → `ready = true`）。`boardKey` を registry から読むのが `setBackgroundColor` より前になったが、副作用の無い読み出しなので差は無い。
- 継承: `DemoScene` は `prepareScene`・`initPlayState`・`createParts`・`loadSolutions`・`registerInput`・`trayPieces` のどれも上書きしておらず、`GameScene.create()` も呼ばない（`demo.js` のメソッド一覧で確認）。デモは `prepareScene(DEMO_LAYOUTS, fromUrl?.board ?? registry)` だけを通り、`registerInput()`（shutdown での遊びかけの控え）を通らないので「記録・遊びかけに残さない」は保たれる。冒頭のコメント（`demo.js:7-10`）も今の作りと合っている。
- `piecePosition()`: 新しいオブジェクトを返し、`cells` の配列は前と同じく参照を共有するだけ（前も同じ）。`map` の第 2 引数以降は分割代入で捨てるので無害。`persist()` のキーの並び（`name, cells, location, row, col`）も前と同じで、保存される JSON は変わらない。
- `setPiecePosition()`: 4 つだけを写す。`restoreState()` は `changed` を書き換える前に求めており前と同じ。`applyProgress()`（storage の item に `name` がある）・`finishStep()`（`value` に `type`・`ok` などがある）でも余計なキーは写らない。デモの `applyRelayout()` は前の `Object.assign` が写していた中身が同じ 4 つだけなので同じ。`slideIn()`・`finishStep()` の `location: 'board'` と座標も前と同じ。
- トレイの数え方: `trayPieces()` は前の 4 か所の `filter(location === 'tray')` と同じ式。`runHint()` の `left`、`fillForced()` の `names`（`map(name)` の並びも `this.pieces` の順で同じ）、`useAuto()`・`refreshHud()` の `left` も同じ値になる（読んで確認。画面では動かしていない）。
- 向きの音: `turnDrag()`・`turnPiece()` とも `before = piece.cells` を `piece.cells = next` より前に取り、`sameShape(next, normalize(flip(before)))` は前の `flipped` と同じ式。鳴らす位置も前と同じ（`turnDrag` は `setPosition` の後・`refreshDragGhost()` の前、`turnPiece` は `layoutPiece()` の後・`refreshHud()` の前）。
- 規約: `setTimeout` 不使用、モジュールのトップレベルに書き換わる `let` は無い（`playTurnSound` は状態を持たない）。コメントの「なぜ」は移った先に残っている（「1 回使ったら捨てる」は `prepareScene` の JSDoc、「drawBoard が穴の位置を見るため」は `prepareScene` 内、全解の読み込みの理由は `loadSolutions` の JSDoc）。
- テスト: シーンのコードで `tests.html` の対象外。足すものは無い。
- 範囲: 指示に無い変更は無い。
- 文書: `rg -n -e prepareScene -e initPlayState -e createParts -e loadSolutions -e registerInput -e trayPieces -e piecePosition -e setPiecePosition -e playTurnSound docs CLAUDE.md README.md` は 0 件。`create()` に触れている `docs/developer.md:204`（控えを `create()` で読む）は今も正しい。古い記述は無い。
- 作り込みすぎ: なし（`setPiecePosition` の分割代入は余計なキーを写さないために要る。`trayPieces()` は 4 か所で使う）。
