# TODO-062 の分担

- implementer（Sonnet 5）: `logic.js` の重み（`moveDistance()`）、`config.js` の値、文書 2 か所
- tests（Sonnet 5）: 手順が変わって落ちた既存 1 件の直し、新規 5 件、壊すと落ちるかの確認。reviewer の指摘（重いテストを軽くする・効かない分岐を消す）も同じ担当に続けて頼んだ
- reviewer（Opus 5.5 に上書き）: 探索の重みが変わるのでレビューを入れた
- verifier（Sonnet 5）: `tests.html`・`--check`・デモの実物（ランダム・最速 2000 手）・文書と動きの突き合わせ
- main: 依頼の組み立て、利用者への確認（近さの効きが弱い件）、UsersGuide と JSDoc の言い方の手直し

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
