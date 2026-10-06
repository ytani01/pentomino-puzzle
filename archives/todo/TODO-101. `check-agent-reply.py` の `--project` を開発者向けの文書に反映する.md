# TODO-101. `check-agent-reply.py` の `--project` を開発者向けの文書に反映する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet 5.5 / 記載なし） |
| 実施 | Opus 5.5 / effort medium | main（書き換え）+ verifier（Sonnet 5.5 / medium） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 14 | 1,631 | 4,139 | 427,681 | 83% |
| verifier | Sonnet 5.5 | medium | 8 | 52 | 19,868 | 70,890 | 17% |
| 合計 |  |  | 22 | 1,683 | 24,007 | 498,571 | 計 524,283 |

- verifier は `~/.claude/agents/verifier.md`。見込みを書いたときは TODO-100 の記録から「記載なし」と写したが、
  実際の定義には `effort: medium` が足されていた
- 集計は決着のコミット前の時点まで。サブエージェントの分は少なめに出る

## きっかけ

TODO-100 の後に `~/.claude/` で決まったことに合わせる。`check-agent-reply.py` に
`--project <dir>` が付き（`~/.claude/` の TODO-031）、TODO-100 で作ったラッパーが要らなくなった。
Agent ツールで `effort` を上書きできるようになった件（同 TODO-030）は、表の effort が定義の値なので
直す所が無く、規則を写すと 2 か所に残るので書かなかった。

## やったこと

- `docs/developer.md` の「サブエージェントの定義」に、このリポジトリの定義は `--project .` を
  付けて測ること、その例、TODO-100 のラッパーはもう要らないことを書き足した

## 確かめたこと

verifier が `--project . --agent <名前>` を 4 担当で 1 回ずつ実行し、4 つとも終了コード 0・返事 1 行で合格。
`--project .` を付けないと「測れなかった」（終了コード 2）になることも確かめた
（[報告](../agents/TODO-101/verifier-report.md)）。

## 分担の振り返り

- verifier: 食い違いは見つからなかった。`--project` を付けない場合の失敗も合わせて確かめた
- 見込みとの食い違いは verifier の effort の書き写し違いだけ。次は見込みを書くとき、記録でなく定義ファイルを見る
- 次に同じ規模なら、組み方は同じでよい
