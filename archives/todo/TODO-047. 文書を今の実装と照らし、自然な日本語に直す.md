# TODO-047. 文書を今の実装と照らし、自然な日本語に直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | docs（Sonnet 5 / medium）+ wording（Sonnet 5 / 記載なし）+ verifier（Sonnet 5 / 記載なし） |
| 実施 | Opus 5.5 / effort high（途中で利用者が medium に下げた） | docs（Sonnet 5 / medium）+ wording（Sonnet 5 / 記載なし。2 回）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high → medium | 14,610 | 40,424 | 63% |
| wording | Sonnet 5 | 記載なし | 8,758 | 105,262 | 18% |
| verifier | Sonnet 5 | medium | 4,371 | 68,932 | 13% |
| docs | Sonnet 5 | medium | 782 | 51,854 | 6% |
| 合計 |  |  | 28,521 | 266,472 | 概算 $4.6 |

- wording は定義のモデルが haiku。言い回しの良し悪しは判断が要るので Sonnet 5 に上書きした。
  定義に `effort` の行が無い（Haiku は effort に対応しないため書いていない）
- 見込みの行の verifier の「記載なし」は誤り。定義（`~/.claude/agents/verifier.md`）には `effort: medium` がある
- 集計は `--since '2026-09-24 02:40:00'`（立てたのは TODO-046 の作業中で、着手はその決着の後）

## きっかけ

利用者の依頼（2026-09-24）。TODO-046 の後に、文書が実装と合っているか、
人が読んで分かりやすい自然な日本語になっているかを点検する。
対象は `README.md`・`docs/developer.md`・`CLAUDE.md`。`archives/` は当時の記録なので直さない。

## やったこと

- `README.md`
  - 構成の `icons.js` に、タイトルの盤・色の選択肢の図を書き足した（main）
  - HUD のボタンの説明の出方を「マウスを載せると（タッチ端末では押すと）何のボタンかが出る」に揃えた。
    「升目」を「マス」に揃えた。デモの節の折り返しを揃えた（wording）
- `docs/developer.md`
  - TODO 番号を外した（利用者が決めた）。番号を消すと意味が通らない昔のいきさつの括弧
    （HUD のボタンの並べ方の変遷）は括弧ごと消した。`archives/` へのリンクは残し、見える文言を言葉にした
  - 内部解像度に縦画面（640×1136）を書き足した
  - 公開の手順を運用に合わせた（`develop` とタグを一緒に push する、`feat` は minor・`fix` / `refactor` は patch、
    公開するものが変わらない変更ではタグを付けない）。「タグを push して公開する」節のコマンドも同じ形にした
  - 数え上げの時間を今回の実測に合わせた（8×8 は十数秒、6×10 は 327〜389 秒）
  - 「画面の用語」の冒頭の 1 文を推敲した（wording）
- `CLAUDE.md` は直すところが無かった（`icons.js` の行は TODO-046 で直してあった）

## 確かめたこと

- verifier（[報告](../agents/TODO-047/verifier-report.md)）
  - README の URL 2 つが 200、`node tools/gen-solutions.mjs --check` が終了コード 0
    （8×8 は 17.0 秒、6×10 は 388.9 秒）、`gh run list` が動く
  - 書き換えた行はどれもコードと一致。TODO 番号の残りは `archives/` へのリンク先のパスだけ
  - 「タグを push して公開する」節と、8×8 の時間の食い違いを見つけた。main が直した

## 分担の振り返り

- **docs** は食い違いを 1 つも見つけなかった。直近の変更（TODO-042〜046）とだけ照らしていて、
  README の `icons.js`、縦画面の内部解像度、公開の手順（master・バージョンの基準）、
  `docs/developer.md` の TODO 番号を見落とした。main が README と `docs/developer.md` を読んで見つけた
- **wording** は 1 回目に表記の揺れ 2 か所だけを直し、読点で条件が並んだ読みにくい文を見送った。
  main が例を示して基準を上げると、2 回目で直した
- **verifier** は、変えていない節の食い違い（タグの手順）と、実測と合わない時間を見つけた
- 見込みとの食い違いは、docs と wording が浅く、main が文書を読み直して補ったこと。main の料金が 63% になった
- 次に同じ規模の文書の点検をやるなら:
  - docs には「直近の変更と照らす」でなく、**文書の主張を 1 つずつ挙げてコードと照らす**よう依頼に書く。
    数値・ブランチ名・手順・件数のように、見落としやすい種類を例で挙げる
  - wording には最初から「初めて読む人が一度で読めるか」を基準として渡し、直すべき例を 1 つ付ける
  - 事実の全体の照合は verifier の方が確かだった。docs を省き、verifier の報告をもとに main が直す組み方でもよい
