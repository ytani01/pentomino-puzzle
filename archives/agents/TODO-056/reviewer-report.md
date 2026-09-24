# TODO-056 reviewer の報告

対象: `git diff`（CLAUDE.md・README.md・docs/UsersGuide.md・docs/developer.md）と
未追跡の `tools/capture.mjs`。画像の中身は見ていない。mermaid が描けるかどうかは
読んで判断しただけで、描画は試していない。

## 要修正

### 1. docs/developer.md:86-112 — 3 層の図で import の矢印が 2 本足りない

直前の文（:82）に「矢印は import の向き」とあるのに、実際にある import が描かれていない。

- `Storage --> Logic` が無い。`src/storage.js:15-17` は `./logic.js` から
  `canPlace, createBoard, normalize, orientations, place, sameShape` を import している
- `UI --> Logic` が無い。`src/icons.js:14` は `./logic.js` から `boardCells` を import している

根拠: `rg -n "^import|import\(" src tests.html` と、複数行にわたる import の `from` 行を突き合わせた。
それ以外の矢印（Scenes→UI/Logic/Sol/Storage、Storage→Sol、Sol→Logic、Sol -.→ Data、
Tests→Logic/Sol/Storage/Data）はコードと合っている。

### 2. docs/developer.md:376 — 「書き込むのは Game・Clear・Records の 3 つのシーンだけ」は正しくない

Title も書き込む。`src/scenes/title.js:238` の `savePalette(key)` が、色の組を
localStorage へ保存する。同じ developer.md の「何を、どのキーに保存しているか」の表（:262）にも
`pentomino-puzzle/palette` の行がある。この節は記録と遊びかけの話なので、文の対象を
「記録と遊びかけを書き込むのは」のように絞るか、Title を足すかのどちらかが要る。

## 検討

### 3. docs/developer.md:86-112 — 3 層の図の、書かれていない前提

- `src/config.js` が図に出てこない。ほぼ全部のファイルと `tests.html` が import しているので、
  省くのは妥当。ただ「矢印は import の向き」と書いた以上、「config.js は全員が読むので省いた」の
  1 行が無いと、読んだ人が抜けと取る
- `src/icons.js:15` が `./scenes/boot.js`（`darken, pieceColor`）を import している。
  図では UI→Scenes の矢印が無く、Scenes→UI の一方向に見える。同じ subgraph の中なので
  層をまたぐ話ではないが、「import の向き」としては実際と逆向きに読める
- `Scenes --> Phaser`（:100）は import ではない。Phaser は CDN からグローバルとして読み込まれる
  （CLAUDE.md）。また `src/ui.js:375,404-406` も `Phaser.*` を使う。UI は subgraph「シーン」の
  中なので「Phaser を読むのはシーンだけ」は subgraph の単位なら正しいが、矢印は
  `Scenes` ノードからしか出ていない。点線にして「グローバル」と添える、あるいは subgraph から
  引く、などの余地がある（実害は未確認。境界線上なので報告だけ）

### 4. tools/capture.mjs:7 / docs/developer.md:65 — `find ... | head -1` がどの Playwright を拾うか決まらない

手元の `~/.npm/_npx` には `playwright/index.mjs` が 4 つあり、版が 2 種類
（`1.63.0-alpha-2026-08-05` が 2 つ、`1.63.0` が 2 つ）。`find` の順番は
ファイルシステム次第なので、どちらの版を拾うかは決まらない。Playwright は版ごとに決まった
ブラウザ（`~/.cache/ms-playwright/chromium-1234` / `-1243`）を要求する。今は両方
入っているので動くが、キャッシュが片方だけ消えると `chromium.launch()` が
失敗することがある（実害は未確認）。
また、`find` が何も見つけないと `PLAYWRIGHT=""` になる。`:18` の `??` は空文字を
既定値に置き換えないので、`import('')` という分かりにくいエラーで落ちる。`||` なら
`'playwright'` に落ちて「package が無い」という読めるエラーになる。

### 5. tools/capture.mjs:240 — 記録の画面の ③（完成形）だけ、位置を数値で決め打ちしている

`s.detailText.x - 160, y - 355, 320×320` の決め打ち。完成形の枠は `records.js:39-62` の
モジュール定数 `L.boardBox`（横画面なら 424×320）にあり、シーンからは読めないのは
コメントのとおり。ただしレイアウトが変わると、落ちずに**ずれた位置を黙って指す**。
他の注記は部品が見つからなければ例外で落ちる（`rectOf(undefined)` が `t.type` で投げる）ので、
ここだけ壊れ方が違う。developer.md:60 の「部品の位置が変わっても追いかける」も、
この 1 件については当てはまらない。

### 6. tools/capture.mjs:198-210 — Ⓕのピースが見つからないと落ちる／撮るたびに絵が変わる

`autoPlace` は `useAuto()` を通すので `Math.random` で選ぶ（`game.js:1009`）。
置いたあとのトレイに `turnMarkKind(p) === "rotate"` のピースが 1 つも無いと、
`.find()` が `undefined` を返し、`.container` で TypeError になる。回転の印は X 以外の
ほとんどに出るので、7 枚残っていて全部が裏返しか X、という確率は低い（実害は未確認）。
同じ理由で、撮り直すたびに play.png・game.png の盤面が変わり、画像の差分が毎回出る。
`addInitScript` で `Math.random` を固定すれば両方消える。

## 好みの範囲

### 7. docs/developer.md:122-135 — シーンの図に Game→Game（やり直し）が無い

`game.js:1091` の `scene.restart()`。前の ASCII の図にも無かったので、差分で抜けた
わけではない。

## 一致したもの

- シーンの移り方: Boot→Title（boot.js:66）、Title→Game（title.js:166,262）/Records（:193）/
  Demo（:206）、Game→Title（game.js:384→goToTitle :1121-1123、確認あり）、Game→Clear
  （:1206）、Clear→Game/Records/Title（clear.js:168-183）、Records→Title（records.js:197）、
  Demo→Title（demo.js:206 の goToTitle、継承）。すべて一致
- 「いつ書き込まれるか」の表と図: saveProgress/clearProgress（game.js:940-946、refreshHud と
  onShutdown から）、addAuto（:1024）、clearProgress（やり直し :1090・完成 :1202）、
  saveBest は自力のときだけ（clear.js:74-77）、addHistory/addFound（:92-93）、
  remove*（records.js:432-434）、足した「全部消したとき」の clear*（:410-412）。一致
- Demo が storage を呼ばない（demo.js の import に storage.js が無い。create を上書きし、
  shutdown の控えも登録されない。demo.js:6-10）。一致
- mermaid の書き方: `[[ ]]`・`[( )]`・`<br>`・`subgraph id["label"]`・`-. "text" .->`・
  `A -- "text" --> B`・`stateDiagram-v2` の日本語ラベル。GitHub で描けない記法は
  見当たらない（描画は未確認）
- UsersGuide の HUD 表 1〜6: game.js:285-292 の `buttons` の並びと一致
- UsersGuide のデモ表 1〜7: demo.js:38 の SPEEDS（slow, fast, fastest）と demo.js:198-207 の並びと一致。
  4 は `state === 'solved'` のときだけ押せる（demo.js:217）、7 は確認なし（demo.js:205 のコメント）。一致
- トレイの向きの印 Ⓕ: トレイのピースだけに出る（game.js:448-458）、回転は円弧の矢印・
  裏返しは左右の両矢印（:486-504）、X は出ない（:419-422）。一致
- タイトルの ①〜⑥、ゲームの Ⓐ〜Ⓕ、記録の ①〜⑥、デモの Ⓐ・Ⓑ・1〜7: capture.mjs の annotate()
  の呼び出しと UsersGuide の記述が一致。盤と色の選択肢の説明表示（title.js:126-131）も一致
- capture.mjs が参照する部品名（boardButtons, paletteButtons, resumeButton, timeText, remainText,
  buttons, pieces, messageText, rowButtons, detailText, achieveText, removeButton, clearButton,
  statusText, hintState, useAuto, toggleHint, selectSpeed, turnMarkKind, layout.boardPanel/trayPanel）は
  すべて存在する。記録の見本データは rowButtons[3] が 57 番（おまかせ・ヒント）になる順で入る
- CLAUDE.md の規約: 依存は足していない（npx の置き場から借りる。package.json も無い）。
  docs/images/ は pages.yml の dist（index.html と src/ だけ）に入らないので、公開物は変わらない
- CLAUDE.md と developer.md のファイル構成: capture.mjs と docs/images/ の説明は食い違いなし
  （並び順が window-shim の前後で違うだけ）
- README と UsersGuide: 「docs/images/ は文書用でゲームは読まない」、盤とトレイの説明、デモの説明に食い違いなし
- 範囲: TODO-056 のチェックリストの外の変更は無い

## 作り込みすぎ

- tools/capture.mjs:19: yagni: `BASE` の環境変数。誰も設定しない。定数 1 つで足りる（好みの範囲）
- 撮り直しのコマンドが capture.mjs:6-8 と developer.md:63-66 の 2 か所にある。片方だけ直ると食い違う（好みの範囲）

それ以外は、オプション（frame・dist・side・配列の部品）がどれも実際の呼び出しで使われている。

net: -1 lines possible.
