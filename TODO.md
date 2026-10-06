# TODO

**残っている項目: TODO-101。** これまでに 100 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-102` から。**

---

## TODO-101. `check-agent-reply.py` の `--project` を開発者向けの文書に反映する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet 5.5 / 記載なし） |

- [ ] `docs/developer.md` の「サブエージェントの定義」に、`check-agent-reply.py` は
  `--project .` を付けて測ることを書き足す（`~/.claude/` の TODO-031）。
  TODO-100 のラッパー（`archives/agents/TODO-100/check-with-agents.py`）は要らなくなったと添える

Agent ツールで `effort` を上書きできるようになった件（`~/.claude/` の TODO-030）は
書かない。表の effort は定義の値で今のままで合っており、上書きの規則は `~/.claude/` 側にある。
文書だけの変更だが、書いたコマンドを verifier に実際に走らせて 4 担当を測らせる。
決着したらタグは付けず `git push origin develop` だけにする。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
