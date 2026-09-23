# TODO-039 の分担

| 担当 | やったこと | 報告 |
|------|-----------|------|
| main | 実装（config / boot / game / records / tests.html） | — |
| reviewer | 差分のレビュー、凹の角の修正の再レビュー（2 回） | [reviewer-report.md](reviewer-report.md) |
| screens | タイトル・本編・記録・明滅・Tween の後始末・tests.html の撮影と実測（2 回） | [screens-report.md](screens-report.md) |

- 実装は main。変わるファイルは 4 つだが、どれも既存の色の組の仕組みに 1 件足す形で、込み入ったロジックが無かったため
- 挙動（描画と Tween）が変わるので reviewer を入れ、reviewer を先、screens を後にした
- screens は定義上リポジトリへ書けないため、報告を `~/tmp/playwright-mcp/` に置き、main が写した
