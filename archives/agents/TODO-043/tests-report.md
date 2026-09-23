# TODO-043 テスト担当の報告

## 足したテスト

`tests.html` の「試行錯誤の探索（solveSteps, TODO-040）」の節のすぐ後に
「logic：solveSteps に渡す canContinue（TODO-043）」の節を足した。
既存の `mulberry32`・`FAST_SEED`・`boardStates`・`hasSolution` を使い回し、
新しく `firstSolutionStepsWith(spec, random, canContinue, limit)` だけ足した
（既存の `firstSolutionSteps` に第 3 引数を足すのではなく別関数にしたのは、
既存のテストの呼び方を変えずに済ませるため）。8×8・6×10 の両方で回した。

1. `canContinue を渡さないと、place の ok は regionsFitPieces と一致する`
   （盤ごと 2 件）: 既定引数のときの `ok` が `regionsFitPieces(board)` と
   一致することを確かめる
2. `hasSolution を渡すと、最初の解までの手を空の盤へ当てはめると完成し、
   ok は hasSolution と一致する`（盤ごと 2 件、`boardStates` を使う）:
   `ok` が毎回 `hasSolution(solutions, board)` と一致すること、
   `ok:false` の直後が同じピースの remove であること、`ok:false` が
   1 回以上起きること（起きなければテストが落ちて分かる）、最後に完成する
   ことを確かめる。依頼の 3.（`ok:true` のあとが必ず解けるにつながる）は、
   この一致の確認で足りるとみなし別立てにしていない
3. `渡した判定が使われている: 常に偽を返す判定だと、最初の place の直後が
   remove になり、solved に至らず手を尽くす`（盤ごと 2 件）: `() => false`
   を渡すと最初の place がすぐ ok:false になり、直後が同じピースの remove、
   solved に至らないことを確かめる。**手数に 1000 の上限を置いた**
   （壊す確認で判明。後述）

合計 6 件足した。**256 件すべて通った**（元は 250 件）。

## 壊す確認

`src/logic.js` の `const ok = canContinue(board);` を一時的に
`const ok = regionsFitPieces(board);` に戻し、`tests.html` を再実行した。

- **落ちた 4 件**:
  - `hasSolution を渡すと…ok は hasSolution と一致する（8×8）`
    「N で ok が食い違う 期待 false / 実際 true」
  - 同（6×10）「P で ok が食い違う 期待 false / 実際 true」
  - `渡した判定が使われている…（8×8）`「solved に至ってしまった」
  - 同（6×10）「solved に至ってしまった」
- 残り 252 件は通った（既定引数のテストは `regionsFitPieces` 同士の比較なので
  壊しても崩れない。これは想定どおり）

壊す確認の途中で、「常に偽を返す判定」のテストを最初
`[...solveSteps(...)]`（generator を最後まで展開）で書いたところ、
`canContinue` が無視されて `regionsFitPieces` のままだと全解を辿る
探索になり、6×10 で確認用の node スクリプトが 2 分以上終わらなかった
（`tools/gen-solutions.mjs --check` の実測 466.8 秒と同じ理由）。
壊れたときにテストごとタイムアウトして道具立てが分からなくなるのを避け、
**手数 1000 の上限で例外にする**形に直した（他のテストの書き方に合わせた）。

確認後、`const ok = canContinue(board);` に戻し、`diff src/logic.js
/tmp/logic.js.bak`（壊す前に取ったコピー）で **一致（差分ゼロ）** を確認。
`git diff --stat src/logic.js` も implementer の報告と同じ 24 行（+15/-9 相当）。
`src/` に残した変更はゼロ。

## その他

- `git status` に `README.md` / `docs/developer.md` の変更が見えるが、
  自分は触っていない（別の作業によるものと見立てる。報告のみ）
