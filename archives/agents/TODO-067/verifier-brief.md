# TODO-067 verifier への依頼

## 対象

未コミットの差分（`git diff`）。仕様は `TODO.md` の TODO-067 の節: デモのランダム（`solveStepsRandom()`）で、置いた直後に
置き済みのピースと同じ形の閉じた 5 マスの空きができたら、直前の 1 手をその場で外す。

## 確かめること（手段も指定）

1. `node tools/gen-solutions.mjs --check` が終了コード 0
2. `tests.html` の全件: `python3 -m http.server 8765` を立て、Playwright の headless Chromium（`tools/capture.mjs` と同じく
   npx の置き場から借りる）で開き、通った件数・落ちた件数・コンソールエラーを読む。tests 担当は 327 件と報告したが、
   331 件から 2 件消した経緯なので、件数を数えて報告する（食い違っても判断はしない）
3. デモの実物: `http://localhost:8765/` でデモを探し方ランダム・最速で 3000 手ほど進め（`window.game` から。`src/scenes/demo.js` を読んで
   起動の仕方を決める。デモは `canContinue` に全解データの `hasSolution` を渡す）、次を数える:
   - 置いた直後に置き済みのピースの形の 5 マスの空きがある place の数と、そのうち次の手がその手の remove だった数（一致するはず）
   - コンソールエラーの数、解に達した回数
4. `docs/UsersGuide.md`・`docs/developer.md`・`src/logic.js` の JSDoc が、差分の動きと食い違わないか

## 見なくてよいもの

値の良し悪し、画面の見た目、テストの強さ（tests 担当が壊して確かめ済み）。

## 報告

`archives/agents/TODO-067/verifier-report.md`。一致したものは 1 行、食い違いだけ詳しく。測った値を必ず載せる。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
