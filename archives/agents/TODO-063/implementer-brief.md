# TODO-063 implementer への依頼

## 目的

デモのランダム（`src/logic.js` の `solveStepsRandom()`）で、同じあたりで詰まり続けたら、1 手ずつでなく数手をまとめて外して
やり直す。人は同じ所で詰まり続けると「やり直そう」と大きく崩すため。背景は `TODO.md` の TODO-063 の節。

## 利用者が決めたこと

- 「詰まりが続いた」は **同じ深さ（盤に残るピースの数）まで戻った回数** で数える。置いた直後にその場で外す手
  （TODO-060/068・066・067）も、行き詰まって戻る手も数える
- まとめて崩した手のうち、控え `failed` に入れるのは **最後に外した 1 手（一番下の手）だけ**。途中の手は控えに入れない

## やること

1. `src/config.js` の `DEMO` に `randomCollapseAfter`（同じ深さに何回戻ったら崩すか。仮の値 5）と `randomCollapseMoves`
   （何手まとめて外すか。仮の値 3）。JSDoc の箇条書きに説明を足す（値は仮で画面で見て決める、TODO-063）
2. `solveStepsRandom()`:
   - 外す一続き（1 手外し・TODO-066 の 2 手外し・行き詰まって ok が真になるまでの連なり）が終わった時点の `stack.length` を d とし、
     深さごとの回数を 1 増やす。一続きの途中の remove では数えない
   - 回数が `randomCollapseAfter` に達したら、続けて `randomCollapseMoves` 手（`stack` にある分まで）を 1 手ずつ remove として yield する。
     控えに入れるのは最後に外した 1 手だけ（`undoLast()` の控えに入れない版が要る）。各 remove の `ok` は今と同じく外した後の
     `canContinue(board)`
   - 崩したら、崩した後の深さ以上の回数を消す（新しい状況として数え直す）
3. JSDoc: `solveStepsRandom()` に崩し方と、なぜそうするか（人は同じ所で詰まり続けると大きく崩す）を足す
4. `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明

## 保つもの

- 乱数は `random` だけ。TODO-059・061・062・066〜068 の動き（抽選・重み・その場で外す 3 つ・控え）は変えない
- `solveSteps()`（深さ優先）は触らない。`logic.js` に DOM・Phaser を持ち込まない
- `src/scenes/demo.js` は、remove が連なるときは待たずに続けて戻す（`advance()` の先読み。TODO-060）。崩す remove もこれに乗るはず。
  `demo.js` を直す必要があるかを読んで確かめ、要るなら報告だけする（直さない）

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る（2 分以上かかる。バックグラウンドでよい）
- `tests.html` を Playwright の**新しいコンテキスト**で（`python3 -m http.server 8765` 経由）開き、落ちた既存テストを一覧で報告
  （直さない。原因の見立ても書かず、どのテストがどの確認で落ちたかだけ）
- 実測: 全解データの `hasSolution`（`src/solutions.js`）を渡して 8×8・6×10 を数千手回し、崩した回数、1 回の崩しで外した手数、
  最初の解までの手数（変更前と後）を報告

## 報告

`archives/agents/TODO-063/implementer-report.md`。返事は 5 行以内。
