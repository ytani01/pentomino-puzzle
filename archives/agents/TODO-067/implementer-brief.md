# TODO-067 implementer への依頼

## 目的

デモのランダム（`src/logic.js` の `solveStepsRandom()`）で、置いた直後に「すでに盤に置いたピースと同じ形の
閉じた 5 マスの空き」ができたら、その手をその場で外す。ピースは 1 種 1 つなので、その空きは埋められず必ず解なし。
人は置いた瞬間に気づく。仕様は `TODO.md` の TODO-067 の節。

## やること

1. `solveStepsRandom()`: 置いたあとの分岐（TODO-066 の `forced && !ok`、TODO-060 の小さな空き）に並べて、
   置き済みのピース（`PIECES` のうち `unused` に無いもの）の形の 5 マスの空きがあれば `yield undoLast()` で 1 手外す。
   判定は `forcedPlacements(board, 置き済みの名前)` が 1 件以上返すか、で書ける見込み（形だけを見る関数なので流用できる）。
   外すのは直前の 1 手だけ（利用者が決めた）。`undoLast()` が `failed` に控えるので選び直さない
2. JSDoc: `solveStepsRandom()` の「行き詰まりを待たずに置いた直後にその場で外す」の箇条書きに 1 項目足す（なぜ: 埋められる
   ピースがもう無いため）。「この 2 つだけ」のような数の言い方があれば合わせる
3. `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明に足す（`rg -n "その場で外す|すぐには外さず" docs/` で探す）

## 保つもの

- 乱数は `random` だけ。TODO-059・060・062・066 の動き（重み・控え・即座の外し方）は変えない
- `solveSteps()`（深さ優先）は触らない
- `logic.js` に DOM・Phaser を持ち込まない

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る
- `tests.html` を（`python3 -m http.server 8765` 経由で）開き、既存テストが通るか見る。落ちたものは直さず一覧を報告
  （テストの追加・修正は別の担当）。落ちたものは、原因の見立てを書かず「どのテストか・どの確認で落ちたか」だけ書く
- 実測: 固定シードで `regionsFitPieces` を渡して 8×8・6×10 を数千手回し、この分岐で外した回数を数えて報告

## 報告

`archives/agents/TODO-067/implementer-report.md`。返事は 5 行以内。
