# TODO-115 screens 報告（前半: 直す前、HEAD 5c1b041）

撮り方: `archives/agents/TODO-115/capture.js`（`browser_run_code_unsafe` の `filename` に渡す）。
後半は `OUT` の `before` を `after` にしたコピーを `~/tmp/playwright-mcp/todo115/` に置いて渡す
（MCP はリポジトリと `~/tmp/playwright-mcp` の外を読めない）。キャッシュは CDP で切ってある。
8×8、色の組は既定（ネオン）。向きは、ビューポートを変えてから読み込み直して切り替える
（横 1280x720 → 内部 960x640、縦 720x1280 → 内部 640x1136）。

## 画像

| 画面 | 画像 | 切った範囲（ページ座標） | sha256 |
|---|---|---|---|
| タイトル・横 | `/home/ytani/tmp/playwright-mcp/todo115/before/title-landscape.png` | x=100, y=0, 1080x720（キャンバス全体） | `915832b98547d3fc8f06ac7c8a7c798d314b59b2b79d41ade90b03dc77dfeb37` |
| クリア表示・横 | `/home/ytani/tmp/playwright-mcp/todo115/before/clear-landscape.png` | 同上 | `bd479b3d1250dfb893f27e8180887a1376443b229c8ca600672ee05126d22fed` |
| タイトル・縦 | `/home/ytani/tmp/playwright-mcp/todo115/before/title-portrait.png` | x=0, y=1, 720x1278（キャンバス全体） | `7205a0bf8824ce3f75e67c7234af8a7eedd660ff8cedb79fe783ae109a24f7d8` |
| クリア表示・縦 | `/home/ytani/tmp/playwright-mcp/todo115/before/clear-portrait.png` | 同上 | `4684b76d05521d97bdf10c9bec760094ebfde84fbdd3fecb4d404b6ffb971a06` |

横の 2 枚の sha256 は TODO-108 の `title.png`・`clear.png` と同じ（同じ手順・同じ状態）。

## 状態の作り方

- タイトル: 動くボード（`previewGraphics`）を消し、`previewTimer` を止めてから撮る
  （縦も同じ。縦は動くボードが題字の下の行にあるので、その行が空く）。
- クリア表示: 本編の経過時間を `00:00`、ネオンの明滅を止めて `glow` の alpha 1、`clearData` に決まった値
  （1:23、正解の 1 番、全 65 解、新しい解、自己最短を更新）を入れて `showClear()`。
  **本編で実際に完成させてはいない**（Clear が読むのは `clearData` だけ）。

## 2 回撮って一致したか

4 枚とも一致（`cmp` で全バイト同じ）。

## 目視

4 枚とも開いて確認した。
- 縦のタイトル: 縦の配置（題字の下に空きがあり、遊び方の枠・ボード・色・記録なし・3 ボタン・デモ・版が下に寄る。
  遊び方の 1 行目が 2 行に割れている）。文字が映っている。
- 縦のクリア表示: 縦の配置（COMPLETE・01:23・各行・ボタン 4 つが中央に積まれ、背後に本編の HUD・ボード・トレイ・下端の説明が暗く透ける）。
  文字が映っている。
- 横の 2 枚は TODO-108 と同じ絵。

## ボタンを押してシーンが移ること（実際にクリック。横・縦とも）

| 押したボタン | クリック | 押したあとに動いているシーン |
|---|---|---|
| タイトルの「はじめる」（横） | ok | `Game` |
| クリア表示の「タイトルへ」（横） | ok | `Title` |
| タイトルの「はじめる」（縦） | ok | `Game` |
| クリア表示の「タイトルへ」（縦） | ok | `Title` |

ボタンは文字（ラベル）から中心を求めて `page.mouse.click` で押した（3 秒の上限付き。返らなかったことは無い）。

## コンソール

エラー 0 件。

# 後半: 直した後（実装 382af27・JSDoc の直し 32c44dd を含む HEAD 32c44dd）

撮り方: 前半と同じ `capture.js`（`OUT` だけ `after` にしたコピー
`/home/ytani/tmp/playwright-mcp/todo115/capture-after.js`）。キャッシュは CDP で切ってある。
状態の作り方・切った範囲（横 x=100,y=0,1080x720／縦 x=0,y=1,720x1278）も同じ。

## 結果: 4 枚とも `cmp` で全バイト一致

| 画面 | 画像 | sha256（先頭 12 桁。前と同じ） |
|---|---|---|
| タイトル・横 | `/home/ytani/tmp/playwright-mcp/todo115/after/title-landscape.png` | `915832b98547` |
| クリア表示・横 | `/home/ytani/tmp/playwright-mcp/todo115/after/clear-landscape.png` | `bd479b3d1250` |
| タイトル・縦 | `/home/ytani/tmp/playwright-mcp/todo115/after/title-portrait.png` | `7205a0bf8824` |
| クリア表示・縦 | `/home/ytani/tmp/playwright-mcp/todo115/after/clear-portrait.png` | `4684b76d0552` |

差のピクセルが無いので、直す前の撮り直し（手順の揺れの確認）と並べて見ることはしていない。

## ボタンを押してシーンが移ること（実際にクリック。横・縦とも）

| 押したボタン | クリック | 押したあとに動いているシーン |
|---|---|---|
| タイトルの「はじめる」（横） | ok | `Game` |
| クリア表示の「タイトルへ」（横） | ok | `Title` |
| タイトルの「はじめる」（縦） | ok | `Game` |
| クリア表示の「タイトルへ」（縦） | ok | `Title` |

前半と同じ結果。

## コンソール

エラー 0 件。
