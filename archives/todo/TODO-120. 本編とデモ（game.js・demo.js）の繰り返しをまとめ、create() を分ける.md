# TODO-120. 本編とデモ（game.js・demo.js）の繰り返しをまとめ、create() を分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 72 | 17,310 | 43,376 | 2,909,446 | 47% |
| impl-120（implementer） | Opus 5.5 | medium | 40 | 19,400 | 76,898 | 1,237,858 | 21% |
| rev-120（reviewer） | Opus 5.5 | high | 12 | 4,560 | 46,347 | 208,522 | 4% |
| screens-120（screens） | Sonnet 5.5 | low | 58 | 18,088 | 75,776 | 1,698,454 | 28% |
| 合計 |  |  | 182 | 59,358 | 242,397 | 6,054,280 | 計 6,356,217 |

- TODO-117・119 と並行して進めた（利用者の指示）。main の行は同じ時間帯に他の項目と共有した値
- 集計は `token-usage.py TODO-120 --since '2026-11-11 04:18:00'`。同じ時間帯に動いた他の項目の担当の行は除いた

## きっかけ

全ファイルを読み直したリファクタリングの洗い出しで、`game.js` の `create()` が 105 行あり、`demo.js` の `create()` の前半と、ピースの位置の読み書き・トレイの数え方・向きの音の判定が繰り返されていた。

## やったこと

- `game.js` の `create()` を状態の初期化・全解の読み込み・入力の登録などのメソッドに分け、`DemoScene` も同じメソッドを呼ぶ（レイアウトの表は引数で渡す）。呼ぶ順と `ready` を最後に立てることは保った
- ピースの `{ cells, location, row, col }` を読む関数と書く関数を 1 つずつにし、`snapshot()`・`restoreState()`・`persist()`・`applyProgress()`・`slideIn()`・`relayout()`・`applyRelayout()`・`finishStep()` が使う
- トレイに残るピースの数え方（4 か所）と、向きを変えたときの音の判定（2 か所）をそれぞれ 1 つにした

## 確かめたこと

- レビュー: 要修正・検討・好みの範囲とも 0 件。`runHint()`・`fillForced()` の数え方、文書に古い名前が残っていないことも読んで確かめた
- 画面（コミット済みの HEAD を別ポートで配信。8×8・568x320）: 置く・外す・一手戻す・向きを変える・ヒント表示と自動で置く手・つづきから・デモを 1 回ずつ。状態を `evaluate` で読み、トレイの数と HUD の「残り」が合う。コンソールのエラー 0 件（`archives/agents/TODO-120/screens-report.md`）

## 分担の振り返り

- implementer はヒント表示を画面で動かさなかったことを懸念として報告し、reviewer がコードで、screens が画面（`useAuto()` で 10 個置いて自動で置く手を起こした）で埋めた。reviewer の指摘は 0 件
- 見込みどおりの編成で、食い違いは無い。screens が全体の 28% で、ヒントの自動で置く手を作る操作に手間取った
- 次に同じ規模なら同じ編成でよい。screens への依頼には、ヒントの自動で置く手を起こす手順（`useAuto()` で置く）を最初から書き、盤上での向き変更は代表 1 つを名指しする
