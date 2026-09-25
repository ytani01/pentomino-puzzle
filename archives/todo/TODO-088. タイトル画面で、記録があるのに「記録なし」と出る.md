# TODO-088. タイトル画面で、記録があるのに「記録なし」と出る

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（調査・実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort low | main（調査・実装）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | low | 10,993 | 32,221 | 52% |
| reviewer | Opus 5.5 | high | 4,298 | 71,297 | 21% |
| verifier | Sonnet 5 | medium | 4,430 | 98,580 | 27% |
| 合計 |  |  | 19,721 | 202,098 | 概算 $4.4 |

- reviewer は定義のモデルが sonnet。最短時間の区切りという分岐の意味が変わる項目なので Opus 5.5 に上書きした
- 集計は TODO-090 の決着から数えた。調査と最初の実装は TODO-090 の確認待ちの間に進めたので、その分は TODO-090 の main に入っている

## きっかけ

利用者の報告。記録があるのに、タイトル画面の最短時間が「記録なし」と出る。

## やったこと

原因は見立てどおりだった。タイトルは最短時間（`loadBest()`）だけを見るが、最短時間は
ヒント表示もおまかせも使わない回にしか残らなかった（TODO-020・TODO-024）。ヒント表示を
使ったクリアしか無いと、履歴はあるのに「記録なし」になる。

利用者と決めたとおり、TODO-020 の決めごとを「おまかせの回だけ最短から除く」に変えた。

- `src/storage.js`
  - `shouldRecordBest(usedAuto)`: おまかせを使っていなければ最短時間に入れる
  - `loadBest()`: 保存値と、履歴のうち `a` の無い件の短い方を返す。履歴から出したときは
    保存値へ書き戻す（記録を消したときや、履歴があふれたときに最短が延びないように）
  - `isBetterClear()`: 見るのを `a` だけにした（`h` は見ない）。最短時間と区切りを揃えないと、
    同じ解でヒント表示の回が自力の回より速いとき、最短は更新したのに履歴には遅い回が残り、
    最短の時間が一覧のどこにも無くなる（reviewer の指摘）
- `src/scenes/clear.js`: 最短の行の分岐を `shouldRecordBest(this.usedAuto)` にし、コメントを直した
- `tests.html`: 最短時間の区切り、`loadBest()` の履歴の参照と書き戻し、`saveBest()` が履歴の
  最短と比べること、`isBetterClear()` が `h` を見ないことのテストを足し、既存の期待値を新しい
  決めごとに合わせた。`withCleanStorage` は `storageKey` も空にしてから走らせる
- `docs/UsersGuide.md`・`docs/developer.md`: 最短時間に入る回の説明を直した

## 確かめたこと

- `tests.html` をブラウザで開き、430 件すべて通った（main）。verifier は Playwright から
  ループバックへ繋げず、テスト本体を Node で走らせた。そこで既存のテスト 1 件
  （`dedupeHistory` の期待値）が新しい決めごとと食い違うのを見つけ、main が期待値を直した
- verifier が 3 か所を一時的に壊し（`shouldRecordBest`・`isBetterClear`・書き戻し）、
  それぞれ対応するテストが落ちることを確かめた（[報告](../agents/TODO-088/verifier-report.md)）
- タイトル画面で、8×8 の履歴にヒント表示の回だけ（83 秒）を入れると「最短 01:23」、
  おまかせの回だけだと「記録なし」と出ることを、ブラウザで確かめた（main）

## 残ること

- 古い版の履歴で、ヒント表示の回が同じ解のもっと速いおまかせの回に置き換わっていた場合は、
  その回がもう残っていないので「記録なし」のまま（reviewer の指摘 3）。取り戻す手段が無い

## 分担の振り返り

- reviewer は、コメントの取り残し、`isBetterClear()` を揃えないと最短の時間が一覧から消える件、
  履歴から出した最短が消える件、`saveBest()` のテストが無い件を見つけた。main が「変えない」と
  決めた `isBetterClear()` の判断を覆したのは reviewer で、入れた効果が大きかった
  （[報告](../agents/TODO-088/reviewer-report.md)）
- verifier は既存テスト 1 件の食い違いを見つけた。ただしブラウザに繋げず、Node の代わりの実行に
  時間を使い（19 分）、料金も reviewer より多かった
- 次に同じ規模なら同じ組み方でよい。ただし verifier の依頼に「Playwright MCP の
  `browser_navigate` で開く（screens と同じ手段）」と手段を名指しし、繋がらなければ
  その時点で止めて返すよう書く
