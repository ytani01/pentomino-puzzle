# TODO-040 implementer への依頼

## 目的

タイトルから始める「デモ」を足す。コンピューターが深さ優先の探索でピースを
置いたり外したりしながら解に至る様子を、盤とトレイの上で見せる。
背景（利用者と決めたこと）と完了条件は `TODO.md` の TODO-040 節にある。

実測は `archives/agents/TODO-040/measure-report.md`。ランダムな順での最初の解までの
「置く」の回数（`regionsFit` の枝刈りで捨てた分も含む）は、中央値が約 1〜1.5 万、
90% で 3〜7.5 万、最大で約 21 万。Node での速さは 1 万手あたり約 50ms
（探索の中の盤は書き換える配列）。

## 決めてあること（変えない）

### 1. 探索: `src/logic.js`

- `export function* solveSteps(spec, random)` のような generator を足す
  （名前は合わせてよい）。`random` は `[0, 1)` を返す関数で、外から渡す
  （シーンは `Math.random`、テストはシード付き）
- 探索を始める前に 1 回だけ、ピースの並びと各ピースの向きの並びを
  `random` で入れ替える（Fisher–Yates）。探索は `tools/enumerate.mjs` と同じ
  （空きマスのうち一番若い位置を埋める、空き領域が 5 の倍数でなければ捨てる）
- 1 手ずつ `yield` する。
  - `{ type: 'place', name, cells, row, col }`（`cells` は正規化した向き。本編の `piece.cells` と同じ形）
  - `{ type: 'remove', name }`
  - `{ type: 'solved' }`
  - 枝刈りで捨てる置き方も `place` → `remove` の 2 手として出す（試して戻す様子を見せるため）
- 解を出したあとも `next()` で続けられ、次の解を探す。全部探し終えたら generator が終わる
- 探索の中の盤は generator の中に閉じた作業用の配列にしてよい（外へは渡さず、
  `yield` するのは上の記述だけ）。本編の盤面（Undo の履歴に入るもの）とは別物なので、
  「盤面は書き換えず作り直す」の規約とはぶつからない。この理由を JSDoc に書く
- 既存の `logic.js` の関数（`orientations`、`normalize`、`regionsFitPieces` の考え方など）で
  足りるものは使う。**`tools/enumerate.mjs` は変えない**（全解データの生成が変わるため）
- Phaser・DOM を持ち込まない

### 2. シーン: `src/scenes/demo.js`（新規）

- `GameScene` を継承した `DemoScene`（キー `'Demo'`）にして、盤・トレイ・ピースの描画
  （`drawBoard`・`drawTray`・`createPieces`・`refreshPiece`・`drawPieceEdges`・
  `pieceTransform`・`settlePiece`、ネオンの明滅）を使い回す。そのために
  `GameScene` の constructor がキーを受け取れるようにする（既定は `'Game'`）
- `create()` は上書きし、描画に要るものだけを組む。入力（ドラッグ・タップ・
  トレイの当たり判定）、ヒント、おまかせ、遊びかけの保存、クリアの判定は持たない。
  ピースを押しても何も起きない（`onPiecePointerDown` を上書きして何もしない）。
  トレイの向きの印（`drawTurnMark`）は出さない
- **記録・遊びかけ・見つけた解に何も書かない**（`storage.js` を呼ばない）。
  `GameScene` の `create()` が登録する shutdown の処理も通らないこと
- `main.js` にシーンを登録する
- 継承で無理が出たら（上書きが多すぎる、`GameScene` 側の変更が大きくなる）、
  その時点で手を止めて報告する。別の組み方を勝手に選ばない

### 3. 進め方と速さ

- `update(time, delta)` で generator を進める。`setTimeout` / `setInterval` は使わない
- 速さは 3 段階。数値は `src/config.js` の `DEMO` にまとめる。既定は「速い」
  - ゆっくり: 一定の間隔（目安 150ms）で 1 手。置く・外すは短い Tween で見せてよい
  - 速い: 1 フレームに一定の手数（目安 20）
  - 最速: 1 フレームに使う時間の上限（目安 8ms。`performance.now()` で測る）まで進める
- 速い・最速では、1 手ごとにピースを動かさない。1 フレームぶんの手を進めたあとで、
  変わったピースだけを今の位置へ移す（Tween なし）
- 置く・外すでピースの向きも変える（`piece.cells` を差し替えて `refreshPiece`）。
  外したピースはトレイの自分のスロットへ戻す

### 4. 画面

- HUD は本編と同じ枠と 6 個のボタンの並び（`createHud` と同じ位置の決め方）を使う:
  `ゆっくり` `速い` `最速` / `次の解を探す` `音 ON/OFF` `タイトルへ`
  - 選んでいる速さは `setSelected` で示す
  - `次の解を探す` は、解を見つけて止まっている間だけ押せる（`setEnabled`）
  - `タイトルへ` は確認を出さずに戻る（失うものが無いため）
- HUD の 1 段目の文字（本編で時間と残りを出している所）に「試した手 12,345」
  「見つけた解 N」を出す。解を見つけたら、本編の `showMessage` と同じ場所に
  「解けた！ N 手目」のように出す（`showMessage` は消える。消えない表示が要るなら同じ場所に別の文字を置く）
- 解を見つけたら止まる。効果音は既存の `audio.js` にあるものを使い、新しく作らない。
  速い・最速で 1 手ごとに音を鳴らさない
- generator が終わった（全部の解を出し切った）ら、その旨を出して `次の解を探す` を押せなくする

### 5. タイトル: `src/scenes/title.js`

- `記録` の行に `デモ` を並べる（2 つを横に並べる。縦画面 640 の幅にも収まる大きさに）。
  行は足さない（横画面の縦が足りない。`STACK` の説明）
- 押すと `this.scene.start('Demo')`。盤と色の組は registry から読む（本編と同じ）

## 保つもの

- 本編（`'Game'`）の挙動と見た目は変えない。`GameScene` への変更は constructor の
  キーと、継承のために最低限要るものだけ
- 規約はプロジェクトの `CLAUDE.md`（`setTimeout` 禁止、色と数値は `config.js`、
  状態はシーンのプロパティ、JSDoc は「なぜ」）

## やらないこと

- `tests.html` のテスト（別の担当が書く）。README・`docs/`・`CLAUDE.md` の更新（別の担当）
- `tools/` と `src/data/` の変更

## 完了条件と確かめ方

- `node --check` を変えたファイルすべてに通す
- Node で `solveSteps` をシード付きの乱数で回し、最初の `solved` までの手数と、
  そこまでの `place` / `remove` を順に当てはめた盤面が 60 マス埋まっていることを確かめる
  （使い捨てのスクリプトはリポジトリの外。`tools/window-shim.mjs` を先に読む）
- 画面の確認は別の担当がするので、ブラウザで撮らなくてよい

## 報告

`archives/agents/TODO-040/implementer-report.md` に、変えたファイルごとの要点、
上の Node での確認の結果（数値）、決めた数値、迷ったところを書く。
返事は「終わったか・報告ファイルのパス・判断が要る点」の 5 行以内。
