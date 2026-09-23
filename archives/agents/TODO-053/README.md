# TODO-053 の分担

- main：設計（[design.md](design.md)）と、直す前後の距離の測定（[distance.mjs](distance.mjs)）。
  レビュー後の文書・テストの手直し
- implementer（Opus 5.5 / medium）：棚詰めの計算・`game.js` の読み替え・テスト。
  並べ方の計算が込み入るので Opus。報告は [implementer-report.md](implementer-report.md)
- reviewer（Opus 5.5 / high）：盤の取り分の計算が変わるので、重なりと回したときのはみ出しを見る。
  報告は [reviewer-report.md](reviewer-report.md)（指摘 1・2 は、その後 main が直した）
- screens（Sonnet 5 / low）：縦横 × 2 つの盤を撮る。報告は [screens-report.md](screens-report.md)
- verifier（Sonnet 5 / medium）：ドラッグで掴めるか、テストの強さ。報告は [verifier-report.md](verifier-report.md)
