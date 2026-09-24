# TODO-068 tests 報告

## 結果

`python3 -m http.server 8765` 経由で `tests.html` を Playwright（新規ナビゲーション、
`fetch(..., { cache: 'no-store' })` で `src/logic.js` の中身が最新であることを
毎回確かめたうえで）開き、**327 件すべて通った**（うち今回足した／直したのは
7 件、残り 320 件は変更なし）。

## 直した 7 件

`hasSmallClosedRegion(board)`（`size < PIECE_SIZE` だけを見る）を
`hasUnfitClosedRegion(board)`（`!regionsFitPieces(board)`。5 の倍数でない
閉じた空き全般）に置き換え、本文の実装（`!regionsFitPieces(board)` の枝）と
揃えた。文言も「小さな空き」→「5 の倍数でない空き」に直した。

1. remove の連なり（8×8・常に偽）／2. remove の連なりの終わりで盤にピースが
残っている（8×8）／4. remove の連なり（6×10・X）／5. 同（6×10）:
`hasSmallClosedRegion` → `hasUnfitClosedRegion` への置き換えで直った
（`tests.html` の「置ける手が尽きて 1 手ずつ外す並び…」「常に偽を返す判定だと…」
の 2 節、既定・常に偽の両方の label で使っている 1 つの helper なので、
書き換えは 1 か所（helper の定義）で両方に効いた）。

3・6. 「ok:false の place の直後に、別の place が続くことがある（即座には
外さない）」: `regionsFitPieces` を `canContinue` に渡すと、ok:false は
必ず「5 の倍数でない閉じた空き」を意味し、TODO-068 の枝でその場ですぐ外れて
しまい、「行き詰まってから戻す」流れが起きなくなっていた。`canContinue` を
`regionsFitPieces` より厳しい `hasSolution(solutions, board)`（実際の解と
照合する判定。同じファイルの「hasSolution を渡すと…」の節と同じもの）に
差し替え、狙いを保った。

7. 「直前の手に近い置き方ほど選ばれやすい」（6×10）: `DEMO.randomNearPower`
を試験だけ引き上げる値を 8 → 12 に変更（実測、8×8・6×10 とも 1 盤あたり
1 秒未満。SEEDS は 5 のまま、手数も増やしていない）。

## 壊すと落ちるかの確認（項目 3）

`src/logic.js` の分岐を一時的に `emptyRegionSizes(board).some((size) => size < PIECE_SIZE)`
に戻し（**確認後に必ず元へ戻した。`git diff` で差分が implementer の変更と
一致することを確認済み**）、直した 4 件（remove の連なり系、既定・常に偽の
両方、8×8・6×10 の両方）が実際に落ちることを、ブラウザのキャッシュを避けて
`src/` を直接読む node のハーネスで確かめた（ブラウザは `<script type="module">`
の HTTP キャッシュが `fetch({cache:'no-store'})` の結果と食い違うことがあり
信頼できなかったため。実装担当の「変更前も同じ 7 件が落ちた」という誤認と
同じ落とし穴）。落ちたことを確認したので、項目 2 の「5 マスより大きい
5 の倍数でない空みができた place の次が remove」の新規テストは足していない
（狙いは直した既存テストがすでに担保している）。

## 保った点

- `src/` は最終的に implementer の変更のまま（`git diff src/logic.js` が
  implementer の diff と一致）。検証のための一時的な巻き戻しはすべて戻した。
- 既存テストの狙い（「行き詰まってから戻す」流れ、「大きい空きは即座に
  外さない」という古い前提の反転など）は書き換えの中で保つか、意図的に
  反転させた（TODO-068 で大きい空きも即座に外れるようになったため）。
- 手数（STEPS・limit）は増やしていない。SEEDS も増やしていない
  （randomNearPower の値だけを上げた）。

## 追記: reviewer 報告への対応

`archives/agents/TODO-068/reviewer-report.md` の指摘 1〜4 に対応した。
`python3 -m http.server 8765` 経由で `tests.html` を Playwright（サーバ再起動後の
新規ナビゲーション）で開き、**327 件すべて通った**（今回の変更で件数は変わらず）。

### 1（要修正）近さのテスト

`randomNearPower` を 12 に上げて通すのをやめた。代わりに、比べる対象から
「置いた直後にその場で外れる手（forced・TODO-068・TODO-067）」を除外し
（`sumMoveDistanceFromLast()` に `hasUnfitClosedRegion`・`hasPlacedFormClosedRegion`
の判定を足した）、`randomNearPower` は 4 に据えた。

Node で、テストと同じ 5 シードずつの組を 1-5・6-10・…・46-50 の 10 通りに
ずらして確かめた結果（`sum/count` の平均距離、近さあり `<` 近さなしが目印）:

| 盤 | 10 組中 OK の数 |
|---|---|
| 8×8 | 10/10 |
| 6×10 | 10/10 |

1 組（5 シード×300 手×2 通り）の実行時間は 8×8 で約 700ms、6×10 で約 730ms
（1 盤 1 秒未満）。距離の項（`moveDistance` を使った重み）を一時的に外すと
（`touch / (1 + moveDistance(...)) ** DEMO.randomNearPower` を `touch` だけに
書き換えると）、8×8・6×10 とも `near===without`（差が消える）になり、
10 組中 0/10 に落ちることを確認した（検証後に必ず元へ戻した）。

### 2（検討）remove の連なりテストの既定を hasSolution に

「置ける手が尽きて 1 手ずつ外す並び」テストの `既定` の分だけ、`canContinue` を
`regionsFitPieces` から `hasSolution(solutions, board)`（実際の解と照合。上の
「hasSolution を渡すと…」の節と同じ判定）に差し替えた。`常に偽` の分は変えていない。
`hasSolution` は本物の解へ向かうため、3000 手の途中で本当に完成する（`{type:'solved'}`
が出る）ことがあり、そこで打ち切る分岐を足した（既存のテストにはこのケースが無く、
今回追加）。

### 3（検討）TODO-067 テストの hasExactOnly

`sizes.some((size) => size === PIECE_SIZE) && !sizes.some((size) => size < PIECE_SIZE)`
を `sizes.some((size) => size === PIECE_SIZE) && regionsFitPieces(board)` に揃えた。
コメントの「即座に外すのは PIECE_SIZE 未満（1〜4 マス）だけだった」を削り、
「5 の倍数でない空みが同時にできている盤面は TODO-068 の分岐が先に外すので
確かめない」に直した。

### 4（検討）1331〜1333 行付近のコメント

「置いた手は ok の真偽によらずいったん stack に積まれ（即座には外さない）」の
「即座には外さない」を削り、`regionsFitPieces` を渡すと ok:false はすぐ外れる
（それでも「積んでから外す」手順自体は変わらない）という注記に直した。

## 壊すと落ちるかの再確認（reviewer 対応後）

キャッシュに影響されない Node のハーネス（`src/` を直接 import。ブラウザの
モジュールキャッシュが最新の `src/logic.js` を読んでいないことがあり、
`fetch(..., {cache:'no-store'})` の中身と食い違うことを実際に確認したため、
以後の壊すと落ちるかの確認はすべて Node で行った）で:

- 条件を `emptyRegionSizes(board).some((size) => size < PIECE_SIZE)` に戻すと、
  「remove の連なり」テストが 8×8・6×10、既定・常に偽のすべてで落ちる
  （`unfit/placedForm mismatch`）。
- TODO-067 の分岐（`forcedPlacements(board, ...placedNames)` の枝）をまるごと
  消すと、同じ 4 件が別の手数で落ちる。
- いずれも確認後に元へ戻し、`git diff src/logic.js` が main の変更
  （JSDoc とコメントのみ）と一致することを確認済み。
