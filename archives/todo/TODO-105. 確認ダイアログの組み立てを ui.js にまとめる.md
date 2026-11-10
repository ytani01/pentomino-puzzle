# TODO-105. 確認ダイアログの組み立てを ui.js にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort 記録なし | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| screens-111（screens） | Sonnet 5.5 | low | 42 | 10,475 | 30,376 | 2,332,034 | 46% |
| main | Opus 5.5 | 記録なし | 31 | 5,799 | 8,920 | 1,617,355 | 32% |
| impl-105（implementer） | Sonnet 5.5 | medium | 38 | 11,477 | 59,508 | 834,684 | 18% |
| review-105（reviewer） | Opus 5.5 | medium | 12 | 4,015 | 46,015 | 188,553 | 5% |
| 合計 |  |  | 123 | 31,766 | 144,819 | 4,972,626 | 計 5,149,334 |

- main の effort は transcript に残らないので書いていない
- screens は TODO-111 で立てた担当（`screens-111`）を続けて使った

## きっかけ

`game.js` と `records.js` に同じ形の `createConfirmDialog()` が 2 つあり、`records.js` は
枠の大きさを `LAYOUTS.landscape['8x8'].confirm` から借り、depth を直書きしていた。

## やったこと

- `src/ui.js` に `createConfirmDialog()` を置き、本編と記録から呼ぶようにした
- 枠の大きさを `src/config.js` の `CONFIRM` にまとめた（`makeLayout()` の `confirm` は
  向きにもボードにも依らない同じ値だった）
- 記録の depth（10）は本編（`DEPTH.confirm` = 40）と値が違い、記録だけが使うので、
  `records.js` の先頭の `CONFIRM_DEPTH` にした（reviewer の指摘で `config.js` から移した）
- `openConfirm()` / `hideConfirm()` / `confirmKind` は各シーンに残した
- `docs/developer.md` と `CLAUDE.md` の `src/ui.js` の説明に足した

## 確かめたこと

- 本編の「やり直す」と記録の「消す」の確認を開いた 2 枚が、直す前後で全バイト一致すること
  （1280x720）。「いいえ」で閉じると、開く前と同じ絵に戻り `confirmKind` が null になること
  （[screens の報告](../agents/TODO-105/screens-report.md)）
- reviewer が、直す前後の式を突き合わせて挙動の差が無いこと
  （[報告](../agents/TODO-105/reviewer-report.md)。要修正 2 件は直した）

## 分担の振り返り

- **各担当が何を見つけたか:** reviewer は、関数が別の関数の JSDoc と本体の間に入ったことと、
  1 画面だけの値を `config.js` に置いたこと（TODO-107 で直した規約に反する）の 2 件を見つけた。
  screens は差を見つけなかった
- **見込みとの食い違い:** 担当は見込みどおり。差し戻しが 1 回あった
- **次に同じ規模なら:** implementer への依頼に「1 画面だけの値は使うファイルの先頭」を
  書いておけば差し戻しは要らなかった。依頼の「`config.js` の 1 か所に置く」は、
  項目の書き方（TODO-107 の前に立てた）をそのまま写したもので、着手時に見直すべきだった
