# TODO-109 tests の報告

## 件数
- 足したテスト: 2 件（1 題を `BOARDS` で 8×8・6×10 の 2 通りに回す）
- 全体: `452 件すべて通った`

## 足したテスト
`removeHistoryMany は古い形の件も、番号へ読み替えてから消せる（8×8 / 6×10）`
消された `removeHistory()` の「古い形の件も番号へ読み替えてから消せる」を `removeHistoryMany(key, [2], solutions)` 向けに書き直した（`cells` だけで `no` を持たない 2 件を保存し、`no: 2` を消して `[{ at: 1000, ms: 100, no: 1 }]` が残る）。
置き場: `tests.html` の `removeFound / removeAuto …` の直前（`removeHistoryMany` の節の末尾）。

壊して確かめた: 期待値を `no: 2` に変えると、足した 2 件が落ちた（期待 no:2 / 実際 no:1）。確かめたあと戻した。
（確かめ用の置換が、別のテスト「知らない鍵は落とされる」の期待値にも当たって 1 件余分に落ちたが、同じく戻した。）

## コンソール
- `tests.html`: error は `favicon.ico` の 404 のみ
- `/`（タイトル→本編 8×8、`scene.start('Game', { resume: false })` で開始）: error 0 件。warning は WebGL の `GPU stall due to ReadPixels` 4 件のみ

判断が要る点: なし。
