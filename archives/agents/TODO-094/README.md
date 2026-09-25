# TODO-094 の分担

- implementer（Opus 5.5 / medium）: 本編の操作の概要・ガラスの下地・やり直しの確認・空の盤のホーム・ツールチップの不具合。原因の切り分けと保存の条件が絡むので Opus にした。TODO-092・093 と並行させるため git worktree で作業させた → [implementer-report.md](implementer-report.md)（依頼は [brief.md](brief.md)）
- reviewer（Opus 5.5 / high）: 分岐と保存の条件が変わるので、挙動のレビューを分けた → [reviewer-report.md](reviewer-report.md)
- screens（Sonnet 5 / low）: 取り込んだあとの画面と、確認・ホーム・タッチのツールチップの挙動 → [screens-report.md](screens-report.md)
- main: develop への取り込み（TODO-093 との食い違いの解消）、タッチのツールチップを時間を止めて撮り直し、`docs/images/game.png`・`demo.png`・`demo.gif` の撮り直しと吹き出しの位置の調整

決着のファイル: [TODO-094](../../todo/TODO-094.%20プレー画面の操作概要・ガラスの下地・確認とホームの動きを直す.md)
