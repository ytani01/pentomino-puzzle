# TODO-050 verifier への依頼

対象: 未コミットの差分（`git diff`）。目的は TODO.md の TODO-050。

確かめること（数値を報告に載せる）:
1. tests.html のブラウザ実行は tests 担当が済ませた（277 件通過）ので要らない
2. Node（`tools/window-shim.mjs` を import して src/ を読む）で:
   - `solveStepsBreadth` を 8×8、全解の判定（solutions.js の hasSolution）で最初の solved まで回し、
     replay でない place の数（期待 28,383 付近。シードで変わるなら 3 シード分）
   - 手を順に盤へ当てはめ、置けない place・盤に無いピースの remove が 0 件
   - `solveSteps()`（深さ優先）が変わっていないこと: `git stash` などで元に戻さず、
     `git show HEAD:src/logic.js` を scratchpad に写して同じシードの最初の 2,000 手を比べ、一致すること
3. `git diff src/scenes/game.js` が空であること

見なくてよいもの: 画面の撮影（別担当）、コードの良し悪し（レビュー済み）、文書。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。
報告は archives/agents/TODO-050/verifier-report.md（一致したものは 1 行、食い違いだけ詳しく）。返事は 5 行以内。
