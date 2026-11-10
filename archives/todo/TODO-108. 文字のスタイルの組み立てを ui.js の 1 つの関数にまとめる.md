# TODO-108. 文字のスタイルの組み立てを ui.js の 1 つの関数にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ reviewer（Sonnet 5.5 / medium）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort 記録なし | implementer（Sonnet 5.5 / low）+ reviewer（Sonnet 5.5 / medium）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| screens-111（screens） | Sonnet 5.5 | low | 52 | 15,089 | 47,735 | 3,902,130 | 59% |
| main | Opus 5.5 | 記録なし | 27 | 5,654 | 8,728 | 1,576,530 | 24% |
| impl-108（implementer） | Sonnet 5.5 | low | 34 | 12,641 | 63,113 | 814,776 | 13% |
| review-108（reviewer） | Sonnet 5.5 | medium | 12 | 3,481 | 52,287 | 204,610 | 4% |
| 合計 |  |  | 125 | 36,865 | 171,863 | 6,498,046 | 計 6,706,899 |

- main の effort は transcript に残らないので書いていない
- screens は TODO-111 で立てた担当（`screens-111`）を続けて使った

## きっかけ

`fontFamily`・`fontSize`・`color` を組んだスタイルを、`add.text()` の 34 か所でそれぞれ書いていた。

## やったこと

- `src/ui.js` に `textStyle(size, color, extra)` を置き、34 か所を差し替えた。
  `color` を付けていなかった `title.js` の `bestText` は `color` のキーを作らない
- 差し替えで崩れた `game.js` の空行を main が戻した（reviewer の指摘）
- `docs/developer.md` と `CLAUDE.md` の `src/ui.js` の説明に足した

## 確かめたこと

- reviewer が、34 か所すべてで前後のスタイルのキーと値が同じこと、`fontFamily` の
  差し替え漏れが無いことを確かめた（[報告](../agents/TODO-108/reviewer-report.md)）
- タイトル・本編・記録・クリア表示・デモの 5 枚が、直す前後で全バイト一致すること
  （1280x720。[screens の報告](../agents/TODO-108/screens-report.md)）。デモはネオンの明滅で
  1 回目に食い違ったので、明滅を止める手順を足して直す前の版も撮り直した

## 分担の振り返り

- **各担当が何を見つけたか:** reviewer は空行の崩れ 1 件（挙動の差は 0 件）。screens は
  撮る手順の穴（デモのネオンの明滅）を見つけて自分で直した。implementer は問題を報告しなかった
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 同じ組み方でよい。撮り比べの「2 回撮って一致」は、同じ版の中で
  動くものを止められているかしか分からない。前後で食い違ったら、まず直す前の版を
  同じ手順で撮り直す（今回 screens がしたとおり）
