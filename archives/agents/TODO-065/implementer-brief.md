# TODO-065 implementer への依頼

## 目的

デモのランダムで、ピースを置く前に、トレイでの向きから置く向きまで回したり裏返したりして見せてから盤へ滑らせる。
今は最終の向きのまま滑らせている。人は手に取って向きを合わせてから置くので、その動きを見せる。背景は `TODO.md` の TODO-065 の節。

## 利用者が決めたこと

- 回し方は **最短**: 今の向きから置く向きまで、右回転・左回転・裏返しの最少の回数で見せる（最大で裏返し 1 回＋回転 2 回）。同じ向きなら回さない
- 回す時間は **待ち時間に足す**: 回した分だけ次の手を遅らせる（速いでも見える）
- 最速（`animate: false`）では回さない。深さ優先は今のまま（回さない）

## やること

1. `src/logic.js` に純関数（例 `orientationSteps(from, to)`）: `from` から `to`（どちらも正規形の cells）までの最短の途中の向きの並び
   （`from` は含まず `to` を含む。同じなら空）と、各段が回転か裏返しかを返す。`rotateCw`・`flip`・`normalize`・`sameShape` を使う。
   `tests.html` に小さなテストを足す（同じ向きで空、1 回転、裏返しだけ、裏返し＋回転 2 回、X）
2. `src/config.js` の `DEMO` に 1 段の時間（例 `randomTurnStepMs`、仮の値 150）。JSDoc に説明（値は仮で画面で見て決める、TODO-065）
3. `src/scenes/demo.js` の `advance()`: ランダム・`animate` の place で、ピースのトレイでの今の向き（`piece.cells`）から `value.cells` まで
   1 段ずつ、トレイの位置で向きを変えて見せ（本編のタップと同じく `refreshPiece()` で描き直し、`audio.rotate()`／`audio.flip()` を鳴らす）、
   最後に今までどおり盤へ滑らせる。段の間隔は `scene.time.delayedCall()`（`setTimeout` は使わない。規約）。
   待ち時間に「段数 × 1 段の時間」を足す（`waitScale` と `intervalMs` の関係を読んで、足し方を決める）
4. 回している途中に、速さ・探し方の切り替え、次の解へ、タイトルへ戻る、が押されても、前の回転の予約が残らないようにする
   （予約を控えて止める。シーンの切り替えで止まる `scene.time` を使っていれば、シーン内の切り替えだけ気をつければよい）
5. `docs/UsersGuide.md` のランダムの説明に 1 文足す

## 保つもの

- 探索（`solveStepsRandom()`）の手順は変えない。`pickWaitScale()` の揺らぎ・外す手の連なりを待たずに戻す作り（TODO-060）は変えない
- `GameScene` の本編の動きは変えない（`demo.js` は継承しているので、本編のメソッドを書き換えない）
- 規約（`CLAUDE.md`）: `setTimeout` を使わない、数値は `config.js`、状態はシーンのプロパティ

## 完了条件

- `node tools/gen-solutions.mjs --check` が通る（2 分以上かかる。バックグラウンドでよい）
- `tests.html` を Playwright の新しいコンテキストで（`python3 -m http.server 8765` 経由）開き、全件の件数を報告
- デモをランダム・ゆっくりで数十手動かしてコンソールエラーが 0 件か。回した段数の分布（0〜3）を `evaluate` で集めて報告

## 報告

`archives/agents/TODO-065/implementer-report.md`。返事は 5 行以内。
