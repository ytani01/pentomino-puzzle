# TODO-111 screens 報告（前半: 直す前）

撮り方: `archives/agents/TODO-111/capture.js`（`browser_run_code_unsafe` の `filename` に渡す）。
後半は `OUT` の `before` を `after` に変えて、同じものを流す。1280x720 の横、本編は 8×8。
本編はネオンの明滅を止め（`tweens.killAll()`）、glow の alpha を 1 に固定してから撮る。

## 撮った画像と sha256

| 画像 | sha256 |
|---|---|
| `/home/ytani/tmp/playwright-mcp/todo111/before/game-colorful.png` | `256b8d248ed358df31ca83c9723275803bf0b11153390c9cc05ae4f034035158` |
| `/home/ytani/tmp/playwright-mcp/todo111/before/game-glass.png` | `7a720df4537dea70095473805f8ff7cf7186138996deabff063c5ef742832134` |
| `/home/ytani/tmp/playwright-mcp/todo111/before/game-neon.png` | `b8abee59ac2c243ee2e24af9ddb8f59823896a0afbebe8adfa775a2ab14cbdb0` |
| `/home/ytani/tmp/playwright-mcp/todo111/before/title-palette.png` | `8c775bdd9cd926b55fed5486ec0dd9595cad20f22019ab1a1576a243f8d3dc25` |

`PALETTES` のキーは `glass`・`colorful`・`neon`（`colorful` のラベルは「12 色」。依頼の「ふつう」はこれにあたると読んだ）。

## 2 回撮って一致したか

4 枚とも一致（`cmp` で全バイト同じ。上の表の値は 2 回目のもの）。
**範囲を変えたときは、変えた範囲で 2 回撮り直して一致を確かめた**（下の注）。

## 切った範囲（ページ座標、`page.screenshot({ clip })`）

- 本編 3 枚: x=111, y=227, 幅 1057, 高さ 422（ボードのパネルとトレイのパネルの外接矩形に 4px の余白。HUD は入らない）
- タイトル: x=417, y=404, 幅 623, 高さ 223（色の選択肢の 3 ボタンの外接矩形に 90px の余白。
  上のボードの選択肢、下の「記録なし」「はじめる」ボタンの上端が入るが、どれも動かない）

注: `paletteButtons[].getBounds()` は左端のボタン（ガラス）の実際の枠より狭く、余白 12px・40px ではガラスの
アイコンの左が切れた。90px にして全体が入った。

## 目視

4 枚とも開いて確認した。ピースの縁とネオンの光が映っており、真っ黒・欠けは無い
（ネオンは外周が光る、ガラスは薄い青の縞、12 色は色つき、タイトルは 3 つのアイコンが全部入っている）。

## コンソール

エラー 0 件。警告 4 件（毎回同じ）:
`[.WebGL-…]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`
（headless Chromium のドライバのメッセージ）。
