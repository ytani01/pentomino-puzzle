# TODO-113 implementer 報告

## 移した範囲
- `logic.js` の旧 478〜918 行（`touchingEdges()` の JSDoc 冒頭〜`solveStepsRandom()` の閉じ `}`）441 行を `src/search.js` の 16 行目以降へ。`logic.js` は 1106 → 665 行、`search.js` は 456 行（先頭の JSDoc と import が 15 行）。
- 手で写さず `sed -n 478,918p` で切り出した。

## 検証
- `diff <(git show HEAD:src/logic.js の 478〜918 行) <(src/search.js の 16 行目以降)` → 差なし（`SAME`）。
- `node --check` を `src/*.js`・`src/scenes/*.js`・`tools/*.mjs` に流した → 全部成功。
- `node -e "import('./src/search.js')..."` → `countCellMoves, moveDistance, singlePieceCell, solveSteps, solveStepsRandom, touchingEdges` が出る。
- 両ボードで `solveSteps`・`solveStepsRandom` を 3000 手回した（固定 `random`）→ 例外なし。
- `tests.html` の import 名が `logic.js`・`search.js` の export に全部ある（欠け 0）。
- `tests.html` とデモの画面、`gen-solutions.mjs --check` は依頼どおり流していない。

## 途中で出た不具合（直した）
`search.js` の最初の import に `boardKey`・`sameShape` が無く、上の動かす確認で `ReferenceError: boardKey is not defined` が出た。`node --check` では見つからない。足して解消。以降、`logic.js` の全トップレベル名を `search.js` で引いて、足りるのを確かめた。`DEMO` は `logic.js` で使われなくなったので `logic.js` の import から外した（未使用の import の整理）。

## 直した参照
- `src/scenes/title.js`・`src/scenes/demo.js`: import を `search.js` から読む形に分けた。
- `tests.html`: import を分け、探索・重み付けの 7 グループ名（`src/logic.js —` → `src/search.js —`）、節コメント 10 か所（`logic：` → `search：`）、冒頭の説明に `src/search.js` を追加。
- `src/scenes/demo.js:12`、`src/config.js:831` のコメント（`logic.js の …` → `search.js の …`）。
- `CLAUDE.md`: 規約に `src/search.js` を追加、ファイル構成の表に `search.js` の行を足し `logic.js` の行から探索の説明を移した。
- `docs/developer.md`: ファイル構成のツリー、3 層の分け方、mermaid の図（Search ノードと矢印 3 本）、テストの説明。
- `TODO.md` の TODO-113 の 3 項目にチェック。

## 残る懸念
- `docs/developer.md:288` の「探し方」の表にある関数名は元から `logic.js` を名指ししていないので触っていない。
- 本編のヒント表示が `forcedPlacements()` などを `logic.js` から読む点は変えていない。
- 画面での確認（デモが 1 手進む）は未実施。次の担当（tests）へ。
