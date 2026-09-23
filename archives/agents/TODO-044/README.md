# TODO-044 の分担

項目: [TODO-044](../../todo/TODO-044.%20ヒント表示が入のとき、残りのピースと同じ形の空きを自動で埋める.md)

| 担当 | 受け持ち | その分担にした理由 | 報告 |
|------|---------|------------------|------|
| implementer（Opus 5.5） | `logic.js` の `forcedPlacements()` と、`game.js` の埋める流れ・一手戻すとのつなぎ | 盤の変化の入口（`refreshHud()`）と履歴の扱いの設計が要るため | [implementer-report.md](implementer-report.md)（依頼は [implementer-brief.md](implementer-brief.md)。確認に使った [check-forced.mjs](check-forced.mjs)） |
| reviewer（Opus 5.5） | 差分の規約・設計・壊れる筋。main が直したあとの見直しも | 盤の変化の流れと一手戻すの挙動が変わるため | [reviewer-report.md](reviewer-report.md) |
| tests（Sonnet 5） | `tests.html` に `forcedPlacements` のテスト。壊すと落ちるかも | 実装した本人にテストの強さを判断させないため | [tests-report.md](tests-report.md) |
| screens（Sonnet 5） | 画面で埋まる・一手戻す・外すと埋め戻る・完成へ進む | 動きは画面で操作しないと分からないため | [screens-report.md](screens-report.md) |

reviewer の指摘（外すと埋め戻される件）は利用者に判断を仰ぎ、main が直した（控えを捨てる、
`undo()` を盤が変わるまで続ける、`slideIn()` にまとめる）。screens が見つけた一手戻すの空振りも main が直した。
