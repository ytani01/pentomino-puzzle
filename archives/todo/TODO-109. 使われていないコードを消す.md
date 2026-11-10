# TODO-109. 使われていないコードを消す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 / effort 記録なし | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Fable 5.2 | 記録なし | 15 | 3,784 | 9,162 | 571,864 | 44% |
| tests-109（tests） | Sonnet 5.5 | low | 26 | 3,514 | 36,304 | 415,465 | 34% |
| impl-109（implementer） | Sonnet 5.5 | low | 16 | 5,221 | 41,666 | 241,294 | 22% |
| 合計 |  |  | 57 | 12,519 | 87,132 | 1,228,623 | 計 1,328,331 |

- main の effort は transcript に残らないので書いていない

## きっかけ

どこからも呼ばれない関数と値、テストからしか呼ばれない関数が残っていた。

## やったこと

- `cachedSolutions()`（`src/solutions.js`）、`setMuted()`（`src/audio.js`）、
  `OUTLINE.width`（`src/config.js`。参照していたコメントも直した）を消した
- `removeHistory()`（`src/storage.js`）とそのテスト 3 件を消した
- 消したテストにあった「番号を持たない古い形の履歴を読み替えてから消す」の観点を、
  `removeHistoryMany()` のテストとして足した（8×8 と 6×10 で 2 件）
- `emptyCells()`・`placedNames()`・`PLAYABLE_CELLS` はテストの道具なので残した

詳しくは [implementer の報告](../agents/TODO-109/implementer-report.md)。

## 確かめたこと

- `tests.html` が 452 件すべて通ること。足した 2 件は期待値を変えると落ちること
- タイトルから本編（8×8）を始めて、コンソールに error が無いこと
  （[tests の報告](../agents/TODO-109/tests-report.md)）

## 分担の振り返り

- **各担当が何を見つけたか:** implementer は、消すテストの観点が `removeHistoryMany()` の
  側に無くなることを見つけた。tests は問題を見つけなかった
- **見込みとの食い違い:** 担当は見込みどおり。tests にテストの追加を 1 つ頼んだ分が増えた
- **次に同じ規模なら:** テストごと関数を消す項目では、「消すテストの観点が残る側に
  あるか」を implementer への依頼に最初から書く
