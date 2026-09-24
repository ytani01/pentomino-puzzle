# TODO-072 の分担

Sonnet 5 が週の利用上限で使えないので、利用者の判断で全員 Opus 5.5 に上書きした。

- implementer（Opus 5.5）: 本編に重ねるクリア表示、記録の更新（`storage.js` の `recordClear()`）、遊びかけの保存、HUD の知らせ。
  reviewer の指摘（ヒント表示の自動配置、`addHistory()` の削除、見つけた解・最短時間の移動、幕の色）と、クリア表示の重なりの直しも同じ担当に続けて頼んだ
- tests（Opus 5.5）: 落ちた既存 2 件の書き換え、記録の更新のテスト 28 件、14 通りの壊し方
- docs（Opus 5.5）: implementer の定義が文書を触らないので、文書を別の担当にした
- reviewer（Opus 5.5）: 記録と時計の扱いが変わるのでレビューを入れた
- verifier（Opus 5.5）: Playwright で 8 項目を 1 回ずつ（`verify.mjs`）
- main: 依頼の組み立て、利用者への確認（ヒント表示の自動配置）

screens は立てなかった（クリア表示の画面は verifier と implementer が撮り、main が見た）。
依頼は `*-brief.md`、報告は `*-report.md`（2 回目以降は同じファイルに追記）。
