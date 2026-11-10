# TODO-117 implementer 報告

## 変更点

- `src/search.js`
  - `:66` `moveCellKeys(move)` を足し、`countCellMoves()`（`:85` 付近）・`singlePieceCell()`・`moveCoversCell()`（`:125`）の
    `"row,col"` の組み立てをこれに寄せた。`moveCoversCell()` は `some` から `includes` へ（結果は同じ）
  - `:247` `placeableMoves()`（置ける手の一覧）と `:281` `chooseMove()`（詰めて置く手 → 1 種しか入らないマス →
    狭い所 → 重み）を `solveStepsRandom()` から出した。`random()` の呼び出しは同じ順番・回数のまま
    （`pickOne` は `chooseMove()` の中へ同じ式で移した）。本体では `forced.length > 0` を `forced`（真偽）で受ける
- `src/logic.js:131` 内部の `turnPosition()`（並び・正規化した形・位置）を足し、`nextTurn()`・`prevTurn()`・`nextPlaceableTurn()` がこれを使う
- `src/storage.js:25` `isPositiveInteger()`、`:33` `isPositiveNumber()` を足し、`loadBest()`・`sanitizeHistory()`・
  `migrateHistory()`・`sanitizeFound()`・`sanitizeProgress()`（`solved`）の検査を置き換えた
- `tests.html`
  - `:1163` `firstSolutionSteps(spec, random, canContinue, limit)` に統合し `firstSolutionStepsWith()` を消した（呼び出し 2 か所を直した）
  - `:1385` `sigOf()`、`:1394` `createFailedOf()` を上に置き、テスト内の `sigOf` 4 か所（1 か所は引数 4 つの形）と
    `failedByBoard`＋`failedOf` 7 か所をこれに替えた
- `TODO.md` の TODO-117 のチェック 5 つ

## 検証

- 手順の突き合わせ: `node archives/agents/TODO-117/record-random-steps.mjs`（8x8・6x10 × 既定の判定/全解の判定 × 種 1・14・164、
  各 最大 600 手。手順の sha256・`random()` の呼び出し回数・最後の手）。変更前 `before.txt` と変更後 `after.txt` が `diff` で一致（終了コード 0）。
  12 組のうち 3 組は solved まで届いている
- `tests.html`: ローカルサーバ（`python3 -m http.server 8765`）経由で headless Chromium（npx の置き場の Playwright 1.63.0 を借りる。
  `archives/agents/TODO-117/run-tests.mjs`）。**変更後 476 件すべて通った**（pageerror なし、終了コード 0）。
  変更前のコード（`git stash`）でも 476 件で、件数は同じ。TODO.md の「281 件」は古い数
- テストは足していない（壊すと落ちるかの確認は対象外）

## 規約で決めたこと

- 新しい関数の JSDoc には「なぜ出したか」を書いた（CLAUDE.md の JSDoc の規約）
- `sanitizeProgress()` の `ms`（`>= 0`）と `cells` の座標（0 以上の整数）は「正の」検査ではないので触っていない（依頼の範囲が「正の整数」「正の有限な数」）

## 範囲外で気づいたこと・残る懸念

- `tests.html` の `const canContinue = (board) => hasSolution(<データ>, board);` が 3 か所（`:1314`・`:1677`・`:2582`）ある。
  閉じ込めるデータが違い、関数にしても長さが変わらないので残した
- `tests.html:1696` のコメント「控え（failedByBoard）を再現し」は、実装（`solveStepsRandom()`）の名前を指すのでそのまま
