# TODO-059 reviewer への依頼

対象: `git diff`（`src/logic.js`・`src/scenes/demo.js`・`src/config.js`・`tests.html`・`docs/`）。
依頼の中身は `implementer-brief.md` と `TODO.md` の TODO-059。実装とテストの報告は
同じディレクトリの `implementer-report.md`・`tests-report.md`。

## 見てほしいこと

- `solveStepsRandom()` の戻りのループ: 盤面ごとの控え（`failed`）に入れる手が正しいか。
  「解ける」盤面で、解につながる手を控えてしまい、置ける手が無いのに解けるままの
  盤面が生まれて止まる・空回りすることがないか
- `canContinue` が常に偽のときに止まらずに回るか（盤が空に戻ったあとの扱い）
- 控え（`failedByBoard`）の増え方。既存の `ponytail:` コメントの前提（「hasSolution では
  行き詰まらないので増えない」）が今も成り立つか
- `demo.js` の間隔の揺らぎがランダムのときだけ効くか、`hintState` と効果音
  （`audio.invalid()`）の鳴り方が新しい動きで妥当か
- 深さ優先（`solveSteps()`）の動きが変わっていないか
- JSDoc・文書が新しい動きと食い違っていないか。規約（`CLAUDE.md`）に反していないか
- テストが新しい動きを押さえているか（壊すと落ちるか）

## 見なくてよいこと

- 画面の見た目、重みの式や揺らぎの値の良し悪し（利用者が画面で決める）
- テストの実行（verifier がやる）

## 報告

コードは直さない。原因の切り分けや境界線上の判断はせず、実害が未確認なら
そう添えて報告だけする。`archives/agents/TODO-059/reviewer-report.md` に書き、
問題の無い観点は 1 行、問題だけ詳しく。返事は 5 行以内。
