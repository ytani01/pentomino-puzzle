# TODO

**残っている項目: TODO-060〜065。** これまでに 59 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-066` から。**

---

## TODO-060. デモのランダムで、小さな孤立した穴にはすぐ気づいて外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] `solveStepsRandom()`: 置いた直後に 1〜4 マスの閉じた空きができたら、行き詰まるのを待たずにその手を外す
- [ ] 外した手は今までどおり `failed` に控える
- [ ] `tests.html` にテストを足す
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す

TODO-059 で、解なしの手を置いても行き詰まるまで気づかない形にした。
人なら小さな穴には置いた瞬間に気づくので、その失敗だけすぐ外す。
すぐ気づく範囲は「1〜4 マスの閉じた空き」と利用者が決めた（7 マスや 12 マスの
ような 5 の倍数でない大きい空きは、今までどおり行き詰まってから戻す）。
空きの大きさは `emptyRegionSizes()` で取れる。

---

## TODO-061. デモのランダムで、空きの形に合わせてピースを選ぶ

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] `solveStepsRandom()`: ピースを一様に選ぶのをやめ、狭い空き（隅の凹みなど）を埋められるピースを選びやすくする
- [ ] 重みの値は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] `tests.html` にテストを足す
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す

人は「この隙間に入るのはどれか」と考えてピースを選ぶ。TODO-062 と同じ関数の
重みを触るので、同時には進めない。

決めること（着手時、調べてから）: 「狭い空き」を何で測るか
（空き領域の大きさ・置ける手の少ないマス、など）。調べて選択肢を出してから聞く。

---

## TODO-062. デモのランダムで、直前に置いた場所の近くに置きやすくする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] `solveStepsRandom()`: 置き方の重みに、直前の手からの距離を加える
- [ ] 重みの値は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] `tests.html` にテストを足す
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す

今は置き方を接する辺の数（`touchingEdges()`）だけで重み付けしていて、
置く場所が盤の上を飛び回る。近くに寄せて、端から順に埋めていく流れにする。
TODO-061 と同じ関数の重みを触るので、同時には進めない。

---

## TODO-063. デモのランダムで、何度も詰まったら数手まとめて崩す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] `solveStepsRandom()`: 戻りが続いたら、1 手ずつでなく数手を一度に外してやり直す
- [ ] 「何度続いたら」「何手崩すか」は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] `tests.html` にテストを足す
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す

人は同じあたりで詰まり続けると「やり直そう」と大きく崩す。
崩した手を `failed` に控えるかどうかは、今の戻り方（外した手を外した後の
盤面の控えに入れる）に合わせる。

決めること（着手時、調べてから）: 「続いた」の数え方（同じ深さへ戻った回数か、
戻りの連続回数か）。今の戻り方を読んでから選択肢を出して聞く。

---

## TODO-064. デモのランダムで、考える時間を盤面に合わせて変える

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

## TODO-065. デモのランダムで、ピースを回しながら置く

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] `demo.js`: 置く前に、ピースを 1〜2 回まわしたり裏返したりしてから盤へ滑らせる
- [ ] 最速（`animate: false`）では回さない
- [ ] 回す回数・時間は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] `docs/UsersGuide.md` のランダムの説明を直す

今はトレイから最終の向きのまま盤へ滑らせている。人は手に取って向きを
合わせてから置くので、その動きを見せる。探索（`logic.js`）は変えない。
回している間に次の手へ進まないよう、待ち時間との兼ね合いを見る。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
