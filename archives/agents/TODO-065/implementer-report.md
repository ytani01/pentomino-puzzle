# TODO-065 implementer-report

## 変更したファイル

- `src/logic.js:126-152`（`nextTurn()` の後）… `orientationSteps(from, to)` を追加。
  `rotateCw`・`flip`・`normalize`・`sameShape` だけを使い、幅優先探索で最短の道
  （回転・裏返しの順方向だけ）を返す純関数。`from` は含まず `to` を含む配列
  `{ cells, kind }`（`kind` は `'rotate'`／`'flip'`）。同じ向きなら空配列。
- `src/config.js:729-785` … `DEMO` の JSDoc に `randomTurnStepMs` の説明を追加し、
  `DEMO.randomTurnStepMs = 150`（仮値）を追加。
- `src/scenes/demo.js` … 以下を変更。
  - クラス先頭の JSDoc に、ランダム・`animate` で回して見せる旨を追記
  - `create()` に `this.turning = null` / `this.turnTimer = null` を追加
  - `advance()`: ランダム・`animate` の `place` で `orientationSteps()` を計算し、
    段があれば `playTurns()` を呼んで戻る（無ければ今までどおり `finishStep()`）
  - `playTurns(piece, steps, index, value, animate)` を新設: 1 段ずつ
    `piece.cells` を書き換えて `refreshPiece()` で描き直し、`audio.rotate()`／
    `audio.flip()` を鳴らし、`scene.time.delayedCall(DEMO.randomTurnStepMs, …)`
    で次の段へ。最後の段の後に `finishStep()` を呼ぶ
  - `cancelTurn()` を新設: 回している途中の予約（`this.turnTimer`）があれば
    その場で最終の向きへ進めて `finishStep()` を呼び、予約を残さない
  - `finishStep(value, animate, piece, turnCount)` を新設:
    元の `advance()` の後半（置く／外すの仕上げ、次手の先読み、`waitScale` の
    決定）をそのまま持ってきたもの。`turnCount > 0` のとき、
    `waitScale` に `(turnCount × DEMO.randomTurnStepMs) / intervalMs` を足す
    （`waitScale` は `intervalMs` に掛ける倍率なので、足したい実時間を
    `intervalMs` で割って倍率へ直した）
  - `selectSpeed()` と `startSearch()`（`toggleStrategy()`・`searchNext()` は
    `startSearch()` 経由）の先頭で `cancelTurn()` を呼び、予約を残さない
    （タイトルへ戻る場合はシーン切り替えで `scene.time` ごと止まるので変更なし）
- `tests.html`:
  - `import` に `orientationSteps` を追加
  - `orientationSteps` のテストを 5 件追加（同じ向きで空、1 回転、裏返しだけ、
    裏返し＋回転 2 回、X はどれを渡しても空）
- `docs/UsersGuide.md`（ランダムの説明）… 「盤へ滑らせる前に、トレイでの今の
  向きから置く向きまで回転・裏返しで合わせてから置く」の 1 文を追加

## 判断したこと

- `orientationSteps()` は BFS（幅優先探索）で実装した。`rotateCw`・`flip` は
  どちらも「その場での順方向」の変換で、逆回転の生成子が無いため、
  ダイヘドラル群（位数 8）の有向 Cayley グラフを辿る形になる。実測でも
  「裏返し＋回転 2 回」で最短 3 段になることを確認済み（利用者の想定と一致）。
  この探索は `turnPiece()` が使う `turnOrder()`（順方向だけの巡り）と同じ考え方。
- 「裏返し＋回転 2 回」のテストは、`(flip, rotate, rotate)` と
  `(rotate, rotate, flip)` のどちらも数学的に同じ最終形へ至る最短路（180°回転は
  可換なため）なので、段の並び順ではなく段数（3）と種別の内訳（裏返し1・回転2）
  だけを確かめる形にした。
- 予約を残さない仕組みは、単に `delayedCall` を消すだけでなく、途中で切られた
  手を `cancelTurn()`内で即座に最終形へ進めて `finishStep()` を呼ぶ形にした。
  これは、探索の generator が内部でその手をすでに適用済み（盤面を書き換え済み）
  なので、画面側だけ仕上げずに放置すると内部状態と表示がずれるため
  （`startSearch()` 側では続けてトレイへ戻すので整合する）。

## 検証

- `node tools/gen-solutions.mjs --check`: **通った**（exit 0）。
  `8×8: 全 520 解、代表形 65 件（6.7 秒）→ src/data/8x8.js と一致した` /
  `6×10: 全 9356 解、代表形 2339 件（183.3 秒）→ src/data/6x10.js と一致した`
- `tests.html`（Playwright・新しいコンテキスト・`python3 -m http.server 8765` 経由）:
  **338 件すべて通った**。`pageerror`・console error は 0 件。
- デモ・ランダム・ゆっくりで実機（Playwright, headless Chromium）を動かし、
  `finishStep()` を差し替えて `place` ごとの回した段数を記録:
  - 1 回目（ゆっくり、14 手）: `[2,0,1,3,0,2,0,1,0,1,0,1,0,2]` →
    分布 `{0:6, 1:4, 2:3, 3:1}`
  - 2 回目（速い、途中で速さ・探し方・最速への切り替えを挟みつつ 23 手）:
    `[0,0,0,0,0,0,2,1,1,2,2,1,1,2,0,2,0,0,1,1,3,1,3]` →
    分布 `{0:9, 1:7, 2:5, 3:2}`。切り替え後も `turnTimer`・`turning` が
    残っていないことを確認（リーク無し）
  - どちらもコンソールエラー 0 件、段数はすべて 0〜3 の範囲

## 残る懸念（当初の実装分）

- `DEMO.randomTurnStepMs = 150` は仮値（brief の指示どおり）。画面で見て
  利用者に決めてもらう必要がある。
- 範囲外だが気づいたこと: 深さ優先や `animate: false`（最速）では回さない
  仕様のとおり実装したが、これらの経路は自動テストでは「回らないこと」を
  明示的には確認していない（`strategy !== 'random' || !animate` の分岐で
  `advance()` が新しい経路に入らないことはコードレビューで確認できる程度）。

---

## レビューの指摘への対応（reviewer-report.md）

### 要修正 1: 回している間に `update()` が次の `advance()` を呼ぶ

`src/scenes/demo.js` の `update()` 冒頭に、`if (this.turning) return;` を追加
（`this.state === 'loading'` の直後）。回している間は `this.waited` を数えず、
`playTurns()` の `delayedCall` の鎖だけが段を進める。回し終えて
`this.turning = null` にしたあと初めて `this.waited` が増え始めるので、
「回した時間が自然に次の待ちへ足される」形になった。これにより
`turnCount`／`extraScale`（`waitScale` へ回した時間を倍率換算して足す処理）が
不要になったので削除し、`finishStep(value, animate, piece)` の引数から
`turnCount` を外した（JSDoc も対応する説明を削除）。

`turnTimer` が上書きされないことは、`this.turning` の間は `advance()` 自体が
呼ばれなくなったので構造的に起きない（`playTurns()` は `advance()` からしか
呼ばれない）。実測でも `turnTimer` が非 null のときに `playTurns()` が
呼ばれた回数を数えて 0 件だった（下の「検証」参照）。

### 要修正 2: テストが「最短でない道」を返す壊し方で落ちない

`tests.html` に次を追加。
- `orientationSteps は回転してから裏返す 2 段の道も返す` … `flip(rotateCw(start))`
  を目標にした明示の 2 段テスト
- `orientationSteps は全ピース・全向きの組で最短になる` … 12 種 × 全向きの組
  （405 組）で、`orientationSteps()` とは別に書いた `orientationDistance()`
  （深さごとに届く形を総当たりで広げるだけの、キュー・訪問済み管理を使わない
  独立な最短段数の数え方）と段数が一致すること、3 段以内であること、各段が
  前の段から `rotateCw`／`rotateCcw`（`kind: 'rotate'`）か `flip`
  （`kind: 'flip'`）のどちらかで移れること、最後が目標と一致することを確認

レビューが挙げた壊し方 2 つ（右回りだけに戻す・幅優先を深さ優先に化ける
`queue.pop()`）を Node で個別に再現し、強くしたテストと同じ判定にかけたところ、
**どちらも即座に落ちる**ことを確認した（`orientationDistance()` はテストと
同一のものを使用）。
- 右回りだけ（左回転が無い版）: 4 組目で失敗
  （`F 段数が最短でない（期待 1 / 実際 3）`）
- 深さ優先に化けた版（`queue.pop()`）: 3 組目で失敗
  （`F 段数が最短でない（期待 2 / 実際 4）`）

### 検討 3: 左回転も使って最短にする

`src/logic.js` に `rotateCcw(cells)` を追加（`rotateCw` の逆。
`(行, 列) → (-列, 行)`）。`orientationSteps()` の BFS が辿る生成子を
`rotateCw`・`rotateCcw`・`flip` の 3 つにした（`kind` はどちらの回転も
`'rotate'` のまま。音は区別しない）。右回りだけだった修正前は 405 組中 84 組が
3 段だったが、左回転を足しても**利用者と決めた上限（最大で裏返し 1 回＋
回転 2 回 = 3 段）は変わらない**ことを、全 405 組の総当たりテストで確認した
（`rotateCw(rotateCw(flip(start)))` のような、180° 回転を挟む組は左右どちらの
回転でも 3 段のまま短くならない。これは 180° 回転がダイヘドラル群の中心元で、
裏返しと可換なため）。左回転の音は `audio.rotate()`（右回転と同じ）のまま。

### 検討 4: `docs/developer.md` に回す動きが無い

`docs/developer.md` の「探し方」の行（`ゆっくり`・`速い`・`最速` の説明がある
表）に、「`ゆっくり`・`速い` では、盤へ滑らせる前にトレイでの今の向きから
置く向きまで、`orientationSteps()`（`logic.js`）が返す最短の回転・裏返しで
1 段ずつ回して見せる（`playTurns()`。TODO-065）」を追記。

### 作り込みすぎ（reviewer 「検討」扱い、対応せず）

`playTurns()` の `animate` 引数・`this.turning.animate` の省略、
`this.turning`／`this.turnTimer` を 1 つへまとめる案は、レビューで
「好みの範囲」とされており、今回の依頼（要修正 1・2、検討 3・4）には
含まれていないため見送った。`turnCount` の削除は要修正 1 の直し方に伴って
自然に行った。

## 変更したファイル（追加分）

- `src/logic.js`: `rotateCcw()` を追加。`orientationSteps()` の生成子を
  3 つに変更、JSDoc を更新
- `src/scenes/demo.js`: `update()` に `this.turning` の早期リターンを追加、
  `finishStep()`／`playTurns()`／`cancelTurn()`／`advance()` から `turnCount`・
  `extraScale` を除去
- `tests.html`: `rotateCcw` の import、2 段テスト、全 405 組の最短性テストを追加
- `docs/developer.md`: 「探し方」の行に 1 文追加

## 検証（追加分）

- `node tools/gen-solutions.mjs --check`: **通った**（exit 0）。
  `8×8` `6×10` ともに `src/data/*.js` と一致した（`rotateCcw` の追加・
  `orientationSteps()` の変更は `orientations()`／求解には影響しないことを確認）
- `tests.html`（Playwright・新しいコンテキスト・`http.server 8765` 経由）:
  **340 件すべて通った**（元 338 件 + 今回追加した 2 件）。`pageerror`・
  console error は 0 件
- デモ・ランダムを Playwright で動かし、`advance()` が `this.turning` が
  真の間に呼ばれた回数と、`turnTimer` が非 null のまま `playTurns()` が
  再度呼ばれた回数を計測（`finishStep()` の呼び出しも合わせて監視）:
  - 速い・30 手: `advanceWhileTurning: 0` / `turnTimerOverwritten: 0` /
    コンソールエラー 0 件
  - ゆっくり・29〜30 手（40 秒のタイムアウト内で 29 手到達）:
    `advanceWhileTurning: 0` / `turnTimerOverwritten: 0` / コンソールエラー 0 件
- 壊し方 2 種（右回りだけ・`queue.pop()` で深さ優先化）を Node で再現し、
  強くしたテストと同じ判定で即座に落ちることを確認（上の「要修正 2」参照）

## 残る懸念（追加分）

- `DEMO.randomTurnStepMs = 150` は引き続き仮値のまま。
- ゆっくり・30 手の実測は 40 秒のタイムアウト内で 29 手までしか進まなかった
  （`slow` はもともと 1 手 400ms 以上かかる想定どおりで、異常ではない）。
  境界線上の判断はしていないので、気になる場合はタイムアウトを伸ばして
  再確認してほしい。
