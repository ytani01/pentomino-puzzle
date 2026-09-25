# TODO

**残っている項目: TODO-064・076・077。** これまでに 74 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-078` から。**

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

## TODO-076. ボタンを高く・幅を狭くし、タイトルへのボタンを左上に置く

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] 全画面のボタン（本編・デモの HUD、記録、クリア表示、タイトル）を今より高く、幅を狭くする
- [ ] 寸法は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] タイトルへのボタンを、本編・デモの HUD では並びの一番左に、記録画面では左上に置く
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のボタンの並びの説明と、`docs/images/` のキャプチャを直す

今の HUD のボタンは幅 `HUD_BUTTON_MAX` 130（場所が足りなければ詰める）・高さ 44 で、
タイトルへのボタンは並びの最後（`game.js`・`demo.js` の `createHudButtons()`）。
記録画面では下の並び（`records.js` の `titleButton`）にある。
範囲は全画面・タイトルへは全画面と、利用者が決めた（2026-09-25）。
縦画面では HUD が 2 段に折り返すので、高くした分だけ盤とトレイが縮まないかを見る。

---

## TODO-077. デモのランダムで、どのピースも覆えない空きマスがあれば外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high） |

- [ ] `logic.js` に、残りのピースのどの置き方でも覆えない空きマスがあるかを返す関数を足す
- [ ] `solveStepsRandom()` で、それがあれば置いた直後にその場で外す（今の「5 の倍数でない空き」と同じ扱い）
- [ ] `tests.html` に、覆えないマスがある盤・無い盤のテストを足す（壊すと落ちるかも見る）
- [ ] `docs/developer.md`・`docs/UsersGuide.md` のランダムの説明を直す

今の打ち切りは `regionsFitPieces()`（閉じた空きの大きさが 5 の倍数か）と、
5 マスの穴に合うピースが置き済みのとき（`forcedPlacements()`）だけ。
判定は空きマス 1 つずつで見ると利用者が決めた（2026-09-25）。
深さ優先（`solveSteps()`）は変えない。1 手ごとに全ピースの置き方を当てるので、
着手時に 1 手あたりの時間を測ってから入れる。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
