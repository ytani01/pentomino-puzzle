# TODO-113 確認（tests）

対象: コミット 9421626（デモの探索を `logic.js` から `search.js` へ移した）。

## tests.html

`458 件すべて通った`（458/458、落ちた題なし）。コンソールの error は
`/favicon.ico` の 404 が 1 件だけ（import の失敗ではない）。

## タイトルの動くボード（`http://localhost:8765/`）

`Title` の `previewBoard.grid`（1 次元配列。ピースは文字、穴は `'#'`）で、置かれたマス数を 2 秒空けて読んだ。

| | 置かれたマス | ピースの種類 |
|---|---|---|
| 1 回目 | 20 | 4 |
| 2 回目 | 35 | 7 |

`previewSteps`・`previewTimer` は有効。

## デモ（`?demo=random&board=8x8`）

`Demo` の `state` は `running`。デモは `this.board` を更新せず、ピースの `location` で持つ
（`board.grid` は常に 0 マスだった。これは仕様どおりで不具合ではない）。
そのため `location === 'board'` のピース数と `tried`（試した手の数）で読んだ。

| | tried | 盤上のピース | state |
|---|---|---|---|
| 1 回目 | 19 | 8 | running |
| 2 回目（3 秒後） | 20 | 2 | running |

`tried` は 1 秒ごとの 8 回の読みで 8 → 14 と増え続けた。盤上の数が 8 → 2 と減ったのは外す手（バックトラック）。

## コンソール

- error: 0 件（タイトル・デモとも。tests.html の favicon 404 のみ）
- warning: タイトルで WebGL の `GPU stall due to ReadPixels` が 4 件（ブラウザの性能警告）。デモでは 0 件。実害は未確認

## 判断が要る点

なし。
