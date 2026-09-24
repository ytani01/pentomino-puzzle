# TODO-056 確認報告（screens）

## 1. 撮り直し

```bash
python3 -m http.server 8765 &   # 既に起動していたのでそのまま使用
PLAYWRIGHT=$(dirname "$(rg -l '"version": "1\.63\.0"' \
  ~/.npm/_npx/*/node_modules/playwright/package.json | head -1)")/index.mjs \
  node tools/capture.mjs
```

- 出力: `docs/images/play.png`, `title.png`, `game.png`, `records.png`, `demo.png`, `demo.gif` の 6 件、すべて生成された。
- エラー・警告なし。
- 所要時間: **32 秒**。

## 2. 画像の中身（一致したものは 1 行）

- `docs/images/play.png` — 一致。色の組が `colorful`（ガラス調でなくカラフル）で撮れている。注記なし。
- `docs/images/title.png` — 一致。①〜⑥ の吹き出しが指す部品（盤選択・色選択・はじめる・つづきから・記録・デモ）は UsersGuide.md の説明と対応。④「つづきから」は記録が無いので押せない状態で表示されているが、吹き出し自体は正しくボタンを指している。吹き出しの欠け・重なりなし。
- `docs/images/game.png` — 一致。Ⓐ経過時間・Ⓑトレイの残り・Ⓒ解ける/解なし・①〜⑥のボタン（一手戻す・おまかせ・ヒント表示・やり直し・音・タイトルへ）・Ⓓ盤・Ⓔトレイ・Ⓕ次のタップで回る、すべて UsersGuide.md の説明・表と対応。ヒント表示（③）がオンになっており、`toggleHint()` の呼び出し通り。「〜を置いた」の知らせは `clearMessage()` で消えており、画面に出ていない。
- `docs/images/records.png` — 一致。①一覧・②印・③完成形・④達成度・⑤この回を消す・⑥全部消す、UsersGuide.md の説明と対応。完成形の枠（`ponytail:` 決め打ちの座標）は実際の完成形の絵とほぼ揃っており、大きくずれてはいない。
- `docs/images/demo.png` — 一致。Ⓐ試した手・見つけた解、Ⓑ解ける/解なし、①〜⑦のボタン（ゆっくり・速い・最速・次の解を探す・探し方・音・タイトルへ）が UsersGuide.md の表と対応。「解ける」の札が出ている瞬間で止まっており、`waitForFunction` の狙い通り。
- いずれの画像も、吹き出し・丸バッジが画面から欠けている箇所、ボタンやラベルを隠している箇所は見当たらない。ツールチップ・確認パネルなど余計な UI も映っていない。

`demo.gif`: `ffmpeg` でフレームを 3 枚（先頭・中間・終盤）抜いて 1 枚に並べたものを
`~/tmp/playwright-mcp/demo-gif-tile.png` に置いた。3 コマとも「試した手」の数が
2→5→14 と進んでおり動いている。色の組は `colorful`。欠け・真っ黒なし。
`ffprobe` では 480x320・100 フレーム。

## 3. mermaid

`about:blank` に `mermaid@11`（CDN）を読み込み、`docs/developer.md` の 3 つの
コードブロック（3 層の分け方の flowchart、シーンの移り方の stateDiagram-v2、
記録の書き込みの flowchart）をそのまま `mermaid.render()` に渡した。

- 3 つともエラー無く SVG を生成できた。
- ノード数の確認: 「3 層の分け方」の flowchart は定義したノード 8 個（Phaser,
  Scenes, UI, Logic, Sol, Storage, Data, Tests）に対し `class="...node..."` の
  出現も 8 件で一致。「記録の書き込み」の flowchart は定義 13 ノードに対し
  出現も 13 件で一致。
- 「シーンの移り方」の stateDiagram-v2 は定義した状態 7 個（[*], Boot, Title,
  Game, Clear, Records, Demo）に対し、同じ正規表現での出現は 13 件だった。
  stateDiagram の SVG は通常の flowchart とマークアップが異なり（複合ノードや
  ラベル用のグループにも `node` クラスが付くことがある）、単純な文字列一致では
  数えにくいための差と見られる。**エラーは出ておらず、実害は未確認**。図の見た目
  までは確認していない（依頼の範囲外）。

## 撮った画像（絶対パス）

- `/home/ytani/work/pentomino-puzzle/docs/images/play.png`
- `/home/ytani/work/pentomino-puzzle/docs/images/title.png`
- `/home/ytani/work/pentomino-puzzle/docs/images/game.png`
- `/home/ytani/work/pentomino-puzzle/docs/images/records.png`
- `/home/ytani/work/pentomino-puzzle/docs/images/demo.png`
- `/home/ytani/work/pentomino-puzzle/docs/images/demo.gif`
- `/home/ytani/tmp/playwright-mcp/demo-gif-tile.png`（gif から抜いた 3 コマの並び。確認用）

## コンソールのエラー・警告

`capture.mjs` の実行ログにはエラー・警告なし（標準出力は撮ったファイル名のみ）。
mermaid の描画でも `render()` は例外を投げず、3 件とも `ok: true`。
