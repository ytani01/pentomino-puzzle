# TODO-061 の分担

- implementer（Sonnet 5）: `logic.js` の狭い所の数え方（`countCellMoves()`・`pickTightCell()`）とピースの抽選、`config.js` の値、JSDoc、文書 2 か所
- tests（Sonnet 5）: 固定シードに頼って落ちた既存 2 件の直し、新規 6 件、壊すと落ちるかの確認。reviewer の指摘（最初の 1 件で打ち切らない）も同じ担当に続けて頼んだ
- reviewer（Opus 5.5 に上書き）: ピースの選び方が変わるのでレビューを入れた
- verifier（Sonnet 5）: `tests.html`・`--check`・デモの実物（両盤 1500 手）での割合・文書との突き合わせ
- main: 利用者への確認（狭い空きの測り方）、依頼の組み立て、reviewer の作り込みすぎの指摘による抽選の書き直し

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
