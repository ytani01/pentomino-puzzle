# TODO-042 の分担

| 担当 | やったこと | 報告 |
|------|-----------|------|
| implementer | `src/icons.js`（アイコン 12 種）、`createButton()` の `icon`・`tooltip`、説明の枠 `createTooltip()`、本編・デモの HUD、文書。レビュー後の修正も | [implementer-brief.md](implementer-brief.md)（依頼）・[implementer-report.md](implementer-report.md)・確認用 [implementer-check.mjs](implementer-check.mjs)・[implementer-gameout.mjs](implementer-gameout.mjs) |
| reviewer | 差分のレビュー（2 回: 実装後・修正後） | [reviewer-report.md](reviewer-report.md) |
| screens | 横 568x320・縦 390x844 で HUD、マウスで載せたときの説明、タッチで押したときの説明を撮影 | [screens-report.md](screens-report.md) |

- アイコンの形と、マウス・タッチで分かれる説明の出し方に判断が要るので、実装を implementer（Opus 5.5 に上書き）に分けた。設計（`createButton()` に足す引数、説明の枠は 1 シーンに 1 つ、`pointer.wasTouch` で分ける）は main が決めて依頼に書いた
- 入力の扱いが変わるので reviewer を入れ、reviewer を先、screens を後にした
- 文書は数行なので docs の担当は立てず、implementer に直させた（立てたあとで見直した）
