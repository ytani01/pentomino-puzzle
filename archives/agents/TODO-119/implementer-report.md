# TODO-119 implementer 報告

## 変更点
- `src/config.js`: `PIECE_BY_NAME`（Map）を `PIECES` の直後に追加して export
- `src/ui.js`: ローカルの `PIECE_BY_NAME` を削除し config から import。`drawMiniBoard()` の塗りを `fillColor()` に
- `src/icons.js`: `PIECES.find()` → `PIECE_BY_NAME.get()`。`paletteIcon()` の塗りを `fillColor()` に
- `src/storage.js`: `sanitizeProgress()` の `PIECES.find()` → `PIECE_BY_NAME.get()`
- `src/logic.js`: `fillColor(palette, color)`（ネオンなら `darken(color, NEON.fillDarken)`）を追加。`NEON` を import
- `src/scenes/boot.js`: `bakeTile(key, size, draw)` を追加し、`makeTile`・`makeGlassTile`・`makeNeonTile` の前後（`textures.exists`・`make.graphics`・`generateTexture`・`destroy`）をここへ。`makeNeonTile` は `(key, size, palette, color)` になり `fillColor()` を使う

`game.js`・`demo.js`・`records.js`・`title.js`・`clear.js` に `PIECES.find()`・`NEON.fillDarken` の同じ処理は無い（`rg` で確認）。

## 検証
- `node archives/agents/TODO-119/check-fill.mjs`: 3 つの色の組 × 12 ピース = 36 通りで、変更前の式（ui/icons の三項、boot の `darken`）と `fillColor()` が一致（exit 0）。式の係数を 0.5 に壊すと throw で落ちることも確認（戻した）
- `node --check src/*.js src/scenes/*.js`: 通った
- `archives/agents/TODO-119/console-check.mjs`（Playwright、ローカルサーバ 8765）: タイトル・本編を開いてコンソールエラー 0。`tests.html` は「476 件すべて通った」
- 撮影による見た目の確認は未実施（別の担当の範囲）

## 残る懸念
- `tests.html` は `waitUntil: 'load'` だと 30 秒で goto がタイムアウトする（テストが同期で重いため。今回の変更とは無関係。スクリプトは `commit` で待つ）
- 追加: `storage.js` の `isPositiveNumber()` から冗長な `typeof value === 'number'` を削除（`Number.isFinite()` は文字列を数にしないので受け入れる値は同じ）。`tests.html` 476 件通過。
