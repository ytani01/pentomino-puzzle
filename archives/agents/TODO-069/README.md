# TODO-069 の分担

- implementer（Sonnet 5）: `game.js` のドラッグ中の入力（2 本目の指・右クリック・ホイール）、回す軸（`turnPivot()`）、`logic.js` の 1 つ前の向き、
  `main.js`・`ui.js`・`config.js`、テスト、文書。途中で API の利用上限で止まり、同じ担当を再開した。reviewer の指摘の手直しも同じ担当に続けて頼んだ
- reviewer（Opus 5.5 に上書き）: 入力の扱いが変わるのでレビューを入れた。CDP タッチで実測して要修正 4 件を見つけた
- verifier（Sonnet 5）: implementer と別の手順で、マウス・CDP タッチ・Undo・デモでの動きを確かめた
- main: 利用者への確認（ドラッグ中のボタンの扱い）、依頼の組み立て

依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
