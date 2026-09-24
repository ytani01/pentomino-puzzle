# TODO-056. 文書に図を入れる（UsersGuide に注記付きのキャプチャ、developer に mermaid、README に画面と GIF）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（撮影スクリプト・文書）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort high | main（撮影スクリプト・文書）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 38,669 | 93,312 | 70% |
| reviewer | Opus 5.5 | high | 4,038 | 78,694 | 24% |
| screens | Sonnet 5 | low | 780 | 69,908 | 6% |
| 合計 |  |  | 43,487 | 241,914 | 概算 $5.8 |

- reviewer は定義のモデルが sonnet。mermaid の図とコードを突き合わせる判断が要るので Opus 5.5 に上書きした
- screens は定義のまま（sonnet / low）
- 途中で利用者から別の項目（デモの探し方）の依頼が入り、その相談のやり取りもこの範囲に含まれる

## きっかけ

利用者から、UsersGuide に注記付きのキャプチャ、developer に mermaid の図、
README に初めて見た人向けの画面を入れてほしいと頼まれた。

## やったこと

決めたこと: 画像は `docs/images/` に置く。注記は撮るときに DOM で重ねる。
README は静止画 1 枚とデモの GIF。3 文書を 1 項目にまとめる。

- `tools/capture.mjs` を足した。Playwright で 6 ファイルを撮る
  （play・title・game・records・demo の PNG と demo.gif）。番号付きの丸と吹き出しは
  Phaser の部品の位置（Container は `setSize()` の大きさ、Text は `getBounds()`）から
  出して、Canvas の上へ HTML で重ねる。HUD を指す吹き出しは、viewport を 960×720 にして
  上下に空けた帯へ置く。GIF はコンテキストの動画を `ffmpeg` で変換する
- Playwright は依存に足さず、Playwright MCP が npx で持ってきた 1.63.0 をパスで渡す
  （`PLAYWRIGHT` 環境変数）。版ごとに使う Chromium が違うため版で絞る
- `docs/UsersGuide.md`: 盤と色・操作・記録・デモの節に画像を入れ、本文と表に番号を振った。
  書かれていなかったトレイの向きの印（Ⓕ）と、デモのボタン表を足した
- `docs/developer.md`: 3 層の分け方（import の向き）、シーンの移り方（ASCII の図を
  stateDiagram に置き換え）、記録の保存（どのシーンが何を書くか）を mermaid で描いた。
  「いつ書き込まれるか」の表に、抜けていた「全部消したとき」を足した。撮り直しの手順を
  ファイル構成の節に書いた
- `README.md`: 遊んでいる途中の画面と、デモの GIF を入れた
- `CLAUDE.md`: 「画像アセットを追加しない」に文書用のキャプチャを例外として足し、
  ファイル構成の表に `tools/capture.mjs` と `docs/images/` を足した

## 確かめたこと

- reviewer: mermaid の 3 図・UsersGuide の番号とコードを突き合わせた。指摘 2 件
  （3 層の図で import の矢印 2 本の抜け、「書き込むのは 3 シーンだけ」が Title の
  `savePalette()` を落としていた）を直した。Playwright の版が不定になる点も直した
- screens: developer.md の手順どおりに撮り直せた（32 秒、エラー無し）。5 枚の PNG で
  注記の指す部品、欠け、余計な表示が無いことを見た。GIF はフレームを抜いて進んでいる
  ことを見た。mermaid の 3 図は `mermaid.render()` でエラー無く描けた

## 残ること

- 記録の画面の「完成形」（③）の位置は、Graphics が大きさを持たないので見出しからの
  決め打ちで指している。記録の画面の配置を変えたら、撮った画像を見て合わせ直す
  （`tools/capture.mjs` に `ponytail:` の注記あり）
- デモの探し方を変える次の項目で、demo.png・demo.gif と UsersGuide のデモの節を撮り直す

## 分担の振り返り

- reviewer は import の矢印の抜けと Title の書き込みの漏れを見つけた。どちらも main が
  図を描くときに `rg` で拾った範囲の外（`storage.js`・`icons.js` の import、Title の
  `savePalette()`）にあった。screens は食い違いを見つけなかった（main が撮るたびに
  画像を見て直していたため）
- 見込みと食い違いは無かった
- 次に同じ規模の文書の項目をやるなら同じ組みでよい。screens には「main が既に見た画像」
  を渡しているので、見る項目を再現（手順どおりに撮れるか）と mermaid の描画に絞れば
  もう少し減らせる。reviewer の Opus への上書きは、図とコードの突き合わせで指摘が
  出たので次も続ける
