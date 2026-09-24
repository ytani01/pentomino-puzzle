# TODO-070 screens 報告（アイコン案を並べて撮る）

## 画像

まとめ: `/home/ytani/tmp/playwright-mcp/todo070-icons.png`
（844×390、デモ画面の HUD の段。行が今・A・B・C、左が深さ優先側・右がランダム側）

個別（8 枚）: `/home/ytani/tmp/playwright-mcp/todo070-{current,A,B,C}-{depth,random}.png`

## 見た結果

- 描き損じ（枠からのはみ出し・線の欠け・つぶれ）: いずれの案も無し。8 枚とも輪郭は
  ボタンの枠内に収まっている。
- ほかの HUD アイコンとの取り違え: A の深さ優先（スネーク状の点線）は、盤の
  マス目や配置ヒントの点表示と形が近い。B のランダム（ジグザグ線＋矢印）は
  A の深さ優先と線の向きの向きが違うだけで、B の深さ優先（階段）と遠目では
  区別しづらい可能性あり（ただし色・太さは他と同じで区別は利用者判断）。
  C の歯車・吹き出しは既存のどのアイコンとも形が異なる。
- コンソールエラー: 0 件（警告 4 件は WebGL の `GPU stall due to ReadPixels` のみで
  今回の変更とは無関係）。

## その他の気づき（判断は不要、参考まで）

- `todo070-C-random.png` で虫眼鏡（次へ）ボタンが灰色（無効）状態で写っている。
  デモの自動再生が進んだタイミングによるもので、アイコンの描画とは無関係と見られる。

## 終わったこと

- ボタンのアイコンは最後に元の `depthFirst`/`random` へ戻した。`src/icons.js` は
  一切変更していない。

## 2 回目（正式化したアイコンと撮り直したキャプチャ）

### 画像

- `/home/ytani/tmp/playwright-mcp/todo070-final-depth.png`・`todo070-final-random.png`
  （844×390 のデモ画面 HUD を 4 倍に拡大。`toggleStrategy()` で切り替えて撮影）
- `/home/ytani/tmp/playwright-mcp/todo070-demo-frame0.png`・`todo070-demo-frame49.png`・
  `todo070-demo-frame99.png`（`docs/images/demo.gif` から `magick` で抜いた 3 フレーム。
  49 枚目は GIF の差分最適化で 1×1 の透過フレームだったため `-coalesce` して抜き直した）
- `/home/ytani/tmp/playwright-mcp/todo070-demo-png.png`（`docs/images/demo.png` そのまま）
- `/home/ytani/tmp/playwright-mcp/todo070-game-png.png`・`todo070-play-png.png`
  （`docs/images/game.png`・`play.png` そのまま）

### 1. 探し方ボタンの深さ優先・ランダム（4 倍）

- 深さ優先（歯車）: 描き損じ無し。虫眼鏡・ミュート・ホームとは輪郭が異なり取り違えにくい。
- ランダム（顔＋「？」）: 描き損じ無し。円の頭に目・口があり、虫眼鏡（丸＋斜めの柄のみ）とは
  形が異なる。「？」は小さいがボタンの大きさでも判読できる。

### 2. `docs/images/demo.gif`・`demo.png`

- 3 フレームとも新しい歯車アイコンが HUD に映っている（探し方ボタン）。フレームの欠け・
  透明抜け・別画面の混入は無し。
- `demo.png` も歯車アイコンが映っており、吹き出しなどのコールアウトの位置ずれは無し。

### 3. `docs/images/game.png`・`play.png`

- `git diff --stat` の対象はアイコン変更に加え TODO-065・069（トレイのピース回転
  ボタン）の影響。両画像ともトレイの各ピースに回転アイコンが付いており、コールアウト
  （番号・吹き出し）の位置ずれや欠けは無し。想定どおりの変更と判断。

### コンソールエラー

0 件（今回も WebGL の `GPU stall` 警告のみ）。

### 終わったこと

ボタンは元の状態（深さ優先）へ戻した。ファイルは一切変更していない。

## 3 回目（ランダムを太い「?」1 文字に描き直した後）

### 画像

- `/home/ytani/tmp/playwright-mcp/todo070-final2-random.png`（844×390 のデモ画面 HUD を 4 倍に拡大）
- `/home/ytani/tmp/playwright-mcp/todo070-demo2-frame0.png`・`todo070-demo2-frame49.png`・
  `todo070-demo2-frame99.png`（`docs/images/demo.gif` から `-coalesce` して抜いた 3 フレーム）
- `/home/ytani/tmp/playwright-mcp/todo070-demo2-png.png`（`docs/images/demo.png` そのまま）

### (1) 探し方ボタンのランダム側

描き損じ無し。「?」は太く、4 倍でも等倍相当の大きさでもはっきり読める。虫眼鏡・
ミュート・ホームなど他の HUD アイコンと形が離れており取り違えない。

### (2) `docs/images/demo.gif`・`demo.png`

3 フレーム・`demo.png` とも撮影中ずっと「深さ優先」のまま（探し方ボタンは歯車のみ）で、
ランダムの新しい「?」アイコンはそもそも映っていない（撮影シナリオがランダム側へ
切り替えていないため。欠け・透明抜け・別画面混入は無し）。

### コンソールエラー

0 件。

ボタンは深さ優先へ戻した。ファイルは未変更。
