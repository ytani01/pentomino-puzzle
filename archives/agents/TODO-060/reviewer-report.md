# TODO-060 reviewer report

対象: `git diff`（未コミット）の `src/logic.js`・`src/scenes/demo.js`・`tests.html`・
`docs/UsersGuide.md`・`docs/developer.md`。画面の撮影・テストの再実行はしていない（依頼どおり）。

## 問題なし（1 行ずつ）

- `solveStepsRandom()` の `undoLast()` へのまとめ: pop → 盤から消す → `unused` に戻す → 外した後の盤面のキーで `failed` に足す → `ok` の順は元のままで、`ok` の意味・`if (ok) break`・`continue` の位置・`while (stack.length > 0)` による空スタックの扱いも変わっていない。
- 即座に外す手の控え: 外した後の盤面（＝置く前の盤面）のキーで `failed` に足しており、行き詰まって外すときと同じ。次の周回の `failedOf(boardKey(board))` で同じ手は選ばれない。スタックは直前に push した手があるので空にならない。
- 判定 `size < PIECE_SIZE` は TODO の「1〜4 マス」と一致。盤が埋まったとき（最後のピース）は空きが無いので外さない。
- `demo.js` の先読み: `startSearch()`（探し方の切り替え・解のあとの探し直し・次の解を探す・generator が尽きたとき）で `peeked = null` に戻すので古い手は使わない。`onSolved()` の前に `peeked = null` 済み。`done` の結果（`{ done: true }`）も `??` で落ちずに `startSearch()` へ進む。1 手飛ばしは無い。
- 最速: `intervalMs: 0` なので倍率が何でも 0 のまま。変わらない。
- 深さ優先: `remove` の前は `waitScale = 0`。連なりの最後の `remove` のあとは `pickWaitScale('remove')` = 1 で今までどおり。
- ランダム: 連なりの最後の `remove` のあと（次が `place`）は `pickWaitScale('remove')` で `randomRemoveMultiplier` が効く。連なりの途中は 0（依頼どおりの変更）。
- `setTimeout` 不使用、新しい数値・色は無い。
- 範囲: `TODO.md` の追記は利用者が足した項目の反映で、指示の範囲内。

## 要修正

### 1. `src/scenes/demo.js:184-186` — 外す直前の手（置いた手）が画面にほぼ出なくなる（利用者の意図の確認が要る）

- 何が問題か: 次が `remove` なら `waitScale = 0` にするので、`update()` は次のフレーム（約 16ms 後）で `remove` を処理する。`place` → `remove` の並び（深さ優先の「解なし」の手すべて、ランダムの小さな空きの手すべて）で、置いた手が 1 フレームしか出ない。
  「ゆっくり」「速い」では `settlePiece()` が 180ms の Tween で盤へ滑らせ始めた直後に、`remove` 側の `settlePiece()` が `killTweensOf()` で止めてトレイへ戻す（`src/scenes/game.js:823`）ので、ピースは盤に届かない。「解なし」の札も 1 フレームだけ、`drop`・`invalid`・`lift` の音もほぼ同時に鳴る。
- なぜ問題か:
  - `src/config.js:739-742` の `DEMO.speeds` の JSDoc が、まさにこれを避けるための設計として「**間隔を Tween より長くしてある**のは、枝刈りで捨てる手が『置いてすぐ外す』になり、短いと滑り切る前に次の Tween に止められるため」と書いている。今回の変更はこの設計と正面から食い違う（JSDoc も直されていない）。
  - TODO-060 の目的は「小さな穴に置いた瞬間に気づいて外す」様子を見せることで、置いた手が見えないとその様子が見えない。
  - `docs/UsersGuide.md:102-103`「どの速さでも 1 手ずつ進むので、置いては外す様子を目で追える」とも食い違う。
- 根拠: コード（`update()` の `waited < intervalMs * waitScale`、`advance()` の先読み、`settlePiece()` の `killTweensOf`）。実装担当の計測も「`remove` の直前の `waitScale` が 0」を確かめただけ。**画面での見え方は未確認**（撮影は依頼の範囲外）。
- 判断が要る点: 「外す手は待たずにすぐ動かす」が「置いた直後に待たずに外す」（今の実装）なのか、「外す手が続くときの間（`remove` → `remove`）を詰める」なのか。前者のままなら `config.js` の JSDoc と `UsersGuide.md:102-103` を直す必要がある。

## 検討

### 2. `tests.html:1167` — 既存テストの `sawRun` が、即座の `remove` でも立つようになった

- 何が問題か: 即座に外す分岐で `sawRun = true` にしている。末尾の `assert(sawRun, '… remove の連なりが一度も終わらなかった')` は、置ける手が尽きた連なりを実際に確かめたことを保証するためのものだが、即座の `remove`（8×8 で 1841 手中 1472 件と頻出。implementer-report）だけで満たせてしまう。
- なぜ問題か: シードや手数が変わって連なりが 1 度も出なくなっても、このテストは通る（テストが弱まった）。`tests-report.md` の書き換え理由（即座の `remove` は連なりとは別物）とも合わない。別物なら数えないのが筋。
- 根拠: 読んだコード。今のシードで連なりが出ているかは未確認（出ていれば今は実害なし）。

### 3. `src/scenes/demo.js:16-18`・`src/config.js:748-750` — 文書の取り残し

- ファイル先頭の JSDoc「ランダムは外さずに置き続け、置ける場所が無くなって初めて…戻す」に、小さな空きはすぐ外すことが無い。
- `randomRemoveMultiplier` の JSDoc「1 手外したあとの待ち時間に掛ける倍率」は、今は「外す手が続いた最後の 1 手のあと（次が置く手のとき）」にしか効かない。
- 根拠: 読んだコード（`advance()` の 184-186 行）。

### 4. `docs/UsersGuide.md:116-117` — 利用者向けの文書に TODO 番号が入った

- `UsersGuide.md` の中で `（TODO-060）` を書いているのはこの 2 か所だけ（`rg -n 'TODO-0' docs/UsersGuide.md` の結果）。他の節は番号を書いていない。`developer.md` 側の書き方に合わせる必要は無く、遊ぶ人向けの文書なので外すのが揃う。

### 5. `src/scenes/demo.js:124-125` — `pickWaitScale()` の JSDoc が実際と違う

- 「ここで引いた値を `advance()` が 0 で上書きする」とあるが、実際は三項演算子で `pickWaitScale()` を呼ばない（引かない）。実害は無いが、書いてあるとおりに読むと乱数を 1 回消費していると誤解する。先読みの説明は `advance()` 側（184 行のコメント）で足りている。

## 好みの範囲

- 無し（下の「作り込みすぎ」に回した）。

## 作り込みすぎ

- `tests.html:1338-1357`: delete（検討）: 新しいテスト「小さな閉じた空きができたら、次の手は同じ名前の remove」は、書き換えた既存テスト（1160-1166 行の分岐）が同じことを assert している。違いは「1 度は起きた」ことの確認だけなので、既存テスト側に `sawImmediate` を 1 つ足せば足りる。
- `tests.html:1359-1377`: delete（検討）: 新しいテスト「小さな空きが無いのに ok:false の場面で、次が remove でないことがある」は、既存の TODO-059 のテスト「ok:false の place の直後に、別の place が続くことがある」（1218 行〜）が既に含んでいる。今の実装では「ok:false の直後に place」が起きた時点で小さな空きは無いため、同じ場面を別の条件で数えているだけ。
- `src/logic.js:581-582・602-603`: shrink（好みの範囲）: `undoLast()` が `{ type: 'remove', name, ok }` を返せば、呼び出し側は `yield undoLast()` / `const step = undoLast(); yield step; if (step.ok) break;` になり、分割代入と詰め直しが消える。

net: -40 lines possible.

## テストの強さで未確認のもの

- 境界（5 マスの閉じた空きは即座に外さない）を固定するテストが無い。`size < PIECE_SIZE` を `size <= PIECE_SIZE` に変えたときに落ちるテストがあるかは未確認（`tests-report.md` の壊し方は `size < 0` だけ）。

## 再レビュー

対象: 直したあとの `git diff`、`implementer-report.md`・`tests-report.md` の追記部分。
利用者の決定（待たないのは `remove → remove` のときだけ、`place → remove` は今の間隔）に照らして見た。

### 前回の指摘

- 要修正 1（置いた手が画面に出ない）: 片付いた。`demo.js` の `skipWait = value.type === 'remove' && nextIsRemove` で、`place → remove` は `pickWaitScale('place')` の間隔で待つ。`config.js` の `DEMO.speeds` の JSDoc の設計とも合う。`UsersGuide.md:102-103` とも食い違わない。
- 検討 2（`sawRun` が即座の remove でも立つ）: 片付いた。`sawImmediate` に分け、両方を assert している。
- 検討 3（文書の取り残し）: 片付いた（`demo.js` 先頭の JSDoc、`randomRemoveMultiplier` の JSDoc）。
- 検討 4（UsersGuide の TODO 番号）: 片付いた。
- 検討 5（`pickWaitScale()` の JSDoc）: **残っている**（検討のまま）。`demo.js:127-128`「`advance()` がここで引いた値を 0 で上書きする」とあるが、三項演算子なので `skipWait` のときは `pickWaitScale()` を呼ばない（引かない）。実害は無い。
- 作り込みすぎ（重なっていたテスト 2 件、`undoLast()` の返し方）: 片付いた。
- 未確認だった境界（5 マスは即座に外さない）: 新しいテストで固定された。`tests-report.md` の追記で `size <= PIECE_SIZE` に壊すと 10 件落ちることが確かめてある。

### 直しで新しく出たもの

- 要修正: なし。
- 検討: なし。
- 新しいテスト「ピースと同じ 5 マスの閉じた空きは…」の控えの再現は、ロジックの「空の盤で全部だめなら控えを消す」を写していないが、テスト側の控えが多くなるだけなので、判定が甘くなる向き（場面を見逃す）にしか外れない。誤って落ちることは無い。問題なし。
- 深さ優先で `remove → remove` が実測で起きていない件（implementer-report の判断が要る点）: `solveSteps()` に渡す判定は `hasSolution` なので、解ける盤面の子には必ず解ける手があり、何段も続けて戻るのはまれ（コードから読んだもの、未確認）。条件式は探し方によらず同じなので、ランダムの 51 件の実測で足りる。

### 作り込みすぎ（再）

- `tests.html`（新しいテスト内の `taken` のループ）: shrink（好みの範囲）: `randomSteps(spec, mulberry32(FAST_SEED[spec.key]), regionsFitPieces, STEPS)` と同じ。既にある関数で 1 行になる。

net: -5 lines possible.
