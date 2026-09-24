# TODO-066 tests への依頼

## 目的
`solveStepsRandom()` の変更（TODO-066）に `tests.html` を合わせ、新しい動きのテストを足す。
変更の中身は `git diff src/logic.js` と `archives/agents/TODO-066/implementer-report.md` を読む。

## 新しい動き（テストで固定するもの）
- place の直前の盤面に、残りのピースで埋められて控えに無い 5 マスの閉じた空き（`forcedPlacements(board, 残り)`）が
  あれば、その place はそのどれか（name・向き・位置が一致）になる
- そうして埋めた place の `ok` が偽なら、直後に `remove`（埋めた手の name）、続いて盤にまだ手があれば
  `remove`（埋める直前に盤にあった最後の手の name）が来る
- 合うピースが無い 5 マスの空きは即座には外さない（TODO-060 のまま）

## やること
1. 今落ちる 6 件（implementer-report.md に列挙）を、上の動きに合わせて前提を直す。**弱めない**:
   既存の狙い（置ける手が尽きたら 1 手ずつ外す、常に偽なら全部外れるまで remove が続く、
   合う形の無い 5 マスは即座に外さない）が今も成り立つ範囲で確かめ続ける形にする。
   TODO-060 の「5 マスの閉じた空きは即座には外さない」は「合うピースが無い 5 マス」に限る形に直す
2. 新しい動きのテストを 8×8・6×10 で足す（既存の `mulberry32` とシード、`regionsFitPieces` か
   テスト用の判定を渡す既存の書き方に合わせる）。埋めて解なしの場面が必要なら、`canContinue` に
   「強制で埋めた直後の盤で偽を返す」ような判定を渡してよい
3. 壊すと落ちるかを確かめる（一時的に `src/logic.js` を壊し、戻す）:
   - `forced.length > 0` の分岐を消して常に抽選にする
   - 2 回目の `undoLast()` を消す
   - `failed.has(key)` の除外を消す（落ちなければ、そう報告するだけでよい）
   それぞれ何件落ちたかを報告。**最後に `git diff src/logic.js` が implementer の差分のままであることを確かめる**

## 変えないもの
- `src/` は壊す確認以外で触らない（見つけた問題は報告だけ。境界線上の判断も報告だけ）

## 完了条件
`python3 -m http.server 8765` 経由で Playwright で `tests.html` を開き、全件通過（件数を報告）。

## 報告
`archives/agents/TODO-066/tests-report.md`。返事は 5 行以内。
