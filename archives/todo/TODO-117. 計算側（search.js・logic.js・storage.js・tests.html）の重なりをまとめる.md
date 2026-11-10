# TODO-117. 計算側（search.js・logic.js・storage.js・tests.html）の重なりをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 71 | 11,566 | 64,469 | 1,975,652 | 47% |
| impl-117（implementer） | Opus 5.5 | medium | 58 | 18,292 | 78,653 | 1,652,648 | 40% |
| rev-117（reviewer） | Opus 5.5 | high | 14 | 4,227 | 44,200 | 244,609 | 7% |
| tests-117（tests） | Sonnet 5.5 | medium | 16 | 2,183 | 30,575 | 239,248 | 6% |
| 合計 |  |  | 159 | 36,268 | 217,897 | 4,112,157 | 計 4,366,481 |

- TODO-118 と並行して進めた（利用者の指示）。main の行は TODO-117・118 で同じ時間帯を共有した値で、両方のファイルに同じ数を書いた
- 集計は `token-usage.py TODO-117 --since '2026-11-11 04:12:00'`（TODO-117〜121 を 1 つのコミットで立てたため始点が見つからない）。同じ時間帯に動いた TODO-118〜120 の担当の行は除いた

## きっかけ

全ファイルを読み直したリファクタリングの洗い出しで、計算側に同じ処理の書き直しが重なっていた。

## やったこと

- `src/search.js`: マスを `"row,col"` にする `moveCellKeys()` を足し、`countCellMoves()`・`singlePieceCell()`・`moveCoversCell()` がこれを使う。`solveStepsRandom()` から置ける手の一覧 `placeableMoves()` と手の選び方 `chooseMove()` を出した。`random()` を呼ぶ順番と回数は同じ
- `src/logic.js`: 内部の `turnPosition()` を足し、`nextTurn()`・`prevTurn()`・`nextPlaceableTurn()` が使う
- `src/storage.js`: `isPositiveInteger()`・`isPositiveNumber()` を足し、記録・遊びかけの検査を置き換えた
- `tests.html`: `firstSolutionStepsWith()` を `firstSolutionSteps()` に統合し、`sigOf()`・`createFailedOf()` を共通の補助にした

## 確かめたこと

- `solveStepsRandom()` の手順: 8x8・6x10 × 判定 2 通り × 種 3 つの 12 組で、変更前後の手順の sha256・`random()` の呼び出し回数が一致（`archives/agents/TODO-117/record-random-steps.mjs`）
- `tests.html`: 476 件すべて通過（`test(` の数は前後とも 281。実行数が 476）。`chooseMove()` の重みを 1 か所外すと 4 件落ちる
- レビュー: 要修正 0 件・検討 0 件。`storage.js` の境界値（0・負・NaN・Infinity・小数・文字列）は旧・新の判定で差 0 件

## 残ること

- レビューの好みの範囲 1 件（`isPositiveNumber()` の `typeof` が不要）は、`storage.js` を触る TODO-119 で一緒に直す

## 分担の振り返り

- implementer は手順の突き合わせ用スクリプトを先に作り、変更前後を 12 組で比べた。reviewer は境界値を node で旧・新の判定に渡して確かめ、`typeof` の冗長さを見つけた。tests は 1 か所を壊して落ちることを確かめたが、`placeableMoves()` の除外や `moveCellKeys()` が捕まるかは見ていない
- 見込みどおりの編成で、食い違いは無い。implementer の報告にあった「281 件は古い」は実行数との取り違えで、reviewer が正した
- 次に同じ規模なら同じ編成でよい。tests の壊す箇所は 1 か所でなく、出した関数ごとに 1 つ（今回なら 3 つ）を依頼で名指しする
