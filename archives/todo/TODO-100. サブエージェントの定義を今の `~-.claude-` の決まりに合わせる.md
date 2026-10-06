# TODO-100. サブエージェントの定義を今の `~/.claude/` の決まりに合わせる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet / medium） |
| 実施 | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet 5.5 / 記載なし） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 56 | 13,910 | 74,898 | 2,278,381 | 93% |
| verifier | Sonnet 5.5 | 記載なし | 12 | 77 | 35,596 | 148,968 | 7% |
| 合計 |  |  | 68 | 13,987 | 110,494 | 2,427,349 | 計 2,551,898 |

- verifier は `~/.claude/agents/verifier.md`（定義に `effort` の行が無い）。モデルを Sonnet に上書きした
- 集計は決着のコミット前の時点まで。verifier の分は少なめに出ている可能性がある
- ファイル名の `~-.claude-` は `~/.claude/` のこと（ファイル名に `/` を使えないため。tmr の前例に合わせた）

## きっかけ

9/26 以降に `~/.claude/` で決まったこと（報告はファイルで受け渡す、確認の担当に
原因の切り分けをさせない、定義に `CLAUDE.md` の規約を写さない）に、
このリポジトリの定義が追いついていなかった。

## やったこと

- `.claude/agents/{docs,measure,screens,tests}.md` の「報告に書くこと」を「報告」の節にし、
  `archives/agents/TODO-NNN/<担当名>-report.md` に書かせ、返事は
  「終わったか・報告ファイルのパス・判断が要る点」だけにさせた。
  「触ってよいファイル」に自分の報告ファイルを例外として足し、4 つとも `tools` に `Write` を足した
- `tests.md` は原因の見立て・切り分けをやめ、「実害は未確認」と添えて報告させる形にした
- `docs.md` から「造語を作らない」（`CLAUDE.md` の写し）を消した
- `docs/developer.md` の「サブエージェントの定義」を、4 つ目に報告の受け渡しを足した形にし、
  規約を写さないこと、直したら `check-agent-reply.py` で確かめることを足した

## 確かめたこと

verifier が差分を読み、4 担当それぞれを `claude -p` で実際に動かして返事を判定した。
4 つとも返事は 1 行で合格（[報告](../agents/TODO-100/verifier-report.md)）。

`check-agent-reply.py` は空の一時ディレクトリで動くので、プロジェクトの
`.claude/agents/` が見えず、そのままでは 4 つとも「測れなかった」（終了コード 2）。
`.claude/agents/` をコピーした一時ディレクトリで同じ判定をするラッパーを
`archives/agents/TODO-100/check-with-agents.py` に残した。

## 残ること

- `~/.claude/bin/check-agent-reply.py` はプロジェクトの定義を測れない
  （`~/.claude/` 側の話。このリポジトリでは上のラッパーで代わりにする）

## 分担の振り返り

- verifier は差分の一致に加え、スクリプトがプロジェクトの定義を読めないことを見つけ、
  ラッパーで測り切った。境界線上の点（`tests.md` の見出し文、`docs.md` に `Write` が無い）も
  挙げ、main が直した
- 見込みとの食い違いは無い
- 次に定義だけを直す項目も、main が書き換え、verifier（Sonnet）に実測させる組み方でよい。
  プロジェクトの定義を測るときは、最初から依頼にラッパーの場所を書けば、直接実行の 4 回分を省ける
