# TODO-071 reviewer の報告

対象: `git diff`（未コミット。docs/UsersGuide.md・records.png・icons.js・logic.js・records.js・storage.js・tests.html・capture.mjs）。
コードは直していない。測ったものは Node（`window` と `localStorage` のダミーを置き、`src/` をそのまま import）で確かめた。
スクリプトは scratchpad の `harness.mjs`・`edge.mjs`（セッション限りの置き場。残していない）。

## 要修正

### 1. 下段のアイコンボタンの説明（tooltip）が出ない
- 場所: `src/scenes/records.js:273`・`:282`・`:286`・`:293`（`tooltip: '前へ'` など 4 つ）
- 問題: 記録の画面は `createTooltip()` を呼んでおらず、`this.tooltip` が無い（`rg -n createTooltip src/scenes/*.js` は title.js と game.js だけ）。
  `src/ui.js:282` の `tip()` は `scene.tooltip` を返すので `undefined` になり、`tip()?.showLater(...)` は何もしない。
  文字のボタンをアイコンだけにしたのに、何のボタンかを知る手段が無い（ゴミ箱・ホームは特に）。
- 根拠: コードを読んだ結果（画面では確かめていない）。
- どうすれば: `create()` で `this.tooltip = createTooltip(this)` を作る。確認の枠（depth 10）との重なり順は game.js（`DEPTH.tooltip`）に倣って決める。

### 2. 「全部選ぶ」→ ゴミ箱が、前の「全部消す」と同じ結果にならない（判断が要る）
- 場所: `src/scenes/records.js` の `doTrash()`（`removeFound` / `removeAuto` を履歴にある番号の分だけ呼ぶ）
- 問題: 前の「全部消す」は `clearHistory` + `clearFound` + `clearAuto` で、達成度とおまかせが避ける番号を丸ごと消していた。
  今は履歴に載っている番号しか外さないので、履歴（`HISTORY_LIMIT` = 50）からあふれた解の番号や、
  履歴に無いおまかせの番号が残る。一覧が空なのに達成度が 0 にならず、それを消す手段も画面から無くなった。
- 根拠（実測）: 6×10 で 51 回クリア（番号 1〜51）と、履歴に無いおまかせ番号 999 を入れたあと、全部選んで消す計算を通すと
  `history 0 / found [1] / auto [999]`。8×8 は全 65 解なので、50 件を超えて見つけた人で起きる。
- どうすれば（利用者の判断）: (a) その盤の記録を全部チェックして消したときは `clearFound` / `clearAuto` も呼ぶ、
  (b) 今のまま「消すのは一覧にある回の分だけ」として、文書に書く。1 件ずつ消すときの扱い（TODO-031）とは、今の作りでも揃っている。

### 3. 文書とコメントが前の 2 つのボタンのまま
- `docs/developer.md:403-404`（表の「記録を 1 件消したとき」「記録を全部消したとき」）、`:420-423`（mermaid の `R1["この回を消す"]`・`R2["全部消す"]`）。
  今は `removeHistoryMany()` + `removeFound()` + `removeAuto()` の 1 つだけ。`:425-429` の「消す件は番号で指定する」の文も、1 件の話として書かれている。
- `src/storage.js:443` の `removeAuto` の JSDoc「全部消すときに `clearAuto()` まで呼ぶのと同じ理由で」。もう全部消す操作は無い（2 の判断しだいで戻る）。
- 根拠: ブリーフの `rg`（`src/storage.js:443` と `docs/developer.md:421-422` がヒット）と、その前後を読んだ結果。

### 4. 確認の枠の寸法を config.js から records.js へ書き写した
- 場所: `src/scenes/records.js` の `const CONFIRM = { width: 460, height: 200, buttonWidth: 150, buttonHeight: 48, gap: 20 }`
- 問題: 前は `LAYOUTS[BOARDS['8x8'].key].confirm` から取っていた。`src/config.js:444-446` に同じ値が残っているので、同じ数が 2 か所になった。
  CLAUDE.md の「数値と色は `src/config.js` に集約する」に反し、TODO-071 の範囲でもない。新しいコメント「手で決めてある」も事実と違う。
- どうすれば: 元の 1 行（`LAYOUTS[...].confirm`）と元のコメントに戻す。

## 検討

### 5. 消したあと、選んでいた回が別の回に変わる
- 場所: `src/logic.js` の `clampSelection()`、`records.js` の `doTrash()`
- 問題: 選び位置を一覧全体の添字のまま持つので、選んでいる回より上の行を消すと、完成形が別の回に変わる。
  例: 5 番目の行を見ている状態で 0・1 行目をチェックして消すと、`clampSelection(6, 5, 0, 8)` は `{selected: 5}` を返し、前の 7 行目の回を出す。
  見ていた回は消えずに 3 行目へ移っているが、選ばれていない。1 件ずつ消すときは「消した回の次」でよかったが、複数件では見ていた回とは関係なく変わる。
- 実害は未確認（利用者が戸惑うかどうか）。見ていた回が残っているなら、その番号で探し直す手がある。

### 6. `clampSelection()` の JSDoc が中身と違う
- 場所: `src/logic.js:966-970`
- 問題:「選んでいた位置（頁の中の何番目か）をそのまま保ち」とあるが、頁の中の位置ではなく一覧全体の添字をそのまま保っている。

### 7. 同じ番号の件が 2 件あると、確認の件数と実際に消える行数が食い違う
- 場所: `records.js` の `toggleRow()`・`confirmTrash()`（`this.checked.size` を件数に出す）
- 問題: チェックを番号で持つので、同じ番号の行が 2 つあると、片方を押すと両方にチェックが付き、「1 件を消しますか」と出して 2 行消える。
- 根拠（実測）: 古い形の件（`cells`）と番号の件が同じ解を指すとき、`loadHistory(..., solutions)` は
  `[{at:2000,no:5},{at:1000,no:5}]` を返す（`migrateHistory()` は重複をまとめない）。
- TODO-022 より前の古いデータが混ざったときだけ起き、前の `removeHistory()` にも同じ性質があった。実害は未確認。
  ブリーフにある「同じ日時の履歴が 2 件あるとき」は、番号で指すので影響しない。

### 8. テストの強さ
- 足したテストは 8 件とも Node で通る。壊して落ちるか:
  - `removeHistoryMany`: 最初の 1 件しか消さない／何も消さない／逆に残す → どれも落ちる
  - `clampSelection`: 0 未満を止めない → 落ちる、頁を詰めない → 落ちる、頁数の下限 1 を外す → 落ちる、
    **頁の下限 0（`Math.max(page, 0)`）を外す → 落ちない**（頁が負になる呼び方が無いので、テストより式を消すほうがよい。作り込みすぎの節）
- 履歴・`found`・`auto` を一緒に消す組み合わせ（2 の不具合がある場所）は records.js の中にあり、テストが無い。
  `storage.js` に 1 つの関数（例: 番号の配列を受け、3 つをまとめて消す）で置けば `tests.html` から確かめられる。

### 9. developer.md の「画面の用語」に新しい部品が無い
- 場所: `docs/developer.md:222-229`（記録の画面の呼び名）
- 問題: チェックボックス・全部選ぶ・ゴミ箱・下段が載っていない。UsersGuide は「チェックボックス」「全部選ぶ」「ゴミ箱」で書いているので、揃えるならその語で。

## 好みの範囲

- `records.js` の `createSelectAll()`: 「全部選ぶ」の文字は押しても反応しない（当たり判定は 32px の箱だけ）。

## 作り込みすぎ

- `src/storage.js:279-288`: delete/shrink。`removeHistory()` は src から呼ばれなくなった（tests.html だけ）。本体は `removeHistoryMany()` と同じ。消すか、`removeHistoryMany(boardKey, [no], solutions)` の 1 行にする。検討。
- `src/storage.js` の `clearHistory` / `clearFound` / `clearAuto`: src から呼ばれなくなった（tests.html だけ）。2 の判断で (a) を選べば使われるので、決めてから消すか残すかを選ぶ。検討。
- `records.js` の `toggleSelectAll()` と `refresh()`: 「番号を持つ件の番号」と「全部チェック済みか」を同じ式で 2 回組んでいる。1 つのメソッドにまとめれば 3 行ほど減る。好みの範囲。
- `src/logic.js` の `clampSelection()`: `Math.max(page, 0)` は負の頁で呼ばれることがないので要らない（8 の実測）。頁数の式も `pageCount()` と同じ。好みの範囲。
- `records.js` の `createList()`: `rowX` を `rowWidth` より前に長い式で組んでいる。`rowWidth` を先に出せば `rowX = rowLeft + CHECKBOX.size + CHECKBOX.gap + rowWidth / 2`。好みの範囲。

net: 12 行ほど減らせる。

## 問題なし（1 行ずつ）

- 消す対象の決め方: 解の番号の Set（`removeHistoryMany`）。1 件ずつ消していたとき（`removeHistory`）と同じく番号で指す。同じ日時の件は影響しない。
- 保存形式: 変わっていない（`removeHistory` と同じく、読んだ配列を filter して JSON で書く）。
- 最短時間: 前も今も消さない（`clearBest` はどちらも呼ばない）。
- 1 件ずつ消すときとの揃え方: 番号ごとに `removeFound` / `removeAuto` を呼んでいて、TODO-031 の扱いと同じ。
- 消したあとのページとチェック: チェックは `doTrash()` で空にする。全部消したら `clampSelection(0, …)` で `{0, 0}`、最後のページが空になったら 1 つ前へ詰める（実測）。
- チェックと行の押し分け: 別の `createButton`。`toggleRow()` は `selected` を触らず、`selectRow()` は `checked` を触らない。
- 盤の切り替え: `reload()` で `checked` を作り直す。ページ送り（`turnPage`）は `checked` を触らない。
- ゴミ箱が押せない状態: `setEnabled(false)` で面・枠・アイコンが無効の色になり、`ui.js` の `pointerup` が `container.enabled` を見て `onClick` を呼ばない。`confirmTrash()` にも件数 0 の防ぎがある。
- 確認の枠の件数: `this.checked.size` を出す（7 の場合だけ食い違う）。
- 古い部品の参照: `removeButton` / `clearButton` / `RECORDS_LAYOUT` / `LAYOUTS_BY_VARIANT` は src・tools・tests.html に残っていない（文書とコメントは 3）。書きかけのコードは見当たらない。
- 規約: `confirm()` / `alert()` / `setTimeout` は使っていない。状態（`checked`）はシーンのプロパティ。色は `COLORS` / `TEXT_COLORS` から取る。
- 範囲: `tools/capture.mjs` の変更は records.png の撮り直しに要る分だけ。
