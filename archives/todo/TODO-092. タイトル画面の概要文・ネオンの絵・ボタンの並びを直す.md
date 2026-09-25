# TODO-092. タイトル画面の概要文・ネオンの絵・ボタンの並びを直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort high | implementer（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 20,063 | 98,097 | 28% |
| implementer | Sonnet 5 / Opus 5.5 | medium | 42,071 | 422,867 | 62% |
| reviewer | Opus 5.5 | high | 98 | 77,158 | 7% |
| screens | Sonnet 5 | low | 752 | 48,392 | 3% |
| 合計 |  |  | 62,984 | 646,514 | 概算 $10.7 |

- 集計は `--since '2026-09-26 03:04:06'`（TODO-092〜095 を 1 コミットで立てたため）
- **TODO-093・094 を並行して走らせたので、その分が混ざっている。** implementer の行は
  TODO-092（Sonnet）・093（Sonnet）・094（Opus）の 3 人の合計で、reviewer の行は
  TODO-094 のもの。TODO-092 だけの分は切り分けられない
- screens は定義のモデル・effort のまま

## きっかけ

タイトル画面の遊び方の 1 行目が盤の選択で変わり、何のパズルかの説明になって
いなかった。ネオンの色の見本には光のにじみが無く、本編のネオンの見た目と
結びつかなかった。ボタンが 2 行に分かれ、デモが記録と同じ大きさで並んでいた。

## やったこと

- 遊び方の枠: 1 行目を「12 種のピースを盤にすき間なく敷き詰めるパズル。」に
  固定し、盤を選び直しても書き換えない（`HOW_TO_PLAY_TEXT`。`src/scenes/title.js`）
- ネオンの見本（`src/icons.js` の `paletteIcon()`）: 本編の `drawPieceEdges()` と
  同じ描き方（外周の内側へ寄せた `NEON.glow` の層と、凹の角の埋め）で、
  太さを `CHOICE_ICON.glowScale`（12 / 64）で縮めて重ねる。明滅はしない
- 並び: 「はじめる」「つづきから」「記録」を 1 行に（幅 224 → 190、間 14）。
  `STACK` から記録の行を消し、横画面の余りは 6 → 68
- 「デモ」は右下に 120×44 で置き、右下のバージョン表示の上に離す
- 文書: `docs/UsersGuide.md` のデモの位置、`docs/images/title.png` の撮り直し。
  `tools/capture.mjs` の吹き出し ④〜⑥ の向きを新しい並びに合わせた

## 確かめたこと

- screens（[screens-report.md](../agents/TODO-092/screens-report.md)）: 横 960×640・
  縦 640×1136 のネオンで、文言・はみ出し・デモとバージョンの重なり・見本のにじみ・
  コンソールのエラーの 5 点すべて一致
- implementer: `node --check`、`tests.html` 430 件すべて通過
- main: 撮り直した `title.png` で吹き出しがボタンを隠していないことを見た

## 分担の振り返り

- implementer は、にじみの縮め方の基準（盤の 1 マス）が画面で 49〜64 と変わることを
  見つけ、固定の 64 で近似して判断点として挙げた。screens は食い違いを見つけなかった
- 見込みと食い違いは無い。ただし `tools/capture.mjs` の吹き出しがボタンの並びに
  依存していて、並びを変えると重なることは見込んでいなかった（main が 3 回撮り直した）
- 次に配置を変える項目では、implementer の依頼に「`tools/capture.mjs` の吹き出しの
  向きも合わせ、撮り直した画像を見る」まで含める。トークンの内訳を項目ごとに
  出したいなら、並行させる項目は別セッションに分ける
