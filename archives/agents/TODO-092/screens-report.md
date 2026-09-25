# TODO-092 画面確認

撮った画像（すべて色の組「ネオン」選択済み、盤は 8×8）:

- /home/ytani/tmp/playwright-mcp/title-960x640-neon.png（横 960×640）
- /home/ytani/tmp/playwright-mcp/title-640x1136-neon.png（縦 640×1136）
- /home/ytani/tmp/playwright-mcp/title-960x640-neon-swatch.png（ネオン見本の切り出し）
- /home/ytani/tmp/playwright-mcp/title-960x640-neon-swatch-zoom.png（同、5 倍拡大）

## 結果

1. 遊び方の 1 行目「12 種のピースを盤にすき間なく敷き詰めるパズル。」枠内に収まる。文言は `src/scenes/title.js` の `HOW_TO_PLAY_TEXT`（98行目）で盤の種類に関わらず固定の定数のため、6×10 選択時も変化しない（コード読みで確認、撮り直し不要）。
2. 「はじめる」「つづきから」「記録」は横 1 列。960×640・640×1136 とも画面内、文字ははみ出していない。
3. 「デモ」ボタンは右下にあり、右下のバージョン表示（`dev`）・他部品と重なっていない。960×640 で位置 (x≈886, y≈572)、`dev` 表示 (x≈931, y≈618) で縦にも十分離れている。
4. ネオンの見本 3 個（赤・青・紫）すべてで、外周の輪郭線の内側にぼやけた光のにじみが見える（拡大画像で確認）。
5. コンソールはエラー 0 件。警告 4 件はいずれも `GL Driver Message ... GPU stall due to ReadPixels`（WebGL のドライバ由来のパフォーマンス通知で、TODO-092 の変更とは無関係）。

食い違いなし。
