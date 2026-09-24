# TODO-066 reviewer 報告

対象: `git diff`（`src/logic.js`・`tests.html`・`docs/UsersGuide.md`・`docs/developer.md`・`TODO.md`）。
テストの実行・計測はしていない（依頼どおり）。

## 要修正

なし。

## 検討

### 1. `src/logic.js:524-529` JSDoc の「だけは」「この手の明らかな詰みだけ」が新しい動きと食い違う

- 問題: 既存の段落が「小さな閉じた空き……**だけは**置いた瞬間に気づいて外す」「人も置いた瞬間に
  気づくのは**この手の明らかな詰みだけ**」のまま。同じ JSDoc の末尾に足した段落（埋めて解なしなら
  その場で 2 手外す）と食い違う。517 行の「ピースは残りから `random` で一様に選ぶ」も、
  穴を埋める手があるときは成り立たない。
- 根拠: 実際に読んだコード（636 行の分岐）。`docs/UsersGuide.md` は「〜ときと、〜ときだけは」へ
  直してあるので、JSDoc だけが古い。

### 2. `tests.html:1214` forced の二重 remove でも `sawImmediate` を立てるので、TODO-060 の確認が弱まる

- 問題: 「1 手ずつ外す並び」のテストで、forced の解なし（二重 remove）でも `sawImmediate = true`
  にしている。末尾の `assert(sawImmediate, '…小さな空きによる即座の remove が一度も起きなかった')` は、
  小さな空きの即座の remove が一度も起きなくても通るようになった。
- 根拠: 実際に読んだコード（1190・1215・1222・1239 行）。フラグを分けて 2 つ assert すれば元の狙いを保てる。
  このシードで小さな空きの即座の remove が今も起きているかは**未確認**（実行していない。実害は未確認）。

### 3. `src/logic.js:504` と `:591` の手の鍵の書式が 2 か所に分かれた

- 問題: `${name}:${turn}:${row}:${col}` を `choices` を作る箇所と `forcedMoves()` の両方で組み立てている。
  片方だけ変えると `failed` の突き合わせが黙って外れる（落ちずに、外した手をまた選ぶだけになる）。
- 根拠: 実際に読んだコード。代わりに `choices.flat()` から `forcedPlacements()` の結果に一致する手を
  拾えば、鍵も `failed` の除外も `choices` 側の 1 か所で済む（下の「作り込みすぎ」の 2 件目）。
  tests-report によると `failed.has(key)` を外すと 9 件落ちるので、書式がずれた場合もテストで気づける
  見込みは高い（未確認）。

### 4. `src/logic.js:636-640` 判定が正確でない `canContinue`（既定の `regionsFitPieces`）では「前の手」が穴を作った手にならない場合がある

- 問題: 1 手で合う穴が 2 つできたとき、1 つ目を埋めても `regionsFitPieces` は真のままなので、
  2 つ目を埋めて偽になったときに外れる「前の手」は 1 つ目の穴を埋めた手になる。穴を作った手は残り、
  その盤面から先へ置くたびに、新しい盤面では `failed` が空なので同じ 2 つの穴を埋めては外すことを
  繰り返しうる（机上で辿った。`failed` は外すたびに必ず新しい鍵が増えるので無限には続かない）。
- 根拠: 実際に読んだコード。デモ（`src/scenes/demo.js:298`）は `hasSolution` を渡しており、判定が
  正確なら「埋める前が解けるなら埋めても解ける」ので 1 つ目の穴を埋めた時点で偽になる。デモでは
  起きない見込み。既定の引数とテストの中だけの話。**実害は未確認**。
- 付記: 戻った先で `unused` にピースが戻り、前からあった穴に合うようになった場合も、外れる「前の手」は
  穴を作った手ではない。`TODO.md` の「穴を作った手が悪かったと判断する」という書き方とは合わないが、
  コードと文書（「その前に置いた手」）は一致している。

## 好みの範囲

- `docs/UsersGuide.md:115` 「出ても すぐには」の途中に半角空白が入っている（改行を詰めたときに残ったもの）。

## 問題なし

- `failed` の鍵: `forcedPlacements()` の `cells` と `orientations()` はどちらも `normalize()` 済みで、`row`/`col` も最小の行・列なので、`choices` と同じ鍵になる。
- 二重 `undoLast()`: 1 回目で埋めた盤面の控えに埋めた手、2 回目で前の手を置く前の盤面の控えに前の手が入る。どちらも手を選んだ盤面の鍵で正しい。`stack.length > 0` で空の盤の場合も守っている。
- TODO-060 との排他: forced で `ok` のときに小さな空きが残るのは、埋める前から小さな空きがあったときだけで、その時点で `canContinue` は偽になる。`else if` で同じ手を 2 回外すことはない。
- 無限の行き来: 外すたびに、その盤面の `failed` にまだ無い鍵が増える（選ぶときに `failed` で除いている）ので、有限で終わるか、空の盤で控えを消す既存の経路に行く。既存の 2 つの経路（空の盤で控えを消す・置ける手が尽きたら戻す）との兼ね合いも変わらない。
- `forced` が空でなければ `choices` も空でないので、`choices.length === 0` の早期 `continue` の後に置いた順で問題ない。
- テストの書き直し: 新しい 2 件（必ず穴を埋める・二重 remove の名前）が、既存 3 件で緩めた部分を補っている。上の 2 を除き、狙いは弱まっていない。
- `docs/developer.md:239`・`docs/UsersGuide.md` の説明は実装と一致。
- 規約（`setTimeout` なし、`logic.js` に DOM・Phaser なし、盤面の扱い、行長）: 違反なし。
- 範囲: 指示外の変更なし（`TODO.md` の追記は利用者が着手後に足した分）。

## 作り込みすぎ

- `src/logic.js:503`: delete: `if (turn < 0) continue;`。`shapes` と `forcedPlacements()` はどちらも `orientations(piece.cells)` から作るので必ず見つかる。代わりは無し。
- `src/logic.js:490-511`: shrink: `forcedMoves()`（JSDoc 込み 22 行）。`const forced = choices.flat().filter((m) => forcedPlacements(board, unused).some((f) => f.name === m.name && f.row === m.row && f.col === m.col && sameShape(f.cells, m.shape)));` のように数行にでき、鍵の組み立てと `failed` の除外が要らなくなる（検討 3 と同じ）。`forcedPlacements()` は先に 1 回だけ呼んで変数に入れる。

net: -15 lines possible.
