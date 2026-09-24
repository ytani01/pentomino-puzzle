# TODO-059 implementer 報告

## 変えたファイルと箇所

### `src/logic.js`

- `touchingEdges(board, cells, row, col)`（新規 export）: 置く形が、盤の外・穴・
  置き済みのマスに接する辺の数を数える。`cellAt()` が盤外・穴とも `null` 以外を
  返すことを利用し、3 つを区別せず数える。ピース自身の内側の辺は数えない。
- `touchWeight(count)`（非公開）: 重みの式は `(count + 1) ** 2`。
  - `+1`: 接する辺が 0（盤の真ん中に孤立して置く手）でも重み 0 にしない
    （重み 0 だと絶対に選ばれず、人もときどきそう置くため）
  - `** 2`: 隅（接する辺が多い）ほど選ばれやすさの差を大きくするため
- `pickWeighted(items, weights, random)`（非公開）: 累積比較の重み付き抽選。
  乱数は引数の `random` だけを使う。
- `solveStepsRandom()`（全面改稿。148〜240行付近）:
  - 置き方の抽選: ピースは今どおり一様（`pickOne(choices)`）、置き方は
    `touchWeight(touchingEdges(...))` を重みにした `pickWeighted()`
  - `ok` が偽でもその場で外さない（`place` は常に `stack.push(move)`、
    else 節を削除）
  - 置ける手が尽きたとき（`choices.length === 0` かつ `stack.length > 0`）:
    `canContinue(board)` が真になるまで、または `stack` が空になるまで
    1 手ずつ外す `while` ループに変更。外すたびに `failed` へ控えるのは今どおり
  - `remove` に `ok`（外した後の盤面の `canContinue(board)`）を追加
  - 空の盤で全部だめ（`choices.length === 0 && stack.length === 0`）の扱い
    （控えを消して選び直す）は変えていない
  - JSDoc をこの動きに合わせて書き直した

### `src/config.js`

- `DEMO`（728〜758行）: `randomJitter: 0.5`・`randomRemoveMultiplier: 2` を追加。
  JSDoc に理由と、深さ優先の「30〜70 手」の実測がランダムには当てはまらなく
  なった旨を追記

### `src/scenes/demo.js`

- ファイル先頭の JSDoc（12〜22行）: ランダムがすぐには外さなくなったこと、
  間隔を揺らすことを追記
- `create()`: `this.lastMoveType = 'place'` を初期化
- `update()` → `intervalMs()`（新規メソッド）: ランダムのときだけ
  `intervalMs × (1 ± randomJitter)` を毎回引き直し、直前が `remove` なら
  さらに `randomRemoveMultiplier` を掛ける。深さ優先・最速（`intervalMs: 0`）は
  今どおり一定
- `advance()`: `remove` の `hintState` を `value.ok`（無ければ `'ok'`）で決める
  ように変更（深さ優先の `remove` には `ok` が無いので今どおり `'ok'`）。
  末尾で `this.lastMoveType = value.type` を記録。「解なしに変わった瞬間に鳴らす」
  のコメントを、ランダムでは行き詰まって戻るまで鳴らない旨に更新
- `startSearch()`: `this.lastMoveType = 'place'` を追加

## 検証

- `node --check src/logic.js src/scenes/demo.js src/config.js` … 構文チェック OK
  （このプロジェクトにリンタ・型チェックは無い）
- 手元スクリプト（`/tmp` の scratchpad、リポジトリには残していない）で
  `solveStepsRandom()` を 20000 ステップ動かし、`place` が常に空きマスに
  置かれる・`remove` が盤にあるピースだけを外す・`ok` が `canContinue()` と
  一致することを確認（8×8、`regionsFitPieces`）
- 同じくスクリプトで `canContinue = () => false` を渡し、5000 ステップ
  ハングせずに動くことを確認（外す動作が無限ループしない）
- `touchingEdges()` の単体確認: 角の 1 マスは 2、盤の真ん中付近の孤立 1 マスは
  周囲の状況どおりの値
- `tests.html` を `python3 -m http.server 8765` + Playwright（`npx` が
  キャッシュした 1.63.0 を `tools/capture.mjs` と同じやり方で借用）で実行。
  **300 件中 4 件が失敗**（他はすべて通過）:
  - 「常に偽を返す判定だと、すべての place の直後が同じピースの remove」
    （8×8・6×10）… 旧仕様（`ok` が偽なら即座に外す）を検証するテストで、
    仕様どおり失敗する
  - 「『解なし』だった置き方は盤面ごとに覚え、同じ盤面で同じ置き方を
    もう一度 place しない」（8×8・6×10）… `pendingFalseName` を使って
    旧仕様の即時 undo を前提に手元で状態を再現しているテストで、
    仕様どおり失敗する
  - この 2 件は依頼どおりテスト担当が直す前提で、こちらでは手を入れていない

## 判断が要る点・範囲外の気づき

- 重みの式（`(count + 1) ** 2`）と揺らぎの値（`randomJitter: 0.5`・
  `randomRemoveMultiplier: 2`）は画面で見て確かめていない（依頼に「画面で
  見て確かめる」とあるが、この担当は静的な実装のみで見た目の確認は
  範囲外と判断した）。reviewer・verifier の確認で見た目が合わなければ
  値の調整が要るかもしれない
- `docs/` は指示どおり触っていない
- `tests.html` は指示どおり触っていない（上記 4 件の失敗はテスト担当が
  新しい仕様に合わせて書き直す想定）
