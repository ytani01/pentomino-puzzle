# TODO-066 implementer 報告

## 変更したファイル

- `src/logic.js`
  - `solveStepsRandom()` の JSDoc（522 行あたり）に、5 マスの穴を残りのピースで
    先に埋めること、合わなければ今までどおり行き詰まってから戻すこと、
    埋めた直後に解なしならその手と前の手をまとめて外すことを追記。
  - `forcedMoves()` を新設（`solveStepsRandom()` の直前、546 行あたり）。
    `forcedPlacements(board, unused)` の結果を、`choices` と同じ形
    `{ name, shape, row, col, key }` に変換する。`shapes.get(name)` の中から
    `sameShape()` が一致する向きを探して `shape`・`turn`（`key` に使う）を決め、
    `failed` に入っている `key` は除く。
  - `solveStepsRandom()` の本体（609 行あたり）。`choices.length === 0` の
    早期 `continue` の後に `forcedMoves()` を呼び、非空なら `pickOne()` で
    1 つ選んでそれを `move` にする（無ければ今までどおり `choices` から
    `pickOne` → `pickWeighted`）。以降の `fill`・`unused`・`stack`・place の
    yield は共通のまま。
  - 置いた直後の分岐に、forced な手で `ok` が偽のときの二重 `undoLast()`
    （その手自身 → まだ盤にあれば直前の手）を追加。小さな閉じた空きの
    既存チェックは `else if` にして排他にした（同じ手を 2 回外さない）。

- `docs/UsersGuide.md`（112〜118 行）… ランダムの説明に、5 マスの穴を先に
  埋めることと、埋めて解なしになったときは前の手もまとめて外すことを追記。
- `docs/developer.md`（239 行）… 同じ動きを 1 文で追記。

`tests.html`・`demo.js`・`solveSteps()`・`forcedPlacements()` 自体は変更していない。

## 検証

1. **`node tools/gen-solutions.mjs --check`** → 終了コード 0（通った）。
2. 完了条件の Node 計測用スクリプト（一時ファイル、コミット対象外）を
   `ensureSolutions`/`hasSolution` を使って `canContinue` に全解データの判定を
   渡す形で書き、8×8・6×10 それぞれ複数シードで数百手回した。
   - `8x8` (steps=1200, seed=12345): placedMoves=603, filledHoleCount=8,
     wrongMiss=0, deadEndAfterFill=8, secondUndoNameMatch=8
   - `8x8` (steps=1200, seed=6789): placedMoves=604, filledHoleCount=14,
     wrongMiss=0, deadEndAfterFill=14, secondUndoNameMatch=14
   - `6x10` (steps=600, seed=4242): placedMoves=304, filledHoleCount=9,
     wrongMiss=0, deadEndAfterFill=9, secondUndoNameMatch=9
   - `6x10` (steps=600, seed=999): placedMoves=166, filledHoleCount=3,
     wrongMiss=0, deadEndAfterFill=0, secondUndoNameMatch=0
   - 「埋められる穴があったのに別の場所へ置いた回数」（wrongMiss）はどのケースも 0、
     埋めた回数（filledHoleCount）は 1 以上。「埋めた手が解なし → remove 2 手」の
     回数（deadEndAfterFill）と、2 手目の remove の name が直前に置いた手と
     一致した回数（secondUndoNameMatch）は完全に一致した。
   - `hasSolution`（全解データでの判定）を `canContinue` に渡せたので、
     「無理なら `regionsFitPieces` のままでよい」の代替は不要だった。

3. **`tests.html` を Playwright（headless Chromium）で実行**（`python3 -m
   http.server 8765` 経由。依頼書に無い検証だが、`solveStepsRandom()` を
   直接テストする既存項目があるため、壊していないか確かめた）。
   → **6 件が失敗した（残り 312 件は通った）**。失敗は次の 6 件で、すべて
   `solveStepsRandom` の既存テスト（TODO-057/060 時点の前提）に対するもの:
   - 「置ける手が尽きて 1 手ずつ外す並び…」（既定 / 常に偽, 8×8・6×10）
   - 「常に偽を返す判定だと…盤のピースがすべて外れるまで remove が続く」（8×8・6×10）
   - 「ピースと同じ 5 マスの閉じた空きは、他に置ける手が残っていれば
     即座には外さない（TODO-060, 8×8）」

## 判断が要る点・範囲外の懸念

- **上の `tests.html` の 6 件は、今回の仕様どおりに実装した結果として
  想定通り落ちている。** 特に「5 マスちょうどの閉じた空きは即座に外さない」
  という TODO-060 時点のテストは、今回の TODO-066 の狙い（5 マスの穴を
  先に埋め、埋めて解なしなら前の手もまとめて外す）と正面から矛盾する
  前提なので、実装を弱めずに直すことはできない。依頼書で「`tests.html` は
  触らない（別担当）」と明記されているため直していないが、**この 6 件を
  新しい仕様に合わせて書き換える作業が別途必要**（着手時の完了条件には
  `tests.html` の実行は含まれていなかったが、確認担当が実行すると必ず
  引っかかるはずなので先に共有する）。
- 一時的な計測スクリプトは `archives/agents/TODO-066/` には置いていない
  （`/tmp/.../scratchpad/` に置いたのみで、リポジトリには残していない）。
  再現させたい場合は上の完了条件の数値の出し方（`ensureSolutions` +
  `hasSolution` を `canContinue` に渡し、`forcedPlacements` で「forced か」
  「別の場所に置いたか」を判定しながら `place`/`remove` イベントを追う）を
  再現すれば同じ形で計測できる。

## reviewer 指摘への対応（追記）

`archives/agents/TODO-066/reviewer-report.md` のうち、コーディネーターの指示
どおり次を直した（`tests.html` は触っていない。並行する別担当の担当のため）。

1. **検討 1（JSDoc の食い違い）**: `solveStepsRandom()` の JSDoc を書き直した。
   「ピースは残りから `random` で一様に選ぶ」の前に「5 マスの穴に合う手が
   あれば必ずそれを置く。無ければ」を足し、「小さな閉じた空き……だけは
   置いた瞬間に気づいて外す」「この手の明らかな詰みだけ」を、小さな閉じた
   空きと「forced な埋めが解なしになったとき」の 2 つを列挙する書き方に
   直した（`src/logic.js` の `solveStepsRandom()` 直前の JSDoc）。
2. **検討 3・作り込みすぎ**: `forcedMoves()` を削除し、`choices` を作った
   直後に `forcedPlacements(board, unused)` を 1 回呼んで、
   `choices.flat()` から `name`・`row`・`col`・`sameShape(cells, shape)` が
   一致する手を拾う形にした（`src/logic.js` の `solveStepsRandom()` 本体）。
   鍵の組み立てと `failed` の除外は `choices` を作る箇所の 1 か所だけになった。
3. **好みの範囲**: `docs/UsersGuide.md:115` の「出ても すぐには」の余分な
   半角空白を詰めた。

### 直したあとの検証

- `node tools/gen-solutions.mjs --check` → 8×8・6×10 とも一致（通った）。
- 前回と同じ Node 計測用スクリプトを、8×8・6×10 それぞれ 1 シードで
  やり直した（`hasSolution` を `canContinue` に渡す形）。
  - `8x8`（steps=1200, seed=12345）: placedMoves=603, filledHoleCount=8,
    wrongMiss=0, deadEndAfterFill=8, secondUndoNameMatch=8
  - `6x10`（steps=600, seed=4242）: placedMoves=304, filledHoleCount=9,
    wrongMiss=0, deadEndAfterFill=9, secondUndoNameMatch=9
  - 前回（`forcedMoves()` があった実装）とまったく同じ値になった
    （同じシードなので、挙動が変わっていないことの裏付けにもなる）。
    「別の場所へ置いた回数」（wrongMiss）は 0、埋めた回数は 1 以上、
    「埋めた手が解なし」の回数と「2 手目の remove の name が一致した回数」も
    完全に一致した。
- `tests.html` は今回変更していないので実行し直していない（前回報告の
  6 件失敗の状況は変わらない見込み。別担当が直す）。
