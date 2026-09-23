# TODO-052 reviewer 報告

対象: 未コミットの `git diff`（README.md / docs/developer.md / src/config.js / src/scenes/demo.js）。
根拠はすべてコードの読み合わせ。ブラウザでの実測はしていない（verifier の担当）。

## 要修正

なし。

## 検討

- `src/scenes/demo.js:273` / `resume()` の JSDoc が「何をするか」だけになっている。
  CLAUDE.md の「JSDoc には『なぜそうするのか』を書く」に照らすと、`done` のときだけ
  `startSearch()` に回す理由（generator を出し切っていて続きが無いこと）を書く形が
  規約に沿う。実害は無い。

## 好みの範囲

- `README.md:63,65` / 待ち時間を「10 秒」と数で書いている。`DEMO.pauseMs` を変えると
  README だけ古くなる。`docs/developer.md:101` は `DEMO.pauseMs` を添えているので
  そちらは追える。利用者向けの文書なので数で書くのは自然でもあり、判断は任せる。

## 確かめたこと（問題なし。1 行ずつ）

- 状態の移り方: `running` で `update()` が `waited = 0` にしてから `advance()` を呼び、
  その中で `onSolved()` / `finish()` が `solved` / `done` にする。したがって止まる時間は
  解を見つけた（出し切った）フレームから数え始まり、次のフレーム以降に `delta` を足して
  `DEMO.pauseMs` 以上で `resume()`。止まる時間は約 `pauseMs`（+1 フレーム以内）。
- `solved` → `resume()` → `running`（`waited = 0`、メッセージを消し、HUD 更新）。
  再開後の最初の 1 手は速さの `intervalMs` を待ってから。以前の「次の解を探す」と同じ。
- `done` → `resume()` → `startSearch()`（ピースをトレイへ戻し、新しい generator、
  `tried` / `solvedCount` を 0、`waited = 0`）。仕様「見つけた解の数も 0 に戻る」と一致。
- `loading` 中は `update()` が先頭で返るので `waited` は増えない。以前と同じ。
- 止まっている間の速さの切り替え: `selectSpeed()` は `running` のときだけ `waited` を
  0 にするので、押しても待ち時間は延びない。コメントも理由を書いている。
- 止まっている間の探し方の切り替え: `toggleStrategy()` → `startSearch()` で `running`・
  `waited = 0`。待ち時間は打ち切られ、空の盤から探し直す。以前と同じ挙動。
- 止まっている間の「次の解を探す」: `solved` ならすぐ `resume()`。`done` ではボタンが
  無効（`refreshHud()` の `setEnabled(state === 'solved')`）で、`searchNext()` も先頭で
  返る。`resume()` の `done` の枝に入るのは `update()` からだけ。docs/developer.md の
  「解を見つけて止まっているときだけ押せる」と一致。
- タイトルへ: `goToTitle()`（game.js:1127）は即 `scene.start('Title')` でフェード等が
  無いので、止まった後に `update()` が `resume()` を呼ぶことは無い。入り直すと
  `create()` が `state = 'loading'`・`waited = 0` に戻す。
- 規約: `setTimeout` / `setInterval` / `delayedCall` は使っていない（TODO.md の
  「`waited` に合わせる」に沿う）。数値 10000 は `config.js` の `DEMO.pauseMs`。
  `config.js` と `selectSpeed()` のコメントは理由を書いている。
- README / docs/developer.md の記述はコードの挙動と一致（「次の解を探す」を押すと
  待たずに再開、出し切ったら 10 秒後に空の盤から、タイトルへ押すまで止まらない）。
  docs の「見つけた解は解けて止まった回数」も今のコードで成り立つ。
- 範囲: 指示に無い変更は無い。`git diff --check` は問題なし。
- テスト: 変わったのはシーンだけで、`tests.html` が扱う `logic.js` / `solutions.js` は
  変わっていない。確認は verifier の Playwright の実測に任せる形で足りる。

## 作り込みすぎ

作り込みすぎ: なし（`resume()` は `searchNext()` と `update()` の 2 か所から呼ばれ、
共通化として妥当。新しい状態も足していない）。
