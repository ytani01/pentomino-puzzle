# TODO-060. デモのランダムで、小さな孤立した穴にはすぐ気づいて外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 17,662 | 85,839 | 26% |
| implementer | Sonnet 5 | medium | 33,294 | 228,355 | 25% |
| tests | Sonnet 5 | medium | 31,447 | 228,534 | 28% |
| reviewer | Opus 5.5 | high | 5,110 | 209,616 | 17% |
| verifier | Sonnet 5 | medium | 1,910 | 62,676 | 4% |
| 合計 |  |  | 89,423 | 815,020 | 概算 $10.8 |

- reviewer は定義のモデルが sonnet。挙動の変わるレビューなので Opus 5.5 に上書きした
- 集計は決着のコミット前（現在時刻まで）。reviewer は再レビューの途中で API の利用上限に当たり、上限が戻ってから続けた

## きっかけ

TODO-059 で、解なしの手を置いても行き詰まるまで気づかない形にした。
人なら小さな穴には置いた瞬間に気づくので、その失敗だけすぐ外す。
すぐ気づく範囲は「1〜4 マスの閉じた空き」と利用者が決めた（7 マスや 12 マスの
ような 5 の倍数でない大きい空きは、今までどおり行き詰まってから戻す）。

着手後に利用者が「デモでは、ピースを戻すときは間を置かないように」と足した。
深さ優先・ランダムの両方が対象。レビューで「置いた直後に外す手まで待たないと、
置いたピースが 1 フレームしか出ず盤に届かない」と分かり、利用者と相談して
**外す手が続くとき（`remove` のあとの `remove`）だけ**待たないことにした。

## やったこと

- `src/logic.js` の `solveStepsRandom()`: `place` を返した直後、空き領域に
  `PIECE_SIZE` 未満のものがあれば、同じ手を `remove` で外す。控え（`failed`）への
  入れ方は行き詰まったときと同じ（外した後の盤面に控える）。外す処理は
  `undoLast()` にまとめて両方から使う
- `src/scenes/demo.js`: 次の手を 1 つ先読み（`this.peeked`）し、今の手も次の手も
  `remove` のときだけ待ち時間を 0 にする。`place → remove` は今の間隔のまま
  （`DEMO.speeds` の「間隔を Tween より長くする」設計を保つ）。`startSearch()` で先読みを捨てる
- `src/config.js`: `randomRemoveMultiplier` の JSDoc を今の効き方に合わせた
- `tests.html`: 小さな空きの直後は同じ名前の `remove` になること、5 マスの閉じた空きでは
  すぐ外さないことを既存のテストに足した。即座の `remove` を「置ける手が尽きた連なり」と
  数えないよう既存テストの前提を直した
- `docs/UsersGuide.md`・`docs/developer.md`: ランダムの説明とデモの間隔の説明

## 確かめたこと

- `tests.html` 318 件すべて通過（verifier が Playwright で実測）
- 壊すと落ちるか: 判定を `size <= PIECE_SIZE` にすると 10 件、`size < 0` にすると 4 件が落ちる
- デモ（ランダム・速い、200 手）: 小さな空きの直後に外した 80/80、`remove → remove` の待ちが 0 の 17/17、
  `place → remove` の待ちが 0 でない 81/81。深さ優先 50 手で `place → remove` の待ちが 1 の 18/18。
  最速 100 手でコンソールエラー 0 件
- `node tools/gen-solutions.mjs --check` が通る（全解データは変わらない）
- 深さ優先の `remove → remove` は、全解のデータで解なしの手をすぐ外すので実測の範囲では起きなかった。
  条件式はランダムと共通

## 分担の振り返り

- **見つけたもの**: reviewer が「置いた直後に外す手まで待たないと、置いたピースが盤に届かない」
  （`config.js` の JSDoc の設計と食い違う）ことと、既存テストの `sawRun` が即座の `remove` で立って
  テストが弱まったこと、新テスト 2 件の重複、5 マスの境界を固定するテストの欠けを見つけた。
  tests は既存テスト 3 件の前提の食い違いを見つけた。verifier は食い違いを見つけなかった（直したあとの確認）
- **見込みとの食い違い**: 編成は見込みどおり。ただし利用者の追加（戻すときの間）の意味を
  最初に 1 通りに決めて実装させたため、レビュー後に意味を決め直して implementer・tests・reviewer を
  2 巡させた。main が最初の確認で「置いた手が盤に届くか」まで選択肢に書いていれば 1 巡で済んだ
- **次に同じ規模なら**: 待ち時間を変える依頼では、選択肢を出す前に `DEMO.speeds` の JSDoc
  （Tween との兼ね合い）を main が読み、見え方の違いを選択肢に書く。tests と implementer は
  今回どちらも 25% 前後で、テストの前提直しが要る項目では tests を分けたままでよい
