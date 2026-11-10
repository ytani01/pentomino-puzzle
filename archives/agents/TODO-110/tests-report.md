# TODO-110 tests の報告

## テストの件数

- 通った数/全体: **458/458**（`458 件すべて通った`）。足したのは 6 件（以前は 452 件）

## 足したテスト（`tests.html`。import に `darken`・`pieceColor` を追加）

- `darken`（3 件）: 係数 1 は元の色 / 係数 0 は 0 / 中間（0.5）は成分ごとに掛けて四捨五入（`0x804020`→`0x402010`、`0xff0000`→`0x800000`）
- `pieceColor`（3 件）: `mono` あり（`PALETTES.glass`）/ `colors` あり（`PALETTES.neon`）/ どちらも無い（`PALETTES.colorful`）。それぞれ 12 ピース全部で確認

## 壊すと落ちるか

期待値をわざと変えて各関数 1 回ずつ確かめ、戻した（458 件通るのを再確認）。
- `darken`: `0x402010` → `0x402011` で「中間の係数…」が落ちた
- `pieceColor`: `colors` の期待を `piece.color` に変えて「colors があれば…」が落ちた

## コンソール

- `tests.html`: error 0 件
- `http://localhost:8765/`: タイトルから本編（8×8。`scene.start('Game', { resume: false })` で開始）まで error 0 件。
  warning は WebGL の `GPU stall due to ReadPixels` 4 件のみ（ドライバのメッセージ。実害は未確認）

落ちたテスト・書き直した既存テストは無い。
