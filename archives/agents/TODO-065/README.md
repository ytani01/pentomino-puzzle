# TODO-065 の分担

- implementer（Sonnet 5）: `logic.js` の `orientationSteps()` とテスト、`demo.js` の回して見せる動き（`playTurns()`・`cancelTurn()`）、`config.js` の値、文書。
  reviewer の指摘（回している間に次の手が進む、右回りだけで最短でない、テストが弱い）も同じ担当に続けて頼んだ
- reviewer（Opus 5.5 に上書き）: 待ちと予約の扱いが変わるのでレビューを入れた
- screens（Sonnet 5）: 回している途中の画面を 3 枚撮り、重なり・欠けを見た
- main: 利用者への確認（回し方・時間の取り方）、依頼の組み立て

tests は編成しなかった（見込みどおり）。足した純関数のテストは implementer が書き、壊すと落ちるかを reviewer が Node で確かめ、直したあと implementer が壊し方 2 種で落ちることを確かめた。
依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
