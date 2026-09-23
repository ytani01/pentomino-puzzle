# TODO-040 の分担

| 担当 | やったこと | 報告 |
|------|-----------|------|
| measure | 実装前に、ランダムな順で解に至るまでの手数と速さを Node で実測 | [measure-report.md](measure-report.md)・[measure.mjs](measure.mjs) |
| implementer | `solveSteps()`・`DemoScene`・タイトルのボタン・`DEMO` の実装 | [implementer-brief.md](implementer-brief.md)（依頼）・[implementer-report.md](implementer-report.md) |
| tests | `tests.html` に `solveSteps()` のテスト 15 件。壊すと落ちるかも確認 | [tests-report.md](tests-report.md) |
| reviewer | 差分のレビュー（3 回: 実装後・速さの作り直し後など） | [reviewer-report.md](reviewer-report.md) |
| screens | 画面と動きの実測（タイトル・HUD・3 段階の速さ・解けたとき・後始末・localStorage） | [screens-report.md](screens-report.md) |
| docs | README・docs/developer.md・CLAUDE.md の更新 | [docs-report.md](docs-report.md) |

- 実装・テスト・文書が複数のファイルにまたがるので、実装も担当に分けた。設計（継承で本編の描画を使い回す、generator で 1 手ずつ返す）は main が決めて依頼に書いた
- 速さの段階を決める材料が要るので、実装の前に measure で手数を測った
- 挙動が変わるので reviewer を入れ、reviewer を先、screens を後にした
- measure と screens はリポジトリへ書けないため、報告を外に置かせて main が写した
