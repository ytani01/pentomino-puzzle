# TODO-081 の分担

| 担当 | 受け持ち | 理由 |
|---|---|---|
| main | `solveStepsRandom()` の実装、config・文書 | 1 関数の数行で、込み入った設計は無い |
| tests（Sonnet 5 / medium） | `tests.html` に上限のテストを足し、壊すと落ちるか確かめる | 既存の書き方に合わせる定型作業 |
| reviewer（Opus 5.5 / high） | 差分のレビュー | 分岐（戻る条件・詰まりの数え方）が変わるため |
| measure（Sonnet 5 / medium） | 直す前と同じ条件での測り直し | 数を持ち帰るだけの作業 |

測定スクリプトは `measure-dead.mjs`（直す前の測定に main が使ったもの）。

報告: `tests-report.md`（2 回分）・`reviewer-report.md`・`measure-report.md`。
振り返りは `archives/todo/TODO-081. …md` にある。
