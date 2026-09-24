# TODO-072 reviewer の報告

対象: `git diff`（未コミット。src/・tests.html・docs/・CLAUDE.md）。
実測のスクリプトは scratchpad の `rv-hint.mjs`・`rv-resume.mjs`（一時置き場。
`check.mjs` と同じく `PLAYWRIGHT=… node` で動かす。8765 のサーバ、横 960×640）。

## 要修正

### 1. ヒント表示が入のまま「続ける」と、ピースを外せず、クリア表示が出直す

- 場所: `src/scenes/game.js:1301-1319`（`refreshHud()` の `fillForced()` → `checkSolved()`）、`:1340`（`checkSolved()`）
- 問題: 完成した盤から 1 個外すと、盤に残る穴はそのピースの形そのものなので、
  TODO-044 の自動で置く手（`forcedPlacements()`）がすぐ埋め戻し、`filled` で
  `checkSolved()` が走る。同じ解の「記録済み」になり、700ms 後にクリア表示と
  ファンファーレがもう一度出る。ヒント表示を切るまで、完成した盤を変えられない。
  TODO-072 の目的（ピースを入れ替えて別の解を作る）がこの条件では果たせない
- 根拠（実測）: おまかせ 12 回で完成 → `continueGame()` → `toggleHint()` → 盤の
  F を実際のマウスでドラッグして盤の外で離す
  - ヒント切: `left: 1`・HUD の知らせは消える・Clear は出ない（期待どおり）
  - ヒント入: `left: 0`・`playing: false`・HUD「記録済み（4 番）」・その後
    Clear が active（status 6 で Game は paused）
- 文書との食い違い: `docs/UsersGuide.md:86-88`「ピースを外して盤が埋まって
  いない状態になると消える」が、ヒント入では成り立たない
- 一手戻す（`undo()`）で外した場合に同じことが起きるかは未確認
- 直し方は管理者の判断（完成した盤から外した直後は埋めない、など。境界線上の
  判断なので、ここでは挙げるだけ）

### 2. `addHistory()` がアプリから使われなくなり、JSDoc とテストが古い仕様を述べている

- 場所: `src/storage.js:290-329`（`addHistory()` と JSDoc）、`:331-339`
  （`removeHistory()` の JSDoc「履歴は同じ番号を 2 件持たない（`addHistory()`）」）、
  `:273`（`recordClear()` の JSDoc「`addHistory()` と同じく」）
- 問題: `addHistory()` の JSDoc は「既にある件を書き換えない」「印を外すときだけ
  日時と時間を残す」と書くが、今の決めごと（`recordClear()`: 成績がよければ
  日時・経過時間・印ごと置き換える）と逆。番号が 1 件に定まる理由も、今は
  `recordClear()` と `dedupeHistory()` が担う。規約「JSDoc には『なぜ』を書く」の
  中身が現状と食い違っている
- `tests.html:3084`「印の付いた解を自力で解き直すと、印だけ外れる」・`:3097`
  「また頼って解いても印が増えない・減らない」は、アプリがもう行わない挙動を
  確かめている（`recordClear()` なら前者は日時も置き換わり、後者は短ければ印が
  入れ替わる）。テストが通っても、今の動きの保証にならない
- どうすればよいか（推奨）: `addHistory()` を消す。`tests.html` の下ごしらえで
  使っている呼び出し（`removeHistory`・`removeHistoryMany`・`removeRecords` の
  テストなど）は、番号が重ならないので `recordClear()` にそのまま置き換えられる。
  `:2970` の 50 件で切るテストは `recordClear()` 向けに移す（今は `recordClear()`
  が `HISTORY_LIMIT` を守ることを確かめるテストが無い）。`:2986`・`:3069-3114`
  の TODO-021/024 の決めごとのテストは、`recordClear()` の節と重なるか古いので
  消す。残すなら、少なくとも上の JSDoc 3 か所を直す

## 検討

### 3. 「見つけた解に足す」「最短時間は自力の回だけ」を `storage.js` へ寄せるか（追加の観点）

- 場所: `src/scenes/game.js:1380-1396`（`recordSolved()`）
- 見立て: この組み合わせは Phaser に依存しない（`this.usedAuto`・`this.usedHint`・
  `this.elapsed`・`this.solutions` を読むだけ）。TODO-072 より前は `clear.js` に
  同じ形であり、そのときもテストは無かったので、今回テストが減ったわけではない。
  ただし今回から**完成のたびに**（続けて作った解でも）通る道になり、呼ばれる
  回数が増えた
- どうすればよいか: `storage.js` に 1 つ（例: `recordSolve(boardKey, { at, ms, no,
  usedAuto, usedHint }, solutions)` → `{ best, updated, status }`）へまとめれば、
  行数はほぼ変わらず、「頼った回は最短に入れないが履歴と見つけた解には残す」
  （TODO-020・TODO-024）と「番号が無ければ何も残さない」を `tests.html` で
  2〜3 件で押さえられる。`this.avoidNumbers.add(no)` だけは本編に残る。
  置いたままでも規約違反ではない（規約が `logic.js`・`solutions.js` に置けと
  言うのは「計算」で、これは保存の手順）。判断は管理者

### 4. 幕の色と濃さの直書き

- 場所: `src/scenes/clear.js:84`（`0x000000`）、`:57`（`BACKDROP_ALPHA = 0.55`）
- 問題: 規約「数値と色は `src/config.js` に集約する」に反する。ただし同じ幕が
  既に `src/scenes/game.js:377` と `src/scenes/records.js:340` に `0x000000, 0.55`
  で直書きされており、今回はそれに揃えている
- どうすればよいか: 今回の 1 か所だけ `config.js` へ移すと 3 か所の書き方が
  割れる。3 か所まとめて `config.js`（例: `COLORS.backdrop`・`backdropAlpha`）へ
  移す別項目にするのが揃う。今回の分だけ直すかは管理者の判断

### 5. `RECORD_STATUS` を `game.js` から `clear.js` が import している

- 場所: `src/scenes/game.js:1419-1423`、`src/scenes/clear.js:19`
- 問題: シーンがシーンの module を読む形はここだけ（他のシーンは `config.js`・
  `storage.js`・`ui.js` を共有する）。値は `recordClear()` の戻り値に 1 対 1 で
  付く文言なので、置き場所として `game.js` は遠い
- どうすればよいか: `recordClear()` の隣（`storage.js`）か `config.js` へ移す。
  実害は無い（循環 import にはなっていない）

### 6. 範囲: `CLAUDE.md` の `records.js` の行の書き換え

- 場所: `CLAUDE.md` のファイル構成の表、`src/scenes/records.js` の行
  （「1 件だけ消す（TODO-031）」→「チェックした回をまとめて消す（TODO-031・TODO-071）」）
- 問題: TODO-072 の変更ではない（TODO-071 で直し漏れた分）。docs の報告にも
  書かれていない。中身は今の動きに合っている
- どうすればよいか: 残すなら決着のコミットの本文に一言添える

## 好みの範囲

- `src/storage.js:212-218` `loadHistory()` の JSDoc に、読むたびに同じ番号を
  まとめる（`dedupeHistory()`）ことが書かれていない（`dedupeHistory()` 側には
  ある）

## 作り込みすぎ

- `src/storage.js:290-329`: delete: `addHistory()`。アプリから呼ばれず、
  `recordClear()` が置き換えた。テストの下ごしらえは `recordClear()` で足りる
  （要修正 2 と同じ。約 -40 行、tests.html の古い決めごとのテストで約 -50 行）
- `src/scenes/clear.js:84-85`: delete: 幕の `.setInteractive()`。本編は
  `pause()` 中で入力を受けない（Phaser は paused のシーンに入力を配らない）と
  コメント自身が書いている「念のため」。好みの範囲、害は無い
- `solvedNumbers`（遊びかけの `solved`）は保存・復元・重なりの判定にしか使われず、
  画面に出す所も読む所も無い。仕様（チェックボックス 7）が求めているので実装と
  しては正しい。TODO-073 以降でも読まないなら、仕様ごと見直す余地がある（検討・低）

net: -90 lines possible（主に `addHistory()` とその古いテスト）

## 問題が無かった観点（1 行ずつ）

- 記録の分け方: `recordClear()` の new／improved／kept と、上書きした件を先頭へ移す
  処理は仕様どおり。`isBetterClear()` の「印の有無だけを見る」は
  `shouldRecordBest()` と同じ区切りで筋が通る（仕様「印が同じかよいとき」の読みとして妥当）
- 前の形の読み込み: 同じ解が複数ある履歴は `loadHistory()` でまとまり、`solved` の
  無い遊びかけは空の配列で読む（tests の壊し方の表で落ちることを確認済み）
- 時計: `update()` は `playing` と `pause()` の両方で止まる。完成から pause までの
  700ms も `playing` が偽なので数えない。`continuePlay()` は `checkSolved()` を
  呼ばないので、盤を変えずに「続ける」を押しても完成と見なさない（check.mjs の 2）
- 外して同じ所へ置き直した場合: `dropDrag()` → `checkSolved()` で「記録済み」に
  なり、クリア表示が出直す。implementer の決めたとおり（ヒント切のとき）
- 重ねたクリア表示の間の入力: Game は paused（status 6）で、Phaser は paused の
  シーンに入力を配らない。TODO-069 のドラッグ中の向きの変更も `this.drag` が
  無いと何もしない。ドラッグの開始は `playing` が偽なので 700ms の間も弾かれる
- 抜けたあと: 「タイトルへ」で抜けると Game・Clear とも status 8（shutdown）で、
  止まったシーンは残らない（実測 `rv-resume.mjs`）
- つづきから: 完成した盤面（`solved: [47]`・盤上 12 個）を再開して 3 秒待っても
  Clear は出ず、`playing: true`・HUD の知らせは空（実測）
- `DemoScene`: `create`・`createHud`・`refreshHud` を自前で持ち、`checkSolved`・
  `persist`・`recordText` を通らない（静的に確認。画面では見ていない）
- `setTimeout`・`setInterval`・`confirm()`・`alert()`・`prompt()`: 差分に無い
- テスト: 追加 28 件は tests の壊し方の表で各分岐が落ちることが示されている。
  足りないのは要修正 2 の `HISTORY_LIMIT` と、検討 3 の本編側の判定
- 文書: UsersGuide・developer.md の記述は今の動きと合う（要修正 1 の
  ヒント入のときを除く）。developer.md の図と「いつ書き込まれるか」の表も差分と一致
