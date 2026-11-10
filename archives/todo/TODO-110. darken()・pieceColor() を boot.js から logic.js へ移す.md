# TODO-110. darken()・pieceColor() を boot.js から logic.js へ移す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 / effort 記録なし | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| tests-110（tests） | Sonnet 5.5 | low | 30 | 5,610 | 37,490 | 533,953 | 43% |
| main | Fable 5.2 | 記録なし | 14 | 3,139 | 5,749 | 509,844 | 38% |
| impl-110（implementer） | Sonnet 5.5 | low | 14 | 3,540 | 36,151 | 214,740 | 19% |
| 合計 |  |  | 58 | 12,289 | 79,390 | 1,258,537 | 計 1,350,274 |

- main の effort は transcript に残らないので書いていない

## きっかけ

`ui.js` と `icons.js` が、`darken()`・`pieceColor()` のためにシーンのファイル（`boot.js`）を
import していた（部品がシーンに依る向き）。

## やったこと

- `darken()` と `pieceColor()` を、中身と JSDoc を変えずに `src/logic.js` へ移した
  （どちらも Phaser にも DOM にも依っていなかった）
- `boot.js`・`game.js`・`ui.js`・`icons.js` の import を直した。`TEX` は `boot.js` に残した
- `tests.html` に 6 件のテストを足した（`darken` は係数 1・0・0.5、`pieceColor` は
  `mono`・`colors`・どちらも無い色の組）
- `CLAUDE.md` と `docs/developer.md` の `logic.js` の説明に足した

## 確かめたこと

- `tests.html` が 458 件すべて通ること。足したテストは期待値を変えると落ちること
- タイトルから本編（8×8）を始めて、コンソールに error が無いこと
  （[tests の報告](../agents/TODO-110/tests-report.md)、
  [implementer の報告](../agents/TODO-110/implementer-report.md)）

## 分担の振り返り

- **各担当が何を見つけたか:** どちらも問題を見つけなかった
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 同じ組み方でよい（関数を動かすだけなら reviewer は要らない）
