# TODO-104. 全体ルール（版 104）に文書と TODO.md の形を合わせる

|      | main | 担当 |
|------|------|------|
| 見込み | Fable 5.2 / effort medium | main のみ（文書だけを変える。確かめるのは書式だけ） |
| 実施 | Fable 5.2 / effort 記録なし | main のみ |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Fable 5.2 | 記録なし | 11 | 2,617 | 8,786 | 414,734 | 100% |
| 合計 |  |  | 11 | 2,617 | 8,786 | 414,734 | 計 426,148 |

- 集計は決着のコミット前の時点まで。立てる前の調べもの（食い違いの洗い出し）は範囲に入っていない
- main の effort は transcript に残らないので書いていない

## きっかけ

起動時に、全体ルールの版（104）をこのプロジェクトがまだ見ていないと知らせが出た。
利用者の依頼で、全体の `CLAUDE.md` と `todo-workflow` skill に照らして食い違いを洗い出した。

## やったこと

- `TODO.md` の先頭を今の骨格に揃えた（「番号は」を 2 行目へ寄せ、残っていた `---` を消した）。
  `~/.claude/bin/todo-index.py` が先頭の 2 行を書き直せるようになった。
  項目を足すのに要ったので、立てるコミット（d62fc96）で済ませた
- `docs/developer.md` の「サブエージェントの定義」を直した。「設計と込み入った実装は
  親（Opus）が持つ」をやめ、実装・レビュー・確認は全体の定義（`implementer`・
  `reviewer`・`verifier`）に任せ、このリポジトリの 4 つはその補いだと書いた。
  Agent ツールを呼ぶときに `model` と `effort` を毎回付けることも足した
- `CLAUDE.md` の「作業の進め方」に「担当への依頼」を足した（worktree を使わないこと、
  依頼に書くコマンド、定義の受け持ちの置き場）
- `.claude/global-rules-seen`（104）をコミットした（利用者が決めた。どのマシンでも同じ版を見たことにする）

## 確かめたこと

- `todo-index.py` が `TODO.md` の先頭の 2 行を書き直し、件数が `archives/todo/` のファイル数と合うこと
- `~/.claude/agents/` に `implementer`・`reviewer`・`verifier`・`wording` があること
- 「親（Opus）」の記述が `docs/`・`CLAUDE.md`・`README.md` に残っていないこと（`rg`）

## 残ること

- `.claude/worktrees/` の 2 つ（TODO-093・TODO-094 の wip。ブランチは develop に入っていない）は
  触っていない。利用者が残すと決めた（2026-11-10）。Git の管理外（`.git/info/exclude`）なので項目にはしない
