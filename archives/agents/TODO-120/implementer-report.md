# TODO-120 implementer の報告

コミット: `e5314a7`（`src/scenes/game.js`・`src/scenes/demo.js` だけ）

## 変更点

- `game.js:106` `create()` を次に分けた。呼ぶ順は前と同じ（部品 → 全解の読み込み → 入力 → 遊びかけ／控えた状態を戻す → `refreshHud()` → `ready = true`）
  - `game.js:131` `prepareScene(layouts, boardKey)` — 背景色・`relayoutState` の受け取り（返り値）・ボード・レイアウト・色の組・空の盤面。デモと共通
  - `game.js:146` `initPlayState()` — 本編の状態の初期化（`ready = false` を含む）
  - `game.js:173` `createParts(saved)` — 部品の組み立てと「やり直し」の説明の出し直し
  - `game.js:192` `loadSolutions()` — `solutions`・`avoidNumbers` と `ensureSolutions()`
  - `game.js:212` `registerInput()` — 入力と shutdown の登録
  - 「ボードはタイトルで選ぶ（TODO-009…）」のコメントは、registry を読む本編の `create()` 側に置いた
- `demo.js:81` `create()` の前半を `prepareScene(DEMO_LAYOUTS, fromUrl?.board ?? registry)` に置き換えた。使わなくなった import（`BOARDS`・`COLORS`・`PALETTES`・`PALETTE_REGISTRY_KEY`・`orientationOf`・`createBoard`）を消した
- `game.js:60` `piecePosition()`・`game.js:64` `setPiecePosition()`（モジュールの関数、export）。`snapshot()`・`restoreState()`・`persist()`・`applyProgress()`・`slideIn()`、デモの `relayout()`・`applyRelayout()`・`finishStep()` で使う。`persist()` の保存の形（`name` が先頭、続いて 4 つ）は変えていない
- `game.js:1192` `trayPieces()`。`useAuto()`・`runHint()`・`refreshHud()`・`fillForced()` で使う
- `game.js:72` `playTurnSound(before, after)`。`turnDrag()`・`turnPiece()` で使う。判定に使う向きは前と同じく書き換える前の `piece.cells`、鳴らす位置も前と同じ

範囲外として触っていないもの: `dropDrag()` の `piece.location = 'board'; piece.row/col = …`（依頼の列挙に無い）、`boardIsEmpty()`（数えずに `every` で見ている）、デモの `playTurns()` の音（`step.kind` で決まり、判定が別）。

## 検証

`archives/agents/TODO-120/check.mjs`（Playwright。npx の置き場の playwright と `~/.cache/ms-playwright/chromium_headless_shell-1243`、1280×800、既に動いていた 8765 のサーバ）。終了コード 0。

- 置く: マウスでトレイから F をボードへ → 残り 12→11、履歴 1
- 向きを変える: ドラッグ中のホイールで形が変わった（`turnDrag`）、ボード上で `turnPiece()` → 形が変わり履歴 2
- 一手戻す: `undo()` → 形が元に戻り履歴 1
- 外す: ボードの F をドラッグして画面の右端で離す → 残り 12
- おまかせ 2 回 → タイトルへ → `resume: true` で開く → ボード上のピースが一致（`L@0,3 P@0,0`）
- 本編の `relayout()` → ボード上のピースが一致
- デモを開く → `running`、手が進む。デモの `relayout()` → 続きから進む（tried 1→3）
- コンソールの error / pageerror は 0。出たのは headless の WebGL ドライバの警告（`GPU stall due to ReadPixels`）だけ
- `node --check` は 2 ファイルとも通過。テストは足していない（`tests.html` は流していない。依頼どおり）

## 残る懸念

- ヒント表示（`runHint()`・`fillForced()` の `trayPieces()`）は画面で動かしていない（依頼の確認項目に無い）
- 文書: `docs/developer.md` などに `create()` の中身や新しい関数名を書いた箇所があるかは見ていない（触ってよい範囲外）
