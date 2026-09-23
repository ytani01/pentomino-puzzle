# TODO

**残っている項目: TODO-049。** これまでに 48 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-050` から。**

---

## TODO-049. screens の定義を、ブラウザが固まったときに備えた形に直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（定義の編集）+ screens（Sonnet 5 / low。直した定義での試し撮り） |

- [ ] `.claude/agents/screens.md` の手順に、始める前にタブを開き直すこと（`browser_close` のあと `browser_navigate`）を足す
- [ ] クリックなどの操作に時間の上限を付けること（`browser_run_code_unsafe` の中で `Promise.race` と `page.waitForTimeout`）と、
      同じ操作が 2 回続けて返らなければやり直さずに報告することを足す
- [ ] `description` の画像の置き場を `~/tmp/claude-img/` から、本文と同じ `~/tmp/playwright-mcp/` に直す
- [ ] 同じコードを通る操作は代表 1 つにすること（ユーザー全体の `CLAUDE.md`）を、見るところの節に 1 行で案内する
- [ ] 利用者に Claude Code を再起動してもらい、直した定義の screens で、タイトルを横・縦 1 枚ずつ撮り、
      盤のボタンを 1 回押させて、固まらずに終わるかを確かめる

TODO-046 で、screens が 2 回とも、画面を撮ったあとの最初のクリックで Playwright の
`mouse.click` が返らなくなり、約 1 時間止まった。タブを開き直すと直ったが、
固まったきっかけは切り分けられていない（`archives/todo/` の TODO-046 の「分担の振り返り」）。
今回はきっかけを探さず、固まっても早く気づいて止まれるようにするだけにする。

- 定義は起動時にしか読まれないので、試し撮りの前に利用者の再起動が要る
- 変えるのは定義ファイルだけで、`.claude/skills/screenshot/SKILL.md` は、定義と食い違う記述があるときだけ直す

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
