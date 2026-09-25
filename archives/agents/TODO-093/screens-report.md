# TODO-093 画面確認報告

対象: /home/ytani/work/pentomino-puzzle の未コミットの変更。python3 -m http.server 8765、
960x640（横）・640x1136（縦）の内部解像度、盤は 8x8。記録画面は localStorage
（`pentomino-puzzle/history/v2/8x8`）に 10 件の履歴を書き込んでから開いた（1 頁 7〜8 件、2 頁）。

**縦（640x1136）は、先に `browser_resize` してから `navigate`（読み込み直し）して撮った。**
画面の向きは起動時の `window.innerWidth`/`innerHeight` で 1 回だけ決まる
（`src/config.js` の `PORTRAIT`）ため。撮る前に毎回 `window.game.scale.width` が
`640` であることを確かめた（下記に実測値を記載）。

## 画像

- 記録・横・一覧（選択のみ）: /home/ytani/tmp/playwright-mcp/records-960x640-list.png
- 記録・横・チェック後（1 件チェックし、ゴミ箱が押せる状態）: /home/ytani/tmp/playwright-mcp/records-960x640-checked.png
- 記録・縦・チェック後（`scale.width` 実測 640）: /home/ytani/tmp/playwright-mcp/records-640x1136-checked.png
- 本編（はじめる）・横・タイトル行付近: /home/ytani/tmp/playwright-mcp/game-960x640-titlebar.png
- 本編・縦（`scale.width` 実測 640）: /home/ytani/tmp/playwright-mcp/game-640x1136-titlebar.png
- デモ・横: /home/ytani/tmp/playwright-mcp/demo-960x640-titlebar.png
- デモ・縦（`scale.width` 実測 640）: /home/ytani/tmp/playwright-mcp/demo-640x1136-titlebar.png

## 見た結果

1. 一致。記録画面の盤の選択ボタンは、タイトル画面と同じ図（8x8 のマス目アイコン／6x10 のマス目アイコン）の `createChoiceRow` 形になっている（横・縦とも）。
2. 一致。ゴミ箱は「全部選ぶ」と同じ行の右端にあり、一覧の右端に揃う（横 960x640: ゴミ箱中心 x=466、一覧右端 x=488。縦 640x1136 も同様に一覧右端とゴミ箱の右端が揃う）。チェックを 1 件入れると `scene.trashButton.enabled` が `true` になった（`evaluate` で確認、横・縦とも）。
3. 一致。記録画面の各部品（盤の選択・全部選ぶの行・一覧・頁送り・完成形・「この回を続ける」ボタン・タイトルへの家アイコン）は、横 960x640・**真の**縦 640x1136（盤とトレイが縦に積まれる本来の縦画面レイアウト）のどちらでも重ならず、画面（Phaser の描画域）からはみ出していない。
4. 一致。本編・記録・デモの最上段に「PENTOMINO PUZZLE」と、その右横に小さく薄い色で `dev`（バージョン）が出ている。右下にはバージョン表示は無い（2 か所に出ていない）。本編・デモのタイトル行は HUD の行（時間・残り・ボタン列、または「試した手」「見つけた解」の行）と重ならない。真の縦画面（盤の下にトレイが積まれるレイアウト）でも同様。
5. 一致。`browser_console_messages` にエラーは 0 件（横・縦とも）。警告はヘッドレス環境の WebGL ドライバのメッセージ（`GPU stall due to ReadPixels`）が数件のみで、コードに起因するものではない。

## 見なかったもの

デザインの良し悪し、タイトル画面、ゲームの操作（依頼どおり）。
