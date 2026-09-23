# TODO-053. トレイのピースを詰めて、指を動かす距離を短くする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | main（設計）+ implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort 記載なし | main（設計・手直し）+ implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | 記載なし | 22,283 | 46,018 | 50% |
| verifier | Sonnet 5 | medium | 5,078 | 83,944 | 14% |
| reviewer | Opus 5.5 | high | 3,892 | 60,508 | 14% |
| implementer | Opus 5.5 | medium | 2,001 | 49,094 | 13% |
| screens | Sonnet 5 | low | 1,603 | 51,380 | 9% |
| 合計 |  |  | 34,857 | 290,944 | 概算 $5.6 |

- implementer・reviewer は定義（`~/.claude/agents/`）のモデルが sonnet。並べ方の計算と
  その組み合わせを見させるので Opus 5.5 に上書きした
- main の集計には、同じ時間に並行して受けた TODO-054 の相談の分も入っている

## きっかけ

利用者が 2026-09-24 に、トレイのピースを詰めて指を動かす距離を短くしたいと望んだ
（間隔が狭くても掴みやすさはそれほど落ちない、とのこと）。スロットはトレイの枠を
列・段で等分した大きさで、枠は盤の残りを全部使うため、画面に余裕があるほどピースが
離れていた。全スロットが `I` の入る 5 マス角でもあった。

## やったこと

- `src/config.js`：`makeLayout()` の等分（`trayCellFor` / `traySlotFor`、`tray.cols` / `rows`）を
  やめ、`tray.slots`（`PIECES` 順の中心と一辺）を棚詰めで出す。一辺はピースの長い辺
  （`I` 5、`L`・`N`・`Y` 4、他 3 マス）× マス + `TRAY_SLOT_PAD`（12 → 6）。大きい順に、
  盤の側の端から詰める。盤の取り分から引くのは棚の奥行きの合計だけにしたので、
  横 6×10（盤のマス 55 → 64）と縦 8×8（64 → 74）では盤が大きくなった
- `src/scenes/game.js`：`createTraySlots()` と `pieceTransform()` が `tray.slots` を読む
- `tests.html`：4 通りの配置で、重ならない・トレイに収まる・長い辺ぶんある・盤の側から
  詰めてある・盤と重ならない、を確かめる 20 件
- `docs/developer.md`：画面の図とスロットの説明を直した

## 確かめたこと

- スロットの中心から盤までの距離（内部解像度の px、平均／最大）：
  横 8×8 252/399 → 141/237、横 6×10 197/307 → 141/237、
  縦 8×8 203/317 → 121/171、縦 6×10 282/449 → 121/171
  （[前](../agents/TODO-053/distance-before.txt)・[後](../agents/TODO-053/distance-after.txt)）
- screens：横 568×320・縦 390×844 × 2 つの盤と、回したあとの 1 枚で、はみ出し・重なり無し
- verifier：568×320 で `F`・`I` をドラッグして盤に置けた。390×844 でスロットの角付近を
  押しても掴めた。`tests.html` 297 件すべて通過。並べ方を盤から遠い側からにする・
  一辺を全部 3 マスにする、のどちらに壊してもテストが落ちた

## 分担の振り返り

- reviewer は、文書（`docs/developer.md`）が等分の説明のままなこと、テストが
  「盤の側に詰める」を守っていないこと（遠い側から並べても通る）を見つけた。どちらも main が直した。
  当たり判定が狭まる点も挙げたが、利用者の意向どおりなので変えなかった
- screens は 1 回目、縦画面を開いてから大きさを変えたため横画面の配置で撮り、
  問題なしと返した。main が画像を見て気づき、撮り直させた。verifier には最初から
  「大きさを決めてから開く」と書いたので起きなかった
- implementer に文書を範囲として渡していなかったため、文書の直しが reviewer の指摘待ちになった。
  次に配置を変える項目では、対象範囲の `rg` に `docs/` を含め、テストの完了条件に
  「目的（ここでは盤の側に詰める）を壊すと落ちること」を書く。screens の依頼には
  「縦画面は大きさを決めてから開く」と書く（定義の `.claude/agents/screens.md` に足すかは別に相談）
