# TODO-040 implementer 報告

## 変えたファイル

- `src/logic.js`
  - :9 `PIECES` を import に追加
  - :336 `shuffle()`（Fisher–Yates、非公開）
  - :364 `export function* solveSteps(spec, random)`。探し方は `tools/enumerate.mjs` と同じ
    （`grid.indexOf(null)` で一番若い空きマス、置けるかは既存の `canPlace()`、枝刈りは
    既存の `regionsFitPieces()`）。始める前にピースの並びと各ピースの `orientations()` を
    1 回だけ入れ替える。作業用の盤は generator の中で書き換える（理由は JSDoc）。
    `place` の `cells` は `orientations()` が返した配列そのもの（呼ぶ側で書き換えない前提）
- `src/config.js:600` `DEMO`（`slowIntervalMs: 150`・`fastStepsPerFrame: 20`・
  `fastestBudgetMs: 8`・`defaultSpeed: 'fast'`）
- `src/scenes/game.js`
  - :31 `DEPTH` を export（デモの HUD の重なりに使う）
  - :37 constructor がキーを受け取る（既定 `'Game'`）
  - :294〜:329 `createHud()` のボタンの並べ方を `createHudButtons(labels, actions)` に分けた。
    中身は移しただけで、位置の計算は同じ。本編の挙動は変えていない
- `src/scenes/demo.js`（新規）`DemoScene`（キー `'Demo'`）。`create()` を上書きし、
  `drawBoard`・`drawTray`・`createPieces`・`createMessage`・`createVersionText`・
  `createHudButtons` を使い回す。`createGhost`・`createTraySlots`・入力の登録・
  確認ダイアログ・shutdown の登録・`storage.js` はどれも通らない。
  `onPiecePointerDown` と `drawTurnMark` は空で上書き。`update()` → `advance(limit, deadline)` で
  進めたあと、変わったピースだけ `refreshPiece` + `settlePiece`（ゆっくりのときだけ Tween と
  `drop`/`lift` の音）。解けたら `fanfare`、`messageText` へ直接「解けた！ N 手目」
  （`showMessage` は消えるので使わない）。出し切ったら「すべての解を探し終えた」
- `src/main.js:17, :29` シーンを登録
- `src/scenes/title.js:57` `SUB`（190×48、間 20）。`記録` と `デモ` を同じ行に左右に並べた

## 確認

- `node --check` を上の 6 ファイルに通した。すべて成功（終了コード 0）
- Node（mulberry32、`tools/window-shim.mjs` 経由。スクリプトは scratchpad の `check-solve.mjs`）で
  `place`/`remove` を `logic.js` の `place()`/`remove()` で順に当てはめ、置く前に毎回 `canPlace` を確認。
  `solved` の時点で `isSolved` が真、埋まったマスは 60。同じシードで 2 回回すと手数が一致。
  1 番目と 2 番目の解は別の盤面だった。

  | 盤 | シード | 最初の解までの place | remove | 2 番目の解までの place |
  |---|---:|---:|---:|---:|
  | 8x8 | 1 | 6134 | 6122 | 7910 |
  | 8x8 | 2 | 833 | 821 | 855 |
  | 8x8 | 3 | 1953 | 1941 | 8206 |
  | 6x10 | 1 | 60549 | 60537 | 60568 |
  | 6x10 | 2 | 27767 | 27755 | 27776 |
  | 6x10 | 3 | 43007 | 42995 | 76602 |

  place と remove の差がいつも 12 で、解の時点で 12 個が盤上にある。
- generator だけの速さ（Node）: 1 万 place で 8x8 108ms、6x10 91ms（measure の 50ms より遅いのは
  generator と `canPlace` の戻り値のぶん。最速の 8ms で約 700 手/フレーム）
- 依頼範囲外だが、動くかを見るために headless Chromium（CDP）で `Title` → `Demo` を 8x8・6x10 で回した
  （撮影はしていない）。例外 0 件。速い → 最速で解に到達して `solved`、`次の解を探す` が押せる状態、
  `searchNext` 後に再開、`goToTitle` 後の動いているシーンは `Title` だけ、localStorage は前後で一致。
  headless（ソフトウェア描画）の fps は 20〜35 で、実機の fps は screens の担当で見てほしい

## 判断したところ・迷ったところ

- `createHud()` からボタンの並べ方を `createHudButtons()` に分けた（`GameScene` 側の変更）。
  デモで同じ計算を写すと 2 か所に同じ位置の決め方が残るため。本編の見た目は変わらないはず
  （reviewer に見てほしい）
- 外したピースの向きは最後に試した向きのままトレイへ戻す（依頼に指定が無かった）
- 「試した手」は `place` の回数（枝刈りで捨てた分も含む。measure と同じ数え方）
- ゆっくりの Tween は既存の `INPUT.returnTweenMs`（180ms）を `settlePiece` 経由で使う。
  間隔 150ms より長いが、次の `settlePiece` が `killTweensOf` で前を止めるので取り合わない。
  Tween 用の数値を `DEMO` に足していない
- ゆっくりでは 1 手ごとに `drop`/`lift` を鳴らす（速い・最速では鳴らさない）

## 範囲外で気づいたこと・懸念

- デモのピースのマスは `createPieces()` で `useHandCursor` 付きの当たり判定を持つので、
  押しても何も起きないのに指のカーソルが出る。消すなら `disableInteractive()` を 1 行足すだけ
- HUD のボタン `次の解を探す`（6 文字、`FONT.small` 20px で約 120px）がボタン幅 130 に近い。
  はみ出していないかは screens の担当で見てほしい
- 8x8 の全解を出し切るのは実際には何時間もかかるので、「探し終えた」はほぼ出ない（動作は Node で未確認）
