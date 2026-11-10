# TODO-115. title.js と clear.js の長い create() を部品ごとのメソッドに分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort 記録なし | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| screens-111（screens） | Sonnet 5.5 | low | 34 | 8,347 | 26,276 | 2,966,649 | 52% |
| main | Opus 5.5 | 記録なし | 33 | 5,406 | 10,499 | 2,021,252 | 35% |
| impl-115（implementer） | Sonnet 5.5 | medium | 24 | 11,555 | 52,338 | 490,725 | 10% |
| review-115（reviewer） | Opus 5.5 | medium | 12 | 3,538 | 39,257 | 188,226 | 4% |
| 合計 |  |  | 103 | 28,846 | 128,370 | 5,666,852 | 計 5,824,171 |

- main の effort は transcript に残らないので書いていない
- screens は TODO-111 で立てた担当（`screens-111`）を続けて使った

## きっかけ

`title.js` の `create()` が 156 行、`clear.js` の `create()` が 128 行あり、`game.js`・`records.js`
のように部品ごとに分かれていなかった。

## やったこと

- 2 つの `create()` を、配置の計算（`computeLayout()`）と部品ごとの `createXxx()` に分けた。
  メソッドの間の値は引数で渡し、`this` のプロパティは増やしていない
- 新しく書いた JSDoc のうち「何をするか」だけのものを、「なぜ」に直すか消した（reviewer の指摘）

詳しくは [implementer の報告](../agents/TODO-115/implementer-report.md)。

## 確かめたこと

- reviewer が、部品を作る順番・`stackTops()` に渡す値と結果・縦横の分岐・`this` の
  プロパティ・キーの登録が前と同じことを確かめた（[報告](../agents/TODO-115/reviewer-report.md)）
- タイトルとクリア表示の縦横 4 枚が、直す前後で全バイト一致すること。タイトルの
  「はじめる」とクリア表示の「タイトルへ」で、縦横ともシーンが移ること
  （[screens の報告](../agents/TODO-115/screens-report.md)）

## 分担の振り返り

- **各担当が何を見つけたか:** reviewer は規約に合わない JSDoc を 1 件（5 か所）見つけた。
  挙動の差は 0 件。screens は差を見つけなかった
- **見込みとの食い違い:** 担当は見込みどおり。JSDoc の差し戻しが 1 回あった
- **次に同じ規模なら:** メソッドに分ける依頼には「新しく足す JSDoc は『なぜ』が書けるときだけ」を
  最初から書く（今回は「中身の無い `/** */` を足さない」だけで、「何をするか」の説明が入った）
