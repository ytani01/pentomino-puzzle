# TODO-002. GitHub Pages で公開し、タグのバージョンを画面に出す

## きっかけ

「タグのバージョンを Web 画面に表示できるか」という相談から始まった。
公開先として GitHub Pages を使うことになったので、タグを打って公開する工程の中で
タグ名をページへ埋め込む形にした。

ビルド工程を持たないリポジトリなので、タグの値をソースへ自動で入れる方法が
他に無い（手で書き換えると書き換え忘れが起きる）。実行時に GitHub API を叩く案は、
ネットワーク必須・レート制限ありで、ローカルで開いたときに意味を成さないので採らなかった。

## やったこと

モデルは Sonnet / effort medium。ファイル 4 つの小さい変更なのでサブエージェントは
編成せず、通しで書いた。

- `src/config.js` に `VERSION`（既定 `'dev'`）を追加
- `src/scenes/title.js` の右下に、薄く小さく `VERSION` を表示
- `.github/workflows/pages.yml` を追加。`v*` タグの push だけをきっかけに、
  `index.html` と `src/` を `dist/` へ集めて GitHub Pages へ公開する
- `CLAUDE.md` に公開の手順（Pages の Source 設定、タグの打ち方）と、
  ファイル構成の表への追記

### 決めたこと

- **置換の壊れやすさへの対処**: `sed` は `export const VERSION = 'dev';` という
  行を丸ごと文字列一致で探す。置換の前後で `grep -qF` により、マーカーが
  見つからない・置換に失敗した場合はジョブを失敗させるようにした
  （`dev` のまま静かに公開されることはない）
- ローカルで `python3 -m http.server` を使って開いたときは `dev` のまま表示される
  （公開前後で見た目が変わる）ことは許容した
- 公開物は `index.html` と `src/` だけを `dist/` に集めてから upload する。
  `.git` / `.obsidian` / `TODO.md` / `archives/` などはそのまま公開しない

## テスト

- `node --check` で `src/config.js` / `src/scenes/title.js` の構文を確認
- `python3 -c "import yaml; yaml.safe_load(...)"` で `pages.yml` の構文を確認
- ワークフロー内の `sed` 置換をローカルでシミュレートし、
  `VERSION = 'dev'` → `VERSION = 'v0.2.0'` に置き換わることを確認
- `tests.html` は `VERSION` を参照していないため影響なし
- Chrome 拡張が未接続だったため、ブラウザでの実画面表示は確認できていない
  （見た目の最終確認は利用者に委ねる）
