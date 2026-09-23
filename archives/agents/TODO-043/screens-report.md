# TODO-043 デモ画面の見た目確認（screens-report）

8×8・6×10 × 横画面（568x320）・縦画面（375x667）の 4 通り、コンソールにエラー・警告なし
（出る 1 件は Phaser 自身の起動バナーの info ログのみ）。1・2・3・4 のすべてで、HUD 1 段目
左の「試した手 …　見つけた解 …」と右端の「解ける」「解なし」は重ならず、枠からもはみ出していない。

## 画像

- 進行中（1）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-progress2.png`（8×8・横。右端に赤字で「解なし」）
  - `/home/ytani/tmp/playwright-mcp/demo-375x667-8x8-progress.png`（8×8・縦。右端に「解ける」）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-6x10-progress.png`（6×10・横。右端に「解ける」）
  - `/home/ytani/tmp/playwright-mcp/demo-375x667-6x10-progress2.png`（6×10・縦。右端に赤字で「解なし」）
- 文字が最も長くなる場合（2. `tried=123456; solvedCount=12; hintState='dead'`）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-longtext.png`
  - `/home/ytani/tmp/playwright-mcp/demo-375x667-8x8-longtext.png`
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-6x10-longtext.png`
  - `/home/ytani/tmp/playwright-mcp/demo-375x667-6x10-longtext.png`
  - いずれも「試した手 123,456　見つけた解 12」と「解なし」が重ならず、HUD の枠内に収まっている
- 「解なし」が実際に出る場面（3. 8×8 横画面）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-progress2.png`（上の進行中の画像と同じもの）
- 解けて止まったとき（4. 8×8 横画面）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-progress.png` — 右端の文字は消えていて、
    下段に「解けた！35 手目」が出ている

## 気づいたこと（実害は未確認）

- 作業に関係ない環境の癖: この Playwright セッションでは、`browser_resize` の直後などに
  一度だけ `window.game` が消え、`location.href` が `http://localhost:8765/tests.html?cachebust=1`
  へ勝手に変わっている瞬間が数回あった（コード側の挙動ではなく、ブラウザ操作の合間に起きた
  もので、再度 `browser_navigate` すれば直った）。デモ画面自体の問題ではないと考えるが、
  再現条件が分からないため一応記録する

## 横画面の撮り直し

前回の 568x320 の画像は、`browser_navigate` の直後に実際の描画が縦画面の配置（盤の下にトレイ）の
まま縮んで映っていた。ブラウザの実際のビューポートが `browser_resize` の指示と食い違い、
CDP の `Page.getLayoutMetrics` で確かめても 390x844（縦）のままになっていたのが原因
（`Emulation.setDeviceMetricsOverride` で明示的に 568x320・`mobile: false` にしてから
`page.reload()` して直した。今回はこの Playwright セッション側の話で、コードの問題ではない）。
直したうえで、`window.game.scene.getScene('Demo').layout.portrait` が `false` であることを
確かめてから撮り直した。いずれも横画面の配置（盤が左・トレイが右、ボタンが 1 段に 6 個）になっており、
左の「試した手 …　見つけた解 …」と右端の「解ける／解なし」は重ならず、枠にも収まっている。

- 進行中（2 の前段。右端に赤字で「解なし」）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-progress-fix.png`（8×8）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-6x10-progress-fix.png`（6×10）
- 文字が最も長くなる場合（`tried=123456; solvedCount=12; hintState='dead'; refreshStatus()`）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-8x8-longtext-fix2.png`（8×8）
  - `/home/ytani/tmp/playwright-mcp/demo-568x320-6x10-longtext-fix.png`（6×10。撮影のために
    `scene.pause()` で止めた直後、実際には既に解けていたため下段に「解けた！44 手目」も出ているが、
    右端の「解なし」は表示を強制した文字幅の確認用で、レイアウトの重なり確認に影響しない）

上の「気づいたこと」に書いた `tests.html` への遷移も、この 390x844 固定と同じ原因（別の担当との
ブラウザ共有）だったと考えられる。
