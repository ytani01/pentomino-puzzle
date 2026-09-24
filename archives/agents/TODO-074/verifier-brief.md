# TODO-074 verifier への依頼

`src/config.js` の値を 2 つ変えた（`DEMO.randomTightWeight` 4 → 10、`DEMO.randomCollapseAfter` 5 → 3）。JSDoc の文言も直した。

## やること

1. `python3 -m http.server 8765` は立っている（`curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://localhost:8765/` で 200 を確かめる。
   立っていなければ立てる）
2. Playwright で `http://localhost:8765/tests.html` を開き、結果の文字（`#summary` など、全件の件数と落ちた件数）とコンソールエラーの数を読む。
   Playwright は npx の置き場から借りる（`tools/capture.mjs` の冒頭のコメントと同じ探し方で `PLAYWRIGHT` を決め、短い node スクリプトを
   `archives/agents/TODO-074/run-tests.mjs` に書いて走らせる）。localhost に届かないならサンドボックスを外してよい
3. 落ちたテストがあれば、テストの名前と落ちた理由の文字をそのまま写す（直さない。原因も考えない）

## 報告

`archives/agents/TODO-074/verifier-report.md` に、件数・落ちた件数・落ちたテストの名前と理由・コンソールエラーの数。返事は 3 行以内。
