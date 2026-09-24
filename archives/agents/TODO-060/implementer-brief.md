# TODO-060 implementer への依頼

## 目的
`src/logic.js` の `solveStepsRandom()` で、置いた直後に 1〜4 マス（`PIECE_SIZE` 未満）の
閉じた空きができたら、行き詰まるのを待たずにその手を外す。

## やること
1. `solveStepsRandom()` で `place` を yield した直後、`emptyRegionSizes(board).some((s) => s < PIECE_SIZE)`
   なら、その手を外す: `stack.pop()`、盤から消す、`unused` に戻す、**外した後の盤面**の
   `failedOf(boardKey(board))` に `move.key` を足す、`{ type: 'remove', name, ok: canContinue(board) }` を yield。
   既存の「置ける手が尽きたときに 1 手外す」処理と同じ手順なので、小さなヘルパーにまとめて両方から使ってよい。
   `place` 自体は今までどおり yield する（置いてから気づいて外す様子を見せる）。
2. 関数の JSDoc の「その場では外さない」の段落を、「小さな閉じた空き（ピースより小さい）だけは置いた瞬間に
   気づいて外す。7 や 12 マスのような大きい空きは今までどおり行き詰まってから戻す」旨に直す（TODO-060 を添える）。
3. `docs/UsersGuide.md` 112〜115 行あたりのランダムの説明と、`docs/developer.md` 239 行の「解ける / 解なし」の行に、
   同じことを 1 文ずつ足す。

## 変えないもの・保つもの
- 乱数の使い方（`random` だけ）、`failed` の控え方、solved で終わること、他の yield の形
- 規約: `setTimeout` を使わない、値は `config.js`（今回の閾値は `PIECE_SIZE` 由来なので config に足さない）
- `tests.html` は触らない（別担当）

## 完了条件
- `node -e` などで `solveStepsRandom` を数百手回し、「place 直後に小さな空きがある盤面のまま次の place が来ない」ことを
  自分で 1 回確かめる（値を報告に載せる）
- `node tools/gen-solutions.mjs --check` が通る（logic.js を触るため）

## 報告
`archives/agents/TODO-060/implementer-report.md` に変更点と確かめた値。返事は 5 行以内。

## 追加の依頼（利用者が着手後に足した）

`src/scenes/demo.js`: デモでピースを外す手（`remove`）は、**待たずにすぐ**動かす。深さ優先・ランダムの両方。

- 次の手を 1 つ先読みして持っておき（例: `this.peeked`）、`advance()` の最後で、先読みした次の手が
  `remove` なら `this.waitScale = 0`、それ以外は今までどおり `pickWaitScale(value.type)`。
  連続して外すときは 1 フレームに 1 手ずつ続けて戻る（`update()` の「1 手ずつ」は保つ）
- `startSearch()` で先読みを捨てる（探し方の切り替え・解のあとの探し直しで前の generator の手が残らないように）
- 外した**あと**の待ち（`randomRemoveMultiplier`）は変えない
- `pickWaitScale()` の JSDoc と、`docs/UsersGuide.md` のデモの説明（「1 手の間隔も少しずつ揺れる」あたり）に 1 文足す
- 最速（`intervalMs: 0`）の動きは変わらないこと

完了条件: ブラウザ（`python3 -m http.server 8765`、Playwright）でデモを開き、`window.game.scene.getScene('Demo')`
（シーン名は `main.js` で確かめる）の `advance` をラップして、remove の直前の `waitScale` が 0 になっていることを
数十手ぶん `evaluate` で集めて報告する。報告は implementer-report.md に追記。

## 2 回目の追加（reviewer-report.md を受けて。利用者が決めた）

1. `demo.js`: 待たないのは **外す手が続くとき（今の手が `remove` で、先読みした次も `remove`）だけ**。
   `place` の次が `remove` のときは今までどおり `pickWaitScale('place')` の間隔で置いた手を見せる
   （置いたピースが盤に届く前に止められないため。`config.js` の `DEMO.speeds` の JSDoc の設計を保つ）。
   `docs/UsersGuide.md` の追記もこの動きに合わせる
2. reviewer-report の 3（`demo.js` 先頭の JSDoc、`config.js` の `randomRemoveMultiplier` の JSDoc）を今の動きに合わせる
3. reviewer-report の 4: `docs/UsersGuide.md` に入れた `（TODO-060）` を外す
4. reviewer-report の 5: `pickWaitScale()` の JSDoc の「0 で上書き」を実際に合わせる（要らなければ消す）
5. reviewer-report の「作り込みすぎ」の 3 つ目: `undoLast()` が `{ type: 'remove', name, ok }` を返す形にして呼び出し側を縮める
6. `tests.html` は触らない（別担当）

完了条件: 前と同じ Playwright の計測で、`remove → remove` の直前だけ `waitScale` が 0 で、`place → remove` の直前は
0 でないことを数十手ぶん集めて報告（深さ優先・ランダム両方）。`node tools/gen-solutions.mjs --check` は logic.js の
変更が形だけなので省いてよい。報告は implementer-report.md に追記。
