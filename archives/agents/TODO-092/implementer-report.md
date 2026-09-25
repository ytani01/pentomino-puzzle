# TODO-092 実装報告（implementer）

## 変更したファイル

### `src/scenes/title.js`
- `howToPlay(board)` を廃止し、盤に依らない固定文言 `HOW_TO_PLAY_TEXT` に置き換え
  （title.js:31-37 付近、旧 `howToPlay()` 定義を削除）。`refreshBoard()` から
  `this.howToText.setText(...)` の呼び出しも削除（`this.howToText` 自体を持たなく
  なった。テキストは `create()` で 1 回だけ `this.add.text(..., HOW_TO_PLAY_TEXT, ...)`）。
- `STACK` から `records` 行を削除し、最終行（`keyHint`）の `gap` を末尾の慣例どおり
  `0` に変更（縦画面・横画面の両方）。コメントの実測値も更新
  （横画面: 634→572、余り 6→68）。
- `START` を「はじめる・つづきから・記録」3 個ぶんの寸法に変更
  （`{ width: 224 → 190, height: 64, gap: 20 → 14 }`）。
- `SUB` を削除し、代わりに右下固定のデモボタン用 `DEMO_BUTTON`
  （`{ width: 120, height: 44, marginRight: 14, marginBottom: 46 }`）を追加。
- `create()` 内: `はじめる`・`つづきから`・`記録` を `start` 行に横 1 列で配置
  （`startStep = START.width + START.gap` を中心からの間隔に使用）。
  `記録` ボタンは `Records` シーンへ遷移する処理をそのまま移設し、
  `fontSize: FONT.hud` を付けて他の 2 個と文字の大きさを揃えた。
  `デモ` ボタンは `STACK` から独立させ、画面右下
  （`SCREEN.width - marginRight - width/2`, `SCREEN.height - marginBottom - height/2`）
  に固定で配置。バージョン表示（`createVersionText()`）より上に来るように
  `marginBottom` を決めた（実測で確認、後述）。

### `src/icons.js`
- `paletteIcon()` の JSDoc から「ネオンのにじみは描かない」を削除し、
  本編と同じ描き方で縮めて重ねる旨を追記。
- `logic.js` から `outlineEdges` / `shapeSize` を追加 import。
- `palette.neon` のとき、外周の塗り（従来の格子・外周描画）の前に、
  `game.js` の `drawPieceEdges()` と同じアルゴリズム（`outlineEdges()` で辺を求め、
  格子点まわりの 4 マスのうち 1 マスだけ欠けている所を凹の角として先に埋め、
  その後 `NEON.glow` の各層を内側へ寄せて描く）でにじみを描画する処理を追加。
  太さは `layer.width * CHOICE_ICON.glowScale` で縮める。明滅は追加していない
  （呼ばれるのは 1 回きりの静止した図なので、Tween を組む必要がない）。

### `src/config.js`
- `CHOICE_ICON` に `glowScale: 12 / 64` を追加し、コメントで
  「本編の 1 マス（64px 相当）と見本の 1 マス（`pieceCell` = 12）の比」と説明した。
  64 は既存の `OUTLINE.width` の説明・`GLASS` の説明が使っている慣用の基準値
  （横画面の 8×8 の盤の 1 マス）をそのまま踏襲した。実際に計算した
  `LAYOUTS['8x8'].board.cell` は環境（画面の向き判定に使う `window.innerWidth/
  innerHeight`）依存で 49〜64 の間で変わるため、見本は図なので固定の基準値で
  近似する前提にした（brief の「縮める比の出し方は任せる」に沿って決めた判断点）。

### `docs/UsersGuide.md`
- 156 行目「タイトルの **記録** の横にある **デモ** を押すと、…」を
  「タイトルの右下にある **デモ** を押すと、…」に修正。
  `rg -n "デモ|記録|つづきから|はじめる" docs/UsersGuide.md README.md docs/developer.md`
  の当たり行を確認し、位置に触れていたのはこの 1 行だけだった。
  18〜19 行目の「③はじめる…⑤記録と⑥デモは下の節で説明する」は、画像
  （`docs/images/title.png`）の丸数字と対応した説明で位置を明言していないため
  そのままにした（画像の撮り直しは管理者の担当・brief の対象外）。

## 検証

- `node --check` … `src/scenes/title.js` / `src/icons.js` / `src/config.js` すべて OK。
- `python3 -m http.server 8765` を立て、`tests.html` を Playwright（headless
  Chromium、npx キャッシュのものを借用）で開いて確認 → **430 件すべて通った**。
- タイトル画面を実際にレンダリングして確認（Playwright、`window.game`
  経由でボタン・テキストの座標を取得）:
  - 縦画面（内部解像度 640×1136）: `はじめる`(x=116, w=190)・`つづきから`
    (x=320)・`記録`(x=524, 右端 619) がすべて 640 幅に収まる
    （左端 21・右端 619、余白 21px ずつ）。
  - 横画面（内部解像度 960×640）でも同様に収まることを確認。
  - `デモ` ボタン（右下、120×44）はどちらの向きでもバージョン表示の直上に
    出て、重ならないこと（縦画面: デモ下端 1090 / バージョン上端 1104、
    横画面: デモ下端 594 / バージョン上端 608）を実測で確認。
  - 遊び方の 1 行目「12 種のピースを盤にすき間なく敷き詰めるパズル。」は
    縦画面・横画面のどちらでも折り返さず 1 行のまま表示されることを、
    実際の `Text` オブジェクトの内容（`\n` の位置）で確認した。
  - スクリーンショットでネオンの色見本ににじみが付いていることを目視確認
    （`/home/ytani/tmp/playwright-mcp/todo092-title.png`,
    `todo092-neon-zoom.png` に保存。imv は起動していない）。

## 判断が要る点・残る懸念

- `CHOICE_ICON.glowScale` の基準値 64 は、実測した `LAYOUTS['8x8'].board.cell`
  （環境依存で 49〜64）と厳密には一致しない近似値。ボタン自体が小さい図なので
  見た目への影響は小さいはずだが、基準を変えたいときは `config.js` の
  コメント・`glowScale` の 1 行を直すだけで済む。
- `START.width` を 224→190 に縮めたことで、`つづきから`（5 文字）のラベルが
  ボタン幅ぎりぎりになるが、実測では文字がボタン内に収まっていることを
  スクリーンショットで確認済み。
- 範囲外で気づいた点: なし。
