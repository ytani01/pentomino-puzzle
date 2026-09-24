# TODO-062. デモのランダムで、直前に置いた場所の近くに置きやすくする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 16,179 | 82,631 | 39% |
| implementer | Sonnet 5 | medium | 7,034 | 83,355 | 12% |
| tests | Sonnet 5 | medium | 20,034 | 218,592 | 32% |
| reviewer | Opus 5.5 | high | 4,878 | 58,353 | 12% |
| verifier | Sonnet 5 | medium | 2,297 | 48,780 | 5% |
| 合計 |  |  | 50,422 | 491,711 | 概算 $6.3 |

- reviewer は定義のモデルが sonnet。挙動の変わるレビューなので Opus 5.5 に上書きした
- 立ててから着手まで空いたので `--since`（TODO-066 の決着のコミット時刻）で集計した。
  同じ範囲に TODO-067・068 を立てたやり取りが少し入っている。集計は決着のコミット前（現在時刻まで）

## きっかけ

デモのランダムは置き方を接する辺の数（`touchingEdges()`）だけで重み付けしていて、
置く場所が盤の上を飛び回っていた。人は近くから順に埋めていくので、それに寄せる。

## やったこと

- `src/logic.js`: 2 つの手のマスどうしの最短マンハッタン距離を返す `moveDistance()` を足し、
  `solveStepsRandom()` の置き方の重みを `touchWeight / (1 + 距離) ** DEMO.randomNearPower` にした。
  直前の手は `stack` の最後（外したあとは 1 つ前の手）で、`stack` が空なら掛けない。
  TODO-066 の穴を埋める手には掛けない
- `src/config.js`: `DEMO.randomNearPower`（仮の値 2）
- `tests.html`: 手順が変わって落ちた既存 1 件を直した（打ち切った末尾のガード漏れ）。
  `moveDistance()` 3 件と、近さの有無で平均距離を比べるテスト 2 件を足した
- `docs/UsersGuide.md`・`docs/developer.md`: ランダムの説明

近さは、ピースを一様に選んだあとの置き方にだけ掛かる。reviewer の実測では 8×8 で
距離 3 以上の手が 56% から 46% に減るだけだった（選んだピースに近い置き方が無い場合が多い）。
利用者は、ピースの選び方には掛けず（TODO-061 で扱う）、UsersGuide の言い方を
「遠くへ置くこともある」に弱めると決めた。

## 確かめたこと

- `tests.html` 327 件すべて通過（verifier が Playwright で実測）
- 壊すと落ちるか: 距離の項を外すと、近さのテストが平均距離の一致で落ちる
- デモの実物（ランダム・最速 2000 手）でコンソールエラー 0 件、解に 1 回達した
- `node tools/gen-solutions.mjs --check` が通る

## 残ること

- `DEMO.randomNearPower` の値は仮。画面で見て利用者が決める

## 分担の振り返り

- **見つけたもの**: implementer は落ちた既存テストを見つけたが、原因の見立て（TODO-066 の 2 手外し）は外れていた。
  tests が本当の原因（打ち切った末尾のガード漏れ）を見つけた。reviewer は近さの効きが弱いことを実測で示し、
  利用者の判断につながった。ほかに近さのテストが 37 秒かかること、効かない分岐を見つけた。verifier は食い違いを見つけなかった
- **見込みとの食い違い**: 編成は見込みどおり。tests の料金が 32% と大きいのは、最初に 40 シード × 1000 手の重いテストを作り、
  reviewer の指摘で作り直したため
- **次に同じ規模なら**: 重みを変える項目では、tests の依頼に「比べるテストは効きを大きくした値で、1 盤 1 秒以内」と最初から書く。
  効きの強さは立てるときに利用者と決めにくいので、implementer の依頼に「効きの割合を実測して報告」を足し、
  reviewer より前に利用者へ聞けるようにする
