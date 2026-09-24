# TODO

**残っている項目: TODO-064・074。** これまでに 72 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-075` から。**

着手する順番の案: 064 は保留（利用者が 2026-09-25 に決めた）

- 064 を再開するときは、TODO-065 の回している時間（`DEMO.randomTurnStepMs`）が待ちに足されていることを踏まえる

---

## TODO-064. デモのランダムで、考える時間を盤面に合わせて変える

**保留**（利用者が 2026-09-25 に決めた）。

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] `demo.js` の `pickWaitScale()`: 置ける手が少ない盤面や、行き詰まって戻った直後は長めに待つ
- [ ] 倍率は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す

今の揺らぎは ±50% と、外したあと 2 倍だけで、盤面の難しさは関係しない。
置ける手の数は generator の中にしか無いので、`place` に載せて運ぶ
（`logic.js` も少し触る）。探索の順番は変えない。
確認は TODO-059 の振り返りのとおり、画面の時間ではなく `pickWaitScale()` の
値を `evaluate` で集めて見る（headless ではフレームが重く測れない）。

---

## TODO-074. デモのランダムで、狭い所を埋める強さと崩す回数の値を決める

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（値の変更）+ verifier（Haiku 4.5） |

- [ ] `src/config.js` の `DEMO.randomTightWeight` を 4 → 10、`DEMO.randomCollapseAfter` を 5 → 3 にする
- [ ] 値の説明（`config.js` の JSDoc）の「値は仮」を、決めた値の書き方に直す
- [ ] `tests.html` の全件が通ることを確かめる（値に合わせて組んだ比べ方のテストがある）

TODO-061・063 で仮に置いた値を、利用者が決めた。ほかの仮の値（`randomNearPower` 2・`randomCollapseMoves` 3・
`randomTurnStepMs` 150ms・`wheelDebounceMs` 150ms）と、TODO-068 のその場で外す動きは今のままにすると決めた（2026-09-25）。
値だけの変更なので reviewer は入れない。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
