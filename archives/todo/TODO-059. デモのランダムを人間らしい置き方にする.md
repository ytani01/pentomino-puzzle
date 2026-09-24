# TODO-059. デモのランダムを人間らしい置き方にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 16,826 | 56,022 | 31% |
| tests | Sonnet 5 | medium | 31,154 | 113,018 | 26% |
| implementer | Sonnet 5 | medium | 21,366 | 98,390 | 17% |
| reviewer | Opus 5.5 | high | 3,737 | 71,398 | 15% |
| verifier | Sonnet 5 | medium | 3,112 | 76,137 | 11% |
| 合計 |  |  | 76,195 | 414,965 | 概算 $6.6 |

- reviewer は定義のモデルが sonnet。挙動が変わる項目のレビューなので Opus 5.5 に上書きした
- 分担と各担当の依頼・報告は [archives/agents/TODO-059/](../agents/TODO-059/)

## きっかけ

デモのランダム（TODO-057）が人の動きに見えなかった。置き場所を盤全体から
一様乱数で選び、全解の照合で「解なし」の手を置いた瞬間に外し、1 手の間隔が
一定だった。3 案（置き場所の重み付け・行き詰まってから戻す・間隔の揺らぎ）を
まとめて入れると決めた。2 案は、手数を測らずに「置ける場所が無くなるまで
置き、無くなったら『解あり』になるまで戻す」形にすると利用者が決めた。

## やったこと

- `src/logic.js`
  - `touchingEdges()` を足した。置く形が盤の外・穴・置き済みのマスに接する辺の数
  - `solveStepsRandom()`: ピースは一様に選び、置き方は `(接する辺 + 1)²` の重みで
    抽選する。置いた直後に解なしでも外さない。置ける手が尽きたら、
    `canContinue` が真になるか盤が空になるまで 1 手ずつ外し、外した手を
    外した後の盤面の控えに入れる。`remove` にも `ok` を付ける
- `src/scenes/demo.js`: ランダムのときだけ、1 手ごとに待ち時間の倍率を引く
  （`pickWaitScale()`。±50%、外したあとは 2 倍）。`remove` の `ok` で「解ける／
  解なし」の札を出す
- `src/config.js`: `DEMO.randomJitter`・`DEMO.randomRemoveMultiplier`
- `tests.html`: 旧の動き（すぐ外す）を前提にした 4 件を書き直し、
  `touchingEdges()`・戻り方・重み付けのテストを足した（316 件）
- `docs/UsersGuide.md`・`docs/developer.md`: ランダムの説明

## 確かめたこと

- `tests.html` 316 件すべて通る（tests・verifier）。重みを 1 にする・すぐ外す動きに
  戻す・戻りのループの `break` を消す、の 3 通りで壊すと落ちる（tests）
- 戻りの控えが正しいこと: 解ける盤面から外し始めた連なりは 1910 回中 0 回（reviewer）
- ランダム・最速でデモが解に着く（110 秒）。コンソールのエラー無し（verifier）
- 待ち時間の倍率は place 平均 0.99・remove 平均 1.98（verifier）。実画面の間隔は
  headless でフレームが 86ms 前後と重く、狙いどおりに測れなかった。変えていない
  深さ優先の間隔も同じくばらついたので、環境によるものとみた

## 残ること

- 重みの式と揺らぎの値は仮。画面で見て利用者が決める（`config.js` に「値は仮」と書いた）

## 分担の振り返り

- implementer: 依頼どおり実装した。揺らぎを毎フレーム引き直す誤りを入れた
- tests: 壊し方 3 通りのうち 1 つを最初のテストで捕まえられず、自分で直した。
  料金の 26% で一番重い担当だった
- reviewer: 揺らぎの誤り（平均が 2〜3 割短くなる）を実測で見つけた。テストでは
  捕まらない箇所で、Opus に上書きした効果があった
- verifier: 実画面の間隔を headless で測らせたが、フレームが重く判定に使えなかった。
  `pickWaitScale()` の単体の値で足りた
- 次に同じ規模なら: 画面の時間を測る確認は依頼しない（headless では測れない）。
  関数の出す値を `evaluate` で集めさせる。tests への依頼は、壊し方ごとに
  どのテストが捕まえるかを先に書かせて、作り直しを減らす
