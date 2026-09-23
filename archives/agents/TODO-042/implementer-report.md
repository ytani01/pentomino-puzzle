# TODO-042 implementer の報告

## 変えたファイル

- `src/icons.js`（新規）: 12 種のアイコン `ICONS`（undo / auto / hint / restart / soundOn / soundOff / title / slow / fast / fastest / next）。どれも `(graphics, color) => void` で、原点はボタンの中央
- `src/config.js:597` `ICON`（size 28、lineWidth 3）、`src/config.js:612` `TOOLTIP`（hoverDelayMs 400、touchMs 1200、padX 10、padY 6、gap 6）。文字の大きさは `FONT.small` を使う
- `src/config.js:245` `HUD_BUTTONS` のコメントが `game.js` の `labels` を指していたので、`createHudButtons()` に渡す数へ直した（`labels` が無くなったため）
- `src/ui.js:126` `createButton()` に `icon` / `tooltip` を追加。`:130`,`:143` アイコン用の Graphics、`:170-175` 色を文字と同じ規則で状態に連れていく（`COLORS.text` / `buttonTextDisabled` / `accent`。どれも既にあったので config への色の追加は無し）
- `src/ui.js:186-218` 入力: マウスは over で `showLater`、out と down で `hide`。タッチ（`pointer.wasTouch`）は over / out では何もせず、up で動作のあと `flash`
- `src/ui.js:226` `setIcon()`、`:232` `setTooltip()`（表示中ならその場で書き換え）。`setLabel` は残した
- `src/ui.js:261` `createTooltip(scene)`: 説明の枠。状態（owner・timer）は Container のプロパティに持つ。ボタンの下に出し、左右は `SCREEN.margin` 〜 `SCREEN.width - SCREEN.margin` へ収める。当たり判定は持たせない
- `src/scenes/game.js:36` `DEPTH.tooltip: 35`（hud 30 と confirm 40 の間）
- `src/scenes/game.js:286` HUD のボタンを `{icon, tooltip, onClick}` の配列で渡す形へ。`:307` `createHudButtons(items)` の引数を `(labels, actions)` から変更し、ここで `this.tooltip` を作る（本編とデモの両方がここを通るため）
- `src/scenes/game.js:1099` `muteFace(muted)`、`:1108` `toggleMute()` は `setIcon().setTooltip()` に
- `src/scenes/demo.js:139` 同じ形で速さ 3・次の解・音・タイトルへを渡す。`ICONS` を import
- `README.md` 操作表の行、`docs/developer.md` の HUD の図と HUD の行、「説明（tooltip）」の行を追加、`CLAUDE.md` のファイル構成に `src/icons.js` を追加（`ui.js` の行にも説明の件を追記）

## アイコンの形

設計の案どおり。一手戻す＝左へ折り返す U 字の矢印（先端は左）、やり直し＝上に切れ目のある円の矢印で、形の系統を分けた。おまかせ＝杖と 4 点の星と小さな点 2 つ、ヒント＝電球、音＝スピーカー＋波 2 本／＋×、タイトルへ＝家（屋根・本体・扉）、速さ＝右向き三角 1・2・3 個、次の解＝虫眼鏡（三角の系統と取り違えないため「▶|」は採らなかった）。

## 検証

- `node --check` を `src/*.js src/scenes/*.js tools/*.mjs` の全ファイルで実行: すべて成功
- `python3 -m http.server 8765` + Playwright（headless Chromium）で `archives/agents/TODO-042/implementer-check.mjs` を実行
  - 568x320（マウス）: 本編・デモとも「タイトルへ」にホバーして 100ms では出ず、待つと出る（x=765, y=122、幅 100+余白。右端 885 < 946）。外すと消える
  - 390x844（タッチ）: 本編でヒント表示、デモで最速をタップ → 動作（hinting=true / speed=fastest）と同時に説明が出て、時間が経つと消える。音をタップ → 説明が「音 OFF」→ もう一度で「音 ON」
  - コンソールのエラー・pageerror は無し（出たのは WebGL ドライバの GPU stall の警告だけ）
  - 撮った画面を目視: アイコンが描かれ、説明がボタンの下に出ている
- `tests.html`: 「250 件すべて通った」。`src/logic.js`・`src/solutions.js` は差分なし

## 気になる点・判断が要る点

- **headless では Phaser の時計が実時間より遅い**（delta が 1 フレーム 33ms で頭打ちになり、低い fps だと進みが遅い）。400ms の待ちが実時間で 1 秒以上かかって見える。確認の担当は待ち時間を長めに取ること（スクリプトでは 3 秒・8 秒待っている）
- マウスでクリックすると説明は消え、同じボタンに載せたままでは出直さない（`pointerdown` で消す設計どおり）。音を切り替えたあとの「音 OFF」は、一度外して載せ直すまで見えない
- 縦画面では 1 段目のボタンの説明が 2 段目のボタンに重なる（ボタンの下に出す設計どおり。説明は当たり判定を持たないので押すのは妨げない）
- 縦画面ではアイコンが実寸で小さめ（Scale.FIT で縮むため）。見分けの判断は screens に任せる
- 確認に使った `python3 -m http.server 8765` を止めていない（PID 148198。後の担当が使えるように。自分が起こしたものか既存のものかは確かめていない）
- `toggleHint()` の JSDoc の「音 ON／音 OFF のように文字で持つと…」は、音のボタンが説明の文字で状態を出すようになった今も趣旨は通るので触っていない

## レビュー後の修正

reviewer-report.md の 1〜5 を直した（6 は指示どおり直していない）。

1. `README.md:89` 「構成」の木に `icons.js` を足した
2. `README.md:56-61` デモの節: ボタンはアイコンで、載せると（タッチでは押すと）名前が出ることを書いた。速さは三角の数、次の解を探すは虫眼鏡だと添えた
3. `src/ui.js:311-316` `createTooltip()` で `Phaser.Input.Events.GAME_OUT` を受けて `hide()`。枠の DESTROY で `off` する（シーンを作り直したときに古い枠への登録を残さないため）
   - **ボタンの hovered の見た目は戻していない。** 一度 `gameout` で `hovered = false` に戻す形を作って測ったが、Phaser は内部で「載っている」扱いのまま持っているので、Canvas へ戻ってボタンの上に来ても `pointerover` が出ず、今度は載っているのに見た目が戻らない（実測: 戻って 6 秒後も `hovered: false`）。前からの挙動（外にいる間は hovered の見た目が残り、戻れば合っている）のほうが害が小さいので外した
   - 同じ理由で、ボタンの上から出て同じボタンの上へ直接戻ったときは、説明は出直さない（一度ボタンから外して載せ直せば出る）
4. `refresh()` と `owner` を消した。`src/ui.js:231` `setTooltip()` は値の入れ替えだけ、`:226` `setIcon()` から `text.setText('')` を消した
5. JSDoc: `src/ui.js:298`（タッチにはホバーが無いため。時間は `TOOLTIP.touchMs` を指す）、`src/scenes/game.js:1099-1102` `muteFace()`（本編・デモの組み立てと `toggleMute()` の 3 か所で同じ対応を使うため）、`src/scenes/game.js:302-304` `createHudButtons()`（枠はシーンに 1 つ要り、本編とデモの両方が通るのはここだけのため）

### 検証

- `node --check` を `src/*.js src/scenes/*.js` で実行: すべて成功
- `tests.html`: 「250 件すべて通った」
- Playwright（`archives/agents/TODO-042/implementer-gameout.mjs`）、800x400・マウス、Canvas は x=100〜。本編・デモとも:
  一手戻すに載せて 6 秒 → `vis: true` / `mouse.move(80, y, {steps: 1})` → 1.5 秒後 `vis: false` / pageerror・console error なし。
  待ちを 3 秒にすると本編は `vis: false` のことがあった（headless の時計が遅いため。前回報告の件）ので 6 秒にしてある
- デモを `scene.restart()` したあとに Canvas の外へ出しても、エラーは出なかった
