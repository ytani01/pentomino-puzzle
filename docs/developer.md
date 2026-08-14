# 開発者向け設定（GitHub）

このリポジトリを GitHub 上で動かすために、利用者が手動で設定する必要が
あるもの。コードやワークフローの変更では自動化できない項目のみをまとめる。

## GitHub Pages の公開先を設定する

リポジトリの **Settings → Pages → Source** を **GitHub Actions** にする。

- 既定値（Deploy from a branch）のままだと `.github/workflows/pages.yml`
  が動いても公開されない
- リポジトリを作り直したとき、フォークしたときに忘れやすい。都度確認する

## タグを push して公開する

`.github/workflows/pages.yml` は、`v` から始まる名前のタグを push した
ときだけ動く。通常の push では公開されない。

```bash
git tag v0.2.0
git push --tags
```

公開時、ワークフローが `src/config.js` の `VERSION`（既定は `'dev'`）を
タグ名へ書き換える。ローカルで直接開いた画面は `dev` のまま表示される
（公開前後で見た目が異なるのは意図した挙動）。

## 日常的なデプロイの手順

master に変更を積んだあと、公開するときの一連の流れ。

1. `master` に反映したい変更が入っていることを確認する
   ```bash
   git status
   git log --oneline -5
   ```
2. 既存のタグを確認し、次のバージョン番号を決める
   ```bash
   git tag -l
   ```
   バージョン番号を上げる基準は特に決めていない。区切りの良いところで
   利用者が決める
3. タグを作って push する（メッセージには何を公開するかを書く）
   ```bash
   git tag v0.3.0 -m "◯◯を追加（TODO-NNN）"
   git push origin v0.3.0
   ```
4. ワークフローの実行を確認する
   ```bash
   gh run list --repo ytani01/pentomino-puzzle --limit 3
   ```
   `failure` になっていたら `gh run view <run-id> --log-failed` で
   原因を見る。**デプロイ保護ルールでタグを許可する**（下の節）が
   原因のことが多い
5. 公開先を開いて確認する（`https://ytani01.github.io/pentomino-puzzle/`）。
   画面右下などのバージョン表示が、push したタグ名になっていれば成功

タグは一度 push すると番号を変えられない（打ち直すには古いタグの削除が
要る）。打ち間違いに気づいたら、その場で相談する。

## 権限まわり

`.github/workflows/pages.yml` は `pages: write` / `id-token: write` の
権限を要求する。組織のリポジトリで Actions の権限がリポジトリごとに
制限されている場合、Settings → Actions → General で Pages への
デプロイが許可されているか確認する。

## デプロイ保護ルールでタグを許可する

`Settings → Pages` を有効にすると `github-pages` という環境が自動で
作られるが、既定では **`master` ブランチからのデプロイしか許可されない**。
このリポジトリはタグ push で公開する運用のため、そのままだと

```
Tag "v0.2.0" is not allowed to deploy to github-pages
due to environment protection rules.
```

のように弾かれる。`Settings → Environments → github-pages →
Deployment branches and tags` で `Add deployment branch or tag rule` を選び、
**Ref type を Tag** にして `v*` を追加する。

初回セットアップで一度だけ必要（一度追加すれば以降のタグは通る）。
