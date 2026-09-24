# TODO-060 verifier への依頼

## 対象
未コミットの `git diff`。要件は `TODO.md` の TODO-060 の節（チェック項目 5 つ）。

## 確かめること（実測。静的な読み合わせで済ませない）
1. `python3 -m http.server 8765` を立て、Playwright（`~/.npm/_npx/*/node_modules/playwright`。`tools/capture.mjs` と同じ借り方）で
   `http://localhost:8765/tests.html` を開き、全件通ること（件数と失敗 0 を報告）
2. デモ（シーン名は `src/main.js` で確かめる）をランダム・速さ「速い」で開き、`advance` をラップして 200 手ほど記録:
   - `place` の直後に `PIECE_SIZE` 未満の空きがある盤面 → 次の手が同じ名前の `remove` か（`emptyRegionSizes` を import して判定）
   - 各手を処理したあとの `waitScale`: 今の手も次の手も `remove` のときだけ 0、`place` の次が `remove` のときは 0 でない
   - 数を表で報告（該当件数・違反件数）
3. 深さ優先に切り替えて 50 手ほど: `place → remove` のあとの `waitScale` が 1（0 でない）こと
4. 最速に切り替えて 100 手ほど進み、コンソールエラーが無いこと
5. `node tools/gen-solutions.mjs --check` は済んでいるので要らない

## 報告
`archives/agents/TODO-060/verifier-report.md`。一致したものは 1 行、食い違いだけ詳しく。測った値を必ず載せる。
コードは直さない。境界線上の判断は報告だけ。返事は 5 行以内。
