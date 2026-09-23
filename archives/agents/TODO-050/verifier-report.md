# TODO-050 verifier-report

対象: 未コミットの差分（`src/config.js`, `src/icons.js`, `src/logic.js`,
`src/scenes/demo.js`, `tests.html`）。

## 1. tests.html のブラウザ実行

tests 担当が済ませたとのことなので省略（依頼どおり）。

## 2. Node での確認

スクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/761dd6b3-74b0-4b24-9ca6-03c5864888ed/scratchpad/verify-breadth.mjs`

`solveStepsBreadth` を 8×8、`hasSolution`（`src/data/8x8.js` の全解）で
最初の `solved` まで回した。シード 3 つ（mulberry32(1), mulberry32(2), mulberry32(3)）:

```
{"seed":1,"placeCount":28383,"badPlace":0,"badRemove":0,"solved":true}
{"seed":2,"placeCount":28383,"badPlace":0,"badRemove":0,"solved":true}
{"seed":3,"placeCount":28383,"badPlace":0,"badRemove":0,"solved":true}
```

- `replay` でない `place` の数: 3 シードとも **28,383**（期待どおり、シードで
  変わらなかった）
- 置けない `place`（`canPlace().ok === false` なのに place が来た件数）: **0 件**
- 盤に無いピースの `remove`: **0 件**
- 3 シードとも最後まで `solved` に到達

## 3. solveSteps（深さ優先）が変わっていないこと

スクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/761dd6b3-74b0-4b24-9ca6-03c5864888ed/scratchpad/compare-depth.mjs`

`git show HEAD:src/logic.js` と `git show HEAD:src/config.js` を scratchpad に写し、
working tree 側（差分適用後）の `solveSteps` と同じシード（mulberry32(42)）で
8×8 の最初の 2,000 手を比較。

結果: **2,000 件とも完全一致**（`first mismatch index -1`）。
なお `git diff src/logic.js` を見る限り、既存の `solveSteps()` 本体には
変更が無く、`solveStepsBreadth()` が新規に下へ追加されただけ（config.js の
差分もレイアウトのボタン数まわりのみで `PIECES` など `solveSteps` の依存には
無関係）。実行結果の完全一致はこれと整合する。

## 4. src/scenes/game.js

`git diff --stat src/scenes/game.js` の出力は空。差分無しを確認した。

## 確かめられなかったこと

- tests.html の実際のブラウザ実行は、依頼どおり自分では行っていない
  （tests 担当の「277 件通過」をそのまま信頼した）
- 画面の見た目・レビューは対象外（依頼どおり）
