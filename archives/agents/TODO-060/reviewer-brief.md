# TODO-060 reviewer への依頼

## 対象
`git diff`（未コミット）の `src/logic.js`・`src/scenes/demo.js`・`tests.html`・`docs/UsersGuide.md`・`docs/developer.md`。
要件は `TODO.md` の TODO-060 の節。実装・テストの報告は同じディレクトリの `implementer-report.md`・`tests-report.md`。

## 見ること
- `solveStepsRandom()`: 置いた直後に `PIECE_SIZE` 未満の空きがあれば同じ手を外す。控え（`failed`）の入れ方が
  行き詰まったときの外し方と同じか。`undoLast()` へのまとめで既存の外し方の意味が変わっていないか
  （`ok` の値、スタックが空のときの扱い、`continue` の位置）
- `demo.js` の先読み（`this.peeked`）: 探し方の切り替え・解のあとの探し直し・`onSolved()`・速さの切り替え・
  generator が尽きたときで、古い手を使ったり 1 手飛ばしたりしないか。外した**あと**の待ち（`randomRemoveMultiplier`）
  が今までどおり効くか。最速で変わらないか。深さ優先で remove の直前が 0 になるか
- `tests.html`: 既存テストの前提の書き換えが、テストを弱めていないか（`tests-report.md` の理由と突き合わせる）
- `CLAUDE.md` の規約（`setTimeout` 不使用、値は config、JSDoc は「なぜ」）
- 文書が今の動きと合っているか

## 見なくてよいもの
画面の撮影、テストの再実行、全解データの突き合わせ（済んでいる）。

## 報告
`archives/agents/TODO-060/reviewer-report.md`。問題なしは 1 行、指摘だけ詳しく。コードは直さない。
境界線上の判断は報告だけ（「実害は未確認」と添える）。返事は 5 行以内。
