# TODO-113. デモの探索を logic.js から search.js へ分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 / effort 記録なし | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| impl-113（implementer） | Sonnet 5.5 | low | 36 | 10,537 | 54,592 | 792,556 | 42% |
| tests-113（tests） | Sonnet 5.5 | low | 36 | 5,076 | 37,070 | 592,239 | 31% |
| main | Fable 5.2 | 記録なし | 13 | 3,889 | 6,689 | 542,444 | 27% |
| 合計 |  |  | 85 | 19,502 | 98,351 | 1,927,239 | 計 2,045,177 |

- main の effort は transcript に残らないので書いていない

## きっかけ

`logic.js` が 1100 行ほどあり、その 4 割がデモ（とタイトルの動くボード）だけが使う探索だった。

## やったこと

- `touchingEdges()` から `solveStepsRandom()` まで（441 行）を、中身を変えずに新しい
  `src/search.js` へ移した。`search.js` が `logic.js` を import する向きで、循環は無い
- `logic.js` で使われなくなった `DEMO` の import を外した
- `demo.js`・`title.js`・`tests.html` の import、コメントの参照、`CLAUDE.md`
  （規約とファイル構成）、`docs/developer.md` を直した
- `forcedPlacements()`・`hasUncoverableCell()`・`regionsFitPieces()` は本編のヒント表示も
  使うので `logic.js` に残した

## 確かめたこと

- 移した範囲が、移す前の `logic.js` の該当範囲と `diff` で差が無いこと
  （[implementer の報告](../agents/TODO-113/implementer-report.md)）
- `tests.html` が 458 件すべて通ること。デモとタイトルの動くボードが進むこと。
  コンソールに error が無いこと（[tests の報告](../agents/TODO-113/tests-report.md)）
- tests が報告した WebGL の warning（`GPU stall due to ReadPixels` 4 件）は、
  この項目の前（TODO-112 の確認）から同じ件数で出ている headless のドライバ通知で、対応しない

## 分担の振り返り

- **各担当が何を見つけたか:** implementer は自分で動かして、`search.js` の import の漏れ
  （`boardKey`・`sameShape`）を見つけて直した。tests は問題を見つけなかった
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 同じ組み方でよい。関数をファイルの間で動かす依頼には、
  `node --check` だけでなく「`node` で読み込んで 1 回動かす」を検証に書く
  （import の漏れは構文の検査では出ない）。デモの盤面はピースの `location` で読むと依頼に書く
