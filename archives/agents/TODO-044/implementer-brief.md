# TODO-044 implementer への依頼

## 目的

本編でヒント表示が入のとき、周りから切り離された 5 マスの空きが残りのピースの
どれかと同じ形なら、そのピースを自動で置く（背景は `TODO.md` の TODO-044 の節）。

決まっていること（利用者と決めた。変えない）:

- 本編だけ。デモ（`src/scenes/demo.js`）には入れない
- 見せ方はおまかせ（`useAuto()`）と同じ：トレイから滑らせ（`settlePiece(piece, true)`）、
  `audio.auto()` を鳴らし、`showMessage('<名前> を置いた')`（複数なら名前を `・` でつなぐ）
- 自動で埋めた手は、直前の手（利用者が置いた手、ヒント表示を入にした時点なら
  その前の手）とまとめて「一手戻す」1 回で戻る
- 記録の印は増やさない（`usedAuto` は立てない。`usedHint` は入にした時点で立っている）

## 対象

```bash
rg -n "runHint|refreshHud|toggleHint|checkSolved|useAuto|emptyRegionSizes|orientations" src
```

触るのは `src/logic.js` と `src/scenes/game.js` だけ。`tests.html`・`README.md`・`docs/` は
別の担当が直すので触らない。

## 設計（main が決めた。迷ったら報告に書いて、この形で進める）

1. **`logic.js` に `forcedPlacements(board, names)`**
   - `names` は残りの（トレイにある）ピース名の配列。形は `config.js` の `PIECES` から引く
   - 空きを上下左右の連結で分け（`emptyRegionSizes()` と同じ塗り方。共通化するなら
     領域のマスを返す内部関数を 1 つ作って両方から使う。`emptyRegionSizes()` の戻り値は変えない）、
     大きさ 5 の領域だけ見る。`normalize()` した形が `names` のどれかの `orientations()` の
     どれかと `sameShape()` なら `{ name, cells, row, col }` を返す配列に足す
     （`cells` は正規形、`row`/`col` は領域の最小の行・列。`place(board, name, cells, row, col)` に
     そのまま渡せる形）
   - 12 種の形はどれも違うので 1 領域に当たるピースは高々 1 つ。同じピースが 2 領域に
     当たることはありうる（そのときは解なしの盤面。呼ぶ側は「解ける」ときしか呼ばない）が、
     関数としては重複させない（そのピースは最初の 1 つだけ返す）
   - 並びは領域を見つけた順（行優先）。解の有無は見ない（純粋に形だけ）
   - JSDoc に「なぜ」：解ける盤面なら、その空きはそのピースで埋めるしかない（12 種の形は
     どれも違う）ので、埋めても解ける。埋めても他の空きは変わらないので一度に全部返す
2. **`game.js` で埋める**
   - `fillForced()` を足し、**`refreshHud()` の先頭**で呼ぶ。条件は
     `this.playing && this.hinting && this.solutions && hasSolution(this.solutions, this.board)`。
     `forcedPlacements` が空でなければ全部置く（`piece.cells/location/row/col`、
     `this.board = place(...)`、`refreshPiece`、`settlePiece(piece, true)`）。音と文言は 1 回
   - **履歴は積まない。** 積まないことで、直前の手の控え（`history` の末尾）が
     「利用者の手＋自動の手」をまとめて戻す 1 手になる。履歴が空なら（続きから始めた直後など）
     自動の手は戻せないままでよい
   - `refreshHud()` の残りの処理（残りの数、ボタン、`runHint()`、`persist()`）は埋めたあとの盤面で
     走るようにする。埋めたら `refreshHud()` の最後で `checkSolved()` を呼ぶ（最後の 1 個を埋めたら
     そのままクリア）
   - `checkSolved()` の頭に `if (!this.playing) return;` を足す。`dropDrag()`・`useAuto()` は
     `refreshHud()` のあとに自分でも `checkSolved()` を呼ぶので、二重に `Clear` へ移らないように
   - `toggleHint()` で入にしたときは `runHint()` ではなく `refreshHud()` を呼ぶ（入にした時点で
     埋めるため）
   - 一手戻したあとも `refreshHud()` を通るので、戻した盤面に当たる空きがあればまた埋まる。
     このときも履歴は積まないので、次の一手戻すはさらに 1 つ前へ戻る（止まらない）。これでよい
   - デモは `refreshHud()` を上書きしているので影響しないはず。確かめて報告に書く
   - `refreshHud()` のコメント（盤が変わる入口をここにまとめてある、の類い）を合わせる

## 保つもの（変えない）

- `useAuto()`・`runHint()` の今の振る舞い（解なしに変わった瞬間だけ鳴る等）
- 規約: `setTimeout` を使わない、状態はシーンのプロパティ、`logic.js` に Phaser/DOM を
  持ち込まない、盤面は作り直して返す、JSDoc は「なぜ」を書く
- `logic.js` の向きの生成や `config.js` のピース定義は触らない（全解のデータを作り直さずに済むように）

## 完了条件と確かめ方

- Node で `forcedPlacements` を回し、(a) 8×8 の全解のデータ（`src/data/8x8.js`）の解から
  ピースを 1 つ取り除いた盤面で、そのピースを返す（位置と向きも元と一致）、(b) 2 つ取り除いて
  それらが隣り合わない場合は 2 つ返す、(c) 残りに無いピースの形の空きは返さない、を数で報告する。
  Node から `src/` を読むときは `tools/window-shim.mjs` を使う
- `http://localhost:8765/tests.html` が全件通る（サーバが無ければ
  `python3 -m http.server 8765` をバックグラウンドで。ブラウザで見られなければ報告にそう書く）
- 画面の見た目の確認とテストの追加は別の担当がする

## 報告

`archives/agents/TODO-044/implementer-report.md` に、変更点・確かめた方法と結果（数値）・
迷った点を書く。返事は「終わったか・報告ファイルのパス・判断が要る点」の 5 行以内。
コミットはしない。
