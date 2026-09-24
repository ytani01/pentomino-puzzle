# TODO-071 implementer2 の報告（capture.mjs の記録画面の吹き出し）

## 変更

- `tools/capture.mjs:59-61` `annotate()` の説明を実際の置き方に合わせ、`text` 無しで `side` があるときの動きを追記
- `tools/capture.mjs:119` 丸だけを枠の内側に置くのは `text` も `side` も無いときだけにした
- `tools/capture.mjs:141-143` `text` 無しで `side` があれば、枠なしの丸だけを部品の外へ出して線で指す（ほかの吹き出しと同じ位置の計算）
- `tools/capture.mjs:225-226` 記録の画面を `BANDED`（960×720）で撮る。下の段の丸を下の帯に出すため
- `tools/capture.mjs:245-246` Ⓑ は `rowChecks[4]`（一番下のチェックボックス）を下から指す。チェックボックスの左に余白が無いため。Ⓒ は「全部選ぶ」を上から指す
- `tools/capture.mjs:254-257` ①〜④ は各ボタンの下へ丸を出して線で指す

番号と `docs/UsersGuide.md` の対応は変えていない（Ⓑ が指すチェックボックスが 1 行目から 5 行目に変わっただけ）。

## 検証

- `PLAYWRIGHT=... node tools/capture.mjs` → 終了コード 0
- `docs/images/records.png`（960×720）を目で確認: Ⓐ〜Ⓕ、①〜④ のどれも部品を隠していない。「全部選ぶ」の文字、チェックボックス、◀・▶・ゴミ箱・ホームのアイコンが見える
- ほかの画像: `title.png` はバイト一致。`play.png`・`game.png`・`demo.png`・`demo.gif` は撮り直しで変わった（おまかせで置くピースの選び方とデモの進み具合による。play は約 6.7%、game は 1.5%、demo は 1.2% の画素）。今回の変更と関係無いので、撮り直す前（main が撮ったもの）に戻した

## 気づいたこと

- 記録の画面だけ 960×720 になり、`records.png` の縦横比が変わった。文書側で大きさを指定している箇所は無い（`rg records.png` で確認）

---

# 追記: レビューの要修正と利用者の判断の反映

## 変更

1. 下段のアイコンの説明（ツールチップ）
   - `src/scenes/records.js:33` `createTooltip` を import。`src/scenes/records.js:190-192` `create()` で `this.tooltip = createTooltip(this)` を確認の枠より前に作る（ほかの部品より手前、確認の枠（depth 10）より奥。本編の `DEPTH.tooltip` < `DEPTH.confirm` と同じ重なり順）
   - `src/ui.js:383-388` **指示の範囲外だが直した**: ツールチップはボタンの下に出すので、画面の下端にある下段のボタンでは 640 を超えて切れた（Playwright で撮って確認。`y: 631`、文字の上半分だけ見えた）。下に出すとはみ出すときだけ、ボタンの上に出すようにした。本編・デモの HUD やタイトルのボタンは下に出してもはみ出さないので、今までどおり
2. 「この回を消す」「全部消す」の残り
   - `docs/developer.md:403`（表の 2 行を `removeRecords()` の 1 行に）、`:420-422`（mermaid）、`:427-431`（一部のときと、記録が残らないときの説明）
   - `src/storage.js:418-419`（`removeFound`）、`:469-471`（`removeAuto`）の JSDoc
3. 確認の枠の寸法: `src/scenes/records.js:104-108` 元の `LAYOUTS[BOARDS['8x8'].key].confirm` とコメントに戻した（`LAYOUTS` の import も戻した）
4. 全部消したとき
   - `src/storage.js:308-332` `removeRecords(boardKey, nos, solutions)` を新しく作った。`removeHistoryMany()` のあと、履歴が 1 件も残らなければ `clearFound` + `clearAuto`、残れば消した番号ごとに `removeFound` + `removeAuto`
   - 「全部選んで消したとき」は「消したあとにその盤の履歴が残らないとき」で判定した。1 件しかない記録をチェックして消したときも、全部選んだのと同じなので丸ごと消える
   - `src/scenes/records.js` `doTrash()` は `removeRecords()` を呼ぶだけにした。import から `removeAuto` / `removeFound` / `removeHistoryMany` を外した
   - `tests.html` 足したテスト 2 件（盤ごとなので 4 件）: 一部だけ消すと found・auto から消した番号だけが外れる／全部消すと、履歴に無い番号（found の 3、auto の 4）も含めて空になる
5. `src/logic.js:965-977` `clampSelection` の JSDoc を、一覧全体の添字を保ち、はみ出したときだけ詰める、と実際の動きに合わせた

## 5 の「完成形が別の回に移る」

計算は前の 1 件消すとき（`Math.max(0, Math.min(selected, length - 1))` と `Math.min(page, pageCount() - 1)`）と同じ。
ただし結果は違う。前は消すのが選んでいた回そのものなので「次の回が選ばれる」だけだった。今は選んでいた回より前の行をチェックして消すと、見ていた回は残っているのに、同じ添字にある別の回が選ばれる（レビューの 5 のとおり）。直していない。直すかどうかは判断が要る。

## 検証

- `tests.html` 全件: Playwright の新しいコンテキストで開いて `#summary` を読んだ → 「359 件すべて通った」（class `pass`）。ui.js を直したあとにもう一度走らせて同じ結果
- 壊すと落ちるか（Node。`tools/window-shim.mjs` にダミーの `localStorage` を足し、`src/storage.js` をそのまま import して、足したテストと同じ 2 つの場面を確かめた。scratchpad の `records-check.mjs`）。直したまま: 終了コード 0。`src/storage.js` を一時的に壊すと、どれも終了コード 1:
  - 全部のときに clear を呼ばない → found `[3]`・auto `[4]` が残って落ちる
  - 全部のときに `clearAuto` だけ外す → auto `[1,4]` で落ちる
  - 一部のときに `removeFound` を外す → found `[1,2,3]` で落ちる
  - 一部でも丸ごと消す → found・auto が `[]` になって落ちる
  - 終わったあと `storage.js` を戻し、`cmp` で元と同じことを確かめた
- 記録の画面での実測（Playwright、960×640）: 履歴 1・2・3、found に 1・2・3・9、auto に 7 を入れた状態で、1 だけチェックして `doTrash()` → 一覧 `[3,2]`・found `[2,3,9]`・auto `[7]`・達成度「65 解中 3 解」。続けて全部選んで `doTrash()` → 一覧 0 件・found `[]`・auto `[]`・達成度「65 解中 0 解」
- ツールチップ: ◀ とホームにマウスを載せて 700ms 待った → 「前へ」「タイトルへ」がボタンの上（y 549）に出て、画面に収まる（撮って確認）

## 範囲外で気づいたこと

- レビューの 7（同じ番号の件が 2 件あるときの件数の食い違い）、9（developer.md の「画面の用語」）、作り込みすぎの節（`removeHistory()` は src から呼ばれていない、など）は触っていない。`clearHistory` は src から呼ばれないまま（`removeRecords` は `removeHistoryMany` の結果で判定するため使わない）

---

# 追記 2: 消したあとも見ていた回を選んだままにする

## 変更

- `src/logic.js:980-997`（関数本体は 989-997）純関数 `selectionAfterRemoval(nos, selected, page, removed, rowsPerPage)` を足した。`nos` は消す前の一覧の番号（並びどおり）
  - 見ていた回が残っていれば、消したあとの一覧でのその回の添字を選び、頁はその回が見える頁（`Math.floor(添字 / rowsPerPage)`）にする
  - 見ていた回を消したときは、残った中で次の回（見ていた位置より前に残った件数を添字にする。末尾なら 1 つ前）を選び、頁は `clampSelection()` で詰める。1 件だけ消すときは前の作り（TODO-031）と同じ結果
- `src/logic.js:965-978` `clampSelection` の JSDoc を、`selectionAfterRemoval()` から使う形に書き直した
- `src/scenes/records.js` `doTrash()`: 消す前の一覧から `selectionAfterRemoval()` で選ぶ位置と頁を出してから `removeRecords()` を呼ぶ。import を `clampSelection` から `selectionAfterRemoval` に替えた
- `tests.html` テスト 5 件を足した（前の行を消しても同じ回のまま／その回の頁へ移る（前を消したとき・後ろだけ消したとき）／見ていた回を消したら次の回へ／末尾ごと消したら 1 つ前へ移り頁も詰める／全部消したら先頭）

## 検証

- `tests.html` 全件: Playwright の新しいコンテキストで開いた → 「364 件すべて通った」（class `pass`）
- 壊すと落ちるか（Node。scratchpad の `sel-check.mjs` が、足したテストと同じ 6 つの場面で `src/logic.js` を import して確かめる）。直したまま: 終了コード 0。一時的に壊すと、どれも終了コード 1:
  - 残っていても添字のまま（前の作り）→ 落ちる（後ろだけ消した場面）
  - 頁を移さない → 落ちる
  - 前に残った件数を数えない → 5 つの場面で落ちる
  - 見ていた回を消したときに添字のまま → 落ちる（次の回へ移る場面）
  - 終わったあと `logic.js` を戻し、`cmp` で元と同じことを確かめた
- 記録の画面での実測（Playwright）: 10 件、1 頁 8 件。1 頁目を開いたまま 9 件目（番号 2）を選び、上の 2 行をチェックして `doTrash()` → 番号 2 を選んだまま（添字 6、頁 0、完成形の見出しも「2 番」）。続けてその回だけ消す → 次の回（番号 1）へ移った
