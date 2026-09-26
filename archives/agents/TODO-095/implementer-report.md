# TODO-095 implementer 報告

作業場所: worktree `.claude/worktrees/todo-095`（ブランチ todo-095）。コミットは `wip(TODO-095): …` の 1 つ。

## 着手前に測ったこと（Playwright, headless Chromium）

スクリプト: `scripts/measure.mjs`・`scripts/fit.mjs`

- `page.setViewportSize()` で横 1200×800 → 縦 400×800 → 横と変えると、変えるたびに
  `window` の `resize` が **1 回**、`matchMedia('(orientation: portrait)')` の `change` が **1 回**、
  Phaser の `scale` の `resize` が **1 回**来る（Phaser 側は内部解像度 960×640 のまま）。
- 400×800 のときに `game.scale.setGameSize(640, 1136)` を（resize から 300ms 後に）呼ぶと、
  canvas は 640×1136、style 400×710px、margin-top 45px になり、`FIT` は追従した。
- **ただし `resize` の処理の中で `setGameSize()` を呼ぶと、縦 → 横で追従しなかった**。
  Phaser は親要素の大きさ（`parentSize`）を次のフレームで読み直すため、その時点ではまだ古い
  大きさ（450×800）を持っており、960×640 を 450×300 に映した（1200×800 の窓で小さく出る）。
  `setGameSize()` の前に `game.scale.getParentBounds()` を呼んで解決した
  （修正後: 縦 450×798.75px / 横 1200×800px。往復 2 回とも同じ）。

## 変更したファイル

- `src/config.js:465-529` … `PORTRAIT`・`SCREEN` をやめ、向きごとの組にした。
  `ORIENTATION_REGISTRY_KEY`（`'orientation'`）・`ORIENTATIONS`・`SCREENS`・
  `LAYOUTS[向き][盤]`・`DEMO_LAYOUTS[向き][盤]`・`orientationOf(scene)`・`screenOf(scene)`。
  トップレベルで `window` を読まなくなった。`VERSION` の行は触っていない。
- `src/main.js:20-75` … 起動時の向きで内部解像度を決め、registry に書く。`followOrientation()`
  （`resize` を 1 つだけ登録）が、`innerHeight > innerWidth` が変わったときだけ registry を書き換え、
  `getParentBounds()` → `setGameSize()` → 動いているシーン（止めてある Game も含む）の `relayout()` を呼ぶ。
- `src/scenes/boot.js:57-64` … テクスチャを縦・横の両方のマスの大きさで焼く。
- `src/ui.js:29-31, 54, 522-530` … `createVersionText`・`createTitleBar`・ツールチップが `screenOf(scene)` を読む。
- `src/scenes/title.js:44-80, 114-133, 268` … `STACK`・`PREVIEW`・`STACK_BIAS` を向きごとの組にし、
  `create()` で今の向きの組を引く。`relayout()` は作り直すだけ。
- `src/scenes/clear.js:33, 85-105` … `STACK_BIAS` を向きごとに。`relayout()` は引数なしで
  `restart()`（前回の `init()` の値が渡し直される）、ファンファーレは鳴らし直さない。
- `src/scenes/records.js:76-113, 128-132, 170-265, 407-…, 530-575` … `L` を `LAYOUT[向き]`
  にし、`this.layout` で引く。確認は `openConfirm(kind, silent)`（`'trash'` / `'continue'`）にまとめ、
  `confirmKind` を持つ。`relayout()`・`pageAnchor()`・`restoreRelayout()` を追加。
- `src/scenes/game.js` … `LAYOUTS[orientationOf(this)][盤]`（85）。`relayout()`（1160）・`applyRelayout()`（1189）。
  確認を `openConfirm(kind, silent)`（1392。`'title'` / `'restart'`）にまとめ `confirmKind` を持つ。
  `checkSolved()` のクリア表示に渡す値を `this.clearData` に持ち、`showClear()` を分けた。
  700 を `CLEAR_DELAY_MS`（36）にした。`continuePlay()` で `clearData` を捨てる。
  前回の `init()` の値（`resume`・`progress`・`restartTip`）は、作り直したときは使わない。
  全解のデータが届いたときの `avoidNumbers` は、持ち越した分に足す形にした（ふだんは空に足すので同じ）。
- `src/scenes/demo.js:64-75, 100-103, 118-121, 131-170` … `DEMO_LAYOUTS[向き][盤]`。`relayout()` は
  `cancelTurn()` で回している途中を仕上げてから、generator・先読み・状態・速さ・探し方・数・
  ピースの位置・メッセージを控える。
- `tests.html:41, 176-186, 237-256` … トレイのスロットのテストを、`makeLayout()` を直接呼ぶ形から
  **画面が実際に引く `LAYOUTS` / `DEMO_LAYOUTS` の向きごとの組**を回す形にした（件数は同じ）。
  「向きごとの組がその向きの寸法で作ってある」テストを 2 件足した。
- 文書: `docs/developer.md`（シーンの移り方の下に「画面の向きが変わったとき」の節と表、registry のキーの表に
  `ORIENTATION_REGISTRY_KEY`、画面の用語の `LAYOUTS[向き][盤]`）、`CLAUDE.md`（ファイル構成の `main.js`・`config.js` の行）、
  `docs/UsersGuide.md`（操作の節の末尾に、回すと組み直して状態が続くことを 1 段落）。

## 洗い出し

`rg -n "SCREEN|LAYOUTS|PORTRAIT|portrait" src` の変更前の全ヒットを処理した。

- `SCREEN` … main.js・clear.js・title.js・records.js・ui.js の全箇所を `SCREENS[向き]` / `screenOf()` へ。変更後 `rg -n "\bSCREEN\b" src tools tests.html` は 0 件
- `PORTRAIT` … config.js のみ。削除（残りは `tools/window-shim.mjs` のコメントだけ。下の懸念）
- `LAYOUTS` / `DEMO_LAYOUTS` … boot.js・game.js・demo.js・records.js の `CONFIRM`
- `portrait` … config.js の `makeLayout()`（引数のまま）、game.js の `this.layout.portrait`（向きごとの layout なので変更不要）、records.js の `ROW_TEXT_WIDTH.portrait`（定数）
- モジュールのトップレベルで向きに依存していた値: title.js `STACK`・`PREVIEW`・`STACK_BIAS`、records.js `L`・`CONFIRM`、clear.js `STACK_BIAS`。
  `DEMO_BUTTON`（title.js）は向きに依存しない値で、使う側の `SCREEN` を `screen` に変えた

## 検証

| コマンド | 結果 |
|---|---|
| `node --check` を `src/*.js src/scenes/*.js` の全部に | 全部成功 |
| `tests.html`（`scripts/tests.mjs`） | 456 件すべて通った、終了コード 0 |
| 壊すと落ちるか: `LAYOUTS` を常に `portrait: false` で作るよう一時的に壊す | 3 件失敗（縦画面の本編 8×8・6×10 のスロットの並び、向きの組のテスト）。戻して 456 件通過 |
| `node tools/gen-solutions.mjs --check` | 8×8・6×10 とも一致、終了コード 0 |
| 各シーンで横→縦→横（`scripts/scenes.mjs`、1200×800 ⇄ 450×800） | 下記。pageerror・console error 0 件 |
| 追加の場面（`scripts/extra.mjs`） | 下記。エラー 0 件 |
| 向きを変えないときの同一性（`scripts/same.mjs`） | 下記 |

各シーン（横→縦→横。値はスクリプトの出力から）:

- Title: 6×10・colorful を選んだまま。`previewBox` が縦 `{x:120,y:263,w:400,h:240}` ⇄ 横 `{x:14,y:163.6,w:200,h:186}`
- Game: おまかせ 2 手・ヒント表示を入・やり直しの確認を開いた状態で回した。盤面の文字列・history 2・usedAuto/usedHint・
  hinting/hintState `ok`・確認（`restart`、表示中）が同じで、`layout.portrait` だけ変わり、全ピースの Container が
  `pieceTransform()` と一致。経過時間は増え続けた。トレイの F をマウスでドラッグ中に回した → drag は消え、
  盤面・history はドラッグ前と同じ、F はトレイ。回したあとでマウスを離しても何も起きない
- Clear: 完成後に回す → Clear は running・Game は paused のまま、Game の layout だけ向きが変わる。
  Clear の文字（COMPLETE・時間・番号・状態・最短・使ったもの）が同じ。履歴の件数は回す前後で 1 → 1（二重にならない）。
  「続ける」で Game が動き（playing true・paused false）、Clear が閉じ、`clearData` は null
- Records: 13 件で頁 2・選択 8・チェック 2 件・消す確認を開いた状態で回した。縦（1 頁 8 行）でも頁 2、
  選択 8・チェック・確認の文言が同じ。横へ戻しても頁 2
- Demo: ランダム・ゆっくりで回す → generator が同じオブジェクト（`steps === 前の steps`）、探し方・速さ・試した手が同じで、
  続きから進む（1.5 秒後に 3 → 5）。最速で 4 回続けて回しても、置く手が盤に無いピース・外す手が盤にあるピースに
  なっているか（generator と画面の食い違い）の検査で 106 手中違反 0

追加の場面: 縦で起動（registry `portrait`・640×1136）／タイトルへの確認を開いて回す → 開いたまま、「はい」でタイトルへ／
完成してからクリア表示が出るまでの 700ms の間に回す → クリア表示が出て Game は止まる／作り直したあとに「はじめる」→
まっさら（トレイ 12・history 0・clearData null）／記録の「この回を続ける」の確認を開いて回す → 開いたまま、「はい」で
盤 12 枚の本編へ／作り直したあとに記録へ入り直す → 確認は閉じ、頁 0・チェック 0／デモで向きを回して見せている途中に
`relayout()` → 置く手を仕上げてから作り直す（試した手 2 → 3、L が盤）／デモの「解けた」で止まっている間に回す →
`solved`・メッセージ・次へのボタンが残る。

向きを変えないときの同一性: HEAD（変更前）を `git archive` で別ポートに出し、横 1200×800 と縦 450×800 の各々で、
Title・Game・Records・Demo・Clear の全オブジェクトの型・座標・大きさ・文字・表示・depth・拡大率・Graphics の命令数を
JSON にして突き合わせた（動く盤・Tween・経過時間は止めて揃えた）。10 組すべて一致、canvas の大きさも一致。

画面は縦の Title・Game（確認あり）・Clear・Records（確認あり）・Demo と、戻した横の Game を撮って目で見た
（欠け・はみ出し・重なりなし）。

## 判断が要る点

- **記録の画面の頁**: 1 頁の行数が向きで違う（横 7・縦 8）ので頁の番号は保てない。選んでいる回が今の頁にあれば
  その回が載る頁、無ければ今の頁の先頭の回が載る頁に合わせた。後者の場合、往復すると頁がずれることがある
  （例: 横で頁 2 の先頭 7 番目 → 縦で頁 1 → 横で頁 1）。
- **Game のメッセージ**（「そこは他のピースと重なる」など時間で消えるもの）は持ち越していない。Title の動く盤は始め直す（依頼どおり）。
- `CLEAR_DELAY_MS`（700）は game.js のローカル定数にした。前から game.js に数字のまま書いてあった値で、
  `config.js` へ移すかは決めていない。

## 範囲外で気づいたこと

- `tools/window-shim.mjs` のコメントが「`config.js` は起動時に `window.innerHeight` を読む（`PORTRAIT`）」と書いたままで、
  今は合っていない。`config.js` は Node で `window` 無しに読めるようになった（`storage.js` などは関数の中でだけ読む）。
  shim は害が無いので残している。
- game.js の `DEPTH` の JSDoc が `RESTART_TIP` の上にあり、離れている（TODO-094 から。触っていない）。

## 残る懸念

- headless では 640×1136 の描画でフレームが遅く、シーンの時計（`delayedCall` の 700ms）が実時間の 2 倍ほどかかった。
  実機では問題にならないはずだが、実害は未確認。
- 検証スクリプト（`scripts/`）はポート 8796（worktree）・8797（HEAD の写し）と、`~/.npm/_npx/6bcb61ec6d5aea22/`
  の Playwright を決め打ちにしてある。

## レビュー後の修正

本体の木（develop、250a721 を取り込んでステージ済み）の上で直した。ステージはしていない。

### 直したもの

1. **window-shim**（要修正）: `config.js` が `window` を読まなくなったので、shim ごと消した。
   `git rm tools/window-shim.mjs`、`tools/enumerate.mjs:15`・`tools/gen-solutions.mjs:15` の import を削除、
   `CLAUDE.md`・`docs/developer.md`（ツリーと全解のデータの表）の行を削除。`.claude/agents/measure.md` の「Node から」は
   「`config.js`・`logic.js`・`solutions.js` はそのまま import できる。`storage.js` は関数の中で `window.localStorage` を読むので、
   ダミーの `globalThis.window` を置く」に書き直した。`rg -n window-shim --glob '!archives/**' .` は 0 件。
   `archives/agents/*/` の古い計測スクリプト（TODO-040・044・050・053・057・077・081）は shim を import しているので、
   そのままでは動かない（archives は記録なので触っていない）。
2. **向きが続けて変わったとき**（検討 2）: `src/main.js:50-99`。`resize` ではその場で作り直さず、
   `game.events` の `poststep` に見張りを 1 つだけ付ける（付いていれば足さない）。フレームの終わりごとに、シーンの予約の列
   （`game.scene._queue`。Phaser が公開していないので private を読む。3.90.0 固定）が空で、`START`・`LOADING`・`CREATING` の
   シーンが無ければ、見張りを外し、**そのときの向きで 1 回だけ**作り直す（元の向きに戻っていれば何もしない）。
   作り直しの予約が残っている間は次を作り直さないので、控えた状態は必ず `create()` が受け取る。`setTimeout` は使っていない。
   `poststep` の時点では Phaser が親要素の大きさを読み直し済みなので、前に足した `getParentBounds()` は外した
   （`scripts/fit.mjs` で縦 450×798.75px / 横 1200×800px、往復 2 回とも追従）。
   最初は `INIT` も「組み立て中」に入れたが、一度も始めていないシーン（Game など）が `INIT` のままで、ずっと作り直さなかった。外してある。
3. **Game の控える・戻す項目**（検討 3）: `src/scenes/game.js:42-45` に `RELAYOUT_KEYS`（12 項目）を置き、`relayout()` は
   `Object.fromEntries(RELAYOUT_KEYS.map(...))`、`applyRelayout()` は `Object.assign(this, saved.state)` の 1 行にした。
   盤面とピース（`position`）・HUD の文字（`record`）・確認・止めているかは部品へ写す手順が要るので別に控える。
   Demo も同じ作りにした（`src/scenes/demo.js:59-66` の `RELAYOUT_KEYS`、`saved.state`）。
4. **records.js の名前**（検討 4）: `LAYOUT` → `L`（`{ portrait, landscape }`）、`this.layout` → `this.L` に戻した。JSDoc の言い回しも合わせた。
5. **`CLEAR_DELAY_MS`**（検討 5）: `src/config.js:863-867` へ移し、game.js は import する。
- 好みの範囲: `pageAnchor()` を `relayout()` の中へ入れた（直した）。記録の画面の頁（6）は変えていない。
- `docs/developer.md` の「画面の向きが変わったとき」に、フレームの終わりまで待って 1 回だけ作り直すことと `RELAYOUT_KEYS` を書き足した。

### 向きが続けて変わったときの測り直し（`scripts/race.mjs`）

レビューと同じく、registry の向きを逆にしてから `resize` を送り、同じ tick の中で向きの変化を偽装した（窓は 1200×800 の横のまま）。
各シーンの `relayout()` の呼ばれた回数も数えた。修正前は worktree（250a721）を同じスクリプトで測った。

| 場面 | 修正前（250a721） | 修正後 |
|---|---|---|
| A1: Title で `scene.start('Records')` と同じ tick | 動いている `['Title','Records']`（Title を作り直した） | `['Records']`。Records を 1 回作り直した |
| A2: Game で `goToTitle()` と同じ tick | `['Title','Game']`（Game を作り直した） | `['Title']`。Title を 1 回作り直した |
| B: 同じ tick で 2 回（最後は元の向き。Game、おまかせ 3 手） | 前 hist 3・盤 3 → 後 hist 0・盤 0（作り直し 2 回） | 前後とも hist 3・盤 3。作り直し 0 回（元の向きなので） |
| B': 同じ tick で `resize` 2 回（向きは変わる） | — | hist 3・盤 3 のまま。作り直し 1 回 |
| B'': 作り直しの予約が残っている間（予約した直後の `poststep`）にもう一度変わる | （起きなかった） | hist 3・盤 3 のまま。作り直し 2 回（1 回目の `create()` が済んでから 2 回目） |
| Clear を重ねたまま B' と B'' を続ける | Clear の create 2 回・ファンファーレを鳴らす create 0 回 | Game・Clear とも作り直し 3 回、Clear は running・Game は paused のまま。Clear の create 3 回・ファンファーレを鳴らす create 0 回 |

pageerror はどちらも 0 件。

### 検証（修正後）

| コマンド | 結果 |
|---|---|
| `node --check`（`src/*.js src/scenes/*.js tools/*.mjs`） | 全部成功 |
| `tests.html`（`scripts/tests.mjs`、本体の木をポート 8798 で） | 456 件すべて通った、終了コード 0 |
| `node tools/gen-solutions.mjs --check`（shim 無し） | 8×8・6×10 とも一致、終了コード 0 |
| 各シーンの横→縦→横（`scripts/scenes.mjs`） | 前回と同じ項目がすべて保たれた（Game: 盤面・history 2・ヒント表示・確認、ドラッグ中はドラッグ前へ戻る／Clear: 文字同じ・履歴 1 → 1・続けるで再開／Records: 頁 2・選択 8・チェック・確認／Demo: generator が同じ・違反 0/104 手）。エラー 0 件。終了コード 0 |
| 追加の場面（`scripts/extra.mjs`） | 前回と同じ結果。エラー 0 件 |
| 向きを変えないときの同一性（`scripts/same.mjs`。比べる元は本体の木の HEAD 26afd88 を `git archive` したもの） | 横 1200×800・縦 450×800 で canvas と 5 シーン、12 組すべて一致 |

`export const VERSION = 'dev';` の行はそのまま（`src/config.js:892`）。

### 残る懸念

- `game.scene._queue` は Phaser の private なプロパティ。Phaser を上げるときは、`main.js` の `scenesSettled()` を見直す必要がある。
- 向きが変わってから作り直すまで、少なくとも 1 フレーム遅れる（その間の 1 フレームは古い配置のまま映る）。
