# tests 報告（TODO-119）

## 足したテスト
`tests.html` に 2 件。`group('src/logic.js — ピースの塗りの色（fillColor。TODO-119）')` を
`pieceColor` の節の直後に置いた。import に `fillColor`・`NEON` を足した。

- ネオンの組では、元の色を NEON.fillDarken で暗くした色になる（12 ピース全部。期待値は `darken(color, NEON.fillDarken)`）
- ネオン以外の組（colorful・glass）では、元の色のままになる（12 ピース × 2 組）

## 結果
- 足した後: `478 件すべて通った`（足す前 476 件）。コンソールのエラーは `favicon.ico` の 404 だけ
- 壊したとき: `fillColor()` を `return color;` にして再実行 →
  `1 件が失敗（477 件は通った）`
  - 落ちた題: ネオンの組では、元の色を NEON.fillDarken で暗くした色になる（期待 3345420 / 実際 16726843）
  - ネオン以外の組のテストは、この壊し方では通る（ネオン以外が元の色のままなのは壊していないため）。
    逆向きの壊し（常に暗くする）は頼まれていないので試していない
- 戻し: `git checkout -- src/logic.js` のあと `git diff --stat src/logic.js` は空
