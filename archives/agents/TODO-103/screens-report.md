# TODO-103 画面確認（デモの「解けた！」の札）

## 画像
- /home/ytani/tmp/playwright-mcp/demo-solved-960x640.png … 横 960x640、8×8、デモ（深さ優先）解けた状態
- /home/ytani/tmp/playwright-mcp/demo-solved-390x844.png … 縦 390x844、8×8、同上（内部 640x1136）

## 結果
| 項目 | 横 960x640 | 縦 390x844 |
|---|---|---|
| 札の bounds [x,y,w,h] | [806,93,104,26] | [486,93,104,26] |
| statusText の bounds | [34,93,520,26] | [34,93,247,26]（文言は短縮形「手 38　解 1　機械的」） |
| 重なり | なし | なし |
| 札の欠け・はみ出し | なし（HUD 枠の右端内） | なし |
| alpha（200ms 間隔 3 回） | 0.34 / 0.48 / 0.81 | 0.79 / 0.89 / 0.57 |
| ボード下の余計な文字 | なし（y>500 の Text は 0 件。横はトレイ側の空の枠のみ） | なし |

- searchNext() 後（横）: state running、札の文字「解ける」、alpha 1 / 1 / 1（一定）。一致。
- 縦で解けた状態から 960x640 へ resize（作り直し）後: 札「解けた！」が出て、alpha 0.47 / 0.35 / 0.66 で点滅。bounds [806,93,104,26]、重なりなし。一致。
- 目視: どちらの画像も札の文字は読める。金色の札が HUD 1 段目の右端に収まり、左の文字と離れている。

## コンソール
エラー 0 件。警告 4 件（初回読み込み時）、本文はいずれも同じ種類:
`GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`（Chromium headless の GPU 警告。今回の変更とは無関係と思われる。実害は未確認）

## 食い違い・判断が要る点
なし。
