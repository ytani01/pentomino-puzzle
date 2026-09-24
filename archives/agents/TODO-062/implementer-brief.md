# TODO-062 implementer への依頼

## 目的

デモのランダム（`src/logic.js` の `solveStepsRandom()`）で、置き方の重みに
「直前に置いた手からの近さ」を掛け、盤の上を飛び回らず近くから順に埋めていくようにする。

## やること

1. `src/config.js` の `DEMO` に `randomNearPower`（値は仮で `2`）を足す。上の JSDoc の箇条書きに
   説明を 1 項目足す（何のための値か・値は仮で画面で見て決める、TODO-062）
2. `src/logic.js`:
   - 距離 = 候補の手のマスと、`stack` の最後の手（盤に残っている最後に置いた手）のマスとの
     マンハッタン距離の最小値（隣り合えば 1）。これを返す純関数を export する（名前は任意。例 `moveDistance(a, b)`、
     引数は `{ shape, row, col }` の形）
   - 重みを `touchWeight(count) / (1 + distance) ** DEMO.randomNearPower` にする。`stack` が空なら距離の項は掛けない
   - `forced`（TODO-066）の手には掛けない（今の分岐のまま）
   - `solveStepsRandom()` の JSDoc の置き方の説明に近さを足す（なぜそうするか：人は近くから順に埋めるため）
3. `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明に、直前に置いた近くへ置きやすいことを足す
   （`rg -n "ランダム" docs/UsersGuide.md docs/developer.md` で該当箇所を探す）

## 保つもの

- 乱数は `random` だけを使う。控え `failed`、戻り方、TODO-060・066 の即座の外し方は変えない
- `solveSteps()`（深さ優先）は触らない。全解データは変わらないはず
- 規約（`CLAUDE.md`）どおり。`logic.js` に DOM・Phaser を持ち込まない

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る
- `tests.html` を開いて（`python3 -m http.server 8765` 経由）既存テストが通るか見る。落ちたものは直さず一覧を報告
  （テストの追加・修正は別の担当がやる）

## 報告

`archives/agents/TODO-062/implementer-report.md` に、変えた点・検証結果・落ちた既存テストを書く。
返事は 5 行以内（終わったか・報告のパス・判断が要る点）。
