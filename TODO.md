# TODO

**残っている項目: TODO-050。** これまでに 49 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-051` から。**

---

## TODO-050. デモで探し方を深さ優先・幅優先から選べるようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer（Opus 5.5 / 記載なし）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / 記載なし）+ verifier（Sonnet 5 / 記載なし）+ screens（Sonnet 5 / low） |

- [ ] `logic.js` に幅優先で 1 手ずつ返す generator を足す（`solveSteps()` と同じ
      `{place/remove/solved}` の手を返し、`random`・`canContinue` も同じに受ける）
- [ ] 次に調べる途中の盤面へ移るときは、今の盤面と違うピースだけを
      1 手ずつ外して置き直す（remove / place の手として返す）
- [ ] デモの HUD に探し方の切り替えボタンを足す（アイコンは `icons.js`）。
      切り替えたら空の盤から探し直す。既定は深さ優先
- [ ] HUD のボタンが 7 つになる。`config.js` の `HUD_BUTTONS` は本編と共通なので、
      本編の並びを崩さずにデモだけ 7 つ置けるようにする
- [ ] `tests.html` に幅優先のテストを足す（段の順に深くなる、捨てた手は
      外される、解の盤面が正しい）
- [ ] 画面の確認（横長・スマホ縦横で HUD がはみ出さないか）
- [ ] 文書（CLAUDE.md の表、docs/developer.md、demo.js・logic.js の JSDoc）

背景: 幅優先だと最初の解までに試す手は 8×8 で 28,383、6×10 で 478,902
（Node で実測。全解のデータで解なしの手を捨てた場合）。「最速」でも 8×8 で
約 16 分、6×10 で約 4 時間半かかる。そのため置き換えではなく選べる形にした。
最後の段に並ぶ途中の盤面は最大 9,356（6×10）で、メモリは問題にならない。

- implementer・reviewer・verifier はグローバルの定義を使う想定（effort は仮置き）

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
