# TODO-100 verifier 報告

## 1. 静的確認（git diff）
- チェック 1（4 定義に「報告」の節: ファイルに書き、返事は 3 点だけ）: 一致
- チェック 2（tests.md: 原因の見立てをやめ「実害は未確認」）: 一致
- チェック 3（docs.md の「造語を作らない」削除）: 一致
- チェック 4（developer.md「3 つ」→「4 つ」＋報告ファイル）: 一致
- frontmatter: 4 定義とも `---` で閉じ、measure・screens の tools に Write 追加済み。壊れていない
- 「触ってよいファイル」と「報告」の矛盾: 4 定義とも「例外は自分の報告ファイル」と書いてあり矛盾なし
  （tests.md は「書き換えてよいのは tests.html だけ」の見出し文が残る。例外は箇条書きで補っている。境界線上、報告のみ）
- 変更ファイルは .claude/agents/{docs,measure,screens,tests}.md、TODO.md、docs/developer.md の 6 つ。範囲内
  （TODO.md はチェックボックスのみ。docs.md は Edit のみで Write が無いが、新規ファイル作成は Bash 経由になる。実測では支障なし）

## 2. 実測
- 直接実行（`check-agent-reply.py --agent X`）: 4 担当とも終了コード 2
  「測れなかった: 担当の返事（SubagentHandback）が出力に無い」
  （原因は推定: mkdtemp の空ディレクトリで .claude/agents/ が見えない。出力: raw/direct-*.txt）
- そこで `check-with-agents.py`（同じ場所に残した）で、.claude/agents/ をコピーした一時ディレクトリを cwd にして再実行。スクリプトは未変更
  （run_agent・extract_reply・judge を importlib で再利用）

| 担当 | 返事の行数 | 判定 | 終了コード |
|---|---|---|---|
| docs | 1 | 合格 | 0 |
| measure | 1 | 合格 | 0 |
| screens | 1 | 合格 | 0 |
| tests | 1 | 合格 | 0 |

出力原文: raw/wrap-{docs,measure,screens,tests}.txt。各担当 1 回ずつ。

## 3. 確かめられなかったこと・注意
- 返事の報告パスは一時ディレクトリの絶対パスで、判定は部分一致で通っている（相対パスで返す指定は定義に無い）。問題かどうかは判断しない
- tests の返事には「判断が要る点」が書かれていた（wording に無いのが意図どおりか）。依頼内容の正しさは対象外のため見ていない
- 各 1 回のみなので、返事が毎回短いとまでは言えない
- 一時ディレクトリにできた報告ファイルの中身は、スクリプトが削除するため見ていない
