# TODO-044 implementer の報告

## 変更点

- `src/logic.js:295-321` 内部関数 `emptyRegions(board)`（領域ごとのマスの添字。行優先で見つけた順）を足し、
  `emptyRegionSizes()`（`:327-329`）はその長さを返すだけにした（戻り値は同じ）
- `src/logic.js:338-365` `forcedPlacements(board, names)` を足した。大きさ 5 の領域だけ見て、
  `names` のピースの `orientations()` と `sameShape()` なら `{ name, cells, row, col }`。
  既に返したピースは飛ばす（同じピースを 2 回返さない）
- `src/scenes/game.js:15` import に `forcedPlacements`
- `src/scenes/game.js:1045-1047` `toggleHint()` で入にしたとき `runHint()` → `refreshHud()`
- `src/scenes/game.js:1127-1156` `fillForced()`。条件は依頼どおり
  （`playing && hinting && solutions && hasSolution`）。履歴は積まず、`usedAuto` も立てない。
  全部置いてから `audio.auto()` と `showMessage('<名前・名前> を置いた')` を 1 回
- `src/scenes/game.js:1158-1178` `refreshHud()` の先頭で `fillForced()`、最後で埋めたときだけ
  `checkSolved()`。重複していた「盤が変わる入口をここにまとめてある」のコメントは JSDoc 1 つにまとめた
- `src/scenes/game.js:1188-1190` `checkSolved()` の頭に `if (!this.playing) return;`

デモ: `DemoScene` は `refreshHud()` を上書きしており（`src/scenes/demo.js:186`）、
`checkSolved`・`toggleHint`・`fillForced` を呼ぶ箇所も無い（`rg` で確認）ので影響しない。

## 確かめた方法と結果

- `node archives/agents/TODO-044/check-forced.mjs`（終了コード 0。8×8 の代表形 65 件で回す）
  - (a) 1 つ取り除いた盤（65×12）で、`names` を [そのピース] と全 12 種の 2 通り: 1560 件中 NG 0
    （返すのはそのピースだけ、置き直した `boardKey` が元と一致＝位置と向きも一致）
  - (b) 2 つ取り除き隣り合わない組: 3018 件中 NG 0（2 つ返し、置き直すと元に戻る）。
    隣り合う組（10 マスの空き 1 つ）: 1272 件中、何か返したもの 0
  - (c) 取り除いたピースを `names` から外す: 780 件中、何か返したもの 0
  - 同じピース（I）の形の空きを 2 か所作った盤: `I@0,0` の 1 つだけ返す
- `node --check` で `src/logic.js`・`src/scenes/game.js` とも終了コード 0
- `tests.html`: 既に動いていた `localhost:8765` を Playwright 同梱の chrome-headless-shell の
  `--dump-dom` で開き、`256 件すべて通った`
- 画面での動作確認はしていない（別の担当）

## 迷った点・気づいたこと

- **おまかせの直後に自動で埋まったとき**、`useAuto()` の「X を置いた」を `fillForced()` の
  「Y を置いた」が上書きし、`audio.auto()` も 2 回鳴る（ほぼ同時）。依頼の設計どおりにしてある。
  文言をまとめるかは判断が要る
- `emptyRegionSizes()` が領域ごとに配列を作るようになった。`regionsFitPieces()` 経由で
  `solveSteps()` の既定の枝刈りに使われる（デモは TODO-043 で `canContinue` を渡しているので
  既定は通らない。`tools/enumerate.mjs` は使っていない）。速さは測っていない
- `check-forced.mjs` は `archives/agents/TODO-044/` に残した（使い回し用）
