# TODO-119. ピースを名前で引く処理と、塗りの色・テクスチャを焼く手順をまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 101 | 23,934 | 54,340 | 4,581,768 | 67% |
| impl-119（implementer） | Sonnet 5.5 | medium | 44 | 10,260 | 52,491 | 969,429 | 15% |
| rev-119（reviewer） | Opus 5.5 | high | 14 | 4,804 | 42,419 | 250,019 | 4% |
| tests-119（tests） | Sonnet 5.5 | medium | 18 | 2,756 | 36,681 | 266,419 | 4% |
| screens-119（screens） | Sonnet 5.5 | low | 28 | 6,528 | 51,836 | 631,107 | 10% |
| 合計 |  |  | 205 | 48,282 | 237,767 | 6,698,742 | 計 6,984,996 |

- TODO-120・121 と並行して進めた（利用者の指示）。main の行は同じ時間帯に他の項目と共有した値
- 集計は `token-usage.py TODO-119 --since '2026-11-11 04:21:00'`。同じ時間帯に動いた他の項目の担当の行は除いた
- tests は見込みに無かった。レビューで `fillColor()` のテストが無いと出たので足した

## きっかけ

全ファイルを読み直したリファクタリングの洗い出しで、ピースを名前で引く処理、「ネオンなら暗くして塗る」色の決め方、テクスチャを焼く前後の手順が複数の場所で書き直されていた。

## やったこと

- `config.js` にピースを名前で引く Map を置き、`ui.js` の `PIECE_BY_NAME`、`icons.js`・`storage.js` の `PIECES.find()` を置き換えた
- `logic.js` に `fillColor()` を足し、`drawMiniBoard()`・`paletteIcon()`・`makeNeonTile()` が使う
- `boot.js` の 3 つの `make*Tile()` の前後（`textures.exists()`・`make.graphics()`・`generateTexture()`・`destroy()`）を `bakeTile()` にまとめた
- TODO-117 のレビューの好みの範囲: `storage.js` の `isPositiveNumber()` の冗長な `typeof` を消した
- レビューの検討 2 件: `CLAUDE.md` のファイル構成の表に `fillColor()` を足し、`tests.html` に `fillColor()` のテストを 2 件足した

## 確かめたこと

- `fillColor()`: 3 つの色の組 × 12 ピースで、変更前の 3 か所の計算と同じ値（`archives/agents/TODO-119/`）
- レビュー: 要修正 0 件。存在しない名前 11 種で Map と `PIECES.find()` が同じ結果、`isPositiveNumber()` は 10 種の値で前と同じ
- `tests.html`: 478 件すべて通過（足す前 476 件）。`fillColor()` のネオンの分岐を外すと足したテストが落ちる
- 画面: 3 つの色の組で変更前（77ebb77）と変更後をタイトル・本編で撮り比べた。glass・colorful の本編は画素まで一致、neon はにじみが時間で動く揺れだけ（同じ版どうしでも同程度の差）。コンソールのエラー 0 件
- implementer の報告にある「`tests.html` を `waitUntil: 'load'` で開くと 30 秒でタイムアウトする」は、確認のスクリプトの待ち方の話で、ゲームとテストの不具合ではない（`commit` で待てば通る）。項目にしない

## 分担の振り返り

- implementer は 36 通りで色の一致を確かめた。reviewer は文書の表の抜けとテストの抜けを見つけた。tests は壊すと落ちることを確かめた。screens は変更前後を画素で比べ、neon の差が揺れであることを同じ版どうしの比較で切り分けた
- 見込みとの食い違いは tests を足したことだけ。`logic.js` に関数を出す項目なのに、見込みでテストの担当を入れていなかった
- 次に `logic.js` などの計算側へ関数を出す項目では、見込みの段階で tests を入れ、implementer への依頼に「`CLAUDE.md` のファイル構成の表に名前を足す」を書く
