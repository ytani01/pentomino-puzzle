# TODO-059 tests への依頼

`solveStepsRandom()`（`src/logic.js`）の動きが変わった。実装の報告は
`archives/agents/TODO-059/implementer-report.md`、差分は `git diff src/logic.js`。
`tests.html` の「ランダムの探索（solveStepsRandom, TODO-057）」の group を新しい動きに
合わせる。`src/` は触らない。

## 新しい動き（要点）

- 置き方は `touchingEdges()`（新規 export）の数で重みを付けて抽選する
- 置いた直後に `canContinue` が偽でも外さない（`ok: false` の place のあと、次も place がありうる）
- 置ける手が尽きたら、`canContinue` が真になるか盤が空になるまで 1 手ずつ外す。
  外した手は、外した後の盤面の控えに入り、その盤面では二度と place されない
- `remove` にも `ok`（外した後の盤面での `canContinue`）が付く

## やること

1. 今落ちている 4 件（「常に偽…直後が同じピースの remove」「解なしだった置き方は
   盤面ごとに覚え…」の 8×8・6×10）を新しい動きに合わせて書き直す
   - 控えのテストは「remove した手は、外した後の盤面で二度と place されない」を再現して確かめる
2. 足すテスト
   - `touchingEdges()` の値（8×8 と 6×10 の空の盤の角に置いた形、真ん中で何にも
     接しない形は 0、置き済みのピースの隣。期待値は手で数えて書く）
   - `remove` の ok が、外した後の盤面の `canContinue` と一致する
   - 続けて出る remove の並び（place を挟まない remove の連なり）は、最後の 1 手だけが
     ok:true か、連なりのあと盤が空。途中の remove は ok:false（既定の判定と常に偽の両方）
   - ok:false の place のあとに place が続くことがある（即座に外さないこと）
   - 重み付け: 多くのシード（数は判定に要る最小限で選ぶ）で最初の place の
     `touchingEdges()` の平均が、そのピースの全置き方の一様平均より大きい
3. **壊すと落ちるかを確かめる**（`src/logic.js` を一時的に書き換え、確かめたら必ず元に戻す。
   最後に `git diff src/logic.js` が実装の差分のままであることを確かめる）
   - `touchWeight` が常に 1 を返す → 重み付けのテストが落ちる
   - place の直後に ok:false なら即座に外す（旧の動き）→ 即座に外さないテストが落ちる
   - 戻りのループで `if (ok) break;` を消す → 連なりのテストが落ちる
4. ブラウザで全件通るまで見る（`python3 -m http.server 8765` と Playwright MCP）

## 報告

`archives/agents/TODO-059/tests-report.md` に、書き直した・足したテスト名、
全件の件数と結果、壊したときにどれが落ちたかを書く。返事は 5 行以内。
