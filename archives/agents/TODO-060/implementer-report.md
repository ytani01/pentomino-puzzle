# TODO-060 implementer report

## 変更したファイル

- `src/logic.js`
  - `solveStepsRandom()`（519〜598 行あたり）に `undoLast()` ヘルパーを追加
    （`stack.pop()` → 盤から消す → `unused` に戻す → `failedOf(boardKey(board))` に
    `key` を足す → `{ name, ok: canContinue(board) }` を返す）。
    「置ける手が尽きたときに 1 手外す」既存処理をこのヘルパー呼び出しに置き換えた。
  - `place` を yield した直後、`emptyRegionSizes(board).some((size) => size < PIECE_SIZE)`
    なら `undoLast()` を呼んで `{ type: 'remove', name, ok }` を yield するようにした
    （`place` 自体は今までどおり yield してから外す）。
  - 関数の JSDoc の該当段落を、小さな閉じた空きだけ置いた瞬間に外す旨（TODO-060 を添えて）に書き換えた。
- `docs/UsersGuide.md`（112 行あたり）
  - ランダムの説明に、ピースより小さい閉じた空きは置いた直後に外す旨を 1 文追加（TODO-060）。
- `docs/developer.md`（239 行）
  - 「解ける／解なし」の行に同じ趣旨を 1 文追加（TODO-060）。

## 確かめた値

- `node` で `solveStepsRandom()` を 50 回分（空の盤から）回し、`place` の直後に
  `emptyRegionSizes` を自分でも計算して「ピースより小さい空きがある」場合、
  次の yield が必ず同じ手の `remove` になっているかを検証するスクリプトを実行
  （スクリプトはスクラッチパッドで作り、確認後に削除済み）。
  - 試した `place` 総数: 1841 件
  - うち置いた直後に小さな空きができた件数: 1472 件
  - そのうち次の yield が対応する `remove` でなかった件数（違反）: **0 件**
- `node tools/gen-solutions.mjs --check` … 終了コード 0
  - `8×8: 全 520 解、代表形 65 件（5.1 秒）` → `src/data/8x8.js` と一致
  - `6×10: 全 9356 解、代表形 2339 件（159.0 秒）` → `src/data/6x10.js` と一致

## 追加の依頼（`demo.js`: remove を待たずに動かす）

### 変更したファイル

- `src/scenes/demo.js`
  - `create()`: `this.peeked = null` を追加（1 手先読みした generator の結果を持つ）。
  - `pickWaitScale()` の JSDoc に、先読みした次の手が `remove` なら `advance()` が
    0 で上書きする旨を追加。
  - `advance()`: `this.steps.next()` の直接呼び出しを `this.peeked ?? this.steps.next()`
    に変え、末尾で次の手を `this.peeked = this.steps.next()` として先読みし、
    それが `remove` なら `this.waitScale = 0`、そうでなければ今までどおり
    `this.pickWaitScale(value.type)` にした（外した後の待ち `randomRemoveMultiplier` は
    remove を実際に処理したときの `pickWaitScale('remove')` 呼び出しのみが使うので変えていない）。
  - `startSearch()`: `this.peeked = null` を追加（探し方の切り替え・解のあとの
    探し直しで前の generator の先読みを持ち越さない）。
- `docs/UsersGuide.md`（112 行あたり）: 外す手は深さ優先・ランダムどちらも
  待たずにすぐ動かす旨を 1 文追加（TODO-060）。

### 確かめた値

Playwright（`~/.npm/_npx/*/node_modules/playwright`、`tools/capture.mjs` と同じ借り方）で
`python3 -m http.server 8765` 上のデモを開き、`window.game.scene.getScene('Demo')` の
`steps.next` と `advance` を一時的にラップして、実際に処理された手の順番（`movesInOrder`）と
各手の直前の `waitScale`（`waitScaleLog`）を記録するスクリプトで確認（確認後にスクリプトは削除）。
`selectSpeed('fastest')` にして Phaser の `update()` に自然に進めさせ、手動では `advance()` を呼んでいない。

- 深さ優先: `moves=47`、うち `remove` は 17 件、直前の `waitScale` が 0 でなかった件数（違反）: **0 件**
- ランダム: `moves=200`、うち `remove` は 98 件、直前の `waitScale` が 0 でなかった件数（違反）: **0 件**
  （`place` の直前の `waitScale` は 0.5〜3 程度でランダムに揺れており、`remove` のときだけ 0 になっていることを確認）

初回の計測スクリプトでは wrap を入れる前に Phaser の自然な `update()` が数手進めてしまい、
`movesInOrder` と `waitScaleLog` が 1 手ずれて `remove` の直前が 0 でないように見える誤りがあった
（`this.peeked` が wrap 前の生の `next()` で埋まっていたため）。`scene.startSearch()` を呼んで
新しい generator を作った直後に wrap を入れ直すことで解消し、上の値を得た。

## 2 回目の追加（reviewer-report.md を受けて）

reviewer-report.md の指摘に沿って直した。

### 変更したファイル

- `src/scenes/demo.js`
  - 先頭の JSDoc: 「ピースより小さい閉じた空きができたときだけは行き詰まりを
    待たずにその場で外す（`logic.js`）」「外す手が連なるときは待たずに続けて戻す
    （`advance()` の先読み）」の 2 文を追加（TODO-060）。
  - `pickWaitScale()` の JSDoc: 「外す手が連なるとき（今の手も次に先読みした手も
    `remove`）だけ `advance()` が 0 で上書きする」に直した（1 回目は「次が remove
    なら 0 で上書き」と書いていて、`place → remove` でも 0 になる誤りだった）。
  - `advance()`: `nextIsRemove` だけでなく `value.type === 'remove'`（今の手も
    remove）も条件に加えた `skipWait` を新設し、両方成り立つときだけ
    `waitScale = 0`。`place → remove` は今までどおり `pickWaitScale('place')` の
    間隔で待つようにした（置いたピースが Tween で盤に届く前に `remove` 側の
    `killTweensOf()` に止められ、置いた手がほぼ見えなくなる指摘 reviewer-report §1 の対応）。
  - `create()` の `this.peeked` のコメントを「外す手が連なるときだけ待たせない」に直した。
- `src/config.js`
  - `randomRemoveMultiplier` の JSDoc に「外す手が連なるとき（次も外す手のとき）は
    待たずに続けて動かすので掛からない」を追記（reviewer-report §3）。
- `docs/UsersGuide.md`
  - 「外す手（深さ優先・ランダムのどちらも）は待たずにすぐ動かす」を
    「外す手が連なるとき…は待たずに続けて動かす。置いた手そのものは今までどおりの
    間隔で見える」に直し、`（TODO-060）` の 2 か所を削除した（reviewer-report §1・§4）。
- `src/logic.js`
  - `undoLast()` が `{ type: 'remove', name, ok }` をそのまま返す形にし、
    呼び出し側（置ける手が尽きたときのループ、小さな空きをその場で外すところ）の
    分割代入・詰め直しを `yield undoLast()` / `const step = undoLast(); yield step; if (step.ok) break;`
    に縮めた（reviewer-report「作り込みすぎ」§3）。

`tests.html` は指示どおり触っていない（reviewer-report §2・「作り込みすぎ」§1・§2 は別担当の範囲）。

### 確かめた値

Playwright で、`remove → remove` の直前と `place → remove` の直前の `waitScale` を
別々に集計するスクリプトで確認（確認後に削除）。`steps.next`・`advance` をラップし、
`startSearch()` を呼んだ直後（新しい generator を作った直後）に wrap を入れ直して
1 手ずれを防いだ（1 回目の確認で気づいた手順）。

- 深さ優先（8×8、`moves=65`、解けて終了）: `remove → remove` 0 件（この実行では発生せず）、
  `place → remove` 26 件、`waitScale == 0` の違反 0 件
- 深さ優先（6×10、`moves=205`）: `remove → remove` 0 件（この実行でも発生せず）、
  `place → remove` 96 件、違反 0 件
- ランダム（8×8、`moves=600`）: `remove → remove` **51 件**、`waitScale != 0` の違反 0 件。
  `place → remove` 245 件、`waitScale == 0` の違反 0 件
  （`place` の前後の `waitScale` は 0.5〜3 程度で揺れており、`remove → remove` のときだけ
  きっちり 0 になっていることを確認）

深さ優先は今回試した 2 つの盤・シードでは `remove → remove` の連なりが 1 度も起きなかった
（`solveSteps()` は 1 手外すごとにすぐ別の置き場所が見つかりやすく、連続で外すことが
少ない）。`skipWait` の条件は探し方によらず同じコードなので、ランダムの 51 件で
`remove → remove` 側の分岐を実地に確認できていることで足りると判断した。

## 判断が要る点・気づいたこと

- 深さ優先で `remove → remove` の連なりが実際に画面で起きる場面を実測できていない
  （上記のとおり今回のシードでは発生しなかった）。コード上は同じ条件式を通るので
  動くはずだが、気になるなら 6×10 でシードや手数をさらに増やして確かめる余地がある。
