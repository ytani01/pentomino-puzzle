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

## 権限まわり

`.github/workflows/pages.yml` は `pages: write` / `id-token: write` の
権限を要求する。組織のリポジトリで Actions の権限がリポジトリごとに
制限されている場合、Settings → Actions → General で Pages への
デプロイが許可されているか確認する。
