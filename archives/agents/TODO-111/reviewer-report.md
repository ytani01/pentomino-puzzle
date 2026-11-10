# TODO-111 レビューの報告（4c110e2）

## 要修正

なし。

## 検討

- `src/config.js:662-663` / 「見え方を変えたいときはこの 3 つを触る（読むのは `game.js` の
  `drawPieceEdges()` だけ）」が今のコードと合わない。`outlineWidth`・`outlineDarken` は
  `icons.js` の `paletteIcon()` も読み（`src/icons.js:338-339`）、`TILE.edgeDarken` も
  `paletteIcon()` が読む（`src/icons.js:329`）。この食い違いは今回の差分より前からある
  （直す前の `paletteIcon()` も同じ値を読んでいた）が、縁の描画をまとめた今回が直しどき。
  差分には含まれていない文書。

## 作り込みすぎ

作り込みすぎ: なし（関数 1 つにまとめただけで、引数はどれも 2 か所の呼び出しで値が違う）。

## 挙動の突き合わせ（一致を確かめたもの）

- 本編の縁取り: 太さ `palette.outlineWidth`・色 `darken(piece.color, outlineDarken)`・alpha 1・
  角は埋めない。式は `0 + col*cell ± …` になるが `0 + a` は `a` と同じ値。一致
- 本編のにじみ: 層ごとに「角の塗り → 線」の順、太さ `layer.width`、色 `piece.color`、
  alpha `layer.alpha`。凹の角の判定・塗る正方形の位置（`dr === -1` / `dc === -1` は直す前の
  `missingUp` / `missingLeft` と同じ）も同じ。一致
- 見本のにじみ: 太さ `layer.width * glowScale`（呼ぶ側で掛ける）、原点 `left`/`top`、
  1 マス `CHOICE_ICON.pieceCell`。直す前と同じ式・同じ順番。一致。`has` が `some()` から
  `Set` に変わったが、マスは整数なので判定は同じ
- 見本の外周: `outlineEdges()`（`src/logic.js:234-244`）は 1 マスごとに上・右・下・左の
  単位辺を返す。内側への寄せ方を辺ごとに読むと、上 `y+half`、右 `x+cell-half`、
  下 `y+cell-half`、左 `x+half` で、端点も `x..x+cell` / `y..y+cell`。直す前の 4 本と
  座標・長さが同じ。足し算の順番も `(left + col*cell) + half` で同じ（整数と 0.5 刻みで丸めも無い）
- 外周の引く順番（上下左右 → 上右下左）: 外周は alpha 1 の 1 色（`src/icons.js:338-339`、
  `palette.glass` でも alpha は 1 固定）。同じ色を不透明で重ねるので、順番は絵に出ない。
  縁のアンチエイリアスで部分的に重なっても、同じ色を合成する順番は結果に効かない
  （`C + (bg - C)(1-a1)(1-a2)` で入れ替えても同じ）。撮り比べでの裏付けは別担当に任せる（未確認）
- 線の端: どちらも `lineBetween()` のまま。変わらない
- 本編でにじみの無い色の組: 直す前も角を探さず、今も `fillCorners` が false なので探さない
- import: `game.js` から使わなくなった `outlineEdges` を外した。`shapeSize`・`darken` は
  ほかで使う。`icons.js` → `logic.js`、シーン → `icons.js` の向きで、`docs/developer.md:110-`
  の図の向きと合う。規約（色・数値の直書き無し、JSDoc は「なぜ」）にも反しない
- 文書: `CLAUDE.md:73`、`docs/developer.md:57` は今のコードと合う。`src/scenes/boot.js:140`
  の「光るのは外周（`drawPieceEdges()`）」も、本編について言っているので誤りではない
