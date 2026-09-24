# TODO-072 docs への依頼

完成したあとも続けて遊べるようにした（`git diff src/`。仕様は `TODO.md` の TODO-072 の節）。直す箇所は
`archives/agents/TODO-072/implementer-report.md` にある（implementer は文書を触らなかった）。

- `docs/UsersGuide.md`: クリア（本編の上に重なる表示、「続ける」、HUD の「新しい解／記録を更新／記録済み」）、記録（1 つの解に 1 件、成績がよければ
  上書き、印の無い方を優先）、つづきから（完成したあとも保存される）
- `docs/developer.md`: シーンの移り方（クリアの表示の出し方が変わった）、保存（遊びかけの形、履歴のまとめ方）、用語
- `CLAUDE.md` のファイル構成の表で `src/scenes/clear.js`・`src/storage.js` の説明が今と合うか

`rg -n "クリア|COMPLETE|もう一度|遊びかけ|つづきから|履歴" docs/ CLAUDE.md README.md` で残りを探す。利用者向けの文書に TODO 番号を書かない。
報告は `archives/agents/TODO-072/docs-report.md`、返事は 3 行以内。
