# TODO-040 reviewer 報告

対象: `git diff`（src/config.js, src/logic.js, src/main.js, src/scenes/game.js,
src/scenes/title.js, tests.html）と未追跡の `src/scenes/demo.js`。
画面の実測・デザイン・文書は見ていない。

## 要修正

なし。

## 検討

### 1. デモでは `refreshHud()` が毎フレーム呼ばれ、ボタン 4 個の文字を毎回描き直す（実害は未確認）

- `src/scenes/demo.js:117`（`advance()` の最後）→ `:170-171`（`setSelected` ×3、`setEnabled` ×1）
- `src/ui.js:167-184` の `setEnabled` / `setSelected` は値が同じでも毎回 `redraw()` を
  呼び、`redraw()` は `text.setColor()` と `markText.setColor()` を呼ぶ（`src/ui.js:141,147`）
- Phaser 3.90.0 の `TextStyle.setColor` は `this.update(false)` → `this.parent.updateText()`
  で、**値が変わらなくても文字の canvas を描き直してテクスチャを上げ直す**
  （CDN の `phaser.js` を取って確認。84201 行と 83970 行）
- 速い・最速では毎フレーム、Graphics 4 個の描き直しと Text 8 個の描き直しが走る。
  本編は盤が変わったときだけ `refreshHud()` を呼ぶので、この負荷はデモにしか無い
- fps にどれだけ響くかは測っていない。screens の担当の実機の fps で見てほしい

### 2. 枝刈りで捨てた置き方を出さなくしても、13 件のテストが全部通る

- `tests.html:760-826`。JSDoc（`src/logic.js:357-358`）と依頼（brief の 1.）が求める
  「枝刈りで捨てる置き方も place → remove の 2 手として返す」を押さえるテストが無い
- 実測: `solveSteps` を写し、`regionsFitPieces()` が偽のときは place も remove も
  出さないように変えたものを Node で回し、テスト 1・2・5・6・7 と同じ判定を
  当てた。8×8（seed 14）・6×10（seed 37）とも**どれも落ちなかった**
  （8×8 は 107 手が 45 手に減った。6×10 の seed 37 は枝刈りが一度も起きない）
- tests-report の「壊すと落ちるか」で試したのは remove だけを消す壊し方で、
  place と remove を両方消す壊し方は試していない
- 例えば「place の直後に同じ名前の remove が来る組が 1 つ以上ある（8×8 の seed 14）」
  のような 1 件で押さえられる

### 3. `place` の `cells` が generator の内部の配列そのものであることが、コードに書かれていない

- `src/logic.js:393`（`cells: shape`）。`shape` は `shapes` の Map が持つ配列で、探索は
  このあとも同じ配列を使う。`src/scenes/demo.js:101` がそれを `piece.cells` にそのまま入れる
- 今は壊れない。`piece.cells` を読む `refreshPiece` / `drawPieceEdges` / `pieceTransform` /
  `shapeSize` / `outlineEdges`（`src/logic.js:127,146`）はどれも読むだけで、`sort()` などの
  書き換えも無い。`turnPiece` は差し替え（`piece.cells = next`）で、デモからは届かない
- ただし「呼ぶ側で書き換えない」は implementer-report にしか無く、`solveSteps` の JSDoc
  （`src/logic.js:344-363`）は盤を書き換える理由だけを書いている。将来 `piece.cells` を
  その場で並べ替える変更が入ると、探索が静かに壊れる。JSDoc に 1 行あれば足りる

## 好みの範囲

- implementer-report の「範囲外で気づいたこと」に「消すなら `disableInteractive()` を
  1 行足すだけ」とあるが、`src/scenes/demo.js:55` には既に入っている。報告とコードが
  食い違っている（誰が足したかは未確認）。意図して入れたものなら問題なし

## 問題なしの観点

- 本編の HUD: `createHudButtons()`（`src/scenes/game.js:305-329`）は元の `map` の中身を
  移しただけで、位置の式・並び・`setDepth(DEPTH.hud)` は同じ。`this.buttons` と
  `undo/auto/hint/muteButton` の添字も元と同じ。`createHud()` 側の `rowY` は文字の配置に
  まだ使っているので残っていてよい
- constructor のキー: Phaser 3.90.0 の `createSceneFromFunction` は `new scene()` と
  引数なしで作る（`phaser.js` 198340 行）ので、本編は既定の `'Game'` になる。デモは `'Demo'`
- `this.state` などの名前: Phaser 3.90.0 の `Scene` のプロパティ（game〜renderer）と
  ぶつからない
- 継承で本編の処理に入る経路: `DemoScene.create()` は `createGhost`・`createTraySlots`・
  `createConfirmDialog`・`pointermove/up` の登録・`shutdown` の登録を通らない。ピースのマスは
  `disableInteractive()`（`demo.js:55`）。`settlePiece` / `refreshPiece` から呼ばれる
  `drawTurnMark` は空で上書き済みなので、`this.drag` / `this.playing` が未定義でも読まれない。
  `update` / `refreshHud` / `createHud` は上書き、`toggleMute`（`this.muteButton` を設定済み）と
  `goToTitle` の継承はそのまま動く。`init()` の継承は `this.resuming` を立てるだけで読まれない
- `storage.js` への経路: `demo.js` と `solveSteps` から `storage.js` の関数に届く呼び出しは無い
  （`persist`・`checkSolved`・`clearProgress`・`ensureSolutions` のどれも通らない）。
  ミュートの切り替えも `audio.js` のモジュール変数だけで保存しない
- `solveSteps` の探索: `tools/enumerate.mjs` と同じ（一番若い空きマス、先頭のセルで合わせる、
  `canPlace` は `fits` と同じ判定、`regionsFitPieces` は `regionsFit` と同じ判定、`unused` の
  splice と戻し方も同じ）。place / remove は LIFO で対応している
  （`random = () => 0` で最初の解まで、8×8 は 75121 手、6×10 は 201941 手を Node で回し、
  remove の名前がスタックの一番上と食い違った回数は 0）
- `update` の進め方: 最速は `performance.now() + fastestBudgetMs` を毎手見て止まり、最初の 1 手は
  必ず進む。ゆっくりで同じピースが 150ms ごとに動いても、`settlePiece` が
  `killTweensOf(piece.container)` で前の Tween を止めてから次を足す（`game.js:833`）。
  ネオンの明滅の Tween は `piece.glow` が対象なので止まらない。解を見つけたフレームも、
  `break` のあと `touched` のピースを動かしてから `refreshHud` するので位置は合う。
  シーンを離れると `update` が呼ばれず、Tween はシーンと一緒に止まり、generator は次の
  `create()` で差し替わる
- タイトル: `記録` と `デモ` を `records` の行に `START` と同じ組み方で左右に並べている。
  行は足していない。`SUB` を `title.js` に置くのは既存の `START` と同じ置き方
- 規約: `setTimeout` / `setInterval` なし、色の直書きなし、数値は `DEMO` に集約、
  トップレベルで書き換わる `let` なし、`logic.js` に Phaser / DOM なし、
  JSDoc は「なぜ」を書いている
- 範囲: 依頼に無い変更は無い（`DEPTH` の export と `createHudButtons` の切り出しは
  継承のために要る最小限）
- テスト（2. 以外）: 当てはめて完成する・place が置ける位置・形が `orientations()` のどれか・
  シードで再現する・シードで変わる・solved のあと続けられる、は押さえている。
  「全部探し終えたら終わる」は数時間かかるので、テストが無いのは妥当

## 作り込みすぎ

- `src/scenes/demo.js:193-194`: delete: `onPiecePointerDown() {}` の上書き。`:55` でマスの
  当たり判定を外し、トレイの当たり判定（`createTraySlots`）も作らないので、呼ばれる経路が
  もう無い。どちらか 1 つで足りる（依頼が上書きを指定しているので、消すなら `:55` と
  どちらを残すかは管理者の判断）。重大度は好みの範囲

net: -2 lines possible.

---

# 再レビュー（速さの作り直し後）

対象: `src/scenes/demo.js`（update / advance / onSolved / finish / refreshHud /
refreshStatus）、`src/config.js` の `DEMO`、`src/ui.js`・`README.md`・
`docs/developer.md`（と `CLAUDE.md` の表）のデモの記述。

## 要修正

### R1. 「試した手」の数え方が、`docs/developer.md` とコードで食い違っている

- `docs/developer.md:62` は「試した手は置く・外す（枝刈りで捨てた分も含む）の回数」
- コードは `place` のときだけ数える（`src/scenes/demo.js:88`。remove では増えない）。
  `解けた！ N 手目`（`:112`）も同じ数
- さらに「手」が 2 つの意味で使われている。`README.md:56`・`docs/developer.md:60`・
  `src/scenes/demo.js:12,64,72` の「1 手ずつ進む」は **place か remove の 1 回**、
  `試した手`・`N 手目` は **place の回数**。`src/config.js` の `DEMO` の JSDoc の
  「1 手には置くと外すの両方が入る」は「手 = place」の意味で書いている
- どちらに揃えるか（文書を place の回数に直すか、数え方を変えるか）は管理者の判断

## 検討

### R2. `DEMO` の JSDoc の「速いで 1 時間前後」が、書いてある前提から計算すると短い

- `src/config.js` の `DEMO` の JSDoc。前提は「最初の解までの置くは中央値で 1〜1.5 万、
  置くごとに外すも入る」なので、1 解までの手はおよそ 2〜3 万
- 速い（200ms ごと）: 2〜3 万 × 0.2 秒 = 4000〜6000 秒 ≒ **67〜100 分**。
  「1 時間前後」より長い
- 最速（60fps で 1 フレーム 1 手）: 2〜3 万 ÷ 60 = 333〜500 秒 ≒ 5.6〜8.3 分。
  「5〜10 分」と合う
- 実機では測っていない（計算だけ）。ゆっくり（400ms ごと）は 2.2〜3.3 時間になるが、
  JSDoc には書いていない

## 好みの範囲

- `src/scenes/demo.js:160` の「探索が進むたびに毎フレーム呼ぶ」は、最速のときしか
  当てはまらない（ゆっくり・速いは 400ms・200ms ごと）

## 問題なしの観点

- 前回の (1): ボタンの `setSelected` / `setEnabled` は `onSolved`・`finish`・
  `selectSpeed`・`searchNext`・`create` のときだけ呼ばれる。毎手呼ぶのは
  `refreshStatus` の `setText` だけで、Phaser 3.90.0 の `Text.setText` は値が
  同じなら描き直さない（`value !== this._text`。remove の手では文字が変わらない）
- 前回の (3): `solveSteps` の JSDoc に「読むだけにする」が入った
- `update`: 間隔ぶん待って 1 手だけ進め、`waited` を 0 に戻す。最速（`intervalMs: 0`）は
  毎フレーム 1 手。溜まった時間で何手もまとめて進むことは無い
- 速さの切り替え: `selectSpeed` が `waited` を 0 に戻すので、切り替えた直後から新しい
  間隔で数える（最速へ切り替えれば次のフレームで進む）。Tween ありから最速へ
  切り替えても、滑っている途中のピースは同じ行き先へ滑り切る。次に同じピースを
  動かすときは `settlePiece` が `killTweensOf` で止めてから置く
- Tween の重なり: 間隔 200・400ms は Tween の 180ms より長いので、同じピースの
  「置いてすぐ外す」でも滑り切ってから次が始まる（フレームの刻みで少し遅れる
  ことはあっても早まらない）
- 解いたときの最後の手: `place` と `solved` は別の手なので、最後の place は前の間隔で
  画面に反映され（Tween ありなら 180ms で滑り切る）、次の間隔で `solved` に来て止まる。
  `onSolved` の `refreshHud` で「見つけた解」も更新される
- `finish`: `state = 'done'` にしてから `refreshHud` するので `次の解を探す` は押せない
- `src/ui.js:4`・`CLAUDE.md` の表・`README.md` の「5 つのシーン」: `createButton` を
  使うのはタイトル・本編・クリア・記録・デモの 5 つで合う
- `README.md` と `docs/developer.md` の速さの説明（どれも 1 手ずつ、ゆっくり・速いは
  滑らせて音を鳴らす、最速は 1 フレームに 1 手で滑らせない）は `DEMO.speeds` と
  `advance()` に合う
- 前回の (2)（枝刈りした手のテスト）は今回の変更の範囲外で、`tests.html` はまだ直っていない

## 作り込みすぎ（再レビュー）

作り込みすぎ: なし。
