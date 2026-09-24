# TODO-059 verifier への依頼

対象は今の作業ツリーの差分（`git diff`）。依頼の中身は `implementer-brief.md`、
レビューの指摘は `reviewer-report.md`。レビューのあと main が次を直した:
待ち時間の揺らぎを 1 手ごとに 1 回だけ引く（`demo.js` の `pickWaitScale()`・`waitScale`）、
重みは選んだピースの分だけ数える、コメントの手直し。

## 確かめること（手段と条件はこのとおり）

`python3 -m http.server 8765` を立て、Playwright MCP（headless Chromium、画面 1280×720）で。

1. `http://localhost:8765/tests.html` を開き、全件の件数と失敗の件数を `evaluate` で読む。全件通ること
2. デモの画面で、ランダム・最速にして最初の解（`state === 'solved'`）まで進むこと。
   `window.game.scene.getScene('Demo')` を `evaluate` で読む（`strategy`・`speed`・`state`・
   `tried`）。探し方と速さはボタンを押すか、シーンのメソッド（`selectSpeed()` など）を
   呼んでよい。3 分で着かなければそう報告。コンソールにエラーが無いこと
3. 待ち時間: ランダム・速い（200ms）で、`advance()` を包んで呼ばれた時刻と手の種類を
   60 手ぶん記録し、place のあとの間隔の平均・最小・最大と、remove のあとの間隔の
   平均を出す（狙いは place のあと平均 200ms・100〜300ms、remove のあと平均 400ms 前後）。
   深さ優先・速いでも 20 手ぶん測り、間隔がほぼ一定（200ms 前後）であること
4. ランダムで「解なし」の手を置いたあと、同じ盤面のまま次の place が続く（すぐ外さない）
   ことを、3 の記録（`value.type` と `value.ok`）から 1 例示す

## 見なくてよいこと

- 見た目の良し悪し、重みや揺らぎの値の良し悪し（利用者が決める）
- 深さ優先で解に着くまで

## 報告

コードは直さない。境界線上の判断は報告だけ。測った値を必ず載せる。
`archives/agents/TODO-059/verifier-report.md` に、合ったものは 1 行、食い違いだけ詳しく。
返事は 5 行以内。
