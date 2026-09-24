# TODO-062 tests への依頼

## 背景

`solveStepsRandom()` の置き方の重みに、直前の手（`stack` の最後）からの近さを掛けた
（`git diff src/logic.js src/config.js` を読む。新しい関数は `moveDistance(a, b)`、値は `DEMO.randomNearPower`）。
実装担当の報告: `archives/agents/TODO-062/implementer-report.md`。

## やること

1. **落ちている既存テスト 1 件を直す**:「N の remove で ok:true になり、まだ置ける手が残っているのに次が place でない」。
   重みが変わって `FAST_SEED` の手順が変わり、TODO-066 の「穴を埋めて解なしなら 2 手外す」
   （1 手目の remove が ok:true でも続けて 2 手目を外す。仕様どおり）を初めて踏んだもの。
   この不変条件から TODO-066 の 2 手外しの 1 手目を除く形に直す（テストの元の狙いは保つ）。
   TODO-066 のテストで即座の remove を見分けるフラグを分けてあるので、それに揃える
2. **足す**:
   - `moveDistance()`: 隣り合う 2 手で 1、同じマスを含むと 0、離れた例で期待値どおり（手で数えた値）
   - 近さが効いていること: 固定シードで `solveStepsRandom()` を回し、抽選で選ばれた place
     （`forced` でない手）の直前の手からの距離の平均が、`DEMO.randomNearPower` を 0 にしたとき
     より小さい、のように**比べて**確かめる（`DEMO` は export されたオブジェクトなので、テスト内で
     一時的に書き換えて finally で戻せる）。`forced` の手を除けないなら、除かずに比べてよい
3. 壊すと落ちるか: 重みの行で距離の項を外した（`touch` だけを返す）とき、2 の近さのテストが落ちることを確かめ、元に戻す

## 保つもの

- `src/` は触らない（テストだけ）。既存のテストの狙いを弱めない
- 既存の書き方（`group`・シード付き乱数 `mulberry32` など）に合わせる

## 完了条件

`python3 -m http.server 8765` 経由で `tests.html` を開き、全件通る（件数を報告）。

## 報告

`archives/agents/TODO-062/tests-report.md` に、直したテスト・足したテスト・全件の件数・壊して落ちた件数。
返事は 5 行以内。
