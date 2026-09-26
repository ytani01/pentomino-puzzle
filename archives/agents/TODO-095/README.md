# TODO-095 の分担

- implementer（Opus 5.5 / medium）: 設計の方針は main が決めて依頼に書き、洗い出しと実装・着手前の計測を任せた。変更が 13 ファイルにまたがり、Phaser の拡縮とシーンの予約の扱いが込み入るので Opus にした。TODO-094 の決着を待たずに始めるため、TODO-094 を取り込んだ状態から作った worktree（ブランチ todo-095）で作業させた。レビュー後の修正は本体の木で行った（途中で API のセッション上限で止まり、同じ担当に続きを頼んだ） → [implementer-report.md](implementer-report.md)（依頼は [brief.md](brief.md)、計測のスクリプトは [scripts/](scripts/)）
- reviewer（Opus 5.5 / high）: 状態の持ち越しと、シーンの予約が重なる経路のレビュー。修正後に同じ担当で再レビュー → [reviewer-report.md](reviewer-report.md)
- screens（Sonnet 5 / low）: 開いたあとに縦横を切り替え、6 つの場面で状態と配置を見る → [screens-report.md](screens-report.md)
- main: develop への取り込み、公開の仕組み（`VERSION` の行・版付け）との突き合わせ、デモのトレイのピースの位置の数値での確認

決着のファイル: [TODO-095](../../todo/TODO-095.%20画面の縦横の変化に追従する.md)
