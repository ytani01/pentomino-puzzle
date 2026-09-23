# TODO-042 reviewer の報告

対象: `git diff`（CLAUDE.md / README.md / docs/developer.md / src/config.js /
src/scenes/demo.js / src/scenes/game.js / src/ui.js）と未追跡の `src/icons.js`。
コードは直していない。

## 要修正

### 1. `README.md:74-93`（「構成」の木）に `src/icons.js` が無い

- 何が問題か: 「構成」は `src/` のファイルを 1 つずつ全部並べている（`main.js` 〜
  `ui.js`、`scenes/*`）。今回 `src/icons.js` を足したが、この木には入っていない
- 根拠: 読んだ README。`CLAUDE.md` のファイル構成の表には足してあるので、
  対で保守している 2 か所の片方だけが変わった状態

## 検討

### 2. `README.md:56-59`（デモの節）がボタンを名前で案内したまま

- 何が問題か: 「速さは **ゆっくり**・**速い**・**最速** から選べる」「**次の解を探す**で
  続きを見られる」「音の ON・OFF と **タイトルへ** も同じ画面にある」。デモのボタンも
  アイコンになったので、画面にこの文字は常には出ない（ホバー／タップで説明に出るだけ）
- 根拠: `src/scenes/demo.js:139-147` がデモの 6 個もアイコンにしている。本編の操作表
  （README.md:32）はアイコンになったことと説明の出方を書き足したが、デモの節には無い
- 実害は未確認（説明の文言は同じなので、載せれば分かる）

### 3. マウスがボタンから直接 Canvas の外へ出ると、説明が出たまま残る

- 何が問題か: Phaser 3.90 は Canvas の外へ出たときに Game Object の `pointerout` を
  出さない（`GAME_OUT` だけ）。ボタンの上から 1 回の移動で Canvas の外へ飛ぶと、
  説明（depth 35 なので盤やピースの上）が戻ってくるまで消えない
- 根拠（実測。Playwright・800x400・マウス。Canvas は x=100〜700）:
  - 一手戻すに載せて 3 秒 → `vis: true`
  - `mouse.move(80, y, {steps: 1})` で Canvas の外へ → 1.5 秒後も `vis: true`、
    `hovered` も true のまま
  - 同じ移動を `steps: 10`（途中で Canvas 上を通る）にすると `vis: false`
- 補足: ボタンの `hovered` の見た目が残るのは今回の変更の前からある挙動。説明は
  それより目立つ（盤の上に文字が残る）。実害は未確認（どれくらいの頻度で起きるかは
  測っていない。HUD は画面の上端なので、ブラウザの外へ抜ける動きでは起きうる）

### 4. `src/ui.js:234, 270, 290, 313, 317-319` `refresh()` と `owner` は通る道が無い

- 何が問題か: `refresh()` は「表示中で、持ち主が同じボタンなら書き換える」が、
  `setTooltip()` を呼ぶのは `toggleMute()`（`game.js:1108`）だけで、それは
  `pointerup` の `onClick` からしか呼ばれない。その前の `pointerdown`
  （`ui.js:203-207`）で必ず `hide()` しているので、`box.visible` は偽で、
  `refresh()` の中身は動かない。`owner` は `refresh()` のためだけにある
- 根拠: 読んだコード。本編にキー操作は無い（`rg keydown src` はタイトルの
  SPACE / ENTER だけ）。Phaser 3.90 の `InputPlugin` はタッチでも
  down → over、up → out の順で、down の `hide()` を飛ばす道は無い
- 実装報告の「気になる点」にある「音を切り替えたあとの説明は載せ直すまで出ない」
  も、この道が通らないことの表れ（利用者と決めた挙動なので、それ自体は指摘しない）

### 5. JSDoc が「何を」を書いている箇所

`CLAUDE.md`「JSDoc には『何をするか』でなく『なぜそうするのか』を書く」に照らして:

- `src/ui.js:302` `/** タッチ: すぐ出して、一定時間で消す。 */` — 動作の言い換え。
  「なぜ」は `config.js` の `touchMs` の説明にあるので、そちらを指すか消す
  （同じ並びの `:294` は「横切っただけで出さないため」と理由がある）
- `src/scenes/game.js:1098` `muteFace()` の `/** 音のボタンのアイコンと説明。今の状態
  （切なら OFF）を出す。 */` — 何を返すかだけ。分けた理由（本編・デモの組み立てと
  切り替えの 3 か所で同じ対応を使うため）が無い
- `src/scenes/game.js:300-305` `createHudButtons()` は説明の枠を「ここで 1 つだけ作る」と
  書くが、なぜここか（本編とデモの両方が通る唯一の入口だから。実装報告にはある）が無い

## 好みの範囲

### 6. `src/ui.js:284-286` 説明の枠の角の丸み `6` と線の太さ `2` を直接書いている

`CLAUDE.md` は数値を `config.js` へ集約するとしているが、同じファイルのボタンの面
（`ui.js:162-164` の `8`・`2`）も直接書いており、既存の作りには沿っている。
`TOOLTIP` に入れるなら `radius` だけで足りる。

## 作り込みすぎ

- `src/ui.js:L234, L270, L290, L313, L317-319`: delete: `refresh()` と `owner`（上の 4）。`setTooltip()` は `tooltip = value; return container;` だけで足りる。
- `src/ui.js:L228`: delete: `setIcon()` の `text.setText('')`。`setIcon()` を呼ぶのはアイコンのボタン（文字は最初から空）だけ。

net: -8 lines possible.

## 確かめて問題が無かったもの（1 行ずつ）

- `pointer.wasTouch`: Phaser 3.90 の `Pointer.js` で、マウスの move / down / up は false、タッチは true にする。タッチの順は down → over、up → out（`InputPlugin.js:760-771`）なので、over で出さず out で消さない分け方で、`flash()` が指を離したときの out で消えない
- 押せないボタン: マウスのホバーでは出る。タッチでも `wasPressed` だけを見て `flash()` するので出る。`onClick` は `enabled` で止まる（前と同じ）
- シーンの切り替え: 説明の枠は `scene.add` で作り、待ちは `scene.time.delayedCall` なので、シーンと一緒に消える。実測（説明を出したまま `scene.restart()`）で、作り直された枠は `vis: false`、コンソールのエラー・pageerror は無し
- 文字のボタン（タイトル・クリア・記録・確認の表示）: `icon` が無ければ文字は今までどおり、`iconGraphics` は空、`tooltip` が無ければ `tip()` は null で説明の処理は何もしない。`setLabel()` は `records.js:484` が使っており残っている
- 規約: `setTimeout` / `setInterval` は無し。説明の状態は枠の Container とシーンの `tooltip` に持ち、モジュールのトップレベルに書き換わる状態は無い。色は `COLORS`（`text` / `buttonTextDisabled` / `accent` は `TEXT_COLORS` の normal / disabled / accent と同じ値）。待ち時間などは `config.js` の `TOOLTIP`・`ICON`
- 依存・アセット: 増えていない。`Phaser.Math.Clamp` はグローバルの Phaser
- 文書: README.md に TODO 番号は無い。docs/developer.md は開発者向けで既に TODO 番号を使っている。HUD の図の 2 行目は幅 45 で 1 行目と揃った（変更前は 46）
- 範囲: `config.js` の `HUD_BUTTONS` のコメント直しは `labels` が無くなったことに伴うもので、範囲内
- テスト: `tests.html` の対象（`logic.js` / `solutions.js`）は変わっていないので、足すテストは無い

計測に使ったスクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/1b84555f-9f9b-4c15-a7e8-1bc387d6e160/scratchpad/rv.mjs`（一時ファイル。残す必要は無い）

## 修正後の見直し

対象は implementer-report.md の「## レビュー後の修正」の 1〜5 だけ。CLAUDE.md の「公開」の節は対象外。

### 要修正

- **`src/ui.js:252` の `createTooltip()` の JSDoc が消した状態をまだ書いている。**
  「状態（どのボタンの説明か・消すまでのタイマー）も この Container に持たせ」とあるが、
  4 で `owner`（どのボタンの説明か）を消したので、今持っているのは `timer` だけ。
  根拠: 読んだコード（`rg owner src/ui.js` は 0 件）。消すのは 1 語

### 直せていたもの（1 行ずつ）

- 1: `README.md:89` の「構成」の木に `icons.js` が入った
- 2: `README.md:56-61` のデモの節に、ボタンはアイコンで、載せると（タッチでは押すと）名前が出ると書いた。「三角が 1・2・3 個」「虫眼鏡」は `src/icons.js` の `triangles()`・`next` と合っている
- 3: `gameout` で `hide()` を呼ぶ形になった（下に実測）
- 4: `refresh`・`owner`・`setIcon()` の `text.setText('')` を消した。呼んでいた所は `rg -n "refresh\(|owner|setTooltip|setIcon" src` で `game.js:1112`（`setIcon().setTooltip()`。どちらもまだ container を返すので、つないで呼べる）だけ。`records.js` の `refresh()` はシーン自身のメソッドで別物
- 5: `ui.js:298`（`flash`）、`game.js:1099-1102`（`muteFace`）、`game.js:302-304`（`createHudButtons`）が、どれも「なぜ」を書く形になった

### 3 の実測（Playwright・800x400・マウス。Canvas は x=100〜700）

- `gameout` の登録数（`scene.input.listenerCount('gameout')`）: Game→Game→Demo→Title→Game と切り替えた各時点で、動いているシーンは 1、止まったシーンは 0。Game を `scene.restart()` で 3 回作り直したあとも 1。**登録は残らない**
  - 根拠（Phaser 3.90 のソース）: シーンを止めると `DisplayList.shutdown()` が子を全部 `destroy()` するので枠の `DESTROY` が走り、`off` される。そのうえ `InputPlugin.shutdown()` も `removeAllListeners()` を呼ぶので、二重に外れる
- 一手戻すに載せて 6 秒 → `vis: true`。そこから 1 回の移動で x=80 へ → 1.5 秒後 `vis: false`
- 載せてすぐ（待ちの 400ms より前）1 回の移動で Canvas の外へ → 6 秒後も `vis: false`（`hide()` の `cancel()` で待ちが取り消される）
- 音をクリックしたあと、一度外して載せ直すと「音 OFF」が出る（4 の削除のあとも `setTooltip()` が効いている）
- コンソールのエラー・pageerror は無し
- `GAME_OUT` を出すのは `MouseManager` の `mouseout` だけ（`InputManager.setCanvasOut()` の呼び出し元。`TouchManager` は出さない）なので、タッチの `flash()` を消すことはない。実機のタッチ端末が互換の mouse イベントを出す場合は未確認

計測に使ったスクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/1b84555f-9f9b-4c15-a7e8-1bc387d6e160/scratchpad/rv2.mjs`（一時ファイル）
