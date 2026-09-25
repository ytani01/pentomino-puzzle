# TODO-084 demo.gif フレーム確認

## ffprobe
- width=480, height=320
- avg_frame_rate=10/1, nb_frames=100
- duration=10.000000

## 抜いたフレーム（先頭・1/4・中央・3/4・末尾）
- /home/ytani/tmp/playwright-mcp/todo084-frame-1.png （n=0, 試した手 1）
- /home/ytani/tmp/playwright-mcp/todo084-frame-2.png （n=24, 試した手 3）
- /home/ytani/tmp/playwright-mcp/todo084-frame-3.png （n=49, 試した手 4）
- /home/ytani/tmp/playwright-mcp/todo084-frame-4.png （n=74, 試した手 8）
- /home/ytani/tmp/playwright-mcp/todo084-frame-5.png （n=99, 試した手 12）

## 確認結果
5 枚とも一致（問題なし）。不透明で欠けなし、真っ黒・真っ白・読み込み中の画面は無い。
デモ画面（上に HUD、左に 8×8 の盤、右にトレイ）のレイアウトは一貫。
「試した手」の表示が 1→3→4→8→12 と増え、盤上に置かれたピースが増えていく様子が確認できた
（先頭は水色のみ、末尾は緑・赤・水色・黄が盤に配置）。
タイトル画面、注記の丸や吹き出し、マウスカーソル、エラー表示は映っていない。
