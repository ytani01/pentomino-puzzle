# TODO-060 tests への依頼

## 背景
`src/logic.js` の `solveStepsRandom()` を、置いた直後に `PIECE_SIZE` 未満（1〜4 マス）の閉じた空きが
できたら、すぐその手を外す形に変えた（`place` を yield → 直後に同じピースの `remove` を yield。
外した後の盤面の控えにその置き方を入れる。`remove` の `ok` は外した後の `canContinue(board)`）。
大きい空き（7 マスなど 5 の倍数でないもの）は今までどおり行き詰まるまで外さない。

## 足すテスト（`tests.html` の solveStepsRandom の群。8×8・6×10 の両方、既存の `FAST_SEED` と `mulberry32` を使う）
1. 数千手を回し、`place` のあと盤面（`place()` で手元に再現）に `PIECE_SIZE` 未満の空き領域があれば、
   **次の手が同じ名前の `remove`** であること。そういう場面が 1 回以上あったことも assert する
2. 逆に、`place` のあと小さな空きが無いのに `ok:false`（`regionsFitPieces` が偽）だった場面が 1 回以上あり、
   その次の手が `remove` でない場合があること（大きい空きではすぐ外さない、を残すため）

## 既存テスト
既存の solveStepsRandom のテストが新しい動きで落ちたら、テストの前提（「外すのは置ける手が尽きたときだけ」など）が
今回の変更で変わったものかを見て、前提の変わった部分だけ直す。直した理由を報告に書く。

## 確認
- ブラウザ（Playwright、`python3 -m http.server 8765` 経由）で `tests.html` を開き、全件通ること（件数を報告）
- **壊すと落ちるか**: `logic.js` の即時に外す条件を一時的に外して（`< PIECE_SIZE` を `< 0` など）、テスト 1 が落ちることを確かめ、元に戻す（`git diff src/logic.js` が実装担当の差分のままであることを確認）

## 報告
`archives/agents/TODO-060/tests-report.md`。返事は 5 行以内。`src/` は壊す確認以外で触らない。

## 2 回目（reviewer-report.md を受けて）

`reviewer-report.md` の次を直す。`src/` は壊す確認以外で触らない（`logic.js` の `undoLast()` は形だけ変わった）。

1. 検討の 2: 既存テスト（tests.html:1167 あたり）の `sawRun` を、即座の `remove`（置いた直後の小さな空き）では立てない
2. 作り込みすぎの 1・2: 新しく足した 2 つのテストを消し、「小さな空きの直後は同じ名前の remove」が 1 度は起きたことは
   既存テスト側に `sawImmediate` のような 1 つの assert で足す（「大きい空きはすぐ外さない」は TODO-059 の既存テストが見ている）
3. 「テストの強さで未確認のもの」: 5 マスの閉じた空きでは即座に外さないことを固定する。
   `size < PIECE_SIZE` を `size <= PIECE_SIZE` に変えると落ちることを確かめる（あわせて `< 0` でも落ちること）。確認後は元に戻し、
   `git diff src/logic.js` が確認前と同じであることを見る

全件通ること（件数）と、2 つの壊し方でそれぞれ何件落ちたかを tests-report.md に追記。
