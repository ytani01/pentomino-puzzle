# TODO-068 implementer への依頼

## 目的

デモのランダム（`src/logic.js` の `solveStepsRandom()`）で、置いた直後に閉じた空きの大きさが 5 の倍数でなければ、
その手をその場で 1 手外す。今は TODO-060 の「ピースより小さい空き」（`size < PIECE_SIZE`）だけを見ている。
これを大きさによらず 5 の倍数でない空きに広げる（7・12 マスなども）。仕様は `TODO.md` の TODO-068 の節。

## やること

1. `solveStepsRandom()` の TODO-060 の分岐の条件を広げる（`regionsFitPieces(board)` が偽、で書ける見込み）。
   外すのは直前の 1 手だけ（利用者が決めた）。分岐の並び（TODO-066 の `forced && !ok` が先、TODO-067 が後）は保つ
2. JSDoc: `solveStepsRandom()` の「その場で外す」の説明と「7 や 12 マスのような大きい空きは今までどおり行き詰まってから戻す」
   の一文を今の動きに合わせる（なぜ: 5 の倍数でない空きはピースで埋め切れず必ず解なしになり、人は置いた瞬間に気づくため）。
   `rg -n "7 や 12|小さな閉じた|ピースより小さい" src/` で残りを探す
3. `docs/UsersGuide.md`・`docs/developer.md` の同じ説明（`rg -n "ピースより小さい|小さい閉じた" docs/`）

## 保つもの

- 乱数は `random` だけ。TODO-059・062・066・067 の動き（重み・控え・他の即座の外し方）は変えない
- `solveSteps()`（深さ優先）は触らない。`logic.js` に DOM・Phaser を持ち込まない

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る
- `tests.html` を（`python3 -m http.server 8765` 経由で）開き、落ちた既存テストを一覧で報告（直さない。原因の見立ても書かず、
  どのテストがどの確認で落ちたかだけ）
- 実測: 固定シードで `regionsFitPieces` を渡して 8×8・6×10 を数千手回し、この分岐で外した回数のうち、空きが 5 マスより
  大きかったものの回数を報告

## 報告

`archives/agents/TODO-068/implementer-report.md`。返事は 5 行以内。
