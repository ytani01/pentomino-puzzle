# TODO-058. README を遊ぶ人向けに書き直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（README の執筆）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort high | main（README の執筆）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 5,954 | 52,305 | 79% |
| verifier | Sonnet 5 | medium | 2,950 | 45,303 | 21% |
| 合計 |  |  | 8,904 | 97,608 | 概算 $1.3 |

- verifier は `~/.claude/agents/verifier.md`（model: sonnet、effort: medium）のまま

## きっかけ

README に依存・アセット方針・ローカルサーバでの起動手順といった技術的な記述が
多く、公開版で遊ぶ人に向いていなかった。利用者は公開版で遊ぶのが前提で、
ローカルでサーバを動かすのは開発者。README ではパズルゲームとしての見た目と
遊びやすさを前に出し、技術情報は `docs/developer.md` に置く（利用者が決めた）。

## やったこと

- `README.md` を書き直した。公開版へのリンクを先頭に置き、遊び方・盤と解の数・
  ヒント表示とおまかせ・記録・つづきから・デモを遊ぶ人の目線で書いた。
  図は既存の `docs/images/play.png` と `docs/images/demo.gif`（撮り足していない）。
  末尾に `docs/UsersGuide.md` と `docs/developer.md` へのリンクを残した
- `docs/developer.md` に「動かす」節を足し、目次にも載せた。developer.md に
  無かったもの（ビルド工程が無いこと、`file://` で動かない理由と起動手順、
  依存が Phaser だけで npm を使わないこと、画像・音声を持たないこと、
  Node.js が要る場面）だけを移した。全解のデータの中身は既存の節へのリンクで済ませた

## 確かめたこと

verifier が確かめた（[報告](../agents/TODO-058/verifier-report.md)）。

- 「動かす」節の起動手順を書いたとおりに実行し、`/` と `/tests.html` が 200、
  応答の `<title>` がそれぞれのファイルのものと一致した。8765 は作業前から
  別のプロセスが使っていたため、ポートだけ 8766 に変えて再現した
- README と developer.md のリンク・図のパス・新しいアンカーはすべて実在する
- 旧 README の主張はすべて新 README か developer.md に残っている
- 新 README の記述は `docs/UsersGuide.md` と食い違わない

## 分担の振り返り

- **verifier が見つけたこと:** 文書の食い違いは無し。ポート 8765 が既に
  使われていて、最初の実行では手順の再現になっていないことを自分で報告した
  （200 が返っても既存のプロセスの応答だった）。これが無ければ再現済みと
  読み違えていた
- **見込みとの食い違い:** 分担は見込みどおり。verifier への依頼が 2 回に割れた
- **次に同じ規模なら:** 同じ組み方でよい。起動手順を再現させるときは、
  最初から「使われていないポートで起動し、応答の `<title>` で配信元を確かめる」
  まで依頼に書き、依頼を 1 回で済ませる
