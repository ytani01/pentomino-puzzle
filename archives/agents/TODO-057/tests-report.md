# TODO-057 tests.html 担当報告

## やったこと

- `tests.html` の import から `solveStepsBreadth` を消し、`solveStepsRandom` を足した。
- 「src/logic.js — 試行錯誤の探索（solveStepsBreadth, TODO-050）」の group と
  補助関数（`breadthSteps`）・8×8 用の `firstSolvedBreadth` を丸ごと消した。
  `rg -n -i "breadth|幅優先|replay" tests.html` は空。
- 代わりに「src/logic.js — ランダムの探索（solveStepsRandom, TODO-057）」を足し、
  8×8・6×10 の両方（`BOARD_LIST` を回す）で次を確かめた。

### 足したテスト（盤ごとに 1 件ずつ、計 2 件）

- `同じシードなら最初の 300 手がまったく同じ、違うシードなら食い違う（${spec.label}）`

### 足したテスト（盤 × `canContinue`〈既定 / 常に偽〉で 2 件ずつ、計 8 件）

- `place は空いたマスにだけ置かれ、remove は盤にあるピースだけを外す（${label}, ${spec.label}）`
- `ok は渡した判定の結果と一致する（${label}, ${spec.label}）`

### 足したテスト（盤ごとに 1 件ずつ、計 2 件）

- `常に偽を返す判定だと、すべての place の直後が同じピースの remove（${spec.label}）`

解に着くこと（solved）は確かめていない（指示どおり）。

## 通過件数

`http://localhost:8765/tests.html` を Playwright で開いて確認。

**298 件すべて通った**（失敗 0 件）。

## 壊すと落ちるかの確認（結果のみ・src は元に戻し済み）

手順 5 として、一時的に `src/logic.js` の `shuffle(moves, random)` を
`shuffle(moves, Math.random)` に変えて再実行したところ、追加した
「同じシードなら最初の 300 手がまったく同じ」テストが 8×8・6×10 の
両方で失敗することを確認した（2 件失敗・296 件通過）。直後に
`shuffle(moves, random)` へ戻し、`git diff src/logic.js` が実装担当の
差分のままであることを確認した。

**注記**: 途中でコーディネーターから「今後 src/logic.js を実装担当が
書き直すので src/ には一切触らないでほしい」という指示を受けた。この
確認作業（手順 5）はその指示が届く前に完了・復元していたため、追加の
巻き戻しは発生していない。以後 src/ には触れていない。
`git status --short src/` は `icons.js` / `logic.js` / `scenes/demo.js`
の 3 件のみで、いずれも実装担当が着手前から変更していたもの。

## 判断が要る点

特になし。

## 2 回目（solveStepsRandom 書き直し後の壊れ確認）

`src/logic.js` の `solveStepsRandom` が書き直された（1 手ごとにピースと
置き方を選び直すループ）のを受け、tests.html は直さずに 2 つの変異を
一時的に入れて確認した。いずれも作業後は `\cp` でバックアップから
元に戻し、`git diff src/logic.js` が実装担当の差分のままであることを
確認済み。

### (a) `pickOne` の `random()` を `Math.random()` にする

`同じシードなら最初の 300 手がまったく同じ、違うシードなら食い違う
（8×8 / 6×10）` の 2 件が落ちた（296 件通過）。既存テストで検知できた。

### (b) `canPlace(board, shape, row, col).ok` を `true` にする（空いていないマスにも置く）

`place は空いたマスにだけ置かれ、remove は盤にあるピースだけを外す
（既定 / 常に偽 × 8×8 / 6×10）` の 4 件が落ちた（294 件通過）。
既存テストで検知できた。

### 結論

(a)・(b) とも既存のテストで落ちることを確認できたため、追加で足すべき
テストの案は無し。最終確認として `src/logic.js` を元に戻したうえで
tests.html を再実行し、**298 件すべて通った**ことを確認した。
`git diff src/logic.js` は実装担当の差分のまま（1 ファイル、
66 insertions / 79 deletions、solveStepsRandom の書き直し分のみ）。

## 3 回目（盤面ごとの「解なし」の控えのテストを追加）

`solveStepsRandom` が「解なし」を盤面ごとに覚えるようになった
（`failedByBoard`。行き詰まって戻ったときも、戻った先の盤面へ最後に
置いた手を控える）のを受け、ランダムの group に 1 件足した。

### 足したテスト（盤ごとに 1 件、計 2 件）

- `「解なし」だった置き方は盤面ごとに覚え、同じ盤面で同じ置き方をもう一度
  place しない（${spec.label}）`

手元で `place()` / `remove()` / `boardKey()` を使って盤を再現しながら、
`solveStepsRandom` 内部の `failedByBoard` と同じやり方で
（盤面のキー→控えた置き方の組の Set）を自前で組み立てる。
ok:false の直後の remove（後始末）と、行き詰まって戻る remove
（控えのスタックの先頭を pop して、戻った先の盤面へ控える）を、
直前の手が「同じ名前の ok:false な place」かどうかで区別している。
「同じ盤面・同じ置き方の place がもう一度出た」ら失敗にする。

手数は既定 20000 だと重かった（分離して計測すると 8×8 が約 2.6 秒、
6×10 が約 2.3 秒で、3 秒の目安に近すぎた）ため、8000 手に減らした
（分離計測で 8×8 が約 1.0 秒、6×10 が約 0.9 秒）。8000 手でも両方の
盤で「行き詰まって戻る」動きが起きることを確認済み（テスト内の
`sawBacktrack` の検査で担保）。

### 通過件数

**300 件すべて通った**（298 件 + 今回の 2 件。失敗 0 件）。

### 壊すと落ちるかの確認

`src/logic.js` の、行き詰まって戻るときに控えを足す行
`failedOf(boardKey(board)).add(last.key);` を、一時的に
`failedOf(boardKey(board)).clear();`（戻った先の盤面の控えを空にする）
に変えて再実行したところ、追加したテストが 8×8・6×10 の両方で
失敗することを確認した（2 件失敗・298 件通過。落ちたのはどちらも
今回足したテストで、それぞれ「Z を、以前 ok:false だった同じ盤面・
同じ置き方でもう一度 place した」「I を、…」というメッセージ）。
直後に `\cp` でバックアップから元に戻し、`git diff src/logic.js` が
実装担当の差分のままであることを確認した（1 ファイル、
78 insertions / 77 deletions）。最終確認として tests.html を再実行し、
**300 件すべて通った**。

## 判断が要る点

特になし。
