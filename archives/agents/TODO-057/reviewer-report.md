# TODO-057 reviewer の報告

対象: `git diff`（src/logic.js・src/scenes/demo.js・src/icons.js・tests.html・
docs/UsersGuide.md・docs/developer.md・CLAUDE.md・TODO.md）。アイコンの見た目は見ていない。

要修正: 0 件 / 検討: 3 件 / 好みの範囲: 1 件

## 検討

### 1. `src/scenes/demo.js:114-117, 164-168` — 状態 `'done'` と `finish()` に、デモから着く道が無くなった

- 問題: 幅優先を消したことで、generator が最後まで尽きる（`done: true`）場面がデモから無くなった。
  そのため `finish()`・`'done'`・「すべての解を探し終えた」の文言が使われない。
  - 深さ優先: 解のたびに `startSearch()` で新しい generator を作り（`update()` の 98-100 行、
    `searchNext()`）、判定は `hasSolution` なので、空の盤からは必ず solved に着く。尽きるところまで回らない
  - ランダム: `solveStepsRandom()` は solved を返した直後に `return` する（logic.js:478-480）。
    デモは solved のあと `next()` を呼ばずに作り直すので、`done: true` を受け取らない
  - 以前は幅優先だけが続きから探し（`restart: false`）、出し切って `'done'` になれた
- 根拠: コードを読んだ結果。実際に回して `'done'` に着かないことは確かめていない（未確認）
- 関連して、コメントも「出し切った」場面があるように書いたままになっている:
  demo.js:18「出し切ったあとも同じ」、:61 の `'done'` の説明、:99「出し切ったあとも」、:111「出し切ったら」、:147 の `finish()`
- 判断が要る点: `done` を受けたときの分岐は、無いと `value.type` で落ちるので、万一の備えとして残す意味はある。
  残すなら今のままでよいが、上のコメントは「万一尽きたとき」の書き方にするかどうか。
  文書（UsersGuide・developer）には「すべての解を探し終えた」の記述がもう無く、文書との食い違いは無い

### 2. `src/logic.js:502-509` — 戻ったあとは、同じ盤面で「解なし」だった置き方をまた試す

- 問題: TODO.md の決めたことは「同じ盤面で『解なし』だった置き方は繰り返さない」。実装は
  「今の盤面にいる間は繰り返さない」で、外して戻ると `failed` を空にするため、戻った先の盤面で
  前に「解なし」だった置き方をもう一度試す。行き詰まりの原因になった手（`last`）もすぐまた置ける。
  JSDoc（「外して戻ったときに空にする」）とは合っている
- 根拠（実測）: 既定の判定 `regionsFitPieces`・シード 1 で 5 万手回し、盤面（grid 全体）ごとに
  「解なし」だった置き方を覚えて数えた（scratchpad の rep.mjs）。

  | 盤 | 解なしの place | うち前に同じ盤面で解なしだったもの | 1 回の滞在の中での繰り返し | 解なしが出た盤面の数 |
  |---|---|---|---|---|
  | 8x8 | 24275 | 24224 | 0 | 5 |
  | 6x10 | 19881 | 19832 | 0 | 7 |

  既定の判定では、わずかな盤面の間を行き来して同じ失敗を繰り返し続けている。
  implementer の `repeats 0` は「戻ったら別の盤面」と数える定義なので、これは拾えない
- デモへの影響: デモの判定は `hasSolution` で、「解ける」の盤面には解なしでない手が必ず残るため、
  戻る分岐に入らない（implementer の実測で `backs 0`）。**デモの見た目には出ない**。
  出るのは既定の判定で呼んだとき（今は tests.html だけ）
- 境界線上の判断なので報告だけ。TODO の文言を「今の盤面にいる間は」に合わせるか、実装を
  文言に合わせるかは管理者が決める

### 3. `src/logic.js:464-465` — JSDoc の「返す手…は `solveSteps()` と同じ」が、solved のあとの振る舞いの違いを覆っている

- 問題: `solveSteps()` の JSDoc は「solved のあとも `next()` すれば次の解を探し、全部探し終えたら終わる」。
  `solveStepsRandom()` は最初の solved で終わる（logic.js:478-480）が、そのことが書かれていない
- 根拠: 両方の JSDoc とコードを読んだ。デモは solved のあと作り直すので実害は無い
- 1 行足すかどうか

## 好みの範囲

### 4. `tests.html:1122` と `tests.html:1146` — 「常に偽」での `ok` の確認が 2 か所にある

- `ok は渡した判定の結果と一致する（常に偽, …）` と、
  `常に偽を返す判定だと、すべての place の直後が同じピースの remove` の中の
  `assertSame(step.ok, false, …)` が同じことを確かめている。名前と中身は食い違っていない

## 作り込みすぎ

- tests.html:1146: delete: 1122 行の「常に偽」の組と重なる `ok` の確認。後者のテスト名は remove だけを言っているので、この 1 行を消すと名前と中身が揃う。
- demo.js:164-168: 上の 1 で触れた `finish()`。分岐自体は備えとして要るので、消すなら文言と状態だけ（判断は管理者）。
- net: -1 lines possible.

## 問題の無かった点

- `rg -n -i "breadth|幅優先|replay|searchAgain|restart" src tests.html docs CLAUDE.md README.md`: 残りは本編の `restart()`（やり直し）と `ICONS.restart` だけで、幅優先の名残は無い。tools/ にも無い
- `searchAgain()` を消して `update()`・`searchNext()` が `startSearch()` を直接呼ぶ形: 以前の分岐は幅優先のためだけで、深さ優先の動きは変わらない
- `STRATEGIES` から `restart` を消したこと: 参照は `searchAgain()` だけだった
- `toggleStrategy()`: loading 中は探し方だけ変え、届いたら `startSearch()` が使う流れは保たれている
- `advance()` で `replay` の分岐を消し `tried` を毎回数える: ランダムの place はすべて試した手なので正しい
- solveStepsRandom の画面の固まり: yield を挟まずに回るのは「空の盤で候補が 0」のときだけで、`failed` を空にした次の回は必ず place を返す。tests.html の「常に偽」2000 手が通っていることとも合う
- stack / unused / failed / grid の出し入れ: 置く（fill + splice）に対して、解なし（fill null + push）と戻る（pop + fill null + push）が対になっている
- 1 手あたりの計算量: implementer の実測 0.15ms/手（既定の判定）。デモは 1 フレーム 1 手なので収まる
- 乱数は `random` だけを使う（`Math.random` を直接呼んでいない）
- 盤をその場で書き換えること: `solveSteps()` と同じ例外で、JSDoc に理由がある
- 規約: `setTimeout`・モジュールのトップレベルの `let`・色の直書き・新しいライブラリ・アセットの追加は無い
- JSDoc: solveStepsRandom・demo.js・icons.js とも「なぜ」を書いている
- UsersGuide のデモの節: 「左上の空いたマスから順に」は `solveSteps()` の `grid.indexOf(null)`（行優先）と合う。ランダムの説明、表の 5 番も今のコードと合う
- developer.md の用語（次の解を探す・探し方・試した手）: 今のコードと合う
- CLAUDE.md のファイル構成の表（logic.js・demo.js の行）: 今のコードと合う
- tests.html の足したテストの名前と中身: 4 種とも一致（上の 4 の重なりを除く）。`OTHER_SEED`・`FAST_SEED` は既存の定義を使っている
- 範囲: 指示に無い変更は混ざっていない

---

## 2 回目（implementer の 3 回目の差分）

前回の指摘 1〜4 はすべて直っている。測り直しはしていない（implementer-report.md の「3 回目」の実測を使った）。

要修正: 0 件 / 検討: 1 件 / 好みの範囲: 2 件

### 検討

#### 5. `tests.html:1093-1154` — 「外して戻っても同じ盤面の解なしを繰り返さない」を確かめるテストが無い

- 問題: 今回決めたこと（盤面ごとに覚える、行き詰まった手も戻った先で控える）を確かめるのは
  `archives/agents/TODO-057/check-random.mjs` だけで、tests.html には無い。`failedByBoard` を
  前回の形（盤面にいる間だけ控える）へ戻しても、今の tests.html はすべて通るはず（未確認。
  足したテストはどれも、控えの持ち方に触れていない）
- 根拠: tests.html の足したテスト 4 種の中身を読んだ（再現性・place/remove の整合・ok の一致・常に偽での直後の remove）
- 足すかどうか、足すなら「壊すと落ちるか」の確認を tests の担当に回すかは管理者が決める

### 好みの範囲

#### 6. `src/logic.js:478-479` — ponytail コメントの「行き詰まるほど」「増えない」がコードと少しずれる

- `failedOf(boardKey(board))` は毎回呼ばれ、行き詰まらなくても、通った盤面ごとに空の Set を 1 つ作る。
  控えが増えるのは「行き詰まるほど」ではなく「通った盤面の数だけ」。`hasSolution` でも generator 1 本あたり
  最大 13 個（空の盤〜12 枚）増え、解のたびに作り直すので上限がある。「増えない」より「generator 1 本で
  盤面 13 個まで」が正確。実害は無い

#### 7. `src/logic.js:593-596` — `boardKey()` の JSDoc の使い道に、控えの鍵が入っていない

- 「代表形を選ぶための比較と、盤の形が保たれるかの判定に使う」のまま。今回 `solveStepsRandom()` の
  控えの鍵にも使うようになった。1 語足すかどうか

### 作り込みすぎ

- logic.js:481-484: shrink: `failedOf` の 4 行。`const failedOf = (key) => failedByBoard.get(key) ?? failedByBoard.set(key, new Set()).get(key);` の 1 行（`Map.prototype.set` は Map を返す）。
- net: -3 lines possible.

### 問題の無かった点

- demo.js の `'done'` の名残: `rg -n "done|出し切|探し終え|finish" src/scenes/demo.js` は `advance()` の `{ value, done }` と `if (done)` だけ。状態の説明・`update()`・`advance()` の JSDoc・`refreshStatus` 前のコメントも直っている。docs・README・CLAUDE.md にも残っていない
- 到達しない分岐: `update()` の `state !== 'running'` は今は `'solved'` だけで、`startSearch()` へ進む。`refreshHud()`・`searchNext()` の `'solved'` 判定も合っている
- 尽きたときの探し直し: `advance()` は `update()` から 1 フレームに 1 回だけ呼ばれ、`startSearch()` は generator を作るだけで `next()` しない。同じフレームで何度も作り直す経路は無い。万一すぐ尽きる generator でも、`intervalMs` ごとに 1 回作り直すだけで固まらない
- solveStepsRandom の yield を挟まない回り方: 挟まないのは「空の盤で候補 0」の 1 回だけ。そのとき盤は空（`stack` が空で、解なしの手はその場で外すため）なので、空の盤の控えを `clear()` した次の回は必ず place を返す。それ以外の回は place か remove を必ず返す。implementer の「常に偽」2000 手でも yield が続いている
- 控えの鍵: `boardKey()` はマスごとのピース名・`.`・`HOLE` をそのまま並べる（対称で寄せない）ので、盤面を取り違えない。盤面から残りのピースも決まるので、同じ鍵で残りのピースが食い違うことも無い。手の鍵 `名前:向きの番号:行:列` は `orientations()` の並びが決まっているので安定している
- 控えの出し入れ: 解なしの手は置く前の盤面の Set へ（盤は元に戻したあと）、行き詰まって外した手は外したあとの盤面の Set へ入る。どちらも「その手を置く前の盤面」で合っている
- JSDoc: 盤面ごとの控え・行き詰まった手の控え・空の盤だけ消す・最初の solved で終わる、どれもコードと合う
- TODO.md の決めたこと: 今回の 2 つの決定が書き足されていて、コードと合う
- tests.html:1139 のテスト名と中身: `ok` の確認を消して、名前（直後の remove）と中身が揃った
- 1 手あたり約 0.2ms（implementer の実測）。1 フレーム 1 手に収まる
