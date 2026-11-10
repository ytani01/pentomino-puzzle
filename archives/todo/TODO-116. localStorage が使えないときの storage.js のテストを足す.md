# TODO-116. localStorage が使えないときの storage.js のテストを足す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | tests（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort 記録なし | tests（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | 記録なし | 7 | 2,507 | 2,012 | 563,962 | 50% |
| tests-116（tests） | Sonnet 5.5 | low | 22 | 8,069 | 55,235 | 502,340 | 50% |
| 合計 |  |  | 29 | 10,576 | 57,247 | 1,066,302 | 計 1,134,154 |

- main の effort は transcript に残らないので書いていない

## きっかけ

TODO-106 で `localStorage` の読み書きを `readItem()` / `writeItem()` / `removeItem()` に
まとめたが、この経路を確かめるテストが無かった（TODO-106 のレビュー）。

## やったこと

- `tests.html` に 10 件足した。`localStorage` が例外を投げるときと、保存データが壊れている
  ときに、`loadHistory`・`loadProgress`・`loadFound`・`addFound`・`savePalette` が例外を
  外へ出さず今の既定値を返すこと

## 確かめたこと

- `tests.html` が 476 件すべて通ること（[tests の報告](../agents/TODO-116/tests-report.md)）
- `readItem()` と `writeItem()` の try/catch を外すと、`addFound`（8×8・6×10）と `savePalette` の
  3 件が落ちること。`loadHistory`・`loadProgress`・`loadFound` は呼ぶ側にも保存データの
  壊れに備えた try があり（TODO-106 で元の範囲に戻したもの）、内側を外しただけでは落ちない。
  テストは export の振る舞いを見ており、外側の try まで外せば落ちるので、このままでよい

## 分担の振り返り

- **各担当が何を見つけたか:** tests は、読み出し側のテストが内側の try を外しても落ちない
  （二重に守られている）ことを見つけた
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 同じ組み方でよい。「壊すと落ちるか」を頼むときは、どの try を外すかを
  export ごとに指定する（守りが二重の箇所は外側も外す）
