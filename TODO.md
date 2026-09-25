# TODO

**残っている項目: TODO-064・TODO-075。** これまでに 73 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-076` から。**

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

## TODO-075. デモの既定の探し方をランダムにし、探し方のアイコンを描き直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] `demo.js`: 既定の探し方を `random` にする
- [ ] `icons.js` の `depthFirst()`: 根から枝分かれする木（丸い節を線で結ぶ）にする
- [ ] `icons.js` の `random()`: 木と同じ丸い節を、線で結ばずに散らして置く
- [ ] `docs/UsersGuide.md` の探し方の説明（アイコンの形、既定）を直す
- [ ] `tools/capture.mjs` で `docs/images/demo.png`・`demo.gif` を撮り直す

ランダムのアイコンは、木と「つながり・順序の有無」で対になる形にする
（サイコロ・シャッフルの矢印ではなく、利用者が 2026-09-25 に選んだ）。
今は深さ優先が歯車、ランダムが「？」（TODO-070）。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
