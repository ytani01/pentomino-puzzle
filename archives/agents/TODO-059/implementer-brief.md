# TODO-059 implementer への依頼

目的: デモの「ランダム」の探し方（`solveStepsRandom()`）を人間らしい動きにする。
深さ優先（`solveSteps()`）は変えない。`TODO.md` の TODO-059 も読むこと。

## 変えるもの

### 1. 置き場所の重み付け（`src/logic.js`）

- 今は `pickOne(pickOne(choices))`（ピースを一様に選び、その置き方を一様に選ぶ）
- ピースは今のまま一様に選ぶ。置き方は、**ピースのマスの辺のうち、盤の外・穴・
  置き済みのマスに接する辺の数**を重みにして抽選する（隅や置いたピースの隣に
  置きやすくなる）。重みの式（そのままか、2 乗か、+1 するか）は任せる。
  式と選んだ理由を JSDoc に書く
- 接する辺の数を数える関数は `logic.js` に切り出して export する（`tests.html` から
  確かめるため）。乱数は引数の `random` だけを使う（シードで手順を固定するため）

### 2. 戻り方（`src/logic.js` の `solveStepsRandom()`）

- 置いた直後に `canContinue(board)` が偽でも **外さない**。`ok` は今どおり
  `canContinue(board)` の結果を付けて返す（HUD の「解の有無」の表示に使う）
- どのピースにも置き方が無くなったら、**`canContinue(board)` が真になるまで**
  最後に置いた手を 1 手ずつ外す。スタックが空になったら止める
  （`canContinue` が常に偽でも止まるように）。外すたびに、外した手を
  外した後の盤面の `failed` に控える（今と同じ）
- `remove` の手にも `ok`（外した後の盤面での `canContinue(board)`）を付ける
- 空の盤で全部だめになったときの扱い（控えを消して選び直す）は残す
- JSDoc を新しい動きに合わせて書き直す

### 3. 手の間隔の揺らぎ（`src/scenes/demo.js`・`src/config.js`）

- `update()` の待ち時間を手ごとに変える。`intervalMs` に ±の揺らぎを掛け、
  `remove` のあとは長めに待つ。揺らぎの幅と倍率は `config.js` の `DEMO` に置く
  （値は任せる。JSDoc に理由）。最速（`intervalMs: 0`）は今のまま毎フレーム
- **揺らぎはランダムの探し方のときだけ**にする（深さ優先は機械的でよい）
- 乱数は `Math.random` でよい（`demo.js` は既に使っている）。`setTimeout` は使わない

### demo.js の表示

- `advance()` の `remove` で `this.hintState = 'ok'` と決め打ちしている。
  `value.ok` があればそれを使う（深さ優先の `remove` には `ok` が無いので、
  無ければ今どおり `'ok'`）
- ファイル先頭の JSDoc と、`config.js` の `DEMO` の JSDoc
  （「置くたびに全解のデータで解なしを外す」「30〜70 手」など）で、
  ランダムの説明が合わなくなるところを直す

## 変えないもの・保つもの

- 深さ優先の動き、`solveSteps()` の中身
- `solveStepsRandom()` の引数と、返す手の形（`place` / `remove` / `solved`）
- 盤面の `failed` の控え（同じ盤面で同じ失敗を繰り返さない）
- 新しいライブラリ・アセットを足さない。規約は `CLAUDE.md`

## やらないこと

- `tests.html` は触らない（別の担当が直す）。既存のテストが落ちるのは構わない。
  どれが落ちるはずかを報告に書く
- 文書（`docs/`）は触らない（main が直す）

## 報告

`archives/agents/TODO-059/implementer-report.md` に、変えた点、重みの式と揺らぎの値、
落ちるはずの既存テストを書く。返事は 5 行以内（終わったか・報告のパス・判断が要る点）。
