# TODO-062 verifier への依頼

## 対象

未コミットの差分（`git diff`）。デモのランダム（`solveStepsRandom()`）で、置き方の重みに直前の手からの近さ
（`moveDistance()`・`DEMO.randomNearPower`）を掛けた。ピースの選び方は変えていない（利用者が決めた）。

## 確かめること（手段も指定）

1. `node tools/gen-solutions.mjs --check` が終了コード 0
2. `tests.html` をブラウザで全件通るか: `python3 -m http.server 8765` を立て、Playwright の headless Chromium
   （`tools/capture.mjs` と同じく npx の置き場から借りる）で `http://localhost:8765/tests.html` を開き、
   通った件数・落ちた件数・コンソールエラーを読む
3. デモの実物: `http://localhost:8765/` を開き、`window.game` からデモを探し方ランダム・最速で動かし
   （`src/scenes/demo.js` を読んで起動の仕方を決める）、2000 手ほど進めてコンソールエラーが 0 件か、
   解に達するか（達した回数）を見る
4. `docs/UsersGuide.md`・`docs/developer.md`・`src/config.js`・`src/logic.js` の JSDoc の説明が、差分の動き
   （近さは選んだピースの置き方にだけ掛かる、`stack` が空なら掛けない）と食い違わないか

## 見なくてよいもの

- 値の良し悪し、画面の見た目、レイアウト。テストの強さ（tests 担当が壊して確かめ済み）

## 報告

`archives/agents/TODO-062/verifier-report.md`。一致したものは 1 行、食い違いだけ詳しく。測った値（件数など）を必ず載せる。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
