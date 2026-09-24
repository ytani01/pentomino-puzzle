# TODO-071 verifier 報告

Playwright 1.63.0（npx の置き場から借用）、新しいコンテキスト、844×390。サンドボックスでは localhost に届かないため外して実行した。
スクリプトは `archives/agents/TODO-071/verify.mjs`（手順 1〜3・5〜7）と `verify4.mjs`（手順 4）。どちらも終了コード 0、`pageerror`・コンソールエラーは 0 件。
仕込んだ記録: 8×8 の履歴 10 件（no 1〜10）、`found/8x8`=[1..10,20]、`auto/8x8`=[2,3,30]、6×10 の履歴 1 件（no 5）、`found/6x10`=[5]、`auto/6x10`=[5]。
クリックはすべて `page.mouse.click`（部品の座標を Canvas の座標へ変換して実際に押した）。

## 結果

1. 一致: `tests.html` の結果は「364 件すべて通った」。コンソールエラーは `[]`
2. 一致: チェック 0 件のとき `trashButton.enabled=false`、押したあとの確認の枠は `visible=false`
3. 一致: 3 行目（no 3）を表示し、1・2 行目にチェックして `checked=[1,2]`。確認の文言は「8×8 の記録 2 件を消しますか？\nもとに戻せません」。「はい」を押したあと: 件数 8、表示中は no 3（selected 0, page 0）、`found/8x8`=[3,4,5,6,7,8,9,10,20]、`auto/8x8`=[3,30]、達成度「65 解中 9 解」
4. 一致（`verify4.mjs`。10 件・8 行/頁で 2 頁）: 1 頁目で 1 行目をチェック → `checked=[1]`、次へで page 1「2 / 2」`checked=[1]`、前へで page 0 に戻り、1 行目のチェックが付いたまま。6×10 へ切り替えると `checked=[]`、8×8 へ戻しても `[]`
   - 補足: 依頼の順（手順 3 のあと）では 8 件 = 1 頁しか残らず次へが押せないので、10 件で別に確かめた
5. 一致: 全部選ぶで `checked=[3,4,5,6,7,8,9,10]`、確認は「8 件を消しますか？」。消したあと: 件数 0、「記録なし」表示、達成度「8×8 … 65 解中 0 解」、`history/v2/8x8`=`[]`、`found/8x8`=null（キーごと消えた）、`auto/8x8`=null。6×10: `history`=1 件、`found`=[5]、`auto`=[5]、画面の達成度「2339 解中 1 解」
   - `found/8x8` の 20 と `auto/8x8` の 30（履歴に無い番号）も消えている
6. 一致: 5 行目のチェックを押しても selected 0 のまま、見出しの文字も変わらず（`checked=[5]`）。7 行目を押すと selected 6、`checked=[5]` のまま
7. 一致: ゴミ箱に載せて 1.5 秒後、説明「チェックした回を消す」が出る。Canvas 座標で y=549（ゴミ箱の中心 y=600 の上）、画面の高さ 640 に収まる。`~/tmp/playwright-mcp/todo071-tooltip.png` を見て、上に出て切れていないことを確認した
   - 見た目の気づき（実害は未確認）: 上に出る説明が達成度の行（「… 65 解中 0 解」）の左側に重なって一時的に隠す
8. 一致: `docs/images/records.png` の吹き出し Ⓐ一覧・Ⓑチェック・Ⓒ全部選ぶ・Ⓓ印・Ⓔ完成形・Ⓕ達成度・1 前へ・2 次へ・3 ゴミ箱・4 タイトルへ は、UsersGuide の記号・表の番号と合う。UsersGuide の動き（行とチェックの当たり判定が別、全部選ぶは全頁、ゴミ箱は 1 件以上で押せて件数を確認、盤の切り替えでチェックが外れ頁送りでは残る）は 2〜6 の実測と合う。developer.md の `removeRecords()` の表・図・説明は `src/storage.js` と実測 3・5 と合う
   - 食い違い（境界線上。実害は未確認）:
     - `docs/developer.md` の「画面の用語」の記録の画面の表（226 行付近）に、チェック・全部選ぶ・ゴミ箱の呼び名が無い
     - 同じファイルの「説明（tooltip）」の行（220 行付近）は「HUD のボタンの下に出る」とあるが、記録の画面の下段では上に出る（`src/ui.js` の変更）
     - UsersGuide には「記録を全部消すと達成度も 0 になる」旨の記述が無い（変更前も無かった）

## 変更されたファイル

`docs/UsersGuide.md`・`docs/developer.md`・`docs/images/records.png`・`src/icons.js`・`src/logic.js`・`src/scenes/records.js`・`src/storage.js`・`src/ui.js`・`tests.html`・`tools/capture.mjs`、未追跡の `archives/agents/TODO-071/`。
すべて TODO-071 の項目（アイコン・チェック・ゴミ箱・テスト・文書・キャプチャ）の範囲に収まる。`src/config.js` は案 A/B の切り替えを足して消したので差分なし。
`rg -n "removeButton|clearButton|この回を消す|全部消す|RECORDS_LAYOUT|LAYOUTS_BY_VARIANT" src/ tools/ docs/ tests.html` は、tests.html のテスト名「removeRecords で全部消すと…」1 件だけ（古い部品の参照は無い）。

## 確かめなかったこと

- 縦画面（portrait）の配置と説明の位置
- タッチ操作での説明の出方
