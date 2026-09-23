# TODO-041 画面確認（screens）

8×8 盤、Title・Game・Clear・Records の 4 画面を横 568x320 / 縦 390x844 で撮影。
コンソールは毎回 0 件（エラー・警告とも）。

## 撮った画像

- /home/ytani/tmp/playwright-mcp/title-568x320.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/game-568x320.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/clear-568x320.png — **dev 表示なし**（下記参照）
- /home/ytani/tmp/playwright-mcp/records-568x320.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/records-568x320-confirm.png — 「全部消す」の確認表示。dev はパネルの外（右下）に見えたまま、確認表示との重なりなし
- /home/ytani/tmp/playwright-mcp/title-390x844.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/game-390x844.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/clear-390x844.png — **dev 表示なし**（下記参照）
- /home/ytani/tmp/playwright-mcp/records-390x844.png — **dev がボタンと重なっている**（下記参照）

## 問題があったもの

### Clear 画面（568x320 / 390x844 とも）dev が見えない
画面の下端まで見ても `dev` の文字が確認できない。他の画面
（Title・Game・Records）では同じ場所（右下）に出ているので、Clear だけ
表示されていないように見える。実害は未確認（配置座標がクリア画面の
レイアウトの外に出ている、あるいは呼び出し忘れの可能性があるが、
コードは見ていないので断定しない）。

### Records 画面（390x844）dev が「タイトルへ」ボタンと重なる
`タイトルへ` ボタンの右下の角に `dev` の文字が食い込んでいる
（ボタン枠の内側に文字の右側が隠れている）。568x320 では重ならない
（ボタンの下に十分な余白がある）ので、縦長のときだけボタン列の位置と
dev の位置が近づいて起きているように見える。実害は未確認（文字が
薄く小さいため実用上気づきにくい可能性はあるが、境界線上の判断は
報告のみとする）。

## 見なかったもの（依頼どおり）
- Demo 画面（Game と同じ呼び出しのため省略）
- レイアウトの測り直し全般（バージョン表示以外）
- 6×10 盤

## 撮り直し

キャッシュを `Network.clearBrowserCache` + `Network.setCacheDisabled` で外し、
`Clear` へは `{ ms: 83000, no: 1 }` で遷移。コンソールは全カット 0 件
（エラー・警告とも）。

- /home/ytani/tmp/playwright-mcp/clear-568x320-v2.png — dev 表示あり、重なり・はみ出しなし（前回の「表示なし」はキャッシュが原因で解消）
- /home/ytani/tmp/playwright-mcp/records-568x320-v2.png — dev 表示あり、前回と変わらず重なりなし
- /home/ytani/tmp/playwright-mcp/clear-390x844-v2.png — dev 表示あり、重なり・はみ出しなし
- /home/ytani/tmp/playwright-mcp/records-390x844-v2.png — 記録 2 件表示。完成形の枠・達成度の行・ボタン列・dev のいずれも重なっていない。dev は「タイトルへ」ボタンより下に離れて表示され、前回指摘した重なりは解消
- /home/ytani/tmp/playwright-mcp/records-390x844-confirm-v2.png — 「全部消す」の確認表示。dev は確認パネルの外（右下）に見えたままで、パネルとの重なりなし

前回報告した 2 件の問題（Clear の dev 非表示、Records 390x844 での dev とボタンの重なり）は、いずれも今回の撮影では確認されなかった。
