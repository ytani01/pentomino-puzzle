# TODO-096 の分担

- main: `tools/stamp-version.mjs` と `pages.yml` の段、文書。スクリプト 1 本とワークフローの 1 段で、込み入った設計が無いので分けなかった
- verifier（Sonnet 5 / medium）: 手元で公開と同じ手順を踏み、読み込みがすべて `?v=` 付きになること、壊すと失敗することを確かめた → [verifier-report.md](verifier-report.md)
- reviewer（Opus 5.5 / high）: 付け漏れの検出という分岐があり、公開の挙動が変わるので入れた → [reviewer-report.md](reviewer-report.md)

決着のファイル: [TODO-096](../../todo/TODO-096.%20公開した直後のリロードで新しい版が出るようにする.md)
