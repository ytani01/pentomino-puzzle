# TODO-076 見た目の確認

## 撮った画像

960×640（横）
- タイトル: /home/ytani/tmp/playwright-mcp/t076-check-960x640-1-title.png
- 本編: /home/ytani/tmp/playwright-mcp/t076-check-960x640-2-game.png
- 本編のタイトルへの確認: /home/ytani/tmp/playwright-mcp/t076-check-960x640-3-confirm.png
- クリア表示: /home/ytani/tmp/playwright-mcp/t076-check-960x640-4-clear.png
- デモ: /home/ytani/tmp/playwright-mcp/t076-check-960x640-5-demo.png
- 記録: /home/ytani/tmp/playwright-mcp/t076-check-960x640-6-records.png

640×1136（縦）
- タイトル: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-1-title.png
- 本編: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-2-game.png
- 本編のタイトルへの確認: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-3-confirm.png
- クリア表示: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-4-clear.png
- デモ: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-5-demo.png
- 記録: /home/ytani/tmp/playwright-mcp/t076-check-640x1136-6-records.png

盤は既定の 8×8 のみ確認（指示どおり）。

## 見たこと

- ボタンの文字・アイコンの枠からのはみ出し: 問題なし（クリア表示の「タイトルへ」「もう一度」、タイトルの「つづきから」を含め、960×640・640×1136 とも枠内に収まっている）
- 本編・デモの HUD で「タイトルへ」（家のアイコン）が並びの一番左にあるか: 問題なし。記録画面では左上にあるか: 問題なし
- ボタンが他の部品や画面の端と重なる・欠ける: 問題なし
- 本編とデモの盤の位置（960×640 で `layout.boardPanel` を比較）: 一致
  - Game: `{width: 436, height: 436, x: 14, y: 161}`
  - Demo: `{width: 436, height: 436, x: 14, y: 161}`

## コンソール

エラー 0 件、警告 0 件（`browser_console_messages` の集計。個別に出た
4 行は WebGL の `GPU stall due to ReadPixels` という性能情報メッセージで、
エラー・警告レベルではない）。

## 判断が要る点

なし。境界線上に見えるものもなかった。
