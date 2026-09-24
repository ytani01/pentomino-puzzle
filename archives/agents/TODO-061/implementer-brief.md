# TODO-061 implementer への依頼

## 目的

デモのランダム（`src/logic.js` の `solveStepsRandom()`）で、ピースを一様に選ぶのをやめ、狭い空きを埋められるピースを
選びやすくする。人は「この隙間に入るのはどれか」と考えてピースを選ぶため。仕様の背景は `TODO.md` の TODO-061 の節。

## 利用者が決めたこと

「狭い空き」は **置ける手の少ないマス** で測る。

## やること

1. `solveStepsRandom()` の抽選（`forced` が無いときの分岐。`pickOne(choices)` のところ）を次のようにする:
   - `choices`（控え `failed` を除いた、残りの全ピースの置ける手）から、空きマスごとに「そのマスを覆う手の数」を数える
   - 数が 1 以上で一番少ないマスを「狭い所」とする（同数なら `random` で 1 つ選ぶ。数が 0 のマスは除く）
   - ピースの抽選の重み: 狭い所を覆える手を持つピースは `DEMO.randomTightWeight`、それ以外は 1
   - 選んだピースが狭い所を覆えるなら、そのピースの置き方は狭い所を覆う手だけに絞る。覆えないならそのピースの全部の手
   - 絞った置き方に、今の重み（`touchWeight`・近さ `moveDistance`）を掛けて抽選する（今のまま）
   - 数える処理は純関数として export してよい（テストしやすくするため。名前は任意）
2. `src/config.js` の `DEMO` に `randomTightWeight`（値は仮で `4`）。JSDoc の箇条書きに説明を足す（値は仮で画面で見て決める、TODO-061）
3. JSDoc: `solveStepsRandom()` の「ピースは残りから `random` で一様に選ぶ」と TODO-062 の「ピースの選び方には掛けない（選び方は TODO-061 で扱う）」を
   今の動きに合わせる（なぜ: 人は隙間に入るピースを探して選ぶため）
4. `docs/UsersGuide.md`・`docs/developer.md` のランダムの説明（UsersGuide の「ピースは近さに関係なく選ぶので、遠くへ置くこともある」も見直す）

## 保つもの

- 乱数は `random` だけ。TODO-066 の穴を埋める手が抽選より先なのは変えない。置いた直後に外す 3 つ（TODO-060/068・066・067）、
  控え `failed`、戻り方は変えない
- `solveSteps()`（深さ優先）は触らない。`logic.js` に DOM・Phaser を持ち込まない
- 1 手あたりの重さ: デモは最速で 1 フレーム 1 手。数える処理で 1 手が数 ms を超えないか実測して報告

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る
- `tests.html` を Playwright の**新しいコンテキスト**で（`python3 -m http.server 8765` 経由）開き、落ちた既存テストを一覧で報告
  （直さない。原因の見立ても書かず、どのテストがどの確認で落ちたかだけ）
- 実測: 固定シードで全解データの `hasSolution`（`src/solutions.js`）か `regionsFitPieces` を渡して 8×8・6×10 を数千手回し、
  抽選した place のうち狭い所を覆った割合と、1 手あたりの時間を報告

## 報告

`archives/agents/TODO-061/implementer-report.md`。返事は 5 行以内。
