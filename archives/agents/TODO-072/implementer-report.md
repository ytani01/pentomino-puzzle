# TODO-072 implementer の報告

## 変更したファイルと箇所

- `src/storage.js`
  - `:219` `loadHistory()` が読み替えのあとに `dedupeHistory()` を通す
  - `:237` `isBetterClear(entry, other)`（新規・export）
  - `:253` `dedupeHistory(entries)`（新規・export・純関数）
  - `:276` `recordClear(boardKey, entry, solutions)`（新規・export）
  - `:588` 付近 `sanitizeProgress()`: 12 個とも盤に載った盤面を捨てるのをやめた。`solved` を足した（`:637`）。JSDoc も合わせた
  - `:88` `shouldRecordBest()` の JSDoc（呼ぶ側に game.js を足した）、`clearProgress()` の JSDoc（「解き切ったとき」を外した）
- `src/scenes/game.js`
  - `:24` import に `addFound`・`loadBest`・`recordClear`・`saveBest`・`shouldRecordBest`
  - `:83` `this.solvedNumbers = []`（このプレーで完成させた解の番号）
  - `:299` HUD の `this.recordText`（解の有無の札と同じ位置）
  - `:1082` `persist()` が `solved` も保存。JSDoc を直した
  - `:1126` `applyProgress()` が `solved` を戻す
  - `:1311` `refreshHud()`: 残りが 1 以上になったら HUD の知らせを消す
  - `:1340` `checkSolved()` を書き換え。`:1379` `recordSolved()`・`:1398` `showRecordStatus()`・`:1411` `continuePlay()`（新規）
  - `:1419` `RECORD_STATUS`（文言。clear.js と共用）
- `src/scenes/clear.js`: 記録の更新をやめて表示だけにした。重ねて出す幕（`:56`）、行を 1 つ足した（`:42`。`status`）、ボタンを 4 つに（`:168`）、`continueGame()`（`:197`）・`leaveTo()`（`:207`）。背景色と版の表示はやめた（下の本編のものが見える）
- `archives/agents/TODO-072/check.mjs`（新規）: 実測のスクリプト。使い方は冒頭のコメント

## 決めたこと

1. **重ね方**: `ClearScene` を残し、本編は `scene.pause()`、Clear は `scene.launch()` にした。今のクリア表示をそのまま使えるうえ、pause で時計（`update`）・入力・Tween・delayedCall がまとめて止まり、本編の中に止める処理を足さずに済むため。
   - 続ける: `GameScene.continuePlay()`（`resume()`・`playing = true`・一手戻すのボタンを戻す）→ Clear を stop
   - もう一度: `clearProgress()` → Game を stop → `start('Game', { resume: false })`（前と同じく新しく始める。遊びかけは捨てる）
   - 記録・タイトルへ: Game を stop → そのシーンへ。完成した盤面は遊びかけとして残るので、つづきから続きを遊べる
   - 記録の更新は、完成を見つけたときに本編（`recordSolved()`）で行う（続けて作った解も同じ処理を通すため）。Clear は結果を `init(data)` で受けて出すだけ
2. **`recordClear(boardKey, entry, solutions = null)`**
   - 引数: `entry` は `{ at, ms, no, a?, h? }`（`a`/`h` は真のときだけ）。`solutions` は書き戻しで古い `cells` の件を番号へ揃えるため
   - 返り値: `'new'`（その番号が履歴に無い → 先頭へ足して保存）／`'improved'`（履歴の件より成績がよい → その件を外し、今回の件を先頭へ足して保存。日時・経過時間・印が今回のものになる）／`'kept'`（履歴の件がよいか同じ → 何も書かない）
   - 上書きした件を**先頭へ移す**のは、履歴を日時の新しい順に保つため
   - `addFound()` は含めない。本編が別に毎回呼ぶ（既にあれば何もしない）
   - 最短時間（`saveBest()`）は今までどおり自力の回だけ、累計の経過時間で比べる
3. **成績の比べ方 `isBetterClear(entry, other)`**: 印（`a` か `h`）の**有無**だけを見て、無いほうを先に立てる。有無が同じなら `ms` の短いほうがよい。同じなら偽。**`a` だけと `h` だけ、片方と両方は区別しない**（`shouldRecordBest()` と同じ「自力か否か」の区切り）。仕様の「印が同じかよいとき」をこう読んだ。違えば直す。
4. **同じ解が複数ある履歴のまとめ方**: `loadHistory()` で読むたびに `dedupeHistory()` を通す。番号ごとに成績が一番よい件を残し（同じなら新しい順で先の件）、残した件は元の位置のまま。**読むときには保存し直さない**。次に書く操作（`recordClear()`・`removeHistory()`・`removeHistoryMany()`・`addHistory()`）が `loadHistory()` から読んだ形を書くので、そこで保存される。番号の無い古い `cells` の件は通す（`solutions` を渡して読み替えた後はまとまる）。
5. **HUD の知らせ**: 「新しい解（N 番）」「記録を更新（N 番）」「記録済み（N 番）」。「記録済み」だけ薄い色。出すのは**盤が完成でなくなるまで**（`refreshHud()` で残りが 1 以上になったら消す。完成した盤から変えられるのは外す手だけなので、これで足りる）。つづきから再開したときは出さない（知らせは保存していない）。
6. **遊びかけ**: 完成しても消さず、`checkSolved()` で `playing` を偽にする前に `persist()` で控える。形は `solved`（番号の配列）を足しただけ。前の形（`solved` 無し）は空の配列として読む。`solved` は正の整数だけ・重なりを落とす（総数はここで分からないので上限は見ない）。
7. 「続ける」を押しただけでは完成と見なさない: `continuePlay()` は `checkSolved()` を呼ばない。次に盤を変えたときに呼ばれる。外して同じ所へ置き直すと、同じ解ができたとして記録を見る（多くは「記録済み」）。
8. おまかせで避ける番号（`avoidNumbers`）に、完成した解の番号をその場で足すようにした（続けて遊ぶと `create()` を通らず、前は読み直していたものが古くなるため）。

## 依頼と違えた点

- **文書（`docs/UsersGuide.md`・`docs/developer.md`）は触っていない。** 依頼の 8 にあるが、implementer の定義に「文書を触らない（管理者と wording の担当）」とあるため。直す所の見当:
  - UsersGuide.md:71-80（クリアと番号・つづきから。完成後に続ける、完成した盤面もつづきからに残る）
  - developer.md:146-166（シーンの移り方の図。Game → Clear は launch で重ね、Clear → Game は「続ける」で resume）
  - developer.md:336-369（遊びかけの形に `solved`、完成形を捨てる記述が古い）
  - developer.md:404-427（記録を書く所が Clear から Game の `recordSolved()` へ。`addHistory()` → `recordClear()`、完成で `clearProgress()` しなくなった）
- `addHistory()` は**アプリから呼ばれなくなった**が消していない（`tests.html` が多数使っているため）。消すか、テストを `recordClear()` へ移すかは管理者と tests 担当の判断。`storage.js:108-133`・`:229-245` の履歴の説明（「既にある件を書き換えない」）も古くなっている。

## 検証

`python3 -m http.server 8765` を立て、`PLAYWRIGHT=<npx の playwright>/index.mjs node archives/agents/TODO-072/check.mjs` を実行（終了コード 0。ページのエラーは 0 件）。

- `tests.html`（新しいコンテキスト）: **362 件通過・2 件失敗**
  - 「12 個とも盤に載っていたら捨てる（8×8）」「同（6×10）」: 期待 null。今回、完成した盤面を遊びかけとして通すようにした（依頼の 6）ので、仕様どおりの変化。テストを直すのは tests 担当
- 本編（8×8・横 960×640）:
  1. おまかせ 12 回で完成 → Game は paused（status 6）、Clear が重なる。表示「正解の 6 番」「新しい解」、HUD「新しい解（6 番）」、履歴 1 件（`no: 6, a: true`）、found `[6]`、遊びかけ `solved: [6]`・盤上 12 個
  2. 「続ける」を実際にクリック → Clear は閉じ、Game は running（status 5）、`playing: true`、1 秒で経過時間が 317ms 進んだ（headless でフレームが間引かれるため実時間より遅い）。盤は完成のまま、Clear は再び出ない、HUD の知らせは残る
  3. 一手戻す 10 回（HUD の知らせが消えた）→ おまかせ 10 回で**別の解 62 番** → 「新しい解」、履歴 2 件（62 が先頭）、found `[6, 62]`、`solved: [6, 62]`
  4. 「続ける」→ 一手戻す 1 回 → おまかせ 1 回で同じ 62 番 → 「記録済み」（印が同じで時間が長いため）、履歴は 2 件のまま変わらない
- 縦画面（390×844）でもクリア表示の 4 つのボタンと 5 行が枠に収まることを画面で確かめた（撮っただけで、ファイルは残していない）

## 確かめていないこと・懸念

- `'improved'` は実画面では通していない（累計時間なので、同じプレーの中では印が減らない限り起きない）。関数のテストで確かめる必要がある
- 完成の直後 700ms の間（Clear が出る前）に「やり直し」「タイトルへ」を押せるのは前と同じ。やり直しは遊びかけを捨てるので、完成した盤面は残らない（記録は完成の時点で済んでいる）
- つづきから完成した盤面を再開すると、時計は動き、HUD の知らせは出ない。盤を変えて完成させると再び記録を見る
- 幕の色 `0x000000` は本編の確認ダイアログと同じく直書き（`config.js` に置いていない既存の書き方に合わせた）。規約に厳密に合わせるなら `COLORS` へ移すかは管理者の判断

---

# レビュー指摘の修正（2 回目）

## 変更したファイルと箇所

- **要修正 1（ヒント表示の自動配置）** `src/scenes/game.js`
  - `:1308` `refreshHud(fill = false)`: `fill` が真のときだけ `fillForced()` を呼ぶ。外したピースが同じ盤へ埋め戻されたときに控えを捨てていた処理（`history.pop()`）は、もう起きないので消した
  - `refreshHud(true)` で呼ぶのは `:920`（手で置いた）・`:1164`（おまかせ）・`:1183`（ヒント表示を入にした）の 3 か所だけ。外す・一手戻す・向きを変える・データが届いたときは埋めない
  - `undo()` の JSDoc（戻したあとに埋め戻されるという記述）を今の動きに直した
  - 文書: `docs/UsersGuide.md`（ヒント表示の段落。表の行は「解けるかを出す」だけで自動配置に触れていないので、そのままにした）、`docs/developer.md`（用語表の「ヒント表示」の行）
- **要修正 2（`addHistory()`）** `src/storage.js`: `addHistory()` を消した。`recordClear()` の JSDoc（50 件で切ること・`solutions` を渡す理由）と `removeHistory()` の JSDoc（番号で 1 件に決まる理由）を直した。好みの範囲の指摘に合わせ、`loadHistory()` の JSDoc（`:218`）にも「読むたびに 1 件にまとめる」を書き足した
  - `tests.html`: import から `addHistory` を外し、呼び出しをすべて `recordClear()` に置き換えた。古い決めごとのテストを 4 件消した（「同じ番号の解は既出として足されない」「印の付いた解を自力で解き直すと、印だけ外れる」「印の付いた件は、また頼って解いても印が増えない・減らない」「自力で解いた件は、あとで頼って解いても印が付かない」。どれも recordClear の節の 'kept'・'improved' のテストと重なるか、今の決めごとと合わない）
  - 50 件で切るテスト（`:2970`）は `recordClear` のテストへ移し、**保存した件数**も確かめるようにした（`:2985`）。読むときも 50 件で切るので、読んだ件数だけを見ていると、書くときに切らなくなっても落ちないため
- **検討 3（記録の手順を storage へ）** `src/storage.js:315` に `recordCompletion(boardKey, { at, ms, no, usedAuto, usedHint }, solutions)` → `{ best, updated, status }` を置いた。自力の回だけ `saveBest()` し、頼った回は `{ best: loadBest(), updated: false }` を返す。番号か `solutions` が無ければ `status: null` で、履歴にも見つけた解にも残さない。あれば `recordClear()`（印は使ったときだけ付ける）と `addFound()` を呼ぶ。`game.js:1383` の `recordSolved()` はこれを呼んで `avoidNumbers` に足すだけになった
  - `tests.html` にテストを 3 件足した（`:3288`・`:3301`・`:3315`。8×8・6×10 でそれぞれ走るので 6 件）
  - `docs/developer.md`: 「いつ書き込まれるか」の表・図と履歴の段落を `recordCompletion()` に合わせた
- **検討 4（幕の色）** `src/config.js:209` に `BACKDROP = { color, alpha }` を置き、`clear.js:80`・`game.js:378`・`records.js:340` の 3 か所で使う
- **検討 5（`RECORD_STATUS`）** `src/storage.js:295` へ移した（`recordClear()` の返り値ごとの文言なので）。シーンがシーンを import する箇所は無くなった
- 作り込みすぎの指摘に合わせ、クリア表示の幕の `.setInteractive()` を消した（本編は pause 中で入力を受けないため）

## 直さなかったもの

- 検討 6（`CLAUDE.md` の records.js の行）: implementer が変えた箇所ではない。コミットの本文に添えるかは管理者の判断
- `solvedNumbers`（遊びかけの `solved`）: 仕様のチェックボックスにあるので残した
- **ヒント表示を入にした瞬間**は、今までどおり自動で置く（TODO-044 の「入にした時点で埋める」）。利用者の指示を「置いたときだけ」と文字どおり読むなら、入にしたときも置かないことになる。その場合は `toggleHint()` の `refreshHud(true)` を `refreshHud()` にするだけ（1 行）。**判断が要る**

## 検証

- `node archives/agents/TODO-072/mutate-fix.mjs <一時ディレクトリ>`（`storage.js` を壊したコピーに対し、足したテストと同じ判定を Node で走らせる。終了コード 0）。壊し方ごとの落ちた件数:
  - 壊さない: 0 件
  - 頼った回でも最短時間を更新する: 1 件（頼った回）
  - `addFound()` を呼ばない: 2 件（自力の回・頼った回）
  - 印を付けない: 1 件（頼った回）
  - 番号の無い回も残す: 1 件（番号が無い）
  - `recordClear()` が 50 件で切らない: 1 件（50 件。保存した件数を見る判定で落ちる）
- `tests.html`（Playwright の新しいコンテキスト。`check.mjs` の中で開く）: **390 件すべて通った**
- `check.mjs`（終了コード 0、pageerror 0 件）。別の解を必ず作れるよう、手順 3 を「一手戻す 12 回（空の盤まで）・おまかせ 12 回」に変えた（10 回では同じ解に戻ることがあった）
  1. 完成 → 「新しい解（4 番）」、履歴 1 件、`solved: [4]`
  2. 続ける → `playing: true`、Clear が閉じ、HUD の知らせは残る
  3. 別の解 → 「新しい解（5 番）」、履歴 2 件（5 が先頭）、`solved: [4, 5]`
  4. 同じ解を作り直す → 「記録済み（5 番）」、履歴は変わらない
  5. **ヒント表示を入にして続ける → F を実際のマウスで盤からトレイへドラッグ → 1 秒後に `left: 1`・`playing: true`・Clear は出ない・HUD の知らせは消えた**
  6. おまかせ 1 回で完成 → 続ける → 一手戻す 1 回 → 1 秒後に `left: 1`・Clear は出ない（一手戻しても埋め戻されない）

## 残る懸念

- ヒント表示を入にしたまま、置いたときに自動で置く動きは、実際の画面では確かめていない（変えたのは `fill` の渡し方だけで、`fillForced()` 自体には手を入れていない）

---

# クリア表示が後ろの本編と重なる件の修正（3 回目）

- `src/scenes/clear.js`: `FRAME_PAD`（`:59` 付近）を足した。COMPLETE・情報の枠・ボタンの 4 つをまとめて、塗りつぶした外枠 1 つ（`createPanel`）に載せる。外枠は COMPLETE の上端からボタンの下端までを余白 24 で囲む。幅は情報の枠（560）とボタン 4 つ（596）の広いほうに左右 24 を足した値だが、画面の余白（`SCREEN.margin`）の内側に収まるよう詰める（縦画面では 612 になり、ボタンの左右の余白は 8）
- 撮った画面（新しいコンテキストで 8×8 をおまかせで完成させ、クリア表示が出てから 300ms 後）:
  - `~/tmp/playwright-mcp/todo072-overlay-844x390.png`: 外枠は画面の縦に収まり（内部の座標で上端 56・下端 562、画面の高さ 640）、COMPLETE の後ろに HUD のボタンは透けていない。外枠の外の本編は幕で暗くなったまま見える
  - `~/tmp/playwright-mcp/todo072-overlay-390x844.png`: 外枠は画面の幅いっぱい（左右 14 の余白の内側）に収まり、はみ出していない。ボタン 4 つ・5 行とも外枠の内側にある
- `tests.html`（`check.mjs` の中で新しいコンテキストで開く）: 390 件すべて通った。`check.mjs` は終了コード 0（手順 5・6 の結果も前回と同じ）
- ボタンの数（4）を外枠の幅の計算に直接書いている。ボタンを増やすときは `BUTTONS` とこの計算の両方を直す
