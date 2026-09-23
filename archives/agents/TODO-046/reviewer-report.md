# TODO-046 reviewer 報告

対象: `git diff`（src/config.js・src/icons.js・src/ui.js・src/scenes/title.js）。コードは直していない。

実測に使ったスクリプト: `node` で `tools/window-shim.mjs` と `Phaser.Scene` のダミーを置いて
`src/icons.js` を読み込み、呼び出しを記録する Graphics に描かせた
（スクリプトはスクラッチ領域に置いたもので、リポジトリには残していない）。

## 問題なしの観点

- 循環 import: なし。`icons.js → scenes/boot.js → config.js / storage.js → solutions.js → logic.js` で、
  `icons.js` に戻る経路は無い。Node で `icons.js` を読み込めることも確認した（上のスクリプト）
- 記録の画面（`records.js:157`）: `Object.values(BOARDS)` を渡すので `icon`・`tooltip` は `undefined`。
  `createButton` の分割代入の既定値（`= null`）が効き、文字の `label` が出る（`ui.js` の
  `icon ? '' : label`）。`setLabel` を呼ぶのは一覧の行（`records.js:484`）だけで、選択の行には関係しない
- 穴の判定: 8×8 で抜けるのは (3,3)(3,4)(4,3)(4,4) の 4 マス、描くのは 60 マス（実測）
- 図の大きさ: 8×8 は ±18.7、6×10 は x ±23.5 / y ±13.9、色の見本は x ±49（外周の線込みで ±50.5）/
  y ±10.5（同 ±12）。ボタン 150×46 に収まる（実測）
- タイトルの `this.tooltip`: `title.js` に `setDepth` は無く、最後に作るので手前に出る。
  `はじめる` などは `tooltip` を持たないので `tip()` が `null` を返し、動きは変わらない。
  消すまでのタイマーは `scene.time.delayedCall`、`GAME_OUT` の購読は DESTROY で外すので、
  遷移で残るものは無い（`game.js` の HUD と同じ作り）
- `setTimeout` / `setInterval` の追加: なし
- 範囲: 指示どおり盤・色の 2 行だけ。見出しの「盤」「色」とほかのボタンは文字のまま

## 検討

### 1. `src/icons.js:203-212` 色の見本の外周と内側の線が、本編と同じ規則になっていない

JSDoc（`icons.js:190`）は「盤に置いたピースと同じ塗りと外周で描く」としているが、実測では次が違う。

- **外周の位置。** `strokeRect(x, y, cell * 2, cell)` は線の中心を矩形の辺に置くので、太さの半分が
  外へはみ出す。本編の `drawPieceEdges()`（`game.js:517` 以降）と記録の完成形
  （`records.js:578-586`）は、どちらも「外へはみ出すと隣にかぶる」ため太さの半分だけ内側へ寄せている。
  見本は小片どうしが離れているので隣にかぶる実害は無いが、規則としては別物（実害は未確認）
- **内側の区切り線（`lineStyle(1, edge, 0.5)`）。** 本編のマス目テクスチャ（`boot.js`）の区切りは
  組ごとに違う: 12 色は `darken(color, TILE.edgeDarken)`（= 黒、不透明）、ガラスは
  `GLASS.gridColor` を `GLASS.gridAlpha`（0.22）、ネオンは自分の色を `NEON.gridAlpha`（0.3）。
  見本は 3 組とも「外周の色を 0.5」で引いており、どの組の規則とも一致しない
  （実測: 12 色 `lineStyle(1,#411313,0.5)`、ガラス `lineStyle(1,#19272e,0.5)`、
  ネオン `lineStyle(1,#ff3b3b,0.5)`）
- 12 色の立体感（`TILE.bevel` の明暗の帯）、ガラスの光の筋、ネオンのにじみ（`NEON.glow`）は描いていない。
  縮めた図なので省いたのは妥当と思うが、JSDoc の「同じ塗り」とは食い違う

どこまで揃えるかは判断が要る。揃えないなら、JSDoc の「同じ塗りと外周」を実際に揃えている範囲
（塗りの色と透明度、外周の色と太さ）に合わせて書き直すのがよい。

### 2. `src/icons.js:209` 線の太さと濃さ（`1`・`0.5`）を直接書いている

CLAUDE.md「数値と色は `src/config.js` に集約する」。同じ関数の見本の寸法は `CHOICE_ICON` に
出してあるのに、区切り線の太さと濃さだけがコードに残っている。`icons.js` の既存の図形は座標の係数
（`0.15 * U` など）を直接書いているが、あれは形の定義で、線の見え方の値とは性質が違う。
1 の対応で本編の値（`TILE.border`・`GLASS.gridAlpha`・`NEON.gridAlpha`）に寄せるなら、この指摘は消える。

### 3. `src/icons.js:170-185` 穴の判定を `logic.js` の `boardCells()` で置き換えられる

`boardCells(spec)`（`logic.js:162`）が「穴を除いた置けるマス」を返し、`tests.html:463` で
「8×8 で中央 2×2 を抜く」ことまで確かめてある。`boardIcon` の二重ループと穴の条件式は、
これの書き直しになっている。`config.js:9-10` の JSDoc も、穴を矩形で持つ理由を
「`boardCells()` を盤の形に依存させないため」としており、穴の判定を 1 か所に置く設計になっている。
`for (const [row, col] of boardCells(board)) g.fillRect(...)` にすれば、穴の条件式を 2 か所で保守せずに済む。

### 4. `src/icons.js:171-172` rows / cols の入れ替えは今の盤では何もしていない

`BOARDS['6x10']` は `rows: 6, cols: 10` で既に横長（`config.js:52-53`）。`Math.min` / `Math.max` の結果は
8×8・6×10 とも元の値と同じになる。入れ替えが効くのは縦長に定義した盤を足したときだけだが、
そのときは `hole` の行と列を入れ替えていないので、穴のある縦長の盤では穴の位置がずれる
（実害は未確認。今の盤には該当しない）。「6×10 は横長に置く」という JSDoc の説明とあわせて、
入れ替えごと消して `board.rows` / `board.cols` をそのまま使えば 3 とも噛み合う。

### 5. 古くなったコメント・文書

- `src/scenes/title.js:242` `refreshPalette()` の JSDoc「見本はゲーム本編で見せる」。
  今回ボタンに見本を描いたので、この一文は事実と合わなくなった
- `src/icons.js:1-2` ファイル先頭の「HUD のボタンのアイコン（TODO-042）」と、`CLAUDE.md` の
  ファイル構成表の `src/icons.js` の行（「HUD のボタンのアイコン」）。タイトルの盤・色の図も
  ここに置いたので、どちらも範囲が足りない
- `TODO.md` の TODO-046 の節は「盤のマス目テクスチャを縮めて小片を 3 つ並べる」「色は `boot.js` が
  焼いたマス目テクスチャを縮めて使う」としているが、実装は図形で描いている
  （理由は `paletteIcon` の JSDoc にある）。決着させる前に節の記述を実装に合わせる必要がある

### 6. `src/ui.js:121-122` `createChoiceRow` の JSDoc の条件

「`icon` と `tooltip` があれば」とあるが、実際は `icon` だけで図に切り替わり、`tooltip` は独立に効く
（`createButton` の `icon ? '' : label` と `tip()`）。図だけ渡して名前が出ない選択肢を作れてしまう。
今の呼び出しは両方渡しているので実害は無い。書き方を「`icon` があれば図、`tooltip` があれば説明」に
するかどうかの判断だけ。

## 好みの範囲

- `src/icons.js:14` 画面部品のモジュール（`icons.js`）がシーンのモジュール（`scenes/boot.js`）に依存する
  向きになった。`records.js`・`game.js` も同じ関数を `boot.js` から読んでいるので前例はあり、
  循環も無い。`darken` の JSDoc（`boot.js`）の「マスの縁と、ピースの外周（`game.js`）が使う」に
  使う側が増えた、という程度

## 作り込みすぎ

- `src/icons.js:170-185`: 既存: 二重ループと穴の条件式。`boardCells(board)`（`logic.js`）で 1 ループ（上の 3）
- `src/icons.js:171-172`: delete: 今の盤で何もしない rows / cols の入れ替え。`board.rows` / `board.cols`（上の 4）
- `src/icons.js:203-206`: shrink: `let fill` / `let alpha` と if 文の 4 行。
  `const alpha = palette.glass ? GLASS.fillAlpha : 1;` と
  `const fill = palette.neon ? darken(color, NEON.fillDarken) : color;` の 2 行

net: -8 行ほど
