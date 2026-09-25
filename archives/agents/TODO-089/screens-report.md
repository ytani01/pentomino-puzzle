# TODO-089 画面確認報告（タイトル行）

サーバ: http://localhost:8765/（Playwright MCP、headless Chromium）

## 画面ごとの結果

- 横 844×390 / 本編 8×8: 問題無し。`/home/ytani/tmp/playwright-mcp/game-844x390-8x8.png`
- 横 844×390 / 本編 8×8 / タイトル行クリック: 確認の枠が出て Game に留まる（タイトルへ移らない）。問題無し。`/home/ytani/tmp/playwright-mcp/game-844x390-8x8-title-click.png`
- 横 844×390 / 本編 6×10: 問題無し。`/home/ytani/tmp/playwright-mcp/game-844x390-6x10.png`
- 横 844×390 / デモ 8×8（random）: 問題無し。タイトル行の下に「探し方は「深さ優先」と「ランダム」の 2 種類」も表示。`/home/ytani/tmp/playwright-mcp/demo-844x390-random-8x8.png`
- 横 844×390 / デモ 6×10（depth）: 問題無し。盤・トレイとも欠けずに描画。`/home/ytani/tmp/playwright-mcp/demo-844x390-depth-6x10.png`
- 横 844×390 / デモのタイトル行クリック: タイトル画面へ移り、URL から `demo` パラメータが消えた（`http://localhost:8765/` になった）。問題無し。
- 横 844×390 / 記録: 問題無し。`/home/ytani/tmp/playwright-mcp/records-844x390.png`
- 横 844×390 / 記録のタイトル行クリック: タイトル画面へ移った（`scene.isActive('Title')` が true）。問題無し。
- 縦 390×844 / 本編 8×8: 問題無し。`/home/ytani/tmp/playwright-mcp/game-390x844-8x8.png`
- 縦 390×844 / デモ 8×8（random）: 問題無し。`/home/ytani/tmp/playwright-mcp/demo-390x844-random-8x8.png`
- 縦 390×844 / 記録: 問題無し。`/home/ytani/tmp/playwright-mcp/records-390x844.png`

すべての画面で「PENTOMINO PUZZLE」が最上段に表示され、はみ出し・重なり・
欠けたテクスチャは見当たらなかった。

## コンソール

エラー 0 件。警告はヘッドレス実行環境固有の GPU ドライバの性能警告
（`GL Driver Message ... GPU stall due to ReadPixels`）が 4 件のみで、
テクスチャや Phaser 関連のものではない。
