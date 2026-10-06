# TODO-101 verifier report

## 結論
食い違い無し。差分は docs/developer.md のみ（git status は TODO.md と docs/developer.md の変更。指示の範囲内）。

## 1. --help との照合
- `--project`・`--agent` は --help にある。例 `--project . --agent docs` の書き方は一致。
- 「`--project .` を付けないと見えない」を実測: 付けずに `--agent docs` を実行 -> 「測れなかった: 担当の返事（SubagentHandback）が出力に無い」、exit=2。記述と矛盾しない。

## 2. 4 担当（cwd はリポジトリのトップ、各 1 回）
| 担当 | exit | 返事の行数 | 判定 |
|---|---|---|---|
| docs | 0 | 1 | 合格 |
| measure | 0 | 1 | 合格 |
| screens | 0 | 1 | 合格 |
| tests | 0 | 1 | 合格 |

本文（各 1 行、そのまま）:
- docs: 終わった。報告ファイルは /tmp/check-agent-reply-5gn5wza8/archives/agents/TODO-999/docs-report.md。結果は、4 ファイル（docs・measure・screens・tests）とも description に「名指し」は無かった。docs.md の 15 行目に本文の「名指し」が 1 件あるだけ。measure.md・screens.md・tests.md は、ファイル全体で 0 件。判断が要る点は無い。
- measure: 終わった。報告ファイルは /tmp/check-agent-reply-2pl118nb/archives/agents/TODO-999/measure-report.md。結果は、4 ファイル（measure・docs・tests・screens）のどれも frontmatter の description に「名指し」が無かった。docs.md だけは本文に 1 件あった（参考として記載）。判断が要る点は無い。
- screens: 終わった。報告: /tmp/check-agent-reply-v8c1x89e/archives/agents/TODO-999/screens-report.md。4 ファイルとも description に「名指し」は無い（本文の docs.md:15 に 1 件のみ）。判断が要る点なし。
- tests: 終わった。報告: /tmp/check-agent-reply-hjaa10uk/archives/agents/TODO-999/tests-report.md。4 ファイルとも frontmatter の description に「名指し」は無い（docs.md の本文 15 行目にのみ有り）。判断が要る点なし。

## 3. ラッパー不要の記述
4 担当とも `--project .` だけで合格。ラッパー無しで動くので矛盾しない。
境界線上（報告のみ）: 返事の内容は 4 件とも「定義ファイルの調査結果」で、定義どおりに動いた証拠としては十分。ただしラッパーと結果が同じかは未比較（指示により実行せず）。

## 確かめられなかったこと
なし。
