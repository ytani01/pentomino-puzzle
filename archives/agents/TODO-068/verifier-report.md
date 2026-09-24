# TODO-068 verifier 報告

## 1. `node tools/gen-solutions.mjs --check`

終了コード 0。

```
8×8: 全 520 解、代表形 65 件（4.6 秒）
  → src/data/8x8.js と一致した
6×10: 全 9356 解、代表形 2339 件（140.4 秒）
  → src/data/6x10.js と一致した
```

## 2. `tests.html`（Playwright headless Chromium、新しいコンテキスト）

`#summary` の文字列: `327 件すべて通った`。失敗 0、コンソールエラー 0。

## 3. デモの実物（8×8・6×10 それぞれ約 2000 手）

2 通りの方法で測り、結果が一致することを確かめた。

### 3-a. `src/logic.js` の `solveStepsRandom()` を Node から直接動かす

`window-shim.mjs` を使い、`ensureSolutions()` で読んだ全解データの `hasSolution` を
`canContinue` に渡す（デモの `startSearch()` と同じ呼び方）。`solveStepsRandom()` は
盤を外に見せないので、`place`/`remove` の手を自前でミラーした盤に反映し、
`place` の直後に `emptyRegionSizes()` で閉じた空きを調べた（スクリプトは
`/tmp/.../scratchpad/run_demo.mjs`、削除済みのスクラッチ領域）。

| 盤 | 手数 | 置いた回数 | 5 の倍数でない空きができた回数 | そのうち直後の remove が同じ駒だった回数 | そのうち 5 マスより大きかった回数 |
|---|---|---|---|---|---|
| 8×8 | 2010 | 1013 | 854 | 854 | 645 |
| 6×10 | 2010 | 1015 | 838 | 837 | 564 |

6×10 の 838/837 の食い違いは、測定を打ち切った最後の 1 手が place で、対応する
remove を観測する前にループが終わったことによる境界の作用（2000→2010 に伸ばしても
同じ形で 1 件残る）。3-b で境界の影響を受けない形で裏を取った。

### 3-b. 実物の `DemoScene` を Playwright の headless Chromium で操作

`http://localhost:8765/` を開き、`window.game.registry.set('board', ...)` で盤を選び、
`Title.scene.start('Demo')` → `demo.strategy = 'random'; demo.speed = 'fastest';
demo.startSearch();` のあと `demo.advance()` を 2000 回呼んだ（待ち時間を待たずに進める）。
盤は `demo.board`（穴の位置だけ）ではなく、`demo.pieces` の `location === 'board'` な
駒から組み立てて `emptyRegionSizes()` に渡した。

| 盤 | 置いた回数 | 5 の倍数でない空きができた回数 | そのうち直後の remove が同じ駒だった回数 | そのうち 5 マスより大きかった回数 | 見つけた解 |
|---|---|---|---|---|---|
| 8×8 | 1003 | 857 | 856 | 626 | 0 |
| 6×10 | 1009 | 806 | 806 | 524 | 1 |

8×8 の 857/856 も同じ境界の作用（最後の place の remove が 2000 手目の外に出た）。
6×10 は 806=806 で一致。コンソールエラーは 0 件（`page.on('console'/'pageerror')` で
収集）。

**まとめ**: 5 の倍数でない閉じた空きができた手は、境界を除いてすべて直後の 1 手
（同じ駒の `remove`）で外れており、仕様どおり。5 マスちょうどの空きも大きい空き
（7・12 マスなど）も区別なくその場で外れている（`nonMultipleOf5LargerThan5Count` が
0 でない）ことを確認した。

## 4. 差分とファイルの一致

- 変更ファイル: `docs/UsersGuide.md`・`docs/developer.md`・`src/logic.js`・
  `src/scenes/demo.js`・`tests.html`。指示の範囲（TODO-068 の 3 項目）と一致。
  指示に無いファイルの変更は無い
- `src/logic.js`: `emptyRegionSizes(board).some((size) => size < PIECE_SIZE)` を
  `!regionsFitPieces(board)` に変え、JSDoc も「ピースより小さい空き」から
  「5 の倍数でない大きさの閉じた空き」に書き換え済み
- `docs/UsersGuide.md`・`docs/developer.md`・`src/scenes/demo.js` の説明は、
  「ピースより小さい」から「5 の倍数でない大きさ」に揃っており、差分の動きと
  食い違わない

## 確かめられなかったこと・判断が要る点

- `tests.html` の個々のテストケースが「5 の倍数でない空き」を正しく網羅しているか
  （境界値である 5・10 マス、7・12 マスなど）は、依頼の対象外（tests 担当が
  壊して確かめ済みとのこと）なので見ていない
- 3-a・3-b とも乱数のシード・実行 1 回分の実測。別のシードでも同じ性質になるかは
  未確認（境界の 1 件を除き 2 通りの独立な方法で一致しているので、実害は無いと
  見ている）
