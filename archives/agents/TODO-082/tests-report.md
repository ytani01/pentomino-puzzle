# TODO-082 tests 担当の報告

対象: `tests.html` のみ（`src/` は変更していない。手順の 5 で確かめた）。

## 結果

413 件すべて通った（Playwright で `http://localhost:8765/tests.html` を確認）。
コンソールにエラー・警告なし。

## やったこと

### 1・2. 既存テストの前提の直し

- 「狭い所を覆える手が一番少ないマスを唯一絞れる場面では…」（8×8・6×10）と
  `sumTightCoverage()`（「狭い所を覆える手のあるピースを選びやすい抽選になっている」の元）
  に、`singlePieceCell(choices, () => 0)` が非 null の場面を除く分岐を足した。
  `singlePieceCell` を `src/logic.js` から import（`tests.html:49`）。
  - `computeChoices()` が控えを除いた choices を再現するので、`solveStepsRandom()`
    内部と同じ条件で判定できる（reviewer-report「検討 2」どおり）。
- 「置ける手が尽きて 1 手ずつ外す並び…（既定, 6×10）」は、`FAST_SEED['6x10']`（164）
  だと singlePieceCell が先に効いて置き済みピースの形の空きへ向かう手が減り、
  固定シードの 3000 手以内に一度も起きないまま解に着いてしまう（77 手で solved）。
  このテストだけのローカルな種（`4`）に替えた。node で実測すると、種 4 は
  261 手で解に着き、途中で 4 つの目印（`sawRun`・`sawUnfitRegionUndo`・
  `sawPlacedFormUndo`・`sawUncoverableRegionUndo`）が全部立つ。`FAST_SEED` 自体は
  他のテスト（`solveSteps` の分岐回数の説明コメントなど）と共有なので変えていない。

### 3. `singlePieceCell()` 単体のテスト（新設）

`tests.html` に節「src/logic.js — 1 種類しか入らないマス（singlePieceCell, TODO-082）」
を足した（`sumTightCoverage` のテストの後、TODO-081 の節の前）。reviewer-report
「検討 3」のうち、別のコードを通るものを手作りの choices で確かめた。

- 2 種類目のピースが同じマスを覆うと外れる（`cell.pick = -1`）。choices が
  空でも null
- 同じピースの手が何度重なっても 1 種類のまま、count は一番少ないマスが選ばれる
- 同数なら random で選ぶ。pick は `choices` の添字（`{ pick: 0/1, cellKey }` で確認）
- どのマスも 2 種類以上なら null

### 4. `solveStepsRandom()` 側の確認（新設）

同じ節に「1 種類しか入らないマスがある場面の place（forced を除く）は、
そのピースで、候補のマスのどれかを覆う（8×8・6×10）」を足した。1 と同じ
再現のやり方（`randomSteps` + `computeChoices`、FAST_SEED、limit 1500）。

- `singlePieceCandidates()`（tightCellsOf と同じ考え方のテスト用ヘルパー）で、
  count が一番少ない「1 種類しか入らないマス」の同数タイをすべて集める。
  タイが複数ピースにまたがる場面は、`solveStepsRandom()` 内部の `random()` で
  どのピースが選ばれるか外からは追えないので確かめる対象から除く（null を返す）
- 単一ピースに絞れる場面では、実際に置いたピース名が一致すること・置いた
  マスが候補のマスのどれかを覆うことを確かめる

## 壊すと落ちるかの確認（手順の 5、確認後は必ず元に戻した）

- (a) `const single = singlePieceCell(choices, random);` を `null` にすると、
  4 のテスト（8×8・6×10 の 2 件）が落ちた
  （「1 種類しか入らないマスがあるのに、置いたピースが違う」）
- (b) `singlePieceCell()` の `if (cell.pick !== pick) cell.pick = -1;` を消すと、
  9 件が落ちた（3 の単体テスト 2 件、4 の新設テスト 2 件に加え、1・2 で直した
  既存テスト 5 件も道連れで落ちた）
- 確認後、`git diff src/logic.js` が最初に渡された差分どおりであることを確認
  （60 insertions / 13 deletions、内容も一致）

## 判断が要る点

なし。指示の範囲で完了した。
