# TODO-050 の分担

| 担当 | 依頼 | 報告 |
|---|---|---|
| implementer（Opus 5.5） | implementer-brief.md | implementer-report.md |
| tests（Sonnet 5） | tests-brief.md（レビュー後の追加依頼は SendMessage） | tests-report.md |
| reviewer（Opus 5.5） | reviewer-brief.md | reviewer-report.md |
| verifier（Sonnet 5） | verifier-brief.md | verifier-report.md |
| screens（Sonnet 5） | screens-brief.md | screens-report.md |

- 探索の実装はロジックが込み入るので Opus に、テストの追加は既存の書き方に合わせるだけなので常設の tests に分けた
- 挙動が変わる項目なので reviewer を入れ、reviewer → verifier・screens の順に回した
- 振り返りは `archives/todo/TODO-050. …md` にある
