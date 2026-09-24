# TODO-061 verifier への依頼

## 対象

未コミットの差分（`git diff`）。仕様は `TODO.md` の TODO-061 の節と、利用者が決めたこと: 「狭い空き」は置ける手の少ないマス
（`countCellMoves()`）で測る。狭い所を覆えるピースを `DEMO.randomTightWeight` で選ばれやすくし、選んだら狭い所を覆う置き方に絞る。
reviewer のあとで main が抽選の書き方を変えた（`src/logic.js` の `covering`。結果は同じはず）。

## 確かめること（手段も指定）

1. `node tools/gen-solutions.mjs --check` が終了コード 0（2 分以上かかるのでバックグラウンドで走らせてよい）
2. `tests.html` の全件: `python3 -m http.server 8765` を立て、Playwright の headless Chromium（`tools/capture.mjs` と同じく npx の置き場から
   借りる）の新しいコンテキストで開き、通った件数・落ちた件数・コンソールエラーを読む
3. デモの実物: `http://localhost:8765/` でデモを探し方ランダム・最速で 8×8 と 6×10 それぞれ 1500 手ほど進め（`window.game` から。
   `src/scenes/demo.js` を読んで起動の仕方を決める）、コンソールエラーの数と解に達した回数を数える。
   あわせて、各 place の直前の盤面で `countCellMoves()` を使って狭い所を数え直し、forced（5 マスの穴を埋める手）を除いた place のうち
   狭い所を覆った割合を出す（控え `failed` はデモからは見えないので無視してよい。ずれは「控えを無視した近似」と書く）
4. `docs/UsersGuide.md`・`docs/developer.md`・`src/config.js`・`src/logic.js` の JSDoc が差分の動きと食い違わないか

## 見なくてよいもの

値の良し悪し、画面の見た目、テストの強さ（tests 担当が壊して確かめ済み）。

## 報告

`archives/agents/TODO-061/verifier-report.md`。一致したものは 1 行、食い違いだけ詳しく。測った値を必ず載せる。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
