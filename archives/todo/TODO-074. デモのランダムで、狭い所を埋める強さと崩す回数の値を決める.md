# TODO-074. デモのランダムで、狭い所を埋める強さと崩す回数の値を決める

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（値の変更）+ verifier（Haiku 4.5） |
| 実施 | Opus 5.5 / effort medium | main（値の変更）+ verifier（Haiku 4.5）× 2 |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 4,074 | 49,372 | 94% |
| verifier（1 回目） | Haiku 4.5 | 記載なし | 1,430 | 5,353 | 1% |
| verifier（2 回目、途中で止めた） | Haiku 4.5 | 記載なし | 1,099 | 61,757 | 4% |
| 合計 |  |  | 6,603 | 116,482 | 概算 $2.5 |

- verifier は定義のモデルが sonnet（effort medium）。テストを走らせて件数を読むだけなので Haiku 4.5 に上書きした。Haiku は effort に対応しない
- 1 回目の担当は集計では `unknown`（メタ情報のファイルが無い）。報告が届く前に `/clear` を挟んだため、2 回目を起動し直し、1 回目の報告が届いた時点で 2 回目を止めた
- 集計は決着のコミット前（現在時刻まで）

## きっかけ

TODO-061・063 で仮に置いた `DEMO.randomTightWeight`（4）と `DEMO.randomCollapseAfter`（5）を、
デモを画面で見て利用者が決めた。ほかの仮の値（`randomNearPower` 2・`randomCollapseMoves` 3・
`randomTurnStepMs` 150ms・`wheelDebounceMs` 150ms）と、TODO-068 のその場で外す動きは今のままにすると決めた（2026-09-25）。

## やったこと

- `src/config.js` の `DEMO.randomTightWeight` を 4 → 10、`DEMO.randomCollapseAfter` を 5 → 3 にした
- 同じファイルの JSDoc で、今のままにすると決めた値も含めて「値は仮で、画面で見て決める」を
  「値は画面で見て利用者が決めた（TODO-074）」に直した（`wheelDebounceMs`・`randomNearPower`・
  `randomTightWeight`・`randomCollapseAfter`・`randomCollapseMoves`・`randomTurnStepMs`）

値だけの変更なので reviewer は入れなかった。

## 確かめたこと

- `tests.html` を Playwright で開き、396 件すべて通った。コンソールエラーは 0 件
  （[archives/agents/TODO-074/verifier-report.md](../agents/TODO-074/verifier-report.md)）

## 分担の振り返り

- verifier（1 回目）は 396 件通ったことを報告した。落ちたテストは見つからなかった
- 見込みとの食い違いは、`/clear` で main が 1 回目の起動を見失い、2 回目を起動し直したことだけ。
  2 回目の分（全体の 4%）は無駄になった
- 次に同じ規模（値だけの変更＋テスト実行）なら同じ組み方でよい。ただし担当を起動したあとは、
  報告が届くまで `/clear` を勧めない・しない。挟んだときは、起動し直す前に `archives/agents/TODO-NNN/` に
  報告が無いかと、`ListAgents` で動いている担当が無いかを先に見る
