# TODO-063 verifier への依頼

## 対象

未コミットの差分（`git diff`）。仕様: デモのランダム（`solveStepsRandom()`）で、行き詰まり（置ける手が尽きて戻った一続き）が終わったときの
`stack.length` ごとに回数を数え、`DEMO.randomCollapseAfter`（仮 5）に達したら `DEMO.randomCollapseMoves`（仮 3）手を続けて外す。
崩した手は全部控えに入れる。置いた直後にその場で外す手は数えない。

## 確かめること（手段も指定）

1. `node tools/gen-solutions.mjs --check` が終了コード 0（2 分以上かかる。バックグラウンドでよい）
2. `tests.html` の全件: `python3 -m http.server 8765` を立て、Playwright の headless Chromium（`tools/capture.mjs` と同じく npx の置き場から
   借りる）の新しいコンテキストで開き、通った件数・落ちた件数・コンソールエラーを読む
3. デモの実物: `http://localhost:8765/` でデモを探し方ランダム・最速で 8×8 と 6×10 それぞれ解に達するまで（上限 6000 手）進め
   （`window.game` から。`src/scenes/demo.js` を読んで起動の仕方を決める）、次を数える:
   - 3 手以上続く remove のうち、行き詰まりの外しと崩しの見分けは要らない。remove の連なりの長さの分布（最大値を含む）
   - 連なりの remove の間に待ちが入っていないか（`advance()` の先読みで続けて戻るか。TODO-060）。`pickWaitScale()` などの値を `evaluate` で集めてよい
   - コンソールエラーの数、解に達したか、そこまでの手数
4. `docs/UsersGuide.md`・`docs/developer.md`・`src/config.js`・`src/logic.js` の JSDoc が差分の動きと食い違わないか
   （利用者が途中で 2 回決め直したので、古い決め方の説明が残っていないか。`rg -n "最後の 1 手|その場で外す手も" src/ docs/`）

## 見なくてよいもの

値の良し悪し、画面の見た目、テストの強さ（tests・reviewer が壊して確かめ済み）。

## 報告

`archives/agents/TODO-063/verifier-report.md`。一致したものは 1 行、食い違いだけ詳しく。測った値を必ず載せる。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
