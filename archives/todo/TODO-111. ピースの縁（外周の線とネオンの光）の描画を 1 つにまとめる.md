# TODO-111. ピースの縁（外周の線とネオンの光）の描画を 1 つにまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 / effort 記録なし | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| screens-111（screens） | Sonnet 5.5 | low | 62 | 12,088 | 74,514 | 1,750,021 | 48% |
| main | Fable 5.2 | 記録なし | 27 | 6,410 | 12,235 | 1,182,846 | 32% |
| impl-111（implementer） | Opus 5.5 | medium | 22 | 8,230 | 52,007 | 418,808 | 13% |
| review-111（reviewer） | Opus 5.5 | medium | 14 | 4,831 | 47,144 | 221,389 | 7% |
| 合計 |  |  | 125 | 31,559 | 185,900 | 3,573,064 | 計 3,790,648 |

- main の effort は transcript に残らないので書いていない

## きっかけ

`game.js` の `drawPieceEdges()` と `icons.js` の `paletteIcon()` に、凹んだ角を探す処理と、
外周を内側へ寄せて引く処理が 2 つあった。

## やったこと

- `src/icons.js` に `strokePieceEdges()` を置き、本編とアイコンの両方から呼ぶようにした。
  原点・1 マスの大きさ・太さ・色・alpha・角を埋めるかを引数で渡す
- 外周の線も、同じ絵になると読み切れたので光と一緒に寄せた
  （[implementer の報告](../agents/TODO-111/implementer-report.md)）
- `src/config.js` の縁の値の説明（読む場所）を今のコードに合わせた（reviewer の指摘。前からの食い違い）
- `docs/developer.md` と `CLAUDE.md` の説明を直した

## 確かめたこと

- reviewer が、本編とアイコンの両方で直す前後の式を突き合わせ、絵が変わる箇所が無いこと
  （[報告](../agents/TODO-111/reviewer-report.md)。要修正 0 件）
- 色の組 3 種類の本編と、タイトルの色の選択肢の 4 枚が、直す前後で全バイト一致すること
  （1280x720。[screens の報告](../agents/TODO-111/screens-report.md)、
  撮る手順は [capture.js](../agents/TODO-111/capture.js)）

## 分担の振り返り

- **各担当が何を見つけたか:** reviewer は `config.js` のコメントの前からの食い違いを 1 件
  見つけた。screens は差を見つけなかった（全バイト一致）
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 描画を変えないリファクタリングは、時間で動くものを `clip` で外して
  前後を `cmp` で比べる形が安い。全バイト一致が取れるなら reviewer は Sonnet に下げてよい
