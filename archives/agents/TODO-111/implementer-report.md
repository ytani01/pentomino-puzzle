# TODO-111 実装の報告

## まとめた関数

`strokePieceEdges(g, cells, left, top, cell, width, color, alpha, fillCorners = false)` を
`src/icons.js` に置いた（export）。`game.js` は既に `icons.js` を読んでおり、シーン → 部品の向きになる。
凹んだ角を探す処理は小さく、`fillCorners` のときだけ使うので関数の中に置いた（`logic.js` へは出していない）。

- `left` / `top` … 原点（本編は 0, 0、見本は各ピースの左上）
- `cell` … 1 マス（本編は `layout.board.cell`、見本は `CHOICE_ICON.pieceCell`）
- `width` … 線の太さ（見本のにじみは呼ぶ側で `layer.width * glowScale` を渡す）
- `fillCorners` … 凹の角を埋める（ネオンのにじみだけ true）

呼ぶ側:
- `src/scenes/game.js` `drawPieceEdges()`（604 行付近）… 縁取り 1 回、にじみ `NEON.glow` の層ごとに 1 回
- `src/icons.js` `paletteIcon()`（305 行付近のにじみ、335 行付近の外周）

JSDoc の「内側へ寄せる理由」「凹の角を埋める理由」は `drawPieceEdges()` から `strokePieceEdges()` へ移した。
`game.js` から使わなくなった `outlineEdges`・`shapeSize` の import のうち、`outlineEdges` を外した（`shapeSize` は他で使う）。

文書: `CLAUDE.md:73`、`docs/developer.md:57`。`TODO.md` の TODO-111 のチェックを入れた。

## 寄せたもの

光（にじみ）と外周の線の両方を寄せた。

## 同じ絵になると判断した根拠

- にじみ: 2 つの実装は原点と `has` の作り方（Set か `some()`）が違うだけで、式・順番（層ごとに角の塗り → 線）が同じ。
  本編は原点 0 を足す形になるが、`0 + a` は浮動小数でも `a` と同じ値
- 見本の外周（4 辺を別々に引いていた）: マスごとの上・下・左・右の線分を `outlineEdges()` の辺と
  内側への寄せ方で 1 本ずつ突き合わせ、座標が同じになることを確かめた（上 `y+half`、下 `y+cell-half`、
  左 `x+half`、右 `x+cell-half`）。引く線分の集合は同じで、変わるのは 1 マスの中での順番（上下左右 → 上右下左）だけ。
  外周は alpha 1 の同じ色なので、重なり・順番は絵に出ない。同じ線分を 2 回引くことは、どちらの書き方にも無い
- 浮動小数: 見本の座標は `left`・`top`・`cell`（12）が整数、`half` は `outlineWidth`（2 か 3）/ 2 で
  0.5 刻み。足し方の順番が変わっても丸めは起きない
- 線の端: どちらも `lineBetween()` で同じ

## 検証

- `node --check src/scenes/game.js` / `node --check src/icons.js` … 成功（終了コード 0）
- ブラウザでの撮り比べは依頼どおり行っていない（別の担当）
- テストは足していない（描画の関数で `tests.html` の対象外）

## 残る懸念

- 外周の線の 1 マス内の引く順番が変わる。alpha 1 なので絵は変わらない読みだが、撮り比べで確かめてほしい
