# TODO-069 reviewer 報告

対象: `git diff`（未コミット。`docs/UsersGuide.md`・`src/config.js`・`src/logic.js`・
`src/scenes/game.js`・`tests.html`）。コードは直していない。

測り方:

- 論理: `tools/window-shim.mjs` を読み込んだ Node から `src/logic.js` を呼ぶ
  （スクリプトは scratchpad。報告に値を載せた）
- タッチ: Playwright（`hasTouch`・844×390）と CDP `Input.dispatchTouchEvent`。
  2 本目の指を離すのは `touchEnd` にその点だけを載せる（`touchMove` で点を減らしても
  離れない。`touchEnd` に 1 本目を載せると 1 本目が離れる。実測）
- `tests.html`: `<script type="module">` を抜き出し、`document`・`localStorage` を
  最小のダミーにして Node で実行（元のまま 345 件すべて通る。依頼の件数と一致）。
  `src/logic.js` の写しを書き換えて落ちるかを見た

## 要修正

### 1. 1 本目の指で押しただけ（ドラッグ前）のときに、2 本目の指がドラッグを横取りする

- 場所: `src/scenes/game.js:638`（`onPointerMove`）、`:655`（`onPointerUp`）
- 問題: ポインタ ID を見ているのは `this.drag` があるときだけで、`this.pending` の間は見ていない。
  `addPointer(1)`（:117）で 2 本目の指のイベントが届くようになったので、今までは起きなかった次の 2 つが起きる
  - 1 本目でピースを押し、まだ 8px 動かす前に 2 本目の指が触れて少しでも動くと、`startDrag(2 本目のポインタ)` が走る。
    実測: 2 本目を (+2, +1) px 動かしただけで `drag.pointer.id === 2`。ピースは 2 本目の指へ飛ぶ
    （オフセットは 1 本目の押し始めから計算するため）
  - 同じ状態で 2 本目の指を押して離すと、`turnPiece()`（タップ）が走って `pending` が消える。
    実測: 向きが変わり、そのあと 1 本目を 40px 動かしても `drag === null`（ドラッグが始まらない）
- 根拠: 実測（上記）。「ドラッグを始めてすぐ 2 本目でタップ」はこの機能の使い方そのもので、起きやすい
- どうすればよいか: `pending` にも押したポインタ（の ID）を持たせ、`onPointerMove` / `onPointerUp` で
  ほかのポインタを無視する

### 2. タッチでずらしたマス 1 個ぶんが、向きを変えるたびに一緒に回ってしまう

- 場所: `src/scenes/game.js:717`（`turnDrag` の `point`）
- 問題: `this.drag.offsetX/Y` は、タッチでは `startDrag()` がマス 1 個ぶん足した値（指の位置）。
  それを丸ごと `turnPivot()` に渡しているので、回す軸が「つかんだマス」ではなく「指の位置」になり、
  つかんだマスから指へのずれ（横画面なら右へ 1 マス）も一緒に回る
- 根拠: Node で L を 4 回 `nextTurn`（右回転 3 回と裏返し 1 回）。指の点 − つかんだマスの点（行, 列）は
  始め (0, 1) → (1, 0) → (0, −1) → (−1, 0) → (−1, 0)。横画面ではピースが指の左にあるはずが、
  1 回目で指の上、2 回目で指の右、3 回目で指の下へ回る。依頼（implementer-brief）の
  「タッチでマス 1 個ぶんずらしている分は保つ」に合わない。マウス（ずらし無し）では起きない
- どうすればよいか: ずらした分を引いてから写し、写したあとで同じ分を足し直す
  （ずらしの量は `startDrag()` と同じ決め方。`this.drag` に持たせると 2 か所で決めずに済む）

### 3. 2 本目の指（と右クリック）で押した先の HUD のボタンが、ドラッグ中に押される

- 場所: `src/scenes/game.js:677`（`onScenePointerDown`）と `src/ui.js:294-305`（`createButton`）
- 問題: ドラッグ中に 2 本目の指で HUD のボタンをタップすると、向きが変わるうえにそのボタンの
  `onClick` も走る。ボタンは `this.drag` を見ていない（`rg -n "this\.drag" src/scenes/game.js` で
  ボタン側の判定が無いことを確認）。一手戻す・やり直し・おまかせ・ヒント・タイトルへ、がドラッグ中に走りうる
- 根拠: 実測。ドラッグ中に 2 本目の指でミュートのボタンを押して離すと `toggleMute` が 1 回呼ばれ、
  ドラッグは続いたまま。一手戻すを試したときは履歴が空でボタンが押せない状態だったので呼ばれなかった。
  一手戻すなどで盤やピースが実際に壊れるかは**未確認**。右クリックも `createButton` はボタンを
  見分けないので同じ道を通るはず（**未確認**。右クリック自体は前からできたが、今回それを操作として案内している）
- どうすればよいか: 管理者の判断。ドラッグ中はボタンを受けない、など。
  `docs/UsersGuide.md:34` の「どこかをタップ」の書き方もそれに合わせる

### 4. `addPointer(1)` と `disableContextMenu()` を、本編に入るたびに呼び足している

- 場所: `src/scenes/game.js:117-118`
- 問題: どちらもシーンでなくゲーム全体（InputManager・MouseManager）に効く。`create()` は
  新しいゲーム・やり直しのたびに走るので、ポインタが 1 本ずつ増え（上限 10）、`contextmenu` の
  リスナーもキャンバスに積み上がる
- 根拠: Phaser 3.90.0 のソース（`InputManager.addPointer` は `pointers.push`、上限 10。
  `MouseManager.disableContextMenu` は毎回 `addEventListener`）。実測: 本編に入り直すたびに
  `game.input.pointers.length` が 3 → 4 → 5 → 8（3 回入り直し）。実害（3 本目以降の指も
  「2 本目」として回す、など）は**未確認**
- どうすればよいか: `src/main.js` のゲームの設定で `input: { activePointers: 2 }` と
  `disableContextMenu: true` を渡す（Phaser の設定項目。`create()` の 2 行と、その説明の一部が消える）。
  右クリックのメニューはどちらにしてもゲーム全体で出なくなる（今の作りでも、一度本編に入れば
  タイトル・記録・デモでも出ない）

## 検討

### 5. I と Z で、つかんだ点の回り方が理屈と違う（implementer が挙げた懸念。範囲は I と Z だけ）

- 場所: `src/logic.js:236`（`turnPivot`。対称な形で `findIndex` が先に見つけた方を使う）
- 問題（Node で全 12 種・全遷移の、次と前を測った）: 食い違うのは 6 件だけで、T・U・V・W・X と
  非対称な 5 種は理屈どおり
  - I: 次の向きで左回り、前の向きで右回りになる遷移がある（縦→横は右回り、横→縦は左回り）。
    タップを重ねると、つかんだ端を軸にして行ったり来たりする
  - Z: 裏返しの 4 件が、左右の反転でなく上下の反転になる。つかんだ点を軸にした鏡の向きが違うので、
    端をつかんでいるとピースの位置が変わる（形は同じ）
- 実害: 見た目の違和感だけで、つかんだ点がピースから外れることは無い（全点が新しい形の上に乗る）。
  実害は未確認
- どうすればよいか: 下の「作り込みすぎ」6 の書き方にすると、実際の一歩（右回り・左回り・裏返し）で
  決まるので、この曖昧さごと無くなる（同じスクリプトで確かめた。後述）
- ついでに: `turnPivot` の JSDoc 末尾「実害は無いはずだが、境界線上の判断はここに書き残す」は、
  ソースに残す「なぜ」ではなくレビューへの申し送り。I・Z では実際に違うことが測れたので、
  残すならその事実を書く

### 6. テスト: 壊すと落ちるものと、落ちないもの

`src/logic.js` の写しを書き換えて `tests.html` を回した結果:

| 書き換え | 結果 |
|---|---|
| `pointRotateCw` の `+ 1` を消す | 落ちる（1 回転・往復の 2 件） |
| `pointFlip` の `+ 1` を消す | 落ちる（裏返しの 1 件） |
| `pointRotateCwInverse` の `+ 1` を消す | 落ちる（往復の 1 件） |
| `pointFlipInverse` の `+ 1` を消す | **落ちない**（345 件すべて通る） |
| `prevTurn` を `index + 1` にする | 落ちる（逆順の 1 件） |
| `RAW_STEP_KINDS` の裏返しの位置をずらす | 落ちる（裏返しの 1 件） |

`pointFlipInverse` を通るのは、逆向き（`j < i`）の道に裏返しが挟まるときだけ。往復のテストは
次の向き 1 つぶんの往復しか見ておらず、裏返しの遷移を逆に辿る組（例: 裏の起点から表の最後へ戻る
`prevTurn`）を通らない。重大度: 検討（作り込みすぎ の書き方に変えるなら、この関数ごと消える）

足りないもの:

- 上の 2（タッチのずらし）は、純関数の外（`turnDrag`）で起きるのでテストが無い。
  ずらしの扱いを純関数へ寄せるなら、テストも足せる
- 上の 5（I・Z の回り方）を捕まえるテストが無い。「次の向きの点の写し方が `rotateCw` / `flip` の
  一歩と同じ」を全ピースで見るテストなら落ちる

### 7. `docs/UsersGuide.md:42` の「運んでいる指・マウスの下のマス」

タッチではピースを指からマス 1 個ぶんずらしているので、指の下にマスは無い。
2 を直したあとの動きに合わせて書き方を検討（例:「つかんだマスを軸に回る」）。

## 作り込みすぎ

- `src/logic.js:146-266`: shrink: `rawStates`・`RAW_STEP_KINDS`・`rotateShift`・`flipShift`・
  `pointRotateCw(Inverse)`・`pointFlip(Inverse)` と、生の 8 通りの上での探索（約 110 行）。
  `turnOrder()` の隣どうしは必ず右回り 1 回か、その場の裏返し 1 回（`turnOrder` の JSDoc。
  前の向きなら左回りか裏返し）なので、その一歩だけを点に当てれば足りる。
  `const { rows, cols } = shapeSize(from)` のうえで、右回り `[c, rows - r]`・左回り `[cols - c, r]`・
  裏返し `[r, cols - c]`（どれを使うかは `sameShape(rotateCw(from), to)` などで決める。
  `turnDrag` が音のために既に `flipped` を判定している）。Node で全 12 種・全遷移・
  各マスの点（620 点）を比べると、今の `turnPivot` と一致しないのは I・Z の 30 点だけ（5 の
  食い違いそのもの）で、620 点すべてが新しい形の上に乗る。重大度: 検討（5 も一緒に片付く）
- `src/scenes/game.js:117-118`: native: 4 のとおり、Phaser のゲーム設定
  （`input.activePointers`・`disableContextMenu`）で足りる。重大度: 要修正（4 と同じ件）

## 問題の無かった観点

- 右クリックで押してもタップ・ドラッグは始まらない（`onPiecePointerDown` の `rightButtonDown()`。
  右ボタンを押したまま左で押した場合も弾くが、実害は無い）。右ボタンを離しても落とさない（`button === 2`）
- ドラッグ中の 2 本目の指: `onPiecePointerDown` は `this.drag` で弾かれる。2 本目の `pointermove` /
  `pointerup` は ID で弾かれ、ドラッグは続く（実測: 2 本目で 3 回タップして `drag.pointer.id === 1` のまま、
  向きは 3 回変わった）。1 本目を先に離すと落とし、2 本目の後の離しは何もしない（コードで確認）
- ホイールの間引きは `this.time.now` と `INPUT.wheelDebounceMs`（`config.js`）で、状態は `this.drag` に持つ。`setTimeout` は無い
- `prevTurn` は `nextTurn` のちょうど逆（Node で 63 通りの向きすべて、`prevTurn(nextTurn(x))` と `nextTurn(prevTurn(x))` が x に戻る）。X は変わらず音だけ
- `DemoScene` は `super.create()` を呼ばず、入力のリスナーも持たない（`rg` で確認）。ただし 4 の 2 つはゲーム全体に効くので、
  一度本編に入ったあとはデモでも右クリックのメニューが出ない
- トレイの縮小（`scale`）: `startDrag` で割り戻し済みの値を使い、ドラッグ中は拡大率 1 なので `turnDrag` での扱いは正しい
- 規約: `setTimeout` 無し、数値は `config.js`、状態はシーンのプロパティ。範囲外の変更は無い。
  `refreshDragGhost()` への切り出しは `updateDrag` と `turnDrag` の 2 か所で使うので妥当
