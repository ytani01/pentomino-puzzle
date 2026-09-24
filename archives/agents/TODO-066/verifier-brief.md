# TODO-066 verifier への依頼

## 目的
`TODO.md` の TODO-066 の節どおりに `solveStepsRandom()` が動くかを実測で確かめる。コードは直さない。
見つけたことは報告だけ（原因の切り分けや境界線上の判断はせず「実害は未確認」と添える）。

## 確かめること
1. `python3 -m http.server 8765` 経由で Playwright で `tests.html` を開き、全件通過するか（件数）
2. `node tools/gen-solutions.mjs --check` が通るか
3. デモの実物で: `http://localhost:8765/` のデモをランダム・最速にし、`window.game.scene.getScene('Demo')`
   （シーン名は `src/main.js` で確かめる）の generator の手を `evaluate` で 300 手ぶん集める
   （集め方は `archives/agents/TODO-060/verifier-report.md` を参考にしてよい）。数えるもの:
   - 埋められる 5 マスの穴があったのに別の場所へ置いた回数（0 のはず）と、埋めた回数
   - 埋めて解なし（place の ok が偽）→ 直後に remove 2 手、2 手目の name が埋める直前の手と一致した回数
   - コンソールエラーの件数
4. 読み合わせ: `docs/UsersGuide.md`・`docs/developer.md`・`src/logic.js` の JSDoc の説明が、3 の動きと食い違わないか

画面の見た目の評価は要らない。一致したものは 1 行、食い違いだけ詳しく。

## 報告
`archives/agents/TODO-066/verifier-report.md`。返事は 5 行以内。
