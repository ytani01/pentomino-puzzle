# TODO-117 reviewer 報告（76ea72a）

要修正: 0 件 / 検討: 0 件 / 好みの範囲: 1 件

## 観点ごとの結果

- **solveStepsRandom() の random() の順番と回数:** 変わらない。`chooseMove()` は旧コードの分岐（forced → `singlePieceCell` → `pickTightCell`+`pickWeighted` → 重みの `pickWeighted`）を同じ順でそのまま移している。`pickOne` も同じ式（`Math.floor(random() * forced.length)`）。`last`（`stack[stack.length - 1]`）を else の外で先に評価するようになったが、副作用の無い配列参照なので差は無い。`forced.length > 0` → `forced`（真偽）も、旧来の forced が選ばれた場合だけ真なので同じ。`placeableMoves()` は手の並び（unused → 向き → 行 → 列）と `failed` の除外を変えていない。`choices.length === 0` のとき `chooseMove()` を呼ばない順も保たれている
- **moveCellKeys():** `some` → `includes` は短絡の有無だけで結果は同じ。鍵の文字列は同じ
- **logic.js（nextTurn / prevTurn / nextPlaceableTurn）:** 返す値は同じ。`turnPosition()` の中身は旧コード 3 か所と同じ式で、`index === -1` のときの挙動も変わらない。`origin` の既定値（`null`）は公開関数側に残っている
- **storage.js の値の境界:** 変わらない。node で旧・新の判定に 0・-0・負・NaN・±Infinity・小数・1e-9・2**53・MAX_VALUE・文字列（"1"・"5"・"0"・"-3"・"Infinity"・""・" 7 "）・null・undefined・true・[]・{} を渡し、`isPositiveInteger`・`isPositiveNumber`・`loadBest` の式で差が 0 件。`parsed.solved.filter(isPositiveInteger)` は第 2 引数（index）を受けても使わないので同じ
- **tests.html:** `test(` の数は前後とも 281（ループ込みの実行数は実装者の報告で 476 / 476）。消えたのは補助の定義だけで、assert は変わっていない。`sigOf(found)` は `forcedPlacements()` の結果が `name・cells・row・col` を持つので、旧 4 引数版と同じ文字列。`createFailedOf()` はテストごと（TODO-061 の検討のテストでは種ごと）に新しく作っていて、旧と同じく共有されない。テストは弱まっていない
- **規約:** 新しい関数の JSDoc は「なぜ」を書いている。`logic.js` は `search.js` を読まない。Phaser・DOM の持ち込み無し
- **範囲:** 指示に無い変更なし（`TODO.md` はチェックだけ）
- **文書との整合:** 消した `firstSolutionStepsWith`・`pickOne` を `src`・`docs`・`tests.html`・`CLAUDE.md`・`README.md` から `rg` して残り無し。新しい関数はどれも export していないので、`CLAUDE.md` のファイル構成の表を直す必要は無い。`TODO.md` の「281 件」は `test(` の数としては合っている（実装者の「古い数」という指摘は実行数との取り違え。実害は無い）

## 作り込みすぎ

- **好みの範囲** `src/storage.js:33` `isPositiveNumber()` の `typeof value === 'number'` は、`Number.isFinite()` が数でない値に false を返すので要らない。旧コードにあった式をそのまま移したもので、挙動は同じ。
  同じく `tests.html:1163` の `canContinue = undefined` という既定値は書かなくても同じ（実害は無い）
