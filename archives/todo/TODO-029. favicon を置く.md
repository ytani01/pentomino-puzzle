# TODO-029. favicon を置く

## きっかけ

favicon の指定が無いので、ブラウザがどの画面でも `/favicon.ico` を取りに行き、
ローカルサーバのログに毎回 `code 404, message File not found` が出ていた。
本物の不具合を追うときに紛らわしい（実際、記録画面が開かない件を調べた際に
この 404 を原因と読み違えた）。

## やったこと

`index.html` の `<title>` の下に `<link rel="icon">` を 1 行足した。

画像アセットを持たない方針なので、**SVG を `data:` URI で直接書く**。
ファイルを増やさず、GitHub Pages への公開手順（`pages.yml`）にも触らずに済む。

絵柄は F ペントミノ。`src/config.js` の F の形（`[[0,1],[0,2],[1,0],[1,1],[2,1]]`）
そのままで、色も F の色（`0xda3e3e`）と地の色（`#181b26`）に揃えた。

- **色を `index.html` に直に書いている。** 「色はコードへ直接書かない」
  （CLAUDE.md）の例外。`<link>` は Phaser の起動より前に要るので、
  `src/config.js` から読めない。そのぶん、値を揃えた旨をコメントに残した
- URL の中に `#` は書けないので `%23` に置き換えてある

## テスト

- SVG 単体を Chromium で 256×256 に描いて絵柄を確かめた（F の形で出た）
- `python3 -m http.server 8765` のログで、ページを開いても
  `/favicon.ico` の要求が出ないことを確かめた。ただし **headless の
  Chromium は favicon をそもそも取りに行かない**ので、変更前と後で
  ログに差は出なかった。`<link rel="icon">` があればブラウザが
  `/favicon.ico` を探さないのは仕様どおり
