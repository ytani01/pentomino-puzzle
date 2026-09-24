# TODO-073 implementer の報告

## 変更したファイル

- `src/storage.js:684-718` — `progressFromRecord(entry, cells, board)` を追加（純関数）。
  完成形の文字列から 12 個とも盤に置いた遊びかけを作り、`sanitizeProgress()` を通して返す。
  `ms` はその回の経過時間、`usedAuto` / `usedHint` は `a` / `h`、`solved` は `[entry.no]`。
  形が合わなければ `null`
- `src/scenes/game.js:47-59` — `init()` が `data.progress` を受ける。渡されたら保存された
  遊びかけではなくその盤面から始める（`resuming` も真にする）
- `src/scenes/game.js:138` — `applyProgress(this.startProgress || loadProgress(...))`
- `src/scenes/records.js`
  - `:64-98` 配置 `L` に `continueY` を足し、完成形の枠 `boardBox` の高さを詰めた
    （縦 300→250、横 320→280。横は `detailY` を 500→455）。一覧の行数・下段は変えていない
  - `:101-107` `CONTINUE_BUTTON`（220×40）
  - `:326-330` 「この回を続ける」のボタン（`this.continueButton`）
  - `:465-503` `confirmContinue()` / `continueProgress()` / `doContinue()`。遊びかけが
    あれば既存の確認の枠（ゴミ箱と同じ `showConfirm()`）で
    「6×10 の遊びかけの盤面が消えます / この回を続けますか？」を出す。はいで
    `saveProgress()` → `registry` の盤を見ている盤へ切り替え → `scene.start('Game', { progress })`
  - `:613-614` `refresh()` で、記録が無ければボタンを隠し、完成形を引けない間（データ待ち）は押せなくする
- `tests.html:64, 2857-2890` — `progressFromRecord` のテスト 3 件 × 2 盤（完成形どおりに並ぶ・
  時計と印と `solved` を持ち越す・形が合わなければ `null`）
- `tools/capture.mjs:249-254` — 完成形の吹き出し E の位置を新しい寸法に合わせ（`-309`、280×280）、
  G「この回を続ける」を足した（`side: 'right'`）
- `archives/agents/TODO-073/check.mjs` — 実測のスクリプト（1 本）

## 検証

`python3 -m http.server 8765` 経由、Playwright（`~/.npm/_npx/6bcb61ec6d5aea22/.../playwright`）。

- `tests.html`（新しいコンテキスト）: **396 件すべて通った**（終了コード 0）
- 壊すと落ちるか（`storage.js` を書き換えて tests.html を走らせ、戻した）:
  - `usedHint` を `a` から取る → 2 件失敗
  - `usedAuto` を `h` から取る → 2 件失敗
  - `solved: []` → 2 件失敗
  - 行と列の取り方を入れ替える → 3 件失敗
  - `c - col` を `c` にする変更は落ちない。`sanitizeProgress()` が `normalize()` し直すので結果が同じ（害なし）
- `check.mjs`（844×390、各 1 回。6×10 に「ヒント・05:00・5 番」の記録 1 件を入れて）:
  - 遊びかけ無し → 続ける: 確認なしで本編。`board 6x10, left 0, elapsed 300467, usedAuto false,
    usedHint true, solved [5], clearActive false`（1.5 秒待ってもクリア表示は出ない）
  - 全部トレイへ戻し（ドラッグで 10 個、残り 2 個はおまかせが埋めた）、おまかせで完成 →
    HUD「新しい解（8 番）」、履歴は 2 件（8 番 `a,h`・320002ms と、元の 5 番）
  - 遊びかけあり → 続ける: 確認が出る。いいえ → 記録画面のまま、ダイアログは閉じ、遊びかけは同じ文字列のまま
  - もう一度 → はい → 本編、`elapsed 301178, solved [5], left 0`（置き換わった）
  - コンソールのエラー 0 件
- 390×844 でも同じスクリプトが同じ結果。配置（内部座標）:
  - 横: 見出し 430-480、ボタン 490-530、達成度 546-566、下段 588-612
  - 縦: 完成形 730-980、ボタン 988-1028、達成度 1045-1065、下段 1088-1112
  - 重なりは無い。キャプチャは `~/tmp/playwright-mcp/todo073-records-844x390.png`・`-390x844.png`

## 決めたこと・依頼と違えた点

- **ボタンの寸法を `config.js` ではなく `records.js` に置いた。** この画面の配置（`L`・`ROW`・
  `CHECKBOX` など）は元から `records.js` にあり、それに揃えた。確認の枠は既存の
  `CONFIRM`（`LAYOUTS[...].confirm`）をそのまま使っている。`config.js` へ移すべきなら指示を
- **完成形の枠を小さくした**（8×8 の縮小図が横 40→35px/マス、縦 37→31px/マス）。一覧の行数（TODO-071 で
  利用者が選んだ配置）を減らさずに入れるため。行数を 1 行減らして完成形の大きさを保つ案もある
- **続けるときに `registry` の盤を、記録画面で見ている盤へ切り替える。** 本編は `registry` の盤で
  始まるため。以後タイトルに戻ると、その盤が選ばれている
- `progress` を本編へ直接も渡す（localStorage が使えない環境でも始められるように）。遊びかけは
  押した時点で `saveProgress()` で置き換える
- 始めた回の番号を `solved` に入れた。盤を変えずに続けても `checkSolved()` は呼ばれないので、
  完成と見なされない（実測でクリア表示は出なかった）

## 文書で直すべき箇所（docs 担当）

- `docs/UsersGuide.md` 113-135 行の記録の画面: G「この回を続ける」の説明（時計・印を引き継ぐ、
  遊びかけがあれば確認、盤もその盤に切り替わる）。「つづきから」の節にも、記録から続けると
  遊びかけが置き換わることを
- `docs/developer.md` のシーンの移り方: Records → Game（`{ progress }`）を足す
- `CLAUDE.md` のファイル構成の `records.js` の行（「選んだ回から続ける（TODO-073）」など）

## 範囲外で気づいたこと

- **`tools/capture.mjs:237` が `s.addHistory(...)` を呼んでいるが、`storage.js` にもう無い**
  （TODO-072 で `recordClear()` に置き換わった模様）。このままでは記録画面の撮り直しが失敗する。
  `s.recordClear('8x8', {...})` に替えれば動くはず（未確認）。直していない
- 吹き出し G は `side: 'right'` にしたが、撮った画像では確かめていない（撮り直しは main）

## 追記（main の追加依頼: capture.mjs）

- `tools/capture.mjs:237` — `s.addHistory('8x8', …)` を `s.recordClear('8x8', …)` に替えた
- `tools/capture.mjs:254` — 吹き出しを足した: **`G`「この回を続ける」**（`s.continueButton` を指す。`side: 'left', dist: 16`）。
  右に置くと画面の端に寄せられてボタンの右端にかぶったので、左へ出した。
  E（完成形）の位置も新しい寸法に合わせた（`detailText.y - 309`、280×280）
- 冒頭の手順（`PLAYWRIGHT=$(dirname …1.63.0…)/index.mjs node tools/capture.mjs`）で撮った。終了コード 0
- `docs/images/records.png`: 吹き出し A〜G・1〜4 が部品を隠していないことを画像で確かめた
  （G はボタンの左の空いたところ、F は達成度の右）
- ほかに変わった `game.png`・`play.png`・`demo.png`・`demo.gif` は `git checkout` で戻した。今回の変更は
  本編の `init()` に `progress` の受け取りを足しただけで、撮影では通らない。差分はランダムな置き方によるものと判断した
  （画像どうしは突き合わせていない）。`title.png` は変わっていない
- docs 担当への申し送り: `docs/UsersGuide.md` の記録の画面の一覧に **Ⓖ この回を続ける** を足す（Ⓕ 達成度のあと）

## 追記（レビューの指摘の直し）

- 要修正 1: `src/scenes/title.js:262-265` の `はじめる` を `this.scene.start('Game', { resume: false })` にした。
  `rg -n "scene.start\('Game'" src/` で、ほかに引数なしの呼び出しは無い（`つづきから` は `{ resume: true }`、
  記録画面は `{ progress }`。クリアの「もう一度」は `leaveTo('Game', { resume: false })`、やり直しは
  `restart({ resume: false })` で、元から明示している）。`game.js:47-51` の注記も、Game を始める呼び出しはどれも引数を明示する形に直した
- 検討 2: `src/storage.js` の `progressFromRecord()` の JSDoc を直した（`solved` は、そのプレーで作った解として持ち越す。
  完成と見なさないのは本編が始めるときに `checkSolved()` を呼ばないため）
- 検討 3: `src/config.js:79-81`（`BOARD_REGISTRY_KEY`）と `src/scenes/game.js:62-64` に、記録画面の「この回を続ける」も registry を書くことを足した
- 検討 4: `src/scenes/records.js` の `createConfirmDialog()` の JSDoc を「確かめてから進める操作（消す・この回を続ける）の確認」にした
- 作り込みすぎ: `progressFromRecord()` の、同じ文字のマスを集める処理を `solutions.js` の `placementIn()` に置き換えた
  （import に足した）。欠けたピースは `null` を展開して `name` の無い件になり、`sanitizeProgress()` が `null` を返す

### 検証（`check.mjs` に 6・7 を足した。844×390、各 1 回）

- `tests.html`（新しいコンテキスト）: 396 件すべて通った
- 6. この回を続ける → タイトル → はじめる: `left 12, elapsed 345, solved [], data {resume:false}`（まっさら）
- 7. つづきから（`left 11` で再開を確かめた）→ タイトル → はじめる: `left 12, elapsed 363, solved [], data {resume:false}`（まっさら）
- 2〜5 も前と同じ結果（3 は新しい解 1511 番が履歴に足された）。コンソールのエラー 0 件
- `check.mjs` の 3 は、トレイの中央へ落とすと 2 個戻らないことがあったので、トレイの右下へ落とすように直した（前回の「10 個」はこのため）
