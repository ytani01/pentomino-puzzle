# TODO-119 画面の確認（screens）

変更前 77ebb77（:8768）と変更後 62255a5（:8767）を、横 568x320・8×8 で比べた。
色の組は storage の `pentomino-puzzle/palette` に `glass` / `colorful` / `neon` を書いて切り替えた。
タイトルは起動 2.5 秒後、本編はタイトルから `scene.start('Game')` した 1.5 秒後に撮った。

**問題なし。** コンソールのエラーは 0 件。

| 色の組 | タイトル（色の見本・動くボード） | 本編（ボード・トレイ） |
|---|---|---|
| glass | 一致。ボードの外は画素まで同じ。動くボードの中だけ違う（探索の進み具合の差）。ピースの塗り・縁の色は同じ | 画素まで完全に一致（差 0） |
| colorful | 同上 | 画素まで完全に一致（差 0） |
| neon | 同上 | トレイのピースの範囲に微小な差（下記）。見た目は同じ |

欠け・真っ黒なマス・テクスチャが無いマスは、どの画面にも無かった。

## 食い違い（neon の本編）

- 差の範囲は x261–371, y119–276（トレイのピース）。最大差は 13〜22/255
- 同じ版を 2 回撮っても同じ範囲に同じ程度の差が出る
  （変更前どうし最大 13、変更後どうし最大 22、変更前 2 回目と変更後 2 回目は最大 2）。
  ネオンのにじみが時間で動くための揺れで、変更による差ではない

## 画像（すべて 568x320、8×8）

`/home/ytani/tmp/playwright-mcp/` の下。`c119-<old|new>-<glass|colorful|neon>-<title|game>-568x320.png` の 12 枚。

- /home/ytani/tmp/playwright-mcp/c119-old-glass-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-glass-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-old-glass-game-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-glass-game-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-old-colorful-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-colorful-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-old-colorful-game-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-colorful-game-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-old-neon-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-neon-title-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-old-neon-game-568x320.png
- /home/ytani/tmp/playwright-mcp/c119-new-neon-game-568x320.png

ネオンの揺れの確認用に `c119-old2-neon-game-568x320.png`、`c119-new2-neon-game-568x320.png` も撮った。

## コンソール

エラー 0 件。警告は初回の読み込みで 4 件、同じ文言の繰り返し:
`GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`
（headless Chromium の性能に関する通知。変更前後の差ではない）。
