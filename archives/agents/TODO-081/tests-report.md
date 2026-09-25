# TODO-081 テスト担当 報告

## 足したテスト

`tests.html` の `src/logic.js — ランダムの探索（solveStepsRandom, TODO-057）` グループの直後、
`src/data — 全解のデータ` グループの手前に新しい節
`src/logic.js — 解の無い盤面での打ち切り（solveStepsRandom, DEMO.randomDeadLimit, TODO-081）` を足した。

- `canContinue = (board) => hasSolution(solutions, board)` を渡し、盤ごとに 3 つのシード
  （`FAST_SEED`・`OTHER_SEED`・`{ '8x8': 7, '6x10': 7 }`）で `solveStepsRandom` を最初の
  `solved` まで回す（8×8・6×10 の両方、計 2 件）。
- 手元で「直前の盤面が ok 偽のまま続けて置いた place の数」（`deadRun`）を数え、remove で
  ok が真になったら 0 に戻す。`deadRun` が一度も `DEMO.randomDeadLimit`（8）を超えないことを確かめる。
- `deadRun` が上限に達した直後は、ok になるまで（`remove` が続き、途中に `place` を挟まない）ことを、
  同じ走査の中で `awaitingOk` フラグで確かめる。
- 選んだシードのどれかで実際に上限に達する場面（`sawLimitHit`）と、最初の解に至ること（`solved`）も
  それぞれ assert する（見直しが要る書き方をしたときに気づけるように）。

## 実行結果

http://localhost:8765/tests.html（Playwright、`python3 -m http.server 8765`）で実行。

- 全体: **405 件中 403 件が通り、2 件が失敗**。
- 足した 2 件（8×8・6×10）は**両方とも通った**。
- 失敗した 2 件は、足したテストとは別の既存テスト
  `置ける手が尽きて 1 手ずつ外す並び（remove の連なり）は、最後の 1 手だけが ok:true か盤が空になっており、
  途中の remove は ok:false（…常に偽, 8×8 / 6×10）`。
  メッセージは「選んだシード・手数で置き済みピースの形の空きによる即座の remove が一度も起きなかった」。

### 失敗 2 件についての見立て（直していない）

- `tests.html` を変更前（`git checkout -- tests.html`）に戻し、`src/logic.js` /
  `src/config.js` の TODO-081 の差分だけを残した状態で再実行しても、同じ 2 件が同じ理由で失敗する
  ことを確認した。**足したテストのせいではなく、`solveStepsRandom()` の実装変更（TODO-081）で
  既存テストが崩れている。**
- 原因の見立て: この既存テストは `FAST_SEED` で固定シードの手順のうち、6000 手以内に
  「置き済みピースと同じ形の 5 マスの空き」が偶然現れる場面に依存している。TODO-081 で
  行き詰まり時に `undoUntilOk()` / `maybeCollapse()` が呼ばれるタイミング・頻度が変わり、
  同じシードでも手順の並びが変わるため、6000 手以内にその場面が出なくなったと見られる
  （`randomDeadLimit` を 1000 に上げて実測したところ、この 2 件はむしろ通り、代わりに
  今回足した 2 件が失敗した。実装の挙動が seed 依存の手順へ与える影響の大きさが伺える）。
- **境界線上の判断や直しは行っていない。** 直すかどうかは呼び出し側の判断。

## 壊すと落ちることの確認

`src/config.js` の `randomDeadLimit` を一時的に `8` → `1000` に変更して再実行。

- 足した 2 件（8×8・6×10）は**両方とも落ちた**（メッセージ:
  「選んだシードのどれでも、DEMO.randomDeadLimit に達する場面が一度も無かった（見直すこと）」）。
  1000 という上限には、選んだシード・STEP_LIMIT の範囲では実際に到達しなかったため。
- 確認後、`randomDeadLimit` を `8` に戻し、`git diff src/config.js` で
  `randomDeadLimit: 8,` の追加以外の差分が無いことを確認した。

## 変更したファイル

- `tests.html`（この担当が変更してよい唯一のファイル）
- `src/config.js` / `src/logic.js` は一切変更していない（壊す確認の一時変更は確認後に元へ戻し、diff で確認済み）

## 続き（reviewer 報告「検討 1」への対応）

`archives/agents/TODO-081/reviewer-report.md` の「検討 1」（上限で戻ったのも詰まりに数えることを
確かめるテストが無い）と「作り込みすぎ」の 1・2 つ目を受けて対応した。実装（`src/`）は変えていない
（main が直した「空の盤まで戻ったら deadMoves を 0 に戻す」は反映済みの状態から作業した）。

### 1. 「作り込みすぎ」の 1・2 つ目

- 前回足したテストで、読まれていなかった `board`（作って更新するだけで、どのアサーションも
  読んでいなかった）を丸ごと消した。
- ループの外で `boardOk`・`deadRun`・`awaitingOk`・`solved`・`taken` を宣言してからシードのループの
  頭で入れ直していたのを、ループの中の `let` 宣言 1 回にまとめた。外に残したのは `sawLimitHit` だけ。
- 3 つ目（`tests.html:1471-1481` の常に偽のときの try/finally）は指示どおり残した
  （検討 2 は main の直しで解消済みだが、`Infinity` にする try/finally 自体は今回触っていない）。

### 2. 上限で戻ったのも「詰まり」に数えることを確かめるテスト

新しいテスト `DEMO.randomDeadLimit で戻った一続きも、TODO-063 の崩し（maybeCollapse）に数える`
（8×8・6×10）を、前回のテストと同じ節に足した。

- `canContinue` に `hasSolution` を渡し、`DEMO.randomDeadLimit` を 1、`DEMO.randomCollapseAfter` を 1、
  `DEMO.randomCollapseMoves` を 2 に一時的に下げて（`try/finally` で戻す）走らせる。上限がすぐ効き、
  崩しの閾値もすぐ超えるようにするため。
- 手元で「上限に達した瞬間の深さ」（`triggerDepth`）と、そのあと最初に `ok:true` になった深さ
  （`settleDepth`）を追い、`settleDepth` が決まった直後の `Math.min(DEMO.randomCollapseMoves, settleDepth)`
  手ぶんは、必ず `remove` が続くこと（途中で `place`／`solved` が来たら崩しが起きなかったと判定して
  即座に落とす）を確かめる。

**最初に書いた版は、このガードが緩く、上限に達した直後だけでなく走査全体のどこかで
`remove` が 2 回続けば通ってしまうバグがあった。** `src/logic.js` の上限の分岐から
`yield* maybeCollapse();` を消して確かめたところ、最初の版は 407 件すべて通ってしまい
（検知できていなかった）、「直後」の判定を `pendingExtra` を使って厳密にした版に書き直した
うえで、消すと確かに 2 件（8×8・6×10）落ちることを確認した。

## 壊すと落ちることの再確認（今回の分）

`src/logic.js` の上限の分岐（`if (deadMoves >= DEMO.randomDeadLimit) { yield* undoUntilOk(); yield* maybeCollapse(); }`）
から `yield* maybeCollapse();` を一時的に消して再実行:

- 新しく足した崩しのテスト 2 件（8×8・6×10）が、メッセージ
  「上限で戻って ok:true になった直後、崩し（TODO-063）の途中のはずなのに remove 以外が出た」で**両方とも落ちた**
  （他は 405 件通過）。
- 確認後、`src/logic.js` を元に戻し、`git diff src/logic.js` が main の直し（空の盤で deadMoves を
  0 に戻す）だけを含み、それ以外の差分が無いことを確認した。

## 全件の結果（今回）

http://localhost:8765/tests.html で実行。**407 件すべて通った**（前回の 405 件 + 今回足した 1 件 × 2 盤）。
main の直し（空の盤で deadMoves を 0 に戻す）により、前回失敗していた既存テスト 2 件
（「置ける手が尽きて 1 手ずつ外す並び…常に偽」）も通るようになった。
