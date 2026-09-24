# TODO-073 reviewer の報告

対象: `git diff`（`src/scenes/game.js`・`src/scenes/records.js`・`src/storage.js`・`tests.html`・`tools/capture.mjs`）。
文書と見た目は見ていない。実測は `python3 -m http.server 8765` 経由、Playwright（npx の置き場）で、
スクリプトは scratchpad に置いた（リポジトリには足していない）。

## 要修正（1 件）

### 1. `src/scenes/title.js:262` / `src/scenes/game.js:56-58` — 続けたあとにタイトルの `はじめる` を押すと、記録の盤面から始まる

- **問題:** `Title.start()` は `this.scene.start('Game')` を引数なしで呼ぶ。Phaser 3.90.0 の
  `Systems.start(data)` は `if (data) { settings.data = data; }` で、引数が無ければ**前回の
  `data` をそのまま `init()` へ渡す**（CDN の `phaser.js` 201382-201390 行で確認）。
  記録画面から `{ progress }` で始めたあとは、`はじめる` でも同じ `progress` が使われる。
- **実測（844×390、各 1 回）:** 6×10 に「5 番・05:00・ヒント」の記録を 1 件入れて
  - 続ける → タイトルへ → `はじめる`: `onBoard=12 elapsed=300117 solved=[5] data=["progress"]`。
    まっさらではなく、記録の完成形から始まった（時計も記録の値へ戻る）
  - 続ける → タイトルへ → 盤を **8×8** に切り替えて `はじめる`: `board=8x8 onBoard=12`、
    `board.grid` に 6×10 の解が 10 列ずつ詰め込まれ、穴の升（27・28 番目）にも `X`・`W` が入った。
    `applyProgress()` は `place()` を検証なしで呼ぶので、**壊れた盤面が出来る**
  - このあと `persist()` が `saveProgress('8x8', …)` を呼ぶと `sanitizeProgress()` が
    `null` を返して `clearProgress('8x8')` になり、8×8 の遊びかけが消えるはず（**実害は未確認**。
    8×8 に遊びかけを入れた状態では試していない）
- **元からある分:** 同じ仕組みで、`つづきから`（`{ resume: true }`）→ タイトルへ → `はじめる` も
  続きから始まる（実測 `data=["resume"] elapsed=301397`。TODO-030 からある）。こちらは選んでいる盤の
  遊びかけを読むだけなので盤面は壊れないが、原因と直す箇所は同じ。
- **どうすればよいか:** Game を始める呼び出しは、`restart()`（`game.js:1232`）と Clear の
  「もう一度」（`clear.js:185`）が既に `{ resume: false }` を明示している。`title.js:262` だけが
  渡していないので、そこも明示すれば両方直る。`game.js:49-50` の「`scene.restart()` は引数を明示して
  渡し直すので…」の注記を、Title の `はじめる` も含む形にしておくと再発しにくい。
  直したら、「続ける → タイトル → `はじめる` で 12 個ともトレイ、時計 0」を確認に加える。

## 検討（3 件）

### 2. `src/storage.js:692-693` — `solved` に入れる理由が実際の動きと違う

JSDoc は「その回の番号は `solved` に入れておき、続けた直後の盤を『新しく作った解』と見なさない」と
書いているが、`solvedNumbers` は `game.js` で push と保存（`persist()`）にしか使われていない
（`rg -n solved src/` で確認）。続けた直後に完成と見なされないのは、`create()` が `checkSolved()` を
呼ばないから（implementer の報告の最後の項目もそう書いている）。`solved: [entry.no]` 自体は
「このプレーで完成させた解」という意味に合うので入れておいてよいが、JSDoc の理由を
「その回で作った解として持ち越す」程度に直したほうがよい（規約「JSDoc には『なぜ』を書く」の
その「なぜ」が誤っている）。

### 3. `src/config.js:79-80`・`src/scenes/game.js:63-64` — registry を書くのはタイトルだけ、という注記が古くなった

- `config.js:80`「タイトルが書いて他のシーンが読む（TODO-009）」
- `game.js:63`「選び直せるのはタイトルだけなので」

`records.js:500` が `BOARD_REGISTRY_KEY` を書くようになったので、どちらも事実と合わない。
`docs/developer.md` は docs 担当が直している（差分にある）が、コード側の注記は残っている。
Records が Game を始めるのは Game が生きていないとき（Title か Clear から来る。Clear は
`leaveTo()` で Game を止めてから移る）なので、「シーンが生きている間は変わらない」という
`game.js` の結論は今も正しい。直すのは文言だけ。

設計として registry を切り替えること（implementer の決めたこと (2)）は妥当と見る。
本編は registry の盤で始まり、盤を `scene.start()` の引数で回さない理由が `config.js:82-83` に
書いてあるので、そこに沿っている。

### 4. `src/scenes/records.js:342-345` — 確認の枠の JSDoc が「消す前の確認」のまま

`showConfirm()` を「この回を続ける」でも使うようになったので、`createConfirmDialog()` の説明
「消す前の確認」は狭すぎる。「確かめてから進める操作（消す・続ける）の確認」くらいにする。

## 作り込みすぎ

- `src/storage.js:697-709`: shrink/stdlib 相当。同じマスを集めて左上を出す処理を手で書いているが、
  `solutions.js:127` に同じことをする `placementIn(cells, cols, name)` がある（`autoFrom()` と
  テストが使用）。`storage.js` は既に `solutions.js` から `solutionNumber` を import しているので
  循環も増えない。
  `const pieces = PIECES.map(({ name }) => ({ ...placementIn(cells, board.cols, name), location: 'board' }));`
  の 1 文で置き換えられる（欠けたピースは `placementIn()` が `null` → 空の object → `sanitizeProgress()` が
  `null` を返すので、形の合わない盤面のテストはそのまま通るはず。未確認）。重大度は**検討**。

net: -11 lines possible.

## 問題の無かった観点（1 行ずつ）

- 盤面の復元: `tests.html` を実行して 396 件すべて通った。8×8 は縦画面（390×844）で「3 番・02:03・おまかせ」から続けて
  `onBoard=12 elapsed=123183 usedAuto=true usedHint=false`、盤面の番号 3、クリア表示なし、HUD は空で、期待どおり
- 経過時間・印: 記録の `ms`・`a`・`h` をそのまま持ち越す（コードとテストで確認。上の 8×8 の実測も一致）
- 始めた直後に完成と見なさない: `create()` は `checkSolved()` を呼ばない。上の実測でクリア表示は出ていない
- 同じ解を作り直す: 時計は記録の `ms` から増えるだけで、印も持ち越すので、`isBetterClear()` は必ず偽になり `'kept'`（記録済み）になる。元の回の件は書き換わらない（コードを読んで確認。画面では試していない）
- 別の解を作る: `recordCompletion()` → `recordClear()` で、無ければ足し、あれば成績がよいときだけ上書き。仕様（TODO-072 の決めごと）どおり。続けた回の経過時間は元の回の `ms` から数えるので、別の番号の記録を「元の回の時間 + 入れ替えにかかった時間」で上書きすることはありうる。仕様の範囲と見るが、利用者が想定しているかは未確認
- 遊びかけがあるときの確認: 画面内の `showConfirm()` を使っていて、ネイティブダイアログは使っていない（規約どおり）。いいえで残る・はいで置き換わることは implementer の実測を読んだだけで、自分では試していない
- 置き換え: `saveProgress()` が上書きするので、前の遊びかけは残らない。保存できない環境でも `{ progress }` を直接渡すので始められる
- 盤を切り替えている途中: `reload()` が `solutions` を `null` にし、届いたデータの盤を確かめてから入れるので、別の盤の解から遊びかけを作ることは無い（`records.js:552-564`）
- ボタンの寸法を `records.js` に置いたこと（implementer の決めたこと (1)）: この画面の配置（`L`・`ROW_TEXT_WIDTH`・`CHECKBOX`・`FOOT_GAP`）は元から `records.js` にまとめてあり、それに揃えている。規約の文言とは食い違うが、今までの置き方と同じなので問題にしない。色は直接書いていない
- `tools/capture.mjs`: `addHistory()` は TODO-072 で無くなっていて、`recordClear()` への置き換えは正しい。入れる 5 件は番号が重ならないので、どれも `'new'` で先頭に足され、並び順は以前と同じ。E の座標（`-309`、280×280）は横画面の `detailY 455 − boardBox.y 146 = 309`、高さ 280 と合っている
- TODO-071・072: `tests.html` は全件通った。`refresh()` の既存の行（チェック・全部選ぶ・ゴミ箱）には手が入っていない。`restart()` と Clear の「もう一度」は `{ resume: false }` を明示しているので、`progress` が残っていても影響を受けない
- テストの強さ: 「壊すと落ちるか」は implementer が 4 通り試して落ちたと報告している（自分では試していない）。assert は `ms`・`usedAuto`・`usedHint`・`solved` と盤面の文字列を直接比べているので、どれかを壊せば落ちる形になっている。要修正 1 の Title → Game の経路は `tests.html` では確かめられない（Phaser が要る）
- 範囲: 差分は依頼の範囲内。`capture.mjs` の `addHistory` の直しは main の追加依頼による
- 規約: `setTimeout`・トップレベルの `let`・色を直接書くこと・`confirm()` のどれも使っていない。行長・インデントは周りに合っている
