# TODO-045 見た目の確認

`createHintBadge()` の札（本編・デモの HUD 1 段目）を、8×8・6×10 × 横 568x320・
縦 375x667 の 4 通りと、デモの横 568x320・縦 375x667 で確認した。

横の配置は `getScene('Game').layout`（`board.x` / `tray.x`）と
`layout.portrait` を毎回 evaluate で読み、盤が左・トレイが右（横）／
盤が上・トレイが下（縦）であることを確かめてから撮った
（例: 8×8 横 `board.x=24, tray.x=496`、6×10 横 `board.x=24, tray.x=606`、
8×8 縦 `board.y=200`〈トレイは `y=744`〉、6×10 縦 `board.y=200`〈トレイは
`y=586`〉）。

## 結果: 問題なし

- 本編 4 通り × 「解ける」（緑, 時間 `1:39:59` 前後＋残り 12 の最長表示）
  文字・札とも重ならず、HUD 枠内に収まった
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-8x8-ok.png`
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-8x8-ok.png`
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-6x10-ok.png`
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-6x10-ok.png`
- 本編 4 通り × 「解なし」（赤）。8×8 横は実際に解なしになる置き方
  （F を左上 `(0,0)` に置き、`hasSolution()` が偽になることを確認して
  から撮影）、残りは `hintBadge.setState('dead')` で強制。いずれも重なり無し
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-8x8-dead-real.png`（実際の詰み）
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-8x8-dead-real.png`（実際の詰み）
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-8x8-dead-forced.png`（強制）
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-6x10-dead-forced.png`（強制）
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-6x10-dead-forced.png`（強制）
- 本編 8×8 横、ヒント表示を切にすると札ごと消える
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-8x8-off.png`
- デモ（`tried=123456, solvedCount=12`）の「解ける」「解なし」、横・縦とも
  左の文字（試した手／見つけた解）と右寄せの札が重ならず枠に収まった
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-demo-6x10-dead.png`
  - `/home/ytani/tmp/playwright-mcp/badge-568x320-demo-6x10-ok.png`
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-demo-8x8-dead.png`
  - `/home/ytani/tmp/playwright-mcp/badge-375x667-demo-8x8-ok.png`
- `tests.html`: 256 件すべて通った
- 素のページ読み込みでのコンソール: エラー・警告 0 件
  （favicon の 404 と WebGL の性能メッセージのみ。無関係な既存のもの）

## 実測中に踏んだ落とし穴（コードは直していない・報告のみ）

- CDP の `Emulation.setDeviceMetricsOverride` だけでは `page.screenshot()`
  が使う Playwright 側のビューポート寸法が更新されず、古い大きさで撮って
  しまうことがあった（`window.innerWidth/Height` は新しい値を返すのに
  画像サイズは古いまま）。`browser_resize`（`page.setViewportSize`）を
  併用したら直った。他の画面を撮るときも同じ手順を踏んだほうがよい、
  という気づきのみで、コード側の問題ではない
- 手動で `import('/src/logic.js')`（絶対パス）を使い、かつページの
  reload と重ねたときに一度だけ
  `The requested module './src/logic.js' does not provide an export named 'solveSteps'`
  というコンソールエラーが出た。素のページ読み込み（reload を挟まない）
  では再現せず、確認用の操作が引き起こしたものと見られる。**実害は未確認**
