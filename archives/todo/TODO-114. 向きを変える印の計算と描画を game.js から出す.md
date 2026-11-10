# TODO-114. 向きを変える印の計算と描画を game.js から出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Sonnet 5.5 / medium）+ tests（Sonnet 5.5 / low）+ screens（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 → Opus 5.5 / effort 記録なし | implementer（Sonnet 5.5 / medium）+ reviewer（Sonnet 5.5 / medium）+ tests（Sonnet 5.5 / low）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Fable 5.2・Opus 5.5 | 記録なし | 37 | 9,738 | 237,986 | 1,770,375 | 40% |
| screens-111（screens） | Sonnet 5.5 | low | 40 | 8,627 | 130,081 | 1,594,084 | 34% |
| tests-114（tests） | Sonnet 5.5 | low | 28 | 6,592 | 65,129 | 479,045 | 11% |
| impl-114（implementer） | Sonnet 5.5 | medium | 20 | 11,475 | 55,592 | 401,596 | 9% |
| review-114（reviewer） | Sonnet 5.5 | medium | 14 | 5,342 | 50,984 | 254,125 | 6% |
| 合計 |  |  | 139 | 41,774 | 539,772 | 4,499,225 | 計 5,080,910 |

- main の effort は transcript に残らないので書いていない
- 途中で利用上限に当たり、tests と screens が止まった。上限が戻ってから同じ担当に続けさせた。
  その間に利用者が main を Opus 5.5 に切り替えた
- screens は TODO-111 で立てた担当（`screens-111`）を続けて使った

## きっかけ

`game.js` が 1555 行あり、Phaser とのつなぎでない部分（向きを変える印の計算と線画）を含んでいた。

## やったこと

- `turnMarkKind()` と `turnMarkCenter()` を `src/logic.js` へ移した。中心はマスの単位で返し、
  `game.js` が 1 マスの大きさを掛ける（掛け算の順番は前と同じ）
- 矢じり・回転の印・裏返しの印と、縁取り → 本線の 2 回描きを `src/icons.js` の
  `strokeTurnMark()` にまとめた
- 印を出す条件は `game.js` の `drawTurnMark()` に残した。`tools/capture.mjs` が
  シーンの `turnMarkKind(piece)` を呼ぶので、`logic.js` の関数を呼ぶ 1 行のメソッドを残した
- `tests.html` に 2 つの計算のテストを 8 件足した
- `CLAUDE.md`・`docs/developer.md` の説明と、`icons.js` の先頭のコメント・
  「Phaser を読むのはシーンだけ」の記述（reviewer の指摘。後者は前から `ui.js` とずれていた）を直した

## 確かめたこと

- reviewer が、12 ピース × 全向き × 4 通りの 1 マスの大きさで、直す前と今の種類・中心を
  `Object.is` で比べて差が 0 件だったこと（[報告](../agents/TODO-114/reviewer-report.md)）
- トレイに回転の印 8・裏返しの印 3・印なし 1 が出た 1 枚が、直す前後で全バイト一致すること
  （1280x720。[screens の報告](../agents/TODO-114/screens-report.md)）
- `tests.html` が 466 件すべて通ること。足したテストは期待値を変えると落ちること
  （[tests の報告](../agents/TODO-114/tests-report.md)）
- tests が報告した「`tests.html` が 1 回 90 秒かかり、Playwright MCP の navigate が 60 秒で
  切れる」は、利用上限から戻った直後の 1 回だけの値で、足したのは軽い計算のテスト 8 件。
  TODO-113 の確認では同じ手順で通っていたので、この項目では追わない

## 分担の振り返り

- **各担当が何を見つけたか:** reviewer は文書とコメントの食い違いを 2 件見つけた
  （挙動の差は 0 件）。screens・tests は問題を見つけなかった。implementer は
  `tools/capture.mjs` がシーンのメソッドを呼んでいることを見つけた
- **見込みとの食い違い:** 担当は見込みどおり。利用上限で 2 人が止まり、頼み直しが 1 回ずつ増えた
- **次に同じ規模なら:** 撮り比べの担当を前の項目から続けて使うと、手順の組み直しが要らず安い。
  動かす関数を呼ぶ側の検索は `src` だけでなく `tools` も含めて依頼に書く
