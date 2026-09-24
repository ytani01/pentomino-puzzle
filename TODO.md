# TODO

**残っている項目: TODO-055。** これまでに 54 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-056` から。**

---

## TODO-055. 文書を README・UsersGuide・developer の 3 つに整理する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | docs（Sonnet 5 / medium。書く）+ reviewer（Sonnet 5 / high。重複と食い違い）+ verifier（Sonnet 5 / medium。コードと突き合わせ） |

- [ ] `README.md` を概要と特徴のアピールに絞る。遊び方の詳細は `docs/UsersGuide.md` へのリンクにする
- [ ] `docs/UsersGuide.md` を作る（盤の選び方、操作、ヒント表示・おまかせ、記録、つづきから、デモ）
- [ ] README の「テスト」節を `docs/developer.md` へ移す
- [ ] `docs/20260816-0538 ペントミノパズル Codebase 構造分析.md` を精査し、使える部分（層の分け方、シーンの移り方、registry のキー）を `docs/developer.md` へ移して消す。ファイル表の重複は捨て、古い箇所（`demo.js`・`icons.js` が無い等）は今のコードに合わせる
- [ ] `docs/storage.md` を精査し、設計判断（キー、値の形、検証の方針、スキーマ変更の扱い、書き込むタイミング、割り切り）を `docs/developer.md` の 1 節にまとめて消す。localStorage の一般的な説明（§1）と JavaScript の書き方メモ（§8）は落とす
- [ ] `CLAUDE.md` のファイル表・`.claude/agents/docs.md` の受け持ちに `docs/UsersGuide.md` を足す

決めたこと（2026-09-24）: UsersGuide は `docs/` に置く。storage.md の JS 入門の部分は削る。
テストの節は developer.md へ移す。
README と UsersGuide、CLAUDE.md と developer.md で同じ主張が 2 か所に出るので reviewer を入れる。
移す元が今のコードと合っているかは verifier に確かめさせる（reviewer を先、verifier を後）。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
