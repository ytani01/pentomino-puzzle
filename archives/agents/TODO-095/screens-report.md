# TODO-095 画面確認（screens）

対象: ステージ済みの変更（TODO-095 implementer 分）。コードは直していない。

## 画像（絶対パス）

- `/home/ytani/tmp/playwright-mcp/title-640x1136-portrait.png` — Title、縦
- `/home/ytani/tmp/playwright-mcp/title-960x640-landscape.png` — Title、横（戻した後）
- `/home/ytani/tmp/playwright-mcp/game-960x640-landscape.png` — Game、横（操作直後）
- `/home/ytani/tmp/playwright-mcp/game-640x1136-portrait.png` — Game、縦
- `/home/ytani/tmp/playwright-mcp/game-640x1136-confirm-restart.png` — Game、やり直し確認を開いたまま縦
- `/home/ytani/tmp/playwright-mcp/clear-960x640-landscape.png` — Clear、縦→横
- `/home/ytani/tmp/playwright-mcp/records-960x640-landscape.png` — Records、横
- `/home/ytani/tmp/playwright-mcp/records-640x1136-portrait.png` — Records、横→縦
- `/home/ytani/tmp/playwright-mcp/demo-640x1136-portrait-paused.png` — Demo、一時停止のまま横→縦
- `/home/ytani/tmp/playwright-mcp/demo-960x640-landscape-resumed.png` — Demo、再開して縦→横

## 大きさの確認（開いたあとに resize）

960x640 で開いた直後、`window.game.scale.width/height` は 960/640。
640x1136 へ resize した直後は 640/1136（縦）。960x640 へ戻すと 960/640 に戻った。
いずれも一致（読んだ値は各シーンの節に記載）。

## 1. Title（横 960x640 → 縦 640x1136 → 横 960x640）

盤を `6x10`、色を `neon` に選んでから向きを変えた。
`boardKey` / `paletteKey` は 3 回とも `"6x10"` / `"neon"` のまま。
画像は縦の配置（動く盤が題字の下）になっている。一致。

## 2. Game（横 → 縦）

ピースを 3 個（おまかせで `L, T, W`）盤に置き、トレイの `F` を 1 回回転してから
向きを変えた。

- `elapsed`: 横で 10764.57ms → 縦で 20664.17ms（増え続けている。止まっていない）
- `history.length`: 3 → 3（一致）
- `undoButton.enabled`: true → true（一致）
- 盤の `placed`: `["L","T","W"]` → `["L","T","W"]`（一致）
- トレイの `F` の `cells`（向き）: 縦横で完全一致（座標配列が同一）
- 画像は縦の配置（盤の下にトレイ）になっている

一致。

## 3. Game のやり直し確認を開いたまま縦にする

`confirmRestart()` で確認を開き（`confirmKind: "restart"`）、横→縦へ resize。
resize 後も `confirmKind: "restart"` のまま、画像でも確認の表示が出ている。一致。

## 4. Clear（縦→横）

`useAuto()` を 12 回呼んで完成させ、`Clear` の起動を待ってから縦→横へ resize。

- localStorage の `pentomino-puzzle/history/v2/6x10`: resize 前後で
  `[{"at":1790386048893,"ms":29427.16,"no":978,"a":true}]` の 1 件のまま
  （resize 前に完成させた時点で 1 件増えており、resize では増えていない＝二重に
  記録されていない）
- `window.game.scene.isActive('Clear')`: resize 前後とも `true`
- 画像でクリア表示が出たままになっている

一致。

## 5. Records（横→縦）

localStorage に 10 件を直接仕込み（着手前は 0 件）、`Records` を開いて
2 頁目（`turnPage(1)`）・1 件チェック（`toggleRow(0)`）・1 件選択
（`selectRow(1)`）してから横→縦へ resize。

- `page`: 1 → 1（一致。0 始まりの 2 頁目）
- `checked`: `[8]` → `[8]`（一致）
- `selected`: 8 → 8（一致）
- 画像は縦の配置になっている

一致。

## 6. Demo（横→縦→横）

探索を少し進めてから `window.game.scene.pause('Demo')` で一時停止し、
`tried` を読んでから横→縦へ resize。

- 一時停止直後: `tried: 11`
- 縦へ resize 直後: `tried: 11`（保たれている。scene も `active: false` のまま）
- `resume('Demo')` で再開し、1.5 秒後に `tried: 18`（続きから進んでいる。
  0 から数え直していない）
- 縦→横（960x640）へ戻して撮影

一致。

## 洗い出し（漏れの有無）

`rg -n "SCREEN|LAYOUTS|PORTRAIT|portrait" src` は実行していない
（implementer の完了条件であり、screens の役目ではないため）。
本確認では 5 画面すべてで向きの変化に配置・状態が追従しており、
見た範囲で漏れは見当たらない。

## コンソール

`browser_console_messages` を毎回確認。エラーは 0 件（全セッション通して）。
警告は起動直後の WebGL ドライバの `GPU stall due to ReadPixels` が 4 件のみ
（ゲーム内のコードによるものではない、環境依存の描画ドライバの通知）。

## 見なかったもの（依頼どおり）

- デザインの良し悪し
- 向きを変えないときの見た目
- ピースの操作感

## 境界線上の判断（実害は未確認）

- Demo の一時停止は HUD のボタンではなく `scene.manager.pause('Demo')` を直接
  呼んで代用した（Demo シーンに一時停止専用の HUD ボタンが見当たらなかったため）。
  ユーザー操作としての一時停止経路（キーボードや別の入力）が別にあり、
  そちらだけ挙動が違う可能性は確かめていない。実害は未確認。
- Records の 10 件は `localStorage` へ直接書いて仕込んだ（記録画面に到達する
  操作そのものは経由していない）。読み込み・整形（`sanitizeHistory`）は通っている。
