# TODO-114 screens 報告（前半: 直す前、HEAD 33bc06a）

撮り方: `archives/agents/TODO-114/capture.js`（`browser_run_code_unsafe` の `filename` に渡す）。
後半は `OUT` の `before` を `after` にしたコピーを `~/tmp/playwright-mcp/todo114/` に置いて渡す
（MCP はリポジトリと `~/tmp/playwright-mcp` の外を読めない）。キャッシュは CDP で切ってある。

## 画像

`/home/ytani/tmp/playwright-mcp/todo114/before/tray.png`
sha256 `02042976977e2b01371ba0fd8c667b7db44ab6b1d19cc37c1560991c421d1428`

## 状態の作り方（撮る部分は操作だけ）

1280x720 の横・8×8・色の組は既定（ネオン）。本編を始め、トレイの 3 つのスロットを実際にクリックして向きを進める:
L を 3 回、P を 3 回、Z を 1 回（計 7 回。7 回とも `ok`、クリックが返らないことは無かった）。
そのあとマウスを端へ動かし、ネオンの明滅の tween を止めて `glow` の alpha を 1 に固定してから撮る。

## 切った範囲

x=534, y=227, 幅 634, 高さ 422（`layout.trayPanel`（内部座標 390,206 556x368）に 4px の余白。
HUD・ボードは入らない）。

## 印の種類の内訳（`turnMarkKind(piece)` の返り値。報告用に読んだだけ）

| | F | I | L | N | P | T | U | V | W | X | Y | Z |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 始めた直後 | rotate | rotate | rotate | rotate | rotate | rotate | rotate | rotate | rotate | **null** | rotate | rotate |
| 撮った時 | rotate | rotate | **flip** | rotate | **flip** | rotate | rotate | rotate | rotate | **null** | rotate | **flip** |

撮った画像は rotate が 8 個、flip が 3 個（L・P・Z）、null が 1 個（X、印なし）。

## 2 回撮って一致したか

一致（`cmp` で全バイト同じ）。

## 目視

開いて確認した。回転の印（白い円弧と矢じり）が 8 個のピースに、裏返しの印（白い両矢印）が
黄（L）・緑（P）・ピンク（Z）に映っている。紫の X には印が無い。縁とにじみも映っており、欠け・真っ黒は無い。

## コンソール

エラー 0 件（警告 4 件。毎回出る headless Chromium の `GPU stall due to ReadPixels` のみ）。

# 後半: 直した後（実装 b58446d を含む HEAD d03e44f）

撮り方: 前半と同じ `capture.js`（`OUT` だけ `after` にしたコピー
`/home/ytani/tmp/playwright-mcp/todo114/capture-after.js`。キャッシュは CDP で切ってある）。
状態の作り方・切った範囲（x=534, y=227, 634x422）も同じ。クリックは 7 回とも `ok`。

## 結果: `cmp` で全バイト一致

`/home/ytani/tmp/playwright-mcp/todo114/after/tray.png`
sha256 `02042976977e2b01371ba0fd8c667b7db44ab6b1d19cc37c1560991c421d1428`（before と同じ）。
差のピクセルが無いので、並べて見ることはしていない。

## 新しい JS で撮ったか

撮ったあとのページで確認した。`/src/icons.js` に `strokeTurnMark`、`/src/scenes/game.js` に
`strokeTurnMark` の import がある。そのページが読み込んだ `game.js`・`logic.js`・`icons.js` の
`transferSize` は 0 でない（キャッシュからではなく取得している）。撮り直しは不要と判断した。

印の種類の内訳も前半と同じ（rotate 8・flip 3（L・P・Z）・null 1（X））。シーンには
`turnMarkKind` が薄いメソッド（`logic.js` の同名の関数を呼ぶ）として残っているので、種類は同じ方法で読めた。

## コンソール

エラー 0 件。
