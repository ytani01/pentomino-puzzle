# TODO-057 implementer の報告

## 変更点

- `src/logic.js:450-500` — `solveStepsBreadth()` と JSDoc を消し、`solveStepsRandom(spec, random, canContinue = regionsFitPieces)` を `solveSteps()` の直後に足した。
  - 段ごとに `shuffle([...unused], random)` の順でピースを見て、そのピースの `orientations()` × 全位置で `canPlace(...).ok` な置き方を集め、`shuffle` した順に置く。`canContinue` が ok なら再帰、だめならすぐ remove。置き方が尽きたら次のピース、全部尽きたら 1 段戻る（乱択の深さ優先）。
  - 解の判定は `unused.length === 0`。返す手の形は `solveSteps()` と同じ。乱数は `random` だけ。
- `src/scenes/demo.js`
  - 冒頭 JSDoc（1-21 行目）: 幅優先の記述を消し、ランダムに書き直した。
  - `:27` import を `solveStepsRandom` に。
  - `:37-41` `STRATEGIES`: `breadth` を `random`（`ICONS.random`・`探し方: ランダム`）に。`restart` フラグは両方 true になるので消した。
  - `:98-99` `update()` の停止後は `startSearch()` を直接呼ぶ（`searchAgain()` は `startSearch()` を呼ぶだけになったので消した）。
  - `:125` `replay` の分岐とコメントを消した。
  - `:237` `toggleStrategy` を depth⇔random に。
  - `:248` `startSearch` の JSDoc の「深さ優先は」を消した。
  - `:269-273` `searchNext()` は `startSearch()` を呼ぶ。
- `src/icons.js:164-179` — `breadthFirst` を消し、`random`（角の丸い正方形 `strokeRoundedRect` に 5 の目）を足した。JSDoc も直した。`breadthFirst` の参照は他に無い。

## 検証

- `rg -n -i "breadth|幅優先|replay" src/` → 該当なし（終了コード 1）。
- `node --check` を 3 ファイルに → すべて ok。
- `node archives/agents/TODO-057/check-random.mjs`（終了コード 0、数秒）。各盤・各判定・シード 1/2 で最初の 200 手を取り、手を自前の盤へ当てて検査した。

| 盤 | canContinue | seed | 空きでない所への place | 解なし | remove | 同じシードで同じ手順 |
|---|---|---|---|---|---|---|
| 8x8 | regionsFitPieces | 1 | 0 | 80 | 95 | true |
| 8x8 | regionsFitPieces | 2 | 0 | 96 | 96 | true |
| 8x8 | hasSolution | 1 | 0 | 96 | 96 | true |
| 8x8 | hasSolution | 2 | 0 | 99 | 98 | true |
| 6x10 | regionsFitPieces | 1 | 0 | 87 | 97 | true |
| 6x10 | regionsFitPieces | 2 | 0 | 84 | 96 | true |
| 6x10 | hasSolution | 1 | 0 | 99 | 99 | true |
| 6x10 | hasSolution | 2 | 0 | 96 | 95 | true |

  シード 1 と 2 で手順が違うことも全組で true。hasSolution では remove 数 ≦ 解なし数で、「解ける」手を外していない（後戻りなし）。
  解に着くまでの手数は、管理者の指示の変更に従い測っていない。
- ブラウザでの見た目・`tests.html` は見ていない（別担当。`tests.html` はまだ `solveStepsBreadth` を import しているので、直すまで読み込みで落ちる）。

- 管理者の追加の注意に従い、`solveStepsRandom` の JSDoc から「いつかは解に着く」「必ず完成まで続く」の記述を消し、目的（ランダムに置いては「解なし」で外す様子を見せる）だけを書いた。検査は書き直し後に再実行し、8 組すべて同じ結果。

## 判断が要る点・懸念

- hasSolution を渡しても、200 手ではまだ 2〜10 枚しか置けていない。空の盤に近いほど置き方が多く（8x8 で 1 ピース数百通り）、ほとんどが「解なし」なので、解までの手数はかなり長くなりそう（利用者判断で許容済みと聞いている）。
- `finish()` の「すべての解を探し終えた」は、ランダムでは事実上出ない（全順列を辿るため）。文言は触っていない。
- `strokeRoundedRect` は Phaser 3 の Graphics にある API だが、実際の見た目は screens 担当の確認に任せる。

## 2 回目（solveStepsRandom を 1 手ずつ選び直す形に書き直す）

### 変更点

- `src/logic.js:450-529` — `solveStepsRandom()` を再帰からループに書き直し、JSDoc も直した。変えたのはここだけ。
  - `stack`（進めた手）と `failed`（今の盤面で「解なし」だった置き方。キーは `名前:向きの番号:行:列`）を持つ。
  - 毎回、残りのピースごとに `failed` に無い置ける置き方（全向き × 全位置、`canPlace`）を集め、候補のあるピースを `random` で 1 枚、その置き方を `random` で 1 つ選ぶ。
  - ok なら積んで `failed` を空にする。解なしならすぐ外して `remove` を返し、`failed` に足す。
  - 候補が 0 なら `stack` の最後を外して `remove` を返し、`failed` を空にする。`stack` も空なら `failed` を空にして選び直す（次の回で必ず place を返すので、yield が途切れない）。
  - 残りのピースが 0 なら `solved` を返して終わる。
  - JSDoc には目的（人間らしく見せる。1 枚を試し切ると機械的に見える）、`failed` と戻る処理の理由だけを書き、解に着くことの保証は書いていない。

### 検証

`archives/agents/TODO-057/check-random.mjs` を書き直した（同じ盤面での同じ置き方の再配置 `repeats` と、行き詰まって戻った回数 `backs` を数える。盤面は ok の place と、戻る remove で変わったと見なす）。

`node archives/agents/TODO-057/check-random.mjs`（2000 手。終了コード 0）

| 盤 | canContinue | seed | 手数 | 空きでない所への place | repeats | backs | solved | 同じシードで同じ手順 |
|---|---|---|---|---|---|---|---|---|
| 8x8 | regionsFitPieces | 1 | 2000 | 0 | 0 | 30 | 0 | true |
| 8x8 | regionsFitPieces | 2 | 2000 | 0 | 0 | 66 | 0 | true |
| 8x8 | hasSolution | 1 | 314 | 0 | 0 | 0 | 1 | true |
| 8x8 | hasSolution | 2 | 244 | 0 | 0 | 0 | 1 | true |
| 6x10 | regionsFitPieces | 1 | 2000 | 0 | 0 | 202 | 0 | true |
| 6x10 | regionsFitPieces | 2 | 2000 | 0 | 0 | 94 | 0 | true |
| 6x10 | hasSolution | 1 | 532 | 0 | 0 | 0 | 1 | true |
| 6x10 | hasSolution | 2 | 448 | 0 | 0 | 0 | 1 | true |

シード 1 と 2 の手順が違うことも全組で true。hasSolution の組は手数が 2000 に届く前に solved で終わった。

`node archives/agents/TODO-057/check-random.mjs long`（終了コード 0）
- 8x8・hasSolution・シード 1: 314 手で solved が出て終わった（5 万手に届かない）。repeats 0。
- 上の組では長く回せないので、既定の判定（regionsFitPieces）でも 8x8・シード 1 を 5 万手回した。5 万手すべて yield が続き、7.7 秒（1 手あたり約 0.15ms）。repeats 0、戻り 723 回、空きでない所への place 0、solved は出なかった。

`tests.html`（http://localhost:8765/tests.html。サーバは応答 200 を確認）を headless の Chromium（`tools/capture.mjs` と同じく npx の Playwright 1.63.0 を借りる）で開いた: 「298 件すべて通った」、pageerror なし。

### 懸念

- 1 回目の懸念のうち「hasSolution でも解まで長い」は解消した（数百手で解に着く）。
- ループ版は残りのピースの並びを `unused.push` で並べ替えるが、選ぶのは `random` なので手順は決まる（同じシードで同じ手順を確認済み）。
- 1 手ごとに全ピース × 全向き × 全位置を `canPlace` で見る。デモは 1 フレーム 1 手なので問題ない（上の実測で 0.15ms/手）。

## 3 回目（reviewer の指摘と利用者の決定に合わせて直す）

### 変更点

- `src/scenes/demo.js`
  - `finish()`・状態 `'done'`・「すべての解を探し終えた」を消した。`advance()`（:111-120）は generator が尽きたら黙って `startSearch()`。JSDoc に「デモでは尽きるところまで来ない。万一の備え」と書いた。
  - 「出し切った」の記述を直した: 冒頭 JSDoc（:18）、状態の説明（:61）、`update()` のコメント（:99）、`advance()` の JSDoc。`:149` のコメントの `finish()` を `startSearch()` に直した。
  - `rg -n "done|出し切|探し終え|finish" src/scenes/demo.js` の残りは `advance()` の `{ value, done }` と `if (done)` だけ。
- `src/logic.js:450-535`（`solveStepsRandom`）
  - `failed` を盤面ごとの `failedByBoard`（`Map<boardKey(board), Set>`）にした。外して戻っても前の盤面の失敗が残る。
  - 行き詰まって最後の手を外したときは、その手を戻った先の盤面の控えに足す。
  - 候補 0 かつ `stack` も空のときは、空の盤の控えだけ `clear()` して選び直す。
  - 上限は付けず、`ponytail:` のコメント（:478-479）に「行き詰まるほど盤面の数だけ増える。デモの hasSolution では行き詰まらないので増えない。困るなら戻るときに深い盤面の控えを捨てる」と書いた。
  - JSDoc の控えの説明を盤面ごとに書き直し、「最初の solved で終わる（solveSteps() と違い次の解は探さない。デモは解のたびに作り直すため）」を足した。
- `tests.html:1144` 付近: 「常に偽…直後が同じピースの remove」から `assertSame(step.ok, false, …)` の 1 行を消した。ほかは変えていない。

### 検証

`check-random.mjs` を書き直した。`repeats` は盤面（grid の中身）ごとに「解なしだった置き方」と「その盤面へ戻るときに外した手」を覚え、同じ盤面でもう一度置いた回数を数える（reviewer の rep.mjs と同じ数え方に、戻る手を足したもの）。

`node archives/agents/TODO-057/check-random.mjs`（2000 手。終了コード 0）

| 盤 | 判定 | seed | 手数 | bad | repeats | backs | solved | 同じシードで同じ手順 | 時間 |
|---|---|---|---|---|---|---|---|---|---|
| 8x8 | regionsFitPieces | 1 | 2000 | 0 | 0 | 31 | 0 | true | 391ms |
| 8x8 | regionsFitPieces | 2 | 2000 | 0 | 0 | 80 | 0 | true | 350ms |
| 8x8 | hasSolution | 1 | 314 | 0 | 0 | 0 | 1 | true | 87ms |
| 8x8 | hasSolution | 2 | 244 | 0 | 0 | 0 | 1 | true | 82ms |
| 8x8 | 常に偽 | 1 | 2000 | 0 | 0 | 0 | 0 | true | 796ms |
| 8x8 | 常に偽 | 2 | 2000 | 0 | 0 | 0 | 0 | true | 873ms |
| 6x10 | regionsFitPieces | 1 | 2000 | 0 | 0 | 128 | 0 | true | 279ms |
| 6x10 | regionsFitPieces | 2 | 2000 | 0 | 0 | 77 | 0 | true | 290ms |
| 6x10 | hasSolution | 1 | 532 | 0 | 0 | 0 | 1 | true | 125ms |
| 6x10 | hasSolution | 2 | 448 | 0 | 0 | 0 | 1 | true | 133ms |
| 6x10 | 常に偽 | 1 | 2000 | 0 | 0 | 0 | 0 | true | 762ms |
| 6x10 | 常に偽 | 2 | 2000 | 0 | 0 | 0 | 0 | true | 786ms |

シード 1 と 2 の手順が違うことも全組で true。常に偽でも 2000 手まで yield が続いた（固まらない）。

`node archives/agents/TODO-057/check-random.mjs long`（終了コード 0）

| 盤 | 判定 | 手数 | 解なし | repeats | backs | 時間 |
|---|---|---|---|---|---|---|
| 8x8 | regionsFitPieces | 50000 | 23468 | 0 | 1529 | 10.8s |
| 6x10 | regionsFitPieces | 50000 | 22471 | 0 | 2526 | 10.2s |
| 8x8 | hasSolution | 314（solved で終わった） | 150 | 0 | 0 | 0.1s |

reviewer の rep.mjs もそのまま回した: 8x8 は解なし 23468 のうち前に同じ盤面で解なしだったもの 0（盤面 750）、6x10 は 22471 のうち 0（盤面 901）。戻るときに外した手をすぐまた置いた回数も両方 0。

`tests.html`（サーバの応答 200）を headless の Chromium（npx の Playwright 1.63.0）で開いた: 「298 件すべて通った」、pageerror なし。

### 懸念

- 1 手あたりの時間が 2 回目の約 0.15ms から約 0.2ms に増えた（毎回 `boardKey` を作るため）。デモは 1 フレーム 1 手なので問題ない。
- 控えの量: 既定の判定で 5 万手回して、控えのある盤面は 750〜901 個。
