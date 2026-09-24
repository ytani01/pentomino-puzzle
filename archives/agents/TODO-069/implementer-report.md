# TODO-069 implementer 報告

## 変更したファイル

- `src/logic.js`
  - `prevTurn(cells, origin)`（118 行付近）: `nextTurn()` と対の関数。`turnOrder()`
    を逆向きに辿る。ホイール上での「1 つ前の向き」に使う。
  - `turnPivot(fromCells, toCells, origin, point)`（199 行付近）とその内部関数
    `rawStates()` / `RAW_STEP_KINDS` / `rotateShift()` / `flipShift()` /
    `pointRotateCw()` / `pointRotateCwInverse()` / `pointFlip()` / `pointFlipInverse()`。
    ドラッグ中に向きを変えるとき、つかんでいる点（マス単位の小数座標）を
    新しい向きの座標系へ写し直す。`nextTurn()` / `prevTurn()` が使う
    `turnOrder()` は重複を間引いた並びなので、実際に何回転・裏返しが起きたか
    分からない。間引く前の生の 8 通り（`rawStates()`）の上で `fromCells` と
    `toCells` の位置を探し、その間の遷移を点にも同じだけ適用し直す形にした。

  **実装中に見つけて直したバグ**: `pointRotateCw()` / `pointFlip()` の列（2 つ目の
  座標）の式に `+1` が要ることに、実測（Playwright でドラッグ→回転）で
  気づいた。マスの**ラベル**（左上の座標）だけを平行移動の基準にすると、
  マスの中の連続した点は右・下へ最大 1 マスぶんはみ出す分だけ、実際の
  移動先とずれる。単体テスト（後述）と Playwright での実測の両方で、
  12 種すべてのピース・全ての向きの遷移で「つかんだ点が新しい形の上に
  乗っているか」「一周して戻ると元の点に戻るか」を確かめて直した。

- `src/config.js`
  - `INPUT.wheelDebounceMs = 150`（末尾近く）を追加。ドラッグ中のホイールで
    向きを変えるとき、1 段進めてから次を受け付けるまでの間。仮の値。

- `src/scenes/game.js`
  - `create()`: `this.input.addPointer(1)`（2 本目の指を受ける）、
    `this.input.mouse?.disableContextMenu()`（右クリックのメニューを出さない）、
    `pointerdown` / `wheel` のシーン全体リスナーを追加。
  - `onPiecePointerDown()`: 右クリックではタップ・ドラッグを始めない。
  - `onPointerMove()` / `onPointerUp()`: ドラッグを始めたポインタ（`id`）だけを
    見る。`onPointerUp()` は右ボタンの解放では何もしない（同じマウスの
    ポインタ ID を使い回すため、ボタンで見分ける必要があった）。
  - `onScenePointerDown()`（新規）: 右クリック、または 2 本目の指
    （`pointer.wasTouch` かつ別 ID）でドラッグ中の向きを進める。
  - `onWheel()`（新規）: ホイール下で次、上で 1 つ前。デバウンス付き。
  - `turnDrag(direction)`（新規）: `nextTurn()` / `prevTurn()` で向きを進め、
    `turnPivot()` でつかんだ点を写し直し、`this.drag.offsetX/offsetY` を
    直してコンテナを置き直す。音・影（`refreshDragGhost()`。`updateDrag()`
    と共通化）も更新する。X のように向きが 1 通りのピースは音だけ。
  - `startDrag()`: `this.drag` にドラッグを始めたポインタ（`pointer`）と
    `lastWheelAt` を持たせた。

- `tests.html`
  - `prevTurn` / `turnPivot` を import に追加。
  - `prevTurn` のテスト 2 件（nextTurn の逆順であること、X で変わらないこと）。
  - `turnPivot` のテスト 3 件（1 回転・1 裏返しで、つかんだ点（マスの中心）が
    新しい形の上に乗ること。行き来しても元の点へ厳密に戻ること）。

- `docs/UsersGuide.md`
  - 操作の表に、ドラッグ中の向きの変更（スマホ／PC）を追加。
  - 表の下に、ドラッグ中は盤に置けない向きも飛ばさず巡る旨を追記。
  - `docs/developer.md` に「タップ」の記述は無く、直す箇所は無かった
    （`rg -n "タップ" docs/developer.md` で確認）。

## 依頼の仕様との違い

なし。仕様どおりに実装した。

## 検証

- `tests.html`（Playwright、`python3 -m http.server 8765` 経由、新しい
  ブラウザコンテキスト）: **345 件すべて通った**。コンソールエラー 0 件。
- 実測（Playwright、`--no-sandbox` の headless Chromium）:
  - デスクトップ 1280×720、マウスでピースをドラッグしたまま:
    - 右クリック → 次の向きへ（`piece.cells` が変化）
    - ホイール下 1 回 → さらに次の向きへ
    - ホイール上 1 回 → 直前（右クリック後）の向きへ戻る
    - つかんでいる点（マス単位の小数座標）から一番近いマスの中心までの
      距離が、3 回の向き替えを通して**常に同じ値**（≈0.028 マス）のまま
      であることを確認（つかんでいる点が画面上の同じ位置に残っている
      ことの裏付け）。
    - 盤の上で離すと、最後の向き（ホイール上の後の形）で置かれた。
  - モバイル 844×390（`hasTouch: true` のコンテキスト、CDP
    `Input.dispatchTouchEvent`）: 1 本目の指でドラッグを始め、2 本目の指を
    押して離すと次の向きへ変わり、1 本目のドラッグは続いたまま
    （`scene.drag` が生きている）。
  - どちらもコンソールエラー 0 件。
- `DemoScene` は `create()` を丸ごと上書きしていて `super.create()` を呼ばない
  （`rg -n "super.create" src/scenes/demo.js` で確認）ので、今回追加した
  入力リスナー（`pointerdown` / `wheel` など）は登録されず、デモには
  何も影響しない。実機での確認はしていない（静的な確認のみ）。
- `node tools/gen-solutions.mjs --check`: 8×8・6×10 とも
  `src/data/*.js` と一致した（`rotateCw()` / `flip()` / `normalize()` /
  `orientations()` など、全解のデータの生成に関わる既存の関数は変えて
  いない）。

## 残る懸念・判断が要る点（初回実装時点）

- `INPUT.wheelDebounceMs`（150ms）は依頼どおり仮の値。実機のトラックパッド
  での感触は確かめていない。

（`turnPivot()` の対称な形での曖昧さは、下の「レビューの要修正 5」で
別の作りに置き換えて解消した。）

---

## レビュー対応（2 回目）

`archives/agents/TODO-069/reviewer-report.md` の要修正 4 件と検討 1 件
（I・Z の回り方）を直した。

### 1. ドラッグ前の 2 本目の指がドラッグを横取りする

- `src/scenes/game.js`: `onPiecePointerDown()` で `this.pending` に
  押したポインタ（`pointer`）を持たせ、`onPointerMove()` / `onPointerUp()`
  の「ドラッグ前（`this.pending` のみ）」の分岐でも、`this.drag` のときと
  同じく押したポインタの `id` だけを見るようにした。

### 2. タッチでずらしたマス 1 個ぶんが一緒に回ってしまう

- `src/scenes/game.js`: `startDrag()` で、タッチのときに指へ逃がした
  1 マスぶんを `this.drag.touchShiftX` / `touchShiftY` として別に持つ
  ようにした（`offsetX/Y` にはこれを足し込んだ値を入れる。今までどおり
  コンテナの位置決めに使う値は変わらない）。`turnDrag()` では、回す前に
  `touchShiftX/Y` を引いた点（＝つかんでいるマスそのものの点）を
  `turnPivot()` に渡し、回したあとで同じ `touchShiftX/Y` を足し戻す。

### 3. ドラッグ中に 2 本目の指で HUD のボタンが押される

- `src/ui.js`: `createButton()` の `pointerdown` / `pointerup` の先頭で
  `if (scene.drag) return;` を追加。本編（`GameScene`）だけが `scene.drag`
  を持つので、他の画面（タイトル・クリア・記録・デモ）の見た目・動きは
  変わらない。ドラッグ中はボタンを受けない、という管理者の判断のとおり。
  `docs/UsersGuide.md` の「どこかをタップ」の書き方は、ボタンの上でも
  向きの変更だけが起きる（誤ってボタンを押したことにはならない）ため、
  そのままで合っている（直していない）。

### 4. `addPointer` / `disableContextMenu` が本編に入るたびに積み上がる

- `src/main.js`: `Phaser.Game` の設定に `input: { activePointers: 2,
  disableContextMenu: true }` を追加。ゲーム全体に 1 回だけ効く。
- `src/scenes/game.js`: `create()` から `this.input.addPointer(1)` と
  `this.input.mouse?.disableContextMenu()` の 2 行を削除。

### 5（検討）. I と Z で、つかんだ点の回り方が理屈と違う

- `src/logic.js`: `turnPivot()` を、reviewer の案（`shapeSize(from)` の
  `rows` / `cols` を使った、右回り `[col, rows - row]` ・左回り
  `[cols - col, row]` ・裏返し `[row, cols - col]` の 3 通りの式で、
  `from` を `to` へ変える一歩がどれかを `sameShape()` で見分けて使う形）
  に置き換えた。間引く前の 8 通りを辿っていた `rawStates()` /
  `RAW_STEP_KINDS` / `rotateShift()` / `flipShift()` / `pointRotateCw()`
  / `pointRotateCwInverse()` / `pointFlip()` / `pointFlipInverse()`
  （約 110 行）はまるごと消え、`turnPivot()` の引数から `origin` も
  要らなくなった（呼び出し側 `game.js` の `turnDrag()` も合わせて直した）。

  **置き換えたあと、往復（次の向きへ→1 つ前の向きへ）で I だけ元の点へ
  戻らないことに気づいた**（Node で 12 種全部の往復を確かめて見つけた。
  下の「検証」参照）。I は向きが 2 通りしかなく、右回りと左回りが**毎回**
  同じ形になる（`rotateCw(from)` と `rotateCcw(from)` が常に一致する）ため、
  「先に一致したほうを使う」だけでは、行きと帰りで同じ向き（例えば右回り）
  を選び続けてしまい、正味 180° 回ったことになってしまう。他の 11 種は
  往復のどこかで右回り・左回り・裏返しの組み合わせが偏らないため起きない。

  対処として、右回りと左回りの両方が一致する（対称な）ときだけ、
  `shapeKey(from)` と `shapeKey(to)` の大小で一方を選ぶようにした
  （`from`/`to` が入れ替わる逆向きの呼び出しでは大小関係も入れ替わるので、
  必ず逆の向きが選ばれ、往復で打ち消し合う）。reviewer の案からの
  追加はこの 1 か所（`shapeKey` は既存の内部関数を再利用）。

- `tests.html`
  - `turnPivot` の 2 件のテストを 1 件にまとめ、L だけでなく**12 種全部**・
    右回り／左回り／裏返しの**全遷移**で、5 マスの移った先が新しい形の
    5 マスとちょうど 1 対 1 で重なるか（1 マスだけでなく全部）を確かめる
    形にした。
  - 往復のテスト（既存）はそのまま活きていて、置き換え後の
    シグネチャ（`origin` を渡さない）に合わせて直した。

## 検証（レビュー対応後）

- `tests.html`（Playwright、新しいブラウザコンテキスト）: **344 件すべて
  通った**（テストを 1 件まとめたので 345→344。コンソールエラー 0 件）。
- 置き換えた式を Node で壊して、対応するテストが落ちることを確認した
  （`tools/window-shim.mjs` 経由）:
  - 右回りの式で `rows` と `cols` を取り違える → 5 件の形で不一致
  - 左回りの式を壊す → 11 件の形で不一致
  - 裏返しの式を壊す → 6 件の形で不一致
  - タイブレーク（`shapeKey` の大小比較）を外し常に右回りを選ぶ → I の
    往復で 8 件不一致（直した現行版は 0 件）
- Playwright（CDP タッチ、844×390、`hasTouch` コンテキスト）で 1〜3 を
  それぞれ 1 回実測:
  1. 1 本目を押しただけ（8px 動く前）で 2 本目を動かしても `scene.drag`
     は `false` のまま。2 本目を離してもタップにならない。1 本目を
     8px 超えて動かして初めて `drag.pointer.id === 1` でドラッグが始まる
  2. ドラッグ中に 2 本目でタップ→離す、を 3 回繰り返し、毎回
     `piece.cells` が変わり（＝実際に向きが変わり）、`touchShiftX/Y`
     （指へ逃がした 1 マスぶん）は 3 回とも同じ値（横画面で `[55, 0]`）
     のまま
  3. ドラッグ中に、HUD のミュートボタンの真上で 2 本目をタップ→離すと、
     `piece.cells` は変わり（向きが変わった）、`audio.isMuted()` は
     変わらなかった（ボタンの `onClick` は走っていない）。ドラッグも
     続いたまま
  - CDP で 2 本目「だけ」を離すには、`touchEnd` にその指自身の点を
    載せる（`touchMove` で点を減らしても `pointer.isDown` が残ったまま
    になり、次のタップで `pointerdown` が発火しなくなる。`touchEnd` に
    残す側の点を載せると、その残す側が離れてしまう）。reviewer 報告と
    同じ実測結果になった
  - コンソールエラーは 3 件とも 0 件
- デスクトップ 1280×720、マウスでの右クリック／ホイール／盤への配置も
  1 回ずつ再実測し、`turnPivot()` のシグネチャ変更後も今までどおり動く
  ことを確認（コンソールエラー 0 件）
- 本編（`GameScene`）に 3 回入り直し（`scene.restart()`）、
  `window.game.input.pointers.length` が毎回 3 のまま増えないことを確認
  （`input.activePointers: 2` により起動時に 1 回だけ 3 本ぶん作られる）

## 残る懸念・判断が要る点（レビュー対応後）

- `turnPivot()` のタイブレーク（`shapeKey` の大小比較）は、対称な形で
  「右回りと左回りのどちらを見た目として選ぶか」を毎回決め直す形になった
  （前の版は起点からの経路で決めていた）。往復での一致は確かめたが、
  対称なピース（T・U・V・W・Z）を含む長い連続操作（何度も向きを変え
  続ける）までは確かめていない。実害は未確認。
- `docs/UsersGuide.md` の「もう 1 本の指でどこかをタップ」は、HUD の
  ボタンの上でも向きの変更だけになることを確かめたので、書き方は
  直していない（reviewer の検討 7 は見送り。指摘どおりの言い回しの
  ずれは「つかんでいるマス」への書き換えで別途直した）。
