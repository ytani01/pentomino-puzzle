# TODO-121 reviewer 報告（368e930）

挙動を変えないリファクタリングとして見た。**要修正: 0 件。** 挙動の変化は見つからなかった。

## 要修正

なし。

## 検討

なし。

## 好みの範囲

- `src/ui.js:452-454` / `createButton()` の JSDoc（`*/`）と `export function createButton` の間に空行が 1 行残っている。
  報告には「関数の直前へ戻した」とある。`BUTTON_PAD` を抜いたときの空行の残り。動作には関係しない。

## 作り込みすぎ

- `src/ui.js:401-403`（`createConfirmDialog()` の戻り値）/ `parts`・`text` を返し続けているが、`open()`・`hide()` を足したので
  呼び出し元はもう使っていない（`rg -n "confirm\.(parts|text)" src` は 0 件）。JSDoc にも説明が残っている。
  消せば戻り値は `{ open, hide }` だけになる。重大度は**好みの範囲**。

## 観点ごと（問題なし）

- 確認の枠の open/hide: 本編・記録とも、開く音（silent のときは鳴らさない）、閉じる音 1 回、表示の切り替え、「はい」の動作の差し替えは元と同じ。
  `doTrash()` → `hideConfirm()` も音・`confirmKind = null`・非表示の 3 つで元と同じ（順番が変わるだけで、間に見える処理は無い）。
  「はい」の初期値は、記録では元と同じ（`hideConfirm` 相当の `onNo`）。本編は元が `null`（開く前に押せないので呼ばれない）で、実害は無い。
  `confirmKind` は `relayout()` で控え、`applyRelayout()` が `openConfirm(kind, true)` で開き直す（TODO-095）。保たれている。
- `redraw()` の状態の優先順位（無効 > 選択 > 押下 > hover > 通常）: 元の if の連鎖を状態ごとに読み直し、面・縁・文字・アイコン・印の 5 つとも
  `BUTTON_STATES` の値と一致。実装者の 16 通りは有効/無効 × hover × pressed × selected の全組み合わせで、無効との組み合わせ、
  アイコン（描画命令）・印・名前（caption）の色も含む。漏れた組み合わせは無い。
- `refresh()` の分割: 出し直す順番と条件は元と同じ。`allChecked()` は `solutions !== null` を含むが、`toggleSelectAll()` は
  その前で `null` を返すので意味は変わらない。`selectAll` の有効条件も元と同じ。
- `restoreRelayout` → `applyRelayout`: `src`・文書に残り無し（`TODO.md` の説明文のみ）。`RecordsScene` は `Phaser.Scene` を
  継承しており、`GameScene`/`DemoScene` の `applyRelayout` とは継承でぶつからない。
- `title.js` の始めるボタン: x 座標（`cx - step`・`cx`・`cx + step`）、ラベル、動作、`this.resumeButton` は元と同じ。
- ボードの選択肢: `boardChoices()` の中身は元の 2 か所と同じ式。ツールチップ「ラベル（注記）」と選んだときの動作も同じ。
- import: `audio.js` は import を持たず、`icons.js` は `config.js`・`logic.js` だけを読む。`ui.js` を読み返すものは無く、循環しない。
- 規約: `setTimeout` 無し。色は `config.js` の `BUTTON_STATES` へ移した。`let yes` は関数内の閉包で、モジュールのトップレベルではない。
  JSDoc は「なぜ」を書いている。
- 文書: `CLAUDE.md`・`docs/developer.md` の `ui.js` の行は新しい部品に合っている。`openConfirm`・`confirmAction` などの古い名前は文書に残っていない。
- 範囲: 指示に無い変更は無い。
- テスト: `tests.html` の対象（Phaser に依存しない計算）は変わっていないので、足すテストは無い。
