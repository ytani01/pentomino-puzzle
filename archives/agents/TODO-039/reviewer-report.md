# TODO-039 reviewer 報告

対象: `git diff`（src/config.js, src/scenes/boot.js, src/scenes/game.js,
src/scenes/records.js, tests.html）。要修正 0 件、検討 2 件、好みの範囲 2 件。

## 問題なしの観点

- 規約: `setTimeout` / `setInterval` 不使用（明滅は `this.tweens.add`）。色はすべて `config.js`（`PALETTES.neon.colors` と `NEON`）。モジュールのトップレベルに `let` は増えていない。状態（`piece.glow`）はシーンが持つピースのプロパティ
- ガラス・12 色の見た目: `pieceColor`（boot.js:34-37）は `mono !== null` なら mono、`colors === null` なら `piece.color` で、元の式と同じ結果。`drawPieceEdges` の `stroke`（game.js:512-525）は inset = width/2、`lineStyle(width, darken(color, outlineDarken), 1)`、辺ごとのずらし方が元と一字一句同じで、線の位置・太さ・色は変わらない。`piece.glow` は neon 以外で `null` になり（game.js:197）、`if (piece.glow)`（game.js:538）で飛ばす
- テクスチャ: `TEX.piece` は `palette.key` と名前で引くので `cell-neon-F-55` などが別に焼かれ、既存の組と衝突しない
- 明滅の後始末: Phaser 3.90.0（index.html の CDN 版を取得して確認）の TweenManager は `shutdown:function(){this.killAll(),this.tweens=[],...}`。`scene.start('Clear'|'Title')` と `scene.restart()` のどちらでも shutdown を通るので残らない。restart 後は `create()` → `createPieces()` で新しい glow と Tween が 1 本ずつ作られるだけで二重にならない。遊びかけの再開（`applyProgress`, game.js:934-）は `refreshPiece` → `drawPieceEdges` で glow を `clear()` して描き直すだけで、Tween は足さない
- `killTweensOf(piece.container)`（game.js:792）との干渉: Tween の対象は `piece.glow`（子の Graphics）で Container ではないので、移動の Tween を止めても明滅は止まらない。逆に明滅の Tween が Container の x/y/scale を取り合うこともない
- はみ出し: 同じ式で帯の塗る画素を数えた（butt 端の矩形として。scratchpad の `glow-cover.mjs`）。L 字・cell=55・幅 18 でピースの外に出た画素は 0。ドラッグ中は scale 1、トレイは Container の縮小がそのまま効く（トレイでの太さは 18→5.6〜6.2px、10→3.1〜3.5px、芯 3→0.94〜1.04px。全 4 レイアウトを node で計算）。1 マス幅の所（I など）でも 18+18=36 < 55 で両側の帯は重ならない
- 記録画面: `drawMini`（records.js:555-557）は neon のとき塗りを `darken(color, NEON.fillDarken)`、境目は `darken(color, outlineDarken=1)` = 蛍光色そのもの。塗りと線の順序、内側へ半分寄せる扱いは既存のまま
- テストの強さ: tests.html の colors の検査を node に写して PALETTES を壊して回した（`colors-test.mjs`）。F を消す・Z を文字列にする・キー名の打ち間違い（I→i）はどれも `neon の colors.X` で落ち、`colors` そのものを消すと TypeError で落ちる。そのままでは通る
- 範囲: 指示に無い変更は無い。title.js は触っていない（3 つ並ぶかは screens の担当）

## 検討

### 1. 凹の角で、にじみに 18×18 の欠けができる（実害は未確認）

- 場所: src/scenes/game.js:512-525（`stroke`）、src/config.js:501-504（`NEON.glow`）
- 何が: 各辺の帯は辺の長さぶんだけの矩形（butt 端）で、角の先へは伸びない。凸の角では 2 本が重なって濃くなる（config.js:492-493 に書いてあるとおり）が、**凹の角では 2 本の帯がどちらも届かない正方形が残る**。L 字（cells `[0,0],[1,0],[2,0],[2,1]`）で、凹の角の斜め内側 18×18（盤の座標系）のうち帯が塗った画素は 0 / 324（`glow-cover.mjs` で計数）
- なぜ気になるか: 芯（幅 3）でも同じ形で 3×3 の欠けがあり、これは既存のガラス・12 色でも同じなので目立っていなかった。にじみは幅 18 なので、盤の 1 マス 55〜64px に対して 3 割前後の欠けになり、凹の角（F・L・N・P・T・U・V・W・X・Y・Z のほとんど）で光の帯が切れて見える可能性がある。config.js のコメントは凸の角の重なりにしか触れていない
- 前提: Phaser の `lineBetween` が butt 端で描くとして計算した（Canvas の既定、WebGL は四角形 1 枚）。**実際の見え方は未確認**。screens の撮影で凹の角を見てもらうのがよい

### 2. `drawPieceEdges` の JSDoc がにじみに触れていない

- 場所: src/scenes/game.js:499-507
- 何が: 「シルエットの外周の縁取りと落ち影を引き直す」のままで、glow も描くようになったことが書かれていない。内側へ寄せる理由（隣へかぶらない）はにじみにもそのまま効くので、その旨を 1 行足すと、NEON 側のコメント（config.js:490-493）と対になる
- 根拠: CLAUDE.md「JSDoc には『なぜそうするのか』を書く」。config.js:520-521 は「見え方を変えたいときはこの 3 つを触る（`drawPieceEdges()` が読む。他の場所に散らばっていない）」と書いてあり、`NEON` も同じ関数が読むようになった

## 好みの範囲

### 3. `glass` と `neon` が同時に真でも何も言われない

- 場所: src/config.js:137-139, 163-164 / src/scenes/boot.js:81-83 / tests.html:151-166
- 焼き方の分岐は `glass` が先に勝つので、両方 `true` にするとガラスで焼かれ、game.js 側は glow を作って明滅させる（食い違う）。今の定義では起きない。node の写しでも両方 true はテストを通った。`mono` と `colors` の両方を持つ場合（colors が黙って無視される）も同じく通る。気にするなら tests.html に 1 行（`!(palette.glass && palette.neon)`）

### 4. PALETTES の冒頭の説明が 2 組のまま

- 場所: src/config.js:118-120
- 「12 個とも同じ色の『ガラス』を既定にし、今までどおり 12 色に塗り分ける組も選べるようにしてある」は TODO-015 時点の説明で、3 組目があることは下の箇条書きと neon の直前のコメントでしか分からない。書き足すかどうかは任意

## 再レビュー（指摘 1・2 の修正、`drawPieceEdges` のみ）

要修正 1 件。修正後の式を node に写し、12 種の全向き（`turnOrder` の全要素）で、
線（butt 端の矩形）と `fillRect` が塗る画素を数えた（scratchpad の `glow-cover2.mjs`、cell=55）。

### 問題なし

- 凹の角の判定（4 マス中 3 つ埋まり）: 数えた角の数は F3・I0・L1・N2・P1・T2・U2・V1・W3・X4・Y2・Z2 で、形どおり。W・F のように複数ある形も全部拾っている
- 埋める位置と向き: `missingUp` / `missingLeft` の組み合わせで、正方形は 4 方向とも欠けた所の中の「角に接した側」に入る。はみ出し（ピースの外を塗った画素）は全向きで 0
- ガラス・12 色: `concaveCorners` は `piece.glow` があるときだけ作り、芯は `fillCorners = false` で呼ぶので、線は修正前と同じ（芯 3 の 3×3 の欠けも前と同じく残る）
- JSDoc（game.js:507-511）ににじみの扱いと理由が入った（指摘 2 は解消）

### 要修正: 埋める正方形が 1/4 の大きさしかない

- 場所: src/scenes/game.js の `stroke` 内 `graphics.fillRect(col * cell - (missingLeft ? 0 : inset), row * cell - (missingUp ? 0 : inset), inset, inset)`、および JSDoc の「線の太さの半分四方が欠ける」
- 何が: 内側へ `inset = width / 2` 寄せた幅 `width` の線は、辺から `0〜width` の帯を塗る。だから凹の角で欠けるのは **`width` × `width`** の正方形で、半分四方ではない。今の `inset` × `inset` では 1/4 しか埋まらない
- 実測: 修正後の式で、凹の角 1 つにつき塗り残しが glow18 で 243 画素（= 18² − 9²）、glow10 で 75 画素（= 10² − 5²）。L・P・V は 243、F・W は 729、X は 972 で、角の数 × 243 に一致する
- 裏付け: 正方形を `width` 四方にして（位置は `col * cell - (missingLeft ? 0 : width)`、`row * cell - (missingUp ? 0 : width)`）同じ計数をすると、12 種の全向き・両方の幅で塗り残しは 0、はみ出しも 0 になった（`glow-cover3.mjs`）
- 前提: 線の端が butt であること（前回と同じ）。画面での見え方は未確認
