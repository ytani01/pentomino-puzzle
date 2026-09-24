# TODO-067 の分担

- implementer（Sonnet 5）: `logic.js` の分岐（`forcedPlacements()` を置き済みのピースで流用）、JSDoc、文書 2 か所
- tests（Sonnet 5）: 新しい動きで落ちた既存 8 件の直し（うち 2 件は主張を反転）、新規テスト、壊すと落ちるかの確認。reviewer の指摘（重複テストの削除・手数の戻し）も同じ担当に続けて頼んだ
- reviewer（Opus 5.5 に上書き）: 探索の分岐が変わるのでレビューを入れた
- verifier（Sonnet 5）: `tests.html`・`--check`・デモの実物（ランダム・最速 3000 手）での数え上げ・文書との突き合わせ
- main: 依頼の組み立て、利用者への確認（外す手・着手順）、JSDoc の数の手直し

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
