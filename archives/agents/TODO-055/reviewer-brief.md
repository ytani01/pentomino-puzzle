# TODO-055 reviewer への依頼

## 対象
作業ツリーの差分（未コミット）: `git diff HEAD` と新規の `docs/UsersGuide.md`。
依頼内容は `archives/agents/TODO-055/docs-brief.md`、担当の報告は `docs-report.md`。

## 見ること
1. 役割の分け方: README は概要と特徴、UsersGuide は遊び方、developer.md は開発者向け、
   になっているか。README に遊び方の細部が残っていないか、UsersGuide に開発者向けの話
   （関数名・ファイル名）が混ざっていないか
2. 同じ主張が 2 か所にあるところの食い違い: README と UsersGuide、CLAUDE.md と developer.md、
   developer.md の中の「画面の用語」とUsersGuide。数（65/2339、ボタン 6 個など）や言い回しがずれていないか
3. 削った 2 ファイルから、残すべき設計判断が落ちていないか（`git show HEAD:docs/storage.md`、
   `git show "HEAD:docs/20260816-0538 ペントミノパズル Codebase 構造分析.md"` と比べる）。
   落とすと決めたもの（storage.md の §1 一般説明・§8 JS メモ、構造分析の §5・ファイル表の重複）は指摘しない
4. リンク切れ: 文書間のリンクとアンカー（`rg -n '\]\((\.\./)?(docs/)?[A-Za-z]+\.md' README.md docs CLAUDE.md`）
5. ユーザー全体の CLAUDE.md「日本語の書き方」「造語を使わない」に反する箇所

## 見なくてよいもの
- コードの中身と文言が一致しているかの 1 件ずつの照合（verifier が後でやる）
- `archives/`・`TODO.md`

## やらないこと
- ファイルを直さない。境界線上の判断は報告だけ（「実害は未確認」と添える）

## 報告
`archives/agents/TODO-055/reviewer-report.md` に、指摘ごとに「ファイル:行・何が問題か・どう直すとよいか」。
問題の無かった観点は 1 行。返事は 5 行以内。
