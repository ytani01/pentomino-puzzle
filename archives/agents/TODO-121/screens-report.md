# TODO-121 画面の確認（screens-121）

対象: コミット 88c8c13（`git archive` で取り出し、`localhost:8769` で配信。作業ツリーは未使用）。
8×8 のみ。記録は storage に 3 件入れた（`recordClear('8x8', …)`。うち 1 件はおまかせの印つき）。

## 結果: 問題なし

食い違い・欠け・重なり・余計な表示・文言の抜けは見つからなかった。コンソールのエラーは 0 件。

## 画面（画像）

| 画面 | 大きさ | 結果 | パス |
|---|---|---|---|
| タイトル | 320x568 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-title-320x568.png |
| 記録 | 320x568 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-records-320x568.png |
| 本編（確認の枠を開いた） | 320x568 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-game-confirm-320x568.png |
| タイトル | 568x320 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-title-568x320.png |
| タイトル（ボードの選択肢の説明） | 568x320 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-title-568x320-tooltip.png |
| 記録 | 568x320 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-records-568x320.png |
| 記録（全部選ぶ → 消すの確認の枠） | 568x320 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-records-568x320-confirm.png |
| 本編（確認の枠を開いた） | 568x320 | 問題なし | /home/ytani/tmp/playwright-mcp/t121-game-confirm-568x320.png |

縦 320x568 のタイトルは、記録を入れる前に撮ったので最短が「記録なし」と出ている（横は 01:05）。

## 動作（横 568x320、各 1 回）

| 操作 | 結果 |
|---|---|
| タイトルの「はじめる」を押す | 本編（Game）へ移った |
| タイトルで 6×10 の選択肢にマウスを載せる | 説明「6×10（穴なし）」が選択肢の下に出た（色の行に少し重なるが、説明は浮かせて出すもの） |
| 記録で「全部選ぶ」→ ゴミ箱 | 確認の枠「8×8 の記録 3 件を消しますか？／もとに戻せません」が開いた（`confirmKind` = `trash`） |
| その枠で「いいえ」 | 枠が閉じ（`confirmKind` = null）、記録は 3 件のまま、チェックも 3 件のまま |
| 本編で確認の枠（`openConfirm('restart')`）→「はい」 | 枠が閉じ、本編が作り直された（Game のまま、`confirmKind` = null） |

本編の確認の枠は、HUD のボタンではなく `openConfirm('restart')` を evaluate で呼んで開いた（枠は同じ `confirm.open()` で出る）。

## コンソール

- エラー 0 件
- 警告 4 件（すべて同じ種類。ブラウザの GL ドライバの性能の知らせで、コードとは無関係）:
  `[.WebGL-…]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels @ http://localhost:8769/:0`
