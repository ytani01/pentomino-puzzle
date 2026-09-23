# TODO-050 screens 報告

条件: http://localhost:8765/ 、盤 6x10、画面 1280x720 / 844x390 / 390x844。

## 画像
- /home/ytani/tmp/playwright-mcp/demo-1280x720-6x10.png（デモ）
- /home/ytani/tmp/playwright-mcp/demo-1280x720-6x10-tooltip.png（切替ボタンのツールチップ）
- /home/ytani/tmp/playwright-mcp/demo-1280x720-6x10-toggled.png（切替後）
- /home/ytani/tmp/playwright-mcp/game-1280x720-6x10.png（本編）
- /home/ytani/tmp/playwright-mcp/demo-844x390-6x10.png
- /home/ytani/tmp/playwright-mcp/demo-844x390-6x10-tooltip.png
- /home/ytani/tmp/playwright-mcp/demo-844x390-6x10-toggled.png
- /home/ytani/tmp/playwright-mcp/game-844x390-6x10.png
- /home/ytani/tmp/playwright-mcp/demo-390x844-6x10.png
- /home/ytani/tmp/playwright-mcp/demo-390x844-6x10-tooltip.png
- /home/ytani/tmp/playwright-mcp/demo-390x844-6x10-toggled.png
- /home/ytani/tmp/playwright-mcp/game-390x844-6x10.png

## 問題の有無

- 1280x720・844x390: 問題なし。7 個の HUD ボタンが 1 行に収まり、はみ出し・重なりなし。
  切替ボタンを押すとアイコンが変わり（探索中アイコン→山のアイコン）、
  試した手が 9 にリセットされ、ピースがトレイへ戻っていることを確認した。
  本編（ゲーム画面）は 6 ボタンのまま以前どおり。
- 390x844: HUD ボタンが 2 行に折り返され、枠内に収まり重なりもなし。
  ただし **ツールチップ「探し方: 深さ優先」が盤の上端の数マスに重なって
  表示される**（`demo-390x844-6x10-tooltip.png`）。ツールチップ自体は
  枠からはみ出してはいないが、盤の一部を隠す。デザインの良し悪しは
  評価しない方針のため、事実のみ報告。
  切替後のスクリーンショットでは、トレイへ戻る途中の 1 ピースが
  盤とトレイの境目にまたがって写っている（アニメーション中の 1 コマの
  可能性があり、静的な重なりかどうかは未確認）。

コンソール: エラー 0 件、警告 4 件（すべて WebGL ドライバの
`GPU stall due to ReadPixels` というメッセージで、アプリのコードとは無関係）。
