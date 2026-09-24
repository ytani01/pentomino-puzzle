# TODO-066 implementer への依頼

## 目的
`src/logic.js` の `solveStepsRandom()` で、5 マスの閉じた空きがあり、その形のピースが
残り（`unused`）にあれば、ほかの手より先にそのピースでそこを埋める。

## やること
1. `solveStepsRandom()` のループで、`choices` から抽選する前に、既存の
   `forcedPlacements(board, unused)`（TODO-044。同じファイルにある）で埋められる空きを探す。
   返る `{ name, cells, row, col }` を、`choices` の手と同じ形 `{ name, shape, row, col, key }` にする。
   `shape` は `shapes.get(name)` の中で `sameShape()` が一致する向き（向きの配列そのものを使う。
   `key` の `turn` はその添字）。`key` が今の盤面の `failed` に入っているものは除く。
   残ったものがあれば `pickOne()` で 1 つ選び、それを `move` として今までどおり置く
   （以降の fill・unused・stack・yield・小さな空きのチェックは共通）。無ければ今までどおり抽選。
   - 置ける手が無い（`choices.length === 0`）ときの戻り方は変えない。埋める手は `choices` の
     中に必ず含まれる（置けて、控えに無い）ので、この判定の後ろに置けばよい
2. 関数の JSDoc に、この動き（人はピース 1 つ分の穴を見れば、それに合うピースで埋める。TODO-066）を足す。
   合うピースが無い 5 マスの空きは今までどおり行き詰まってから戻す、とも書く
3. `docs/UsersGuide.md` 112〜117 行のランダムの説明と、`docs/developer.md` 239 行（または近い行）に同じことを 1 文ずつ

## 変えないもの・保つもの
- 乱数は `random` だけ（シードで手順が決まる）。`failed` の控え方、solved で終わること、yield の形
- 深さ優先 `solveSteps()`、`demo.js`、`forcedPlacements()` 自体は変えない
- `tests.html` は触らない（別担当）

## 完了条件
- `node` で `solveStepsRandom` を 8x8・6x10 それぞれ数百手回し、「place の直前の盤面に、残りのピースで埋められ
  控えに無い 5 マスの空きがあったのに、別の場所へ置いた」回数が 0 で、埋めた回数が 1 以上あることを数えて報告
  （`tools/window-shim.mjs` を使えば Node から読める）
- `node tools/gen-solutions.mjs --check` が通る

## 報告
`archives/agents/TODO-066/implementer-report.md` に変更点と数えた値。返事は 5 行以内。

## 追加（着手後に利用者が足した。上と一緒に実装する）
4. 1 の「穴を埋める手」を置いた直後、`ok`（`canContinue(board)`）が偽なら、行き詰まりを待たずに
   `undoLast()` で埋めた手を外し、続けて `stack` が空でなければもう 1 回 `undoLast()` で**その前の手**も外す
   （それぞれ yield する）。穴の形のピースはそれしか無いので、埋めて解なしなら埋める前の盤面が解なし＝
   穴を作った前の手が悪い、という判断。前の手を外したあとは今までどおりループへ戻る（`ok` が偽でも
   さらに戻り続けはしない。行き詰まったときの既存の戻り方に任せる）
   - 埋める手は穴をちょうど埋めるので、TODO-060 の小さな空きのチェックとは重ならない。
     重なりの無いように分岐を書く（同じ手を 2 回外さない）
   - JSDoc と文書 2 か所にもこの動きを 1 文ずつ足す
   - 完了条件に追加: 数百手の中で「埋めた手が解なし → remove 2 手が続く」ことを、デモと同じ判定に近づけるため
     `canContinue` に全解のデータで解の有無を見る関数を渡して（`src/solutions.js` の読み方を見て Node で
     使えるなら。無理なら `regionsFitPieces` のままでよく、その旨を報告）数え、1 回以上起きた回数と、
     2 手目の remove の name が埋める直前に置いた手の name と一致した回数を報告
