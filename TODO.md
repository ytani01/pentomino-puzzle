# TODO

**残っている項目: TODO-100。** これまでに 99 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-101` から。**

---

## TODO-100. サブエージェントの定義を今の `~/.claude/` の決まりに合わせる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet / medium） |

- [ ] `docs`・`measure`・`screens`・`tests` の定義に、詳しい報告を
  `archives/agents/TODO-NNN/<担当名>-report.md` に書き、返事は
  「終わったか・報告ファイルのパス・判断が要る点」だけにする指示を足す
- [ ] `tests.md` の「原因の見立て」をやめ、「実害は未確認」と添えて報告させる形にする
- [ ] `docs.md` から `CLAUDE.md` の規約を書き写した行（「造語を作らない」）を消す
- [ ] `docs/developer.md` の「サブエージェントの定義」の「どの定義にも 3 つを書いてある」を、報告ファイルを含めた形に直す
- [ ] verifier に `~/.claude/bin/check-agent-reply.py` で、返事が短くなったかを実際に担当を動かして測らせる

9/26 以降に `~/.claude/` で決まったこと（報告はファイルで受け渡す、確認の担当に
原因の切り分けをさせない、定義に `CLAUDE.md` の規約を写さない）に、
このリポジトリの定義が追いついていない。`CLAUDE.md`・`screenshot` スキル・
`settings.local.json` には食い違いが無かった。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
