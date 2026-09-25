# TODO-083 の分担

| 担当 | 受け持ち | 理由 |
|---|---|---|
| main | `parseDemoParams()`・Boot と Demo の変更・文書 | 3 ファイルに数行ずつで、込み入った設計は無い |
| reviewer（Opus 5.5 / high） | 差分のレビュー | 起動の分岐と「タイトルへ」の動きが変わるため |
| tests（Sonnet 5 / medium） | `tests.html` に `parseDemoParams()` のテストを足し、壊すと落ちるか確かめる | 既存の書き方に合わせる定型作業 |
| screens（Sonnet 5 / low） | URL の 4 通りと「タイトルへ」を画面で確かめる | 手順が決まった確認 |

報告: [reviewer-report.md](reviewer-report.md)・[tests-report.md](tests-report.md)・[screens-report.md](screens-report.md)
