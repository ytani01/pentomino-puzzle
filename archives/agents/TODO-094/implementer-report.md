# TODO-094 implementer 報告

- ブランチ: `worktree-agent-afd09e24b9cee6155`、コミット `c8b4c9a`（`wip(TODO-094): …`）
- 着手時、worktree の HEAD が古い `909f91a`（TODO-030 の時点。demo.js も無い）だった。変更の無い状態のまま `git merge --ff-only develop`（`82c93d2`）してから作業した。コミットの親は `82c93d2`

## ツールチップが出ない原因（5）

`createButton()` の `pointerup` は `onClick()` → `tip()?.flash()` の順に動く（`src/ui.js` の pointerup の処理）。
「やり直し」の `onClick` は `restart()` → `this.scene.restart()`。Phaser の `scene.restart()` は
キューに積むだけなので、`flash()` は **作り直す前のシーンの `scene.tooltip`** に出る。次のフレームで
シーンが shutdown し、その tooltip は表示ごと捨てられる。`create()` が作る新しい tooltip は非表示のまま。

Playwright（`hasTouch: true`・`page.touchscreen.tap()`、390×844）で、直す前に実測した値:
`flashCalls: 1`、flash の時点でシーンは RUNNING（status 5）、flash の直後は `visible: true`。
その直後、古い tooltip は destroy 済み（`oldTipDestroyed: true`）で、今の `scene.tooltip` は別物（`sameTooltip: false`）、
`visible: false, text: ''`。

直し方: `restart()` が `scene.restart({ resume: false, restartTip: this.input.activePointer.wasTouch })` を渡す。
`init()` がそれを受け取り、`create()` の最後で新しい tooltip に `flash(this.restartButton, 'やり直し')` を出す。
確認のモーダルの「はい」から来たときも、`activePointer` がタッチなら同じく出る。

直した後の実測（`probe.mjs`）:
- 空の盤でタップ（確認なしですぐやり直す）: +200ms で `tip: true, text: 'やり直し'`
- 置いてからタップ（モーダル）: 押した直後は `tip: true, confirm: true`。「はい」をタップして +200ms で `tip: true, text: 'やり直し', onBoard: 0`。縦・横とも同じ

## 変更点

- `src/ui.js:14-23` 操作の概要の文言 `HOW_TO_OPERATE`（3 行）・`HOW_TO_OPERATE_SHORT`（1 行）を export。タイトルはまだ自前の文言のまま（管理者が差し替える前提）
- `src/config.js`
  - `:256` `HELP_LINE = 26`
  - `:338-341` `makeLayout()` に `help` 引数を足した。縦は 3 行、横は 1 行、デモ（`help` なし）は 0 行
  - `:378` 盤とトレイの下端を、概要の行ぶん上げる
  - `:455-456` `layout.help = { x, y, lines }`（トレイとメッセージの帯の間）
  - `:486` `LAYOUTS` だけ `help: true`（`DEMO_LAYOUTS` は変えない）
  - `:548-566` 盤の空きマスの下地 `BOARD_GLASS`（fillAlpha 0.7、筋は 1 本で alpha 0.06、格子は `COLORS.boardCellEdge`）
- `src/scenes/boot.js:74-81` 盤のマスのテクスチャを `makeGlassTile(…, BOARD_GLASS)` で焼く。`:126-130` `makeGlassTile()` に `spec` 引数（既定は `GLASS`。ピースの見た目は変わらない）
- `src/scenes/game.js`
  - `:57-62` `init()` で `restartTip` を受け取る。`:107` 作り直した直後に説明を出す
  - `:104`・`:376-390` `createHelp()`。デモは自分の `create()` を持つので呼ばれない
  - `:392-` 確認の枠を、文言と「はい」の動作を差し替えられる形にした。`confirmText`・`confirmAction`・`confirmYes`（`:429`）
  - `:331` `this.restartButton`。やり直しのボタンは `confirmRestart()` を呼ぶ
  - `:1246` `restart()` が `restartTip` を渡す
  - `:1250` `boardIsEmpty()`、`:1255` `confirmRestart()`（空なら確認なしで `restart()`）
  - `:1288` `confirmToTitle()`: 空の盤なら `playing = false` にして、確認なしで `goToTitle()`（`onShutdown()` の `persist()` を止める）。HUD のホームとタイトル行の両方がここを通る
  - `:1299` `showConfirm(message, onYes)`
  - `:127`・`:1364` 下の「範囲の外に踏み込んだ点」

## 範囲の外に踏み込んだ点（判断が要る）

**`はじめる` で始めた直後に、保存済みの遊びかけが消えていた（既存の不具合）。**
全解のデータが届いたときの `refreshHud()`（`create()` の `ensureSolutions().then`）は `ready = true` の後に
走り、空の盤で `persist()` → `clearProgress()` する。データがキャッシュ済みでも Promise なので、必ず後に走る。
このため「空の盤でホームを押したら今あるデータを消さない」（4）が、ホームを押す前に崩れていた
（実測: 遊びかけを 1 個ぶん作ってから `はじめる` 相当で始めると、ホームを押す前に `loadProgress('8x8')` が null）。
`refreshHud(fill, save = true)` に引数を足し、この呼び出しだけ `refreshHud(false, false)` にした。
直した後は、始めた直後も、HUD のホーム・タイトル行を押した後も、遊びかけ（1 個）が残る。
TODO-030 のコメント（`ready` の説明）が意図していた挙動に戻しただけだが、4 の範囲より広い。

## 検証

| コマンド | 結果 |
|---|---|
| `node --check`（`src/config.js`・`src/ui.js`・`src/scenes/game.js`・`src/scenes/boot.js` を 1 本ずつ） | すべて成功（終了コード 0） |
| `tests.html`（Playwright で `#summary` を読む。`tests.mjs`） | 「430 件すべて通った」 |
| デモ `?demo=1&board=6x10` | 例外なし。概要の文字は出ない（`layout.help.lines = 0`） |
| `probe.mjs empty` / `probe.mjs placed` / `probe.mjs placed landscape` | 上の「直した後の実測」のとおり |
| `home.mjs`（マウス、960×640） | 置いてホーム → 確認が出る。「はい」で戻り、遊びかけ 1 個が残る。空の盤で HUD のホーム／タイトル行 → 確認なしで Title へ戻り、遊びかけ 1 個が残る。空の盤でやり直し → 確認なし。置いてからやり直し → 確認が出て、「いいえ」で盤は 1 個のまま |
| `shots.mjs`（縦 640×1136・横 960×640 × 8×8・6×10） | 下記 |

撮った画像: `~/tmp/playwright-mcp/todo094-{portrait,landscape}-{8x8,6x10}.png`、`todo094-modal.png`（横、やり直しの確認）。
自分で見て、はみ出しと重なりは無かった。概要の外接矩形と、トレイ・メッセージの位置:

| 画面 | マス | トレイの下端 | 概要の y 範囲 | メッセージの中心 y |
|---|---|---|---|---|
| 縦 8×8 | 74 | 1018 | 1026–1089 | 1116 |
| 縦 6×10 | 59 | 1018 | 1026–1089 | 1116 |
| 横 8×8 | 46 | 574 | 577–597 | 620 |
| 横 6×10 | 62 | 574 | 577–597 | 620 |

計測スクリプトは `archives/agents/TODO-094/{probe,home,shots,tests}.mjs` に置いた。
worktree の根で `python3 -m http.server 8794` を立て、`PLAYWRIGHT=<npx の playwright/index.mjs>` を渡して `node` で走らせる（ポートは 8794 決め打ち）。

## 懸念・気づいたこと

- **横画面の 8×8 はマスが 49 → 46 に縮む**（概要 1 行ぶん）。6×10 の横は幅で頭打ちなので 62 のまま。縦はどちらもトレイの枠が 3 行ぶん（78px）縮むが、マスの大きさは変わらない
- モーダルを開いたときの「やり直し」の説明は、深さ（`DEPTH.tooltip` 35 < `DEPTH.confirm` 40）のとおり幕の下に暗く見える（`todo094-modal.png`）。上に出すかは決めていない（`DEPTH` の既存の決めごと）
- `restart()` は空の盤でも `clearProgress()` する（既存の挙動のまま）。`はじめる` で始めて何も置かずにやり直すと、前の遊びかけが消える。4 のホームと同じ扱いにするかは決めていない
- `toggleHint()` で入にした時点の `refreshHud(true)` も、空の盤なら `persist()` で遊びかけを消すはず（実害は未確認。直していない）
- `boot.js` の `makeTile()` の、`beveled` が偽のときの分岐は使う所が無くなった（消していない）
- 確認の枠の文言は、2 行のときに上寄りに見える（位置は `y + 50` 固定のまま）
- headless の Chromium では Phaser の時計が実時間より遅く進むため、`TOOLTIP.touchMs`（1.2 秒）で消えるところまでは確かめていない（timer の経過は進んでいる）

## レビュー後の修正

- ブランチを develop（`580dc11`、TODO-092）へ rebase した。食い違いは無かった。develop からの 1 コミット `d2e2d45` にまとめてある（前の報告の `c8b4c9a` は置き換わった）
- 前の報告の行番号は、このコミットでずれている。下の行番号は `d2e2d45` のもの

### 直したもの

1. **検討 1: 遊びかけを消す条件**（`src/scenes/game.js`）
   - `:96` `this.ownsProgress = this.resuming`（つづきから・記録画面の `progress` のときは真）
   - `:1106-1111` `persist()`: 空の盤では `ownsProgress` が真のときだけ `clearProgress()` する。置いてある盤を控えたら `ownsProgress = true` にする
   - `:1252` `restart()` も `ownsProgress` が真のときだけ消す（何も置かずにやり直しても、前の遊びかけは残る）
   - `refreshHud` の `save` 引数と、`confirmToTitle()`（`:1295`）の `playing = false` を消した
2. **検討 2: `tests.html:179`・`:224-235`** 既存のスロットのテスト 5 本を `help: false / true` の両方で回し、`help: true` には「概要の帯がトレイの下端とメッセージの帯の間に収まる」を足した（横・縦 × 2 つの盤）。帯の高さをテストから読めるよう、`layout.help.height` を足した（`src/config.js:457`）。430 件から 454 件に増えた
   - 壊すと落ちるかの確認: `help.height` を `+20` すると「4 件が失敗（450 件は通った）」になった。戻したあとは全件通る
3. **検討 5: 文書**
   - `docs/UsersGuide.md`: 操作の概要（「操作」の節の末尾）、タイトル行・「タイトルへ」は盤が空なら確認なし、「やり直し」は確認を挟み、盤が空ならすぐやり直す、「つづきから」に遊びかけを残す条件。TODO 番号は書いていない
   - `docs/developer.md`: シーンの移り方の図と本文（空の盤は確認なし、やり直しの確認）、画面の用語に「操作の概要」を追加、タイトル行の行、「いつ書き込まれるか」の表と図（消すのは、そのシーンで置いたか続きから始めたときだけ。何も置かずにやり直したときは消さない）
4. **好みの範囲・作り込みすぎ**
   - `confirmYes` を消し、前と同じ `confirmParts.push(createButton(...))` に戻した（`probe.mjs`・`home.mjs` は、ラベル「はい」でボタンを探すように直した）
   - `src/scenes/boot.js:99` `makeTile()` の `beveled` 引数と、偽のときの分岐を消した
   - `persist()` は `boardIsEmpty()` を使う
   - `save` 引数は 1 で消した
   - やり直しの説明の文言は `src/scenes/game.js:38` の `RESTART_TIP` 1 か所にまとめた（`:113`・`:329`）
5. **`src/scenes/title.js:24`・`:101`** 操作の 3 行は `HOW_TO_OPERATE` から読む。文言は一字一句同じなので、見た目は変わらない

検討 6 の訂正: 横画面の 6×10 もマスは 64 → 62 に縮む（前の報告の「62 のまま」は誤り）。

### 検証

| コマンド | 結果 |
|---|---|
| `node --check`（`src/config.js`・`src/ui.js`・`src/scenes/game.js`・`src/scenes/boot.js`・`src/scenes/title.js`） | すべて成功 |
| `tests.html`（`tests.mjs`） | 「454 件すべて通った」。デモは例外なし、概要は出ない |
| `home.mjs`（マウス、960×640） | 下の表 |
| `probe.mjs empty` / `placed`（タッチ） | どちらも、やり直した後に `tip: true, text: 'やり直し'` |
| `shots.mjs` | 前と同じ値（縦 8×8 の概要は 1026–1089 など）。縦 6×10 の画像を見て、はみ出しは無かった |

`home.mjs` の結果（遊びかけは盤に置いたピースの数。null は無い）:

| 操作 | 結果 |
|---|---|
| 置いてからホーム → はい | Title へ、遊びかけ 1 |
| はじめる直後（データの到着後） | 1 のまま |
| 空の盤で HUD のホーム／タイトル行 | 確認なしで Title へ、1 のまま |
| 空の盤でヒント表示を入 | 1 のまま |
| 空の盤でやり直し | 確認なし、1 のまま |
| 記録画面と同じ経路（保存を消してから `{ progress }` で始める） | 始めた直後に 1 が保存される。ホーム → はいの後も 1 |
| このシーンで置いてから一手戻して空にする | null（消える） |
| 置いてからやり直し → はい | null（消える） |
| 置いてからやり直し → いいえ | 確認が閉じ、盤は 1 個のまま |

### 直していないもの

指示どおり、検討 3（確認を開いている間も経過時間が進む）と検討 4（マルチタッチ、クリア直前の経路）には触っていない。確認を開いたときに説明が幕の下に暗く出る件もそのまま。
