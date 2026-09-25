# TODO-090 見た目の確認（drawAcrylic の面取り）

## 撮った画像

- `/home/ytani/tmp/playwright-mcp/todo090-game-1280x720-full.png` — 本編、1280x720、8x8
- `/home/ytani/tmp/playwright-mcp/todo090-game-acrylic-crop.png` — 上の板部分の拡大切り抜き
- `/home/ytani/tmp/playwright-mcp/todo090-game-844x390.png` — 本編、844x390（スマホ横）、8x8
- `/home/ytani/tmp/playwright-mcp/todo090-records-844x390-list.png` — 記録画面、844x390、履歴 1 件選択時の完成形付き
- `/home/ytani/tmp/playwright-mcp/todo090-records-844x390-acrylic-crop.png` — 上の小さい盤の板部分の拡大切り抜き

## 確認結果

- 本編（1280x720・844x390 とも）: 明るい縁が上と左、暗い縁が下と右にあり、立体的に見える。面取りは板の外（周りのマス）へはみ出していない。内側の細い線は面取りの内端に沿っている。問題なし。
- 記録画面の小さい盤（844x390）: 完成形のピースの上に小さく板が重なって表示され、面取りも縮小されて同様に上・左が明るく下・右が暗い。面取りが板を覆いすぎて中の斜線が見えなくなる、ということはない。問題なし。
- コンソール: 直近の画面遷移でエラー 0 件・警告 0 件。初回のページ読み込み直後にのみ警告 4 件（headless の WebGL ドライバによる `GPU stall due to ReadPixels` の性能通知）が出ていたが、コード側のエラーではなく面取りとも無関係。

## 判断が要る点

