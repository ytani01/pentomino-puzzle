# TODO-098 見た目の確認（screens）

## 撮った画像

| 画面 | 大きさ | 状態 | パス |
|---|---|---|---|
| デモ | 844x390 | 人間的 | /home/ytani/tmp/playwright-mcp/demo-844x390-human.png |
| デモ | 844x390 | 機械的 | /home/ytani/tmp/playwright-mcp/demo-844x390-machine.png |
| デモ | 390x844 | 人間的 | /home/ytani/tmp/playwright-mcp/demo-390x844-human.png |
| 本編 | 844x390 | - | /home/ytani/tmp/playwright-mcp/game-844x390.png |
| 本編 | 390x844 | - | /home/ytani/tmp/playwright-mcp/game-390x844.png |

## 1. デモの探し方ボタン（`strategyButton`）

844x390 で `getBounds()` を実測。

- ボタン枠: x=624, y=170, width=48, height=41（底 = 211）
- アイコン（Graphics, y=-8）: 数値上の bounds は取れない（Graphics は getBounds 非対応）が、目視で名前の文字と重なっていない
- 名前の Text（「人間的」）: x=624, y=194, width=48, height=17（底 = 211）
  → ボタン枠の底とちょうど一致。枠の外へはみ出してはいない
- 「機械的」への切り替え後も同様に枠内に収まっている（画像で確認）

問題なし。

## 2. HUD ボタンの高さと HUD 枠・盤の関係

- 本編（844x390）: HUD y=42, height=152 → 底=194。盤 y=218 → 24px の余白。重なりなし
- デモ（844x390）: HUD y=68, height=152 → 底=220。盤 y=244 → 24px の余白。重なりなし
- 縦画面（390x844）も同様の余白があり、重なりなし（本編: HUD 底 194、盤 y=216。デモ: HUD 底 220、盤 y=242）
- HUD 内のボタン（`buttonHeight=64`）は HUD の `rowHeight=76` の中に収まっている（枠内、目視でも重なりなし）

問題なし。

## 3. 盤・トレイ・画面下の文字のはみ出し

- 844x390・390x844 とも、本編・デモの全画像で、盤・トレイ・下端の文字（操作の概要／メッセージの帯、デモの説明文）が画面の外へはみ出していない（目視）

問題なし。

## 4. コンソールのエラー

- 全ナビゲーションでエラー 0 件
- デモ（844x390）でのみ警告 4 件。すべて `GL Driver Message ... GPU stall due to ReadPixels`
  という headless の WebGL 起因のもので、TODO-098 の変更とは無関係とみられる
  （実害は未確認）
