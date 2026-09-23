# TODO-050 tests への依頼

`src/logic.js` に幅優先の generator が足された（`rg -n "export function\*" src/logic.js` で名前を確かめる。
実装の報告は archives/agents/TODO-050/implementer-report.md）。`tests.html` の solveSteps の節
（`rg -n "solveSteps" tests.html`）の書き方・シード付き乱数に合わせてテストを足す。

確かめること:
1. 手を順に盤へ当てはめたとき、place は空いたマスにだけ置かれ、remove は置いてあるピースだけを外す（盤の整合）
2. `replay` でない place の直前の盤面の枚数が単調に増えない方向へ戻らない（段の順：展開する途中の盤面の枚数が 0,1,2… と減らない）
3. `ok: false` の place の直後は同じピースの remove
4. 最初の solved の時点で全マス埋まり、12 種が 1 枚ずつ。`canContinue` に全解の判定を渡した 8×8 なら、解のデータに含まれる解（既存テストの照合方法に合わせる）
5. 小さく終わる条件（`() => false` を渡す等、既存の TODO-043 の節の書き方）で出し切ったら done になる
6. 既存テストは変えない

テストが「壊すと落ちる」ことを 1 つは確かめる（例: 一時的に実装の replay の remove を抜いて落ちるのを見て、戻す。戻したことを git diff src/logic.js で確認）。
全件通るまでブラウザで見る。時間がかかりすぎるテスト（1 件数秒以上）は避ける。
報告は archives/agents/TODO-050/tests-report.md（足したテスト、件数、壊して落ちた確認）。返事は 5 行以内。
