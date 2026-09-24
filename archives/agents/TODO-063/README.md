# TODO-063 の分担

- implementer（Sonnet 5）: `logic.js` の崩し（`maybeCollapse()`）、`config.js` の値、JSDoc、文書 2 か所。利用者が 2 回決め直したので、
  同じ担当に続けて直しと測り直しを頼んだ（控えを最後の 1 手 → 全部、数える詰まりを全部の戻り → 行き詰まりだけ）。値の組の実測もこの担当
- tests（Sonnet 5）: 落ちた既存 2 件の直しと新規テスト。reviewer の指摘（新規 3 本が壊れ方を捕まえない）で、既存テストへ一本化した
- reviewer（Opus 5.5 に上書き）: 探索の分岐が変わるのでレビューを入れた
- verifier（Sonnet 5）: `tests.html`・`--check`・デモの実物（両盤を解まで）での remove の連なりと待ち・文書との突き合わせ
- main: 利用者への確認（3 回）、依頼の組み立て

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記。implementer は「追記 2」が最新）。
