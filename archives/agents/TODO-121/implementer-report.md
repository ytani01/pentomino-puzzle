# TODO-121 implementer 報告

## 変更点
- `src/config.js`: `BUTTON_STATES`（disabled / selected / pressed / hover / normal ごとの面・縁・文字・アイコン・印の色）を `TEXT_COLORS` の後ろに追加。
- `src/ui.js`:
  - `buttonState()` で状態を 1 つに決め（disabled > selected > pressed > hover > normal）、`redraw()` は表を引くだけにした。
    `createButton()` の JSDoc が `BUTTON_PAD` で関数から離れていたので、関数の直前へ戻した。
  - `createConfirmDialog()` は `{ parts, text, open(message, onYes, silent), hide() }` を返す。`onYes` の引数は廃止（「はい」は `open()` で渡した動作を呼ぶ）。
    音（`audio.button()`）は `open()`（silent で消す）と `hide()` が鳴らす。そのため `ui.js` が `audio.js` を import する（循環なし）。
  - `boardChoices()` を追加（タイトルと記録のボードの選択肢）。`ui.js` が `icons.js` を import する（循環なし）。
- `src/scenes/game.js` / `records.js`: `confirmParts`・`confirmText`・`confirmAction` を廃止し `this.confirm` に。
  `openConfirm()`・`hideConfirm()` は `confirmKind` の更新と `this.confirm.open()`／`hide()` の呼び出しだけ。
  `records.js` の `doTrash()` は `hideConfirm()` を呼ぶ（音・非表示・`confirmKind` は前と同じ）。
- `src/scenes/records.js`: `refresh()` を `refreshRows()`・`refreshPager()`・`refreshSelectAll()`・`refreshDetail()` に分割。
  「全部にチェックが付いているか」は `allChecked()`（と `checkableNos()`）に 1 つにして `toggleSelectAll()` も使う。
  `restoreRelayout()` を `applyRelayout()` に改名（`rg -n restoreRelayout` は `TODO.md` の説明文と過去の archives 以外に残らない）。
- `src/scenes/title.js`: 始める 3 ボタンを `clear.js` と同じく配列から作る。ボードの選択肢は `boardChoices()`。
- `CLAUDE.md`（ファイル構成表の `ui.js` の行）・`docs/developer.md`（`ui.js` の行）に新しい部品を追記。

## 検証
- ボタンの色: `archives/agents/TODO-121/button-colors.mjs`（有効・hover・pressed・selected の 16 通り全部で、面・縁の描画命令、アイコンの描画命令、文字・印・名前の色を読み出す）を
  変更前（`button-colors.before.json`）と変更後（`.after.json`）で取り、`cmp` で**完全一致**。
- 動作: `archives/agents/TODO-121/behavior.mjs`（Playwright・8765 のサーバ。結果は `behavior.after.txt`）。全部期待どおり、コンソールのエラーは 0 件。
  - タイトル: ボード選択肢に hover → ツールチップ「6×10（穴なし）」が出る。「はじめる」→ 本編へ。
  - 本編: 確認を開く→「いいえ」で閉じて `confirmKind` が null。開く→「はい」で `restart()` が 1 回。
    開いたまま縦へ向きを変えると、同じ種類（title）の枠が開き直る。
  - 記録（履歴 10 件）: 次へで 2/2 頁、全部選ぶで 10 件にチェック・再度で 0 件、ゴミ箱で確認が開き「いいえ」で閉じてチェックは残る。
    開いたまま向きを変えると `trash` が開き直る（頁は 1 頁目、チェックは 10 件のまま）。「はい」で 10 件が消えて一覧が空になる。
- `tests.html`・全解のデータの検査は流していない（依頼のとおり。`logic.js` / `config.js` のピース定義は触っていない）。
- 見た目の撮影は別の担当。
- 足したテストは無い（ブラウザで読み出して比べるスクリプトで確かめた）。直しを外すと落ちるかの確認: `BUTTON_STATES` の `selected.edge` を変えれば 16 通りの出力が食い違う構造だが、実際に壊してはいない。

## 残る懸念・判断が要る点
- 判断が要る点は無い。
- 音: 「いいえ」・`hide()` の音は前と同じ 1 回。`open()` の音も前と同じ（silent で無し）。耳では確かめていない（コードの読み合わせのみ）。
- コミット対象に、別の担当が触る `tests.html`・`logic.js` は含めていない。
