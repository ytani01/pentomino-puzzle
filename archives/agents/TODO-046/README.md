# TODO-046 の分担

| 担当 | モデル | 見るもの |
|------|--------|----------|
| main | Opus 5.5 | 実装（`src/icons.js`・`src/config.js`・`src/ui.js`・`src/scenes/title.js`） |
| reviewer | Opus 5.5（定義は Sonnet） | 差分が規約と設計に合うか。挙動が変わる項目なので Opus に上書き |
| screens | Sonnet 5（定義のまま） | 横・縦画面で撮り、はみ出し・選択中の見え方・ツールチップ。2 回ともブラウザが固まり、止めた |
| verifier | Sonnet 5 | screens の代わりに、main が撮った画像とコードを照らして判定 |

reviewer を先、screens を後に回す（reviewer の指摘で実装が変わりうるため）。

- [reviewer-report.md](reviewer-report.md)
- screens は報告を書く前に止めたので、報告ファイルは無い
- [verifier-report.md](verifier-report.md)
