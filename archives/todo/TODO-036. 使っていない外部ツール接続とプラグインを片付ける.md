# TODO-036. 使っていない外部ツール接続とプラグインを片付ける

- [x] context7 をこのプロジェクトで切る（`/mcp disable context7`）
- [x] Chrome 連携（claude-in-chrome）を切る（`/mcp` の一覧、または Chrome 拡張側）
- [x] 未使用プラグイン 3 件を削除（pyright-lsp / frontend-design / github。`/plugin`）

## きっかけ

2026-08-18 に `/doctor`（Claude Code の健康診断）を実行した結果。
直近 50 セッション分の記録を調べたところ、次のことが分かった。

- **context7**（ライブラリの公式ドキュメントを取ってくる接続）: 0 回。
  このリポジトリは依存が Phaser 3.90.0（CDN、バージョン固定）だけで npm を使わず、
  Phaser 3 の API は安定していて手元に動くコードもあるため、外の文書を引く場面が無い
- **claude-in-chrome**（Chrome を操作する連携）: 0 回。Chrome 拡張が未接続で使えない
- **プラグイン 3 件**（pyright-lsp / frontend-design / github）: 累計 0 回で、すでに無効化済み。
  無効なので負担は無いが、一覧が紛らわしい

残すと決めたもの: **playwright**（画面の確認に 18 回。`screenshot` スキルが使う）、
**typescript-lsp**（累計 375 回）。

診断の結果のうち、リポジトリのファイルに関わる分（`CLAUDE.md` の整理）は
[TODO-035](TODO-035.%20CLAUDE.md%20の常駐分を減らす.md) で先に済ませてあり、
この項目に残ったのは Claude Code の設定だけ。診断の報告書（`DOCTOR.md`）は
この項目へ写したうえで消した（リポジトリに残す内容ではないため）。

## やったこと

**すべて利用者が実行した。** Claude Code の設定は Claude からは変えられない
（アプリ側に戻される恐れがあるので、設定ファイルを直接書き換えるのも避けた）。

- `/mcp disable context7`
- `/mcp` の一覧から claude-in-chrome を切る
- `/plugin` から未使用プラグイン 3 件を削除

`/mcp disable` は**プロジェクトごと**の設定なので、他のプロジェクトでも切るなら
そこで同じコマンドを実行する。

## テスト

自動テストの対象ではないので、設定ファイルを読んで確かめた。

| 確かめたこと | 結果 |
|---|---|
| `~/.claude.json` の `disabledMcpServers` | `context7` と `claude-in-chrome` の両方が入っている |
| セッション中の接続状態 | 2 つとも切断され、ツールの定義も外れた |
| `~/.claude/plugins/installed_plugins.json` | 残るのは `typescript-lsp@claude-plugins-official` の 1 件だけ |
| `~/.claude/settings.json` の `enabledPlugins` | 同じく 1 件だけ |
| `.claude/settings.local.json` の `enabledMcpjsonServers` | `playwright` は入ったまま（画面の確認は今までどおり使える） |

`~/.claude.json` の最上位には context7 の登録自体は残っている（無効なだけ）。
これは意図どおりで、`/mcp enable context7` で戻せる。
Chrome 連携は切ったのと同じ場所、プラグインは `/plugin` から再インストールできる。
