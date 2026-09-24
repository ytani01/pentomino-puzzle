# TODO-055 docs 担当 報告

## 変えたファイル

### README.md
- 全面書き直し。残したもの: 1 行の説明、公開版 URL、依存・アセット無し・
  マウス/タッチ・盤と全解の数・全解データによる待たない仕組み・デモの
  存在（特徴の箇条書き）、ローカルで開く手順、ライセンス
- 「遊ぶ」の操作表・細かい挙動、「デモ」節 → `docs/UsersGuide.md` へ移した
- 「テスト」節 → `docs/developer.md` へ移した
- 「開発者向け」の文言を「ファイル構成、画面の用語、テスト、記録の保存、
  全解のデータ、GitHub 上の設定」に更新

### docs/UsersGuide.md（新規）
README にあった「遊ぶ」「デモ」の内容を土台に、コード（`src/scenes/*.js`・
`src/ui.js`・`src/config.js`）と突き合わせて作成。節: 盤と色を選ぶ／操作／
HUD のボタン／クリアと番号／つづきから／記録の画面／デモ。
HUD のボタンの文言・ツールチップ文字列は `src/scenes/game.js` の
`tooltip:` から、デモの速さ表記は `src/scenes/demo.js` の `speedTips` から
そのまま拾った。記録の画面は「この回を消す」と「全部消す」の両方が実装に
あったので両方書いた（下記「食い違い」参照）。

### docs/developer.md
- 目次に「構成」「テスト」「記録の保存」を追加し、`docs/UsersGuide.md` への
  導線を 1 行足した
- ファイル構成の図に `docs/UsersGuide.md` を追加
- 「構成」節（新規）: 3 層の分け方、シーンの移り方の図、registry のキー。
  `docs/20260816-0538 … 構造分析.md` から使える部分を移した。
  - シーンの移り方の図は元のドキュメントのまま使わず、`src/main.js` の
    `scene:` 登録と各シーンの `scene.start()` 呼び出しを `rg` で洗い直して
    作り直した（元の図は Demo が無く、Clear → Records の矢印の向きが実際と
    逆だった。下記「食い違い」参照）
  - registry のキー表は `src/config.js` の `BOARD_REGISTRY_KEY` /
    `PALETTE_REGISTRY_KEY` / `SOLUTIONS_REGISTRY_PREFIX` を読んで作成。
    元のドキュメントは色の組を `'glass' / 'colorful'` の 2 つとしていたが、
    実際は `'neon'` を含む 3 つだったので直した
  - 「§5（hoge の話）」は捨てた。「完全」「徹底」などの誇張表現は使っていない
- 「テスト」節（新規）: README から移した内容そのまま
- 「記録の保存」節（新規）: `docs/storage.md` の §2〜§7・§9 を移した。
  §1（localStorage の一般的な説明）と §8（JS 入門）、「読む人の想定」の文は
  落とし、§1 の表のうち「オリジン単位」「使えないことがある」だけ短く残した。
  値の形・関数名（`sanitizeHistory` / `sanitizeProgress` / `migrateHistory` /
  `saveBest` / `addAuto` など）とキー（`historyKey` の `v2`、`pentomino-puzzle/…`）
  は `src/storage.js` と `src/config.js` を読み直して確認済み（食い違い無し）
- 「サブエージェントの定義」の `docs.md` の受け持ちに `docs/UsersGuide.md` を追加
  （developer.md 内の表と `.claude/agents/docs.md` 本体の両方）

### 削除
- `git rm` で `docs/20260816-0538 ペントミノパズル Codebase 構造分析.md` と
  `docs/storage.md` を削除（commit はしていない）

### CLAUDE.md
- ファイル表に `docs/UsersGuide.md` の行を追加
- `docs/developer.md` の行の説明を、今の中身（構成・テスト・記録の保存を含む）に更新

### .claude/agents/docs.md
- `description` と「触ってよいファイル」に `docs/UsersGuide.md` を追加

## 元の文書とコードが食い違っていた箇所（移す前に直した）

- `docs/20260816-0538 … 構造分析.md` のシーン遷移図に `Demo` シーンが無かった
  （`src/main.js` には登録済み、`title.js` から `scene.start('Demo')` で遷移する）
- 同ドキュメントの色の組の説明が `'glass' / 'colorful'` の 2 つだったが、
  `src/config.js` の `PALETTES` には `'neon'` も定義されている（3 つ）
- `docs/storage.md` の内容自体は `src/storage.js` / `src/config.js` と
  食い違っていなかった（関数名・キー・値の形とも一致）

## 完了条件の確認
- `rg -n -e 'storage\.md' -e '構造分析' --glob '!archives/**'` を実行すると、
  `TODO.md` 内の項目文（TODO-055 自身の説明文）に 2 件残る。これは私が
  書き換えられないファイルで、タスクの記述そのものなので想定どおり。
  それ以外（README・developer.md・CLAUDE.md・.claude/agents/*.md）には
  0 件

## 判断が要る点
- 無し
