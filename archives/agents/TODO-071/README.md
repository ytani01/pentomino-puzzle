# TODO-071 の分担

- implementer（Sonnet 5）: 動き（チェック・全部選ぶ・ゴミ箱・まとめて消す計算）と配置 2 案、テスト、文書、`capture.mjs` の記録画面。
  途中で API の利用上限（5 時間の上限で 1 回再開、そのあと週の上限）で止まった
- implementer2（Opus 5.5 に上書き）: Sonnet 5 が週の上限で使えなくなったので、利用者の判断で Opus 5.5 に替えた。`capture.mjs` の吹き出しの位置、
  reviewer の指摘の手直し（ツールチップ・文書・寸法の重複・全部消したときの達成度・消したあとの選択）
- screens（Sonnet 5）: 配置の 2 案を横・縦で撮った。案 B は main が仮の値を切り替えてから撮った
- reviewer（Opus 5.5 に上書き）: 消す計算と画面の動きが変わるのでレビューを入れた
- verifier（Opus 5.5 に上書き）: Sonnet 5 が使えないため。Playwright で 8 項目を 1 回ずつ操作して確かめた（`verify.mjs`・`verify4.mjs`）
- main: 利用者への確認（チェックの扱い・配置・全部消したときの達成度）、`docs/images/` の撮り直し、`docs/developer.md` の用語表

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
