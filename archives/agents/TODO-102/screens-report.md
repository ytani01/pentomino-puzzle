# TODO-102 画面の確認

値は内部解像度の座標。札の左端 = 札の文字の左端 − HINT_BADGE.padX(16)。
条件: Demo を pause、tried=99999, solvedCount=99, hintState='dead', refreshStatus()。

| 大きさ | 探し方 | statusText 右端 | 札の左端 | HUD 枠の右端 | 判定 |
|---|---|---|---|---|---|
| 縦 390x844 | 人間的 (8x8) | 619 | 496 | 626 | **重なる（123 食い込む）** |
| 縦 390x844 | 機械的 (6x10) | 619 | 496 | 626 | **重なる（123 食い込む）** |
| 横 960x640 | 人間的 (8x8) | 619 | 816 | 946 | 重ならない（余白 197） |
| 横 960x640 | 機械的 (6x10) | 619 | 816 | 946 | 重ならない（余白 197） |

statusText は HUD 枠の右端（626）には収まる（7 の余白）が、縦では HUD の 1 段目の右端に寄せた
札（解なし）が「探し方 人間的/機械的」の途中から上に被り、「探し」の後ろ（「方 人間的」）が札に隠れる。
画像でも確認（縦: 「探し」の次から札で隠れ、末尾の「的」だけ札の右にはみ出して見える）。
最長条件（試した手 99,999・見つけた解 99・解なし）での値。実害（通常の数値での被り）は未測定。
「解ける」は札が短いので、被りは少ないはず（未測定）。

## 画像
- /home/ytani/tmp/playwright-mcp/todo102-390x844-human-8x8.png（縦・人間的・8x8、重なりあり）
- /home/ytani/tmp/playwright-mcp/todo102-390x844-machine-6x10.png（縦・機械的・6x10、重なりあり）
- /home/ytani/tmp/playwright-mcp/todo102-960x640-human-8x8.png（横・人間的・8x8、問題なし）
- /home/ytani/tmp/playwright-mcp/todo102-960x640-machine-6x10.png（横・機械的・6x10、問題なし。目で確認、欠けなし）

## コンソール
エラー 0 件。警告 4 件（すべて同じ: `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`）。

## 備考
`hintBadge` は Phaser のオブジェクトではなく `{setState, setDepth}` だけの普通のオブジェクトで `getBounds()` が無い。
左端は札の文字（Text '解なし'）の getBounds().left から padX を引いて求めた。

## 再測定（縦だけ詰めた版）
同じ条件。内部解像度の座標。

| 大きさ | 探し方 | statusText 右端 | 札の左端 | HUD 枠の右端 | 判定 |
|---|---|---|---|---|---|
| 縦 390x844 | 人間的 (8x8) | 346 | 496 | 626 | 重ならない（余白 150） |
| 縦 390x844 | 機械的 (6x10) | 346 | 496 | 626 | 重ならない（余白 150） |

文言: 「手 99,999　解 99　人間的」/「…機械的」。目視は未実施（数値のみ）。エラー 0 件。
- /home/ytani/tmp/playwright-mcp/todo102-re-390x844-human-8x8.png
- /home/ytani/tmp/playwright-mcp/todo102-re-390x844-machine-6x10.png
