# TODO-065 reviewer-report

対象: `git diff`（未コミット。`docs/UsersGuide.md`・`src/config.js`・`src/logic.js`・
`src/scenes/demo.js`・`tests.html`）。

## 要修正

### 1. 回している間に `update()` が次の `advance()` を呼ぶ（実測で起きた）

- 場所: `src/scenes/demo.js:120-132`（`update()`）、`:175-181`（`advance()` から `playTurns()` へ入るところ）
- 問題: `update()` は `advance()` の直前に `this.waited = 0` にするだけで、回している間も
  `this.waitScale` は**前の手の値**のまま。回す時間（1〜3 段 × 150ms = 150〜450ms）が
  `intervalMs × 前の waitScale` を超えると、回し終わる前に次の `advance()` が走る。
  `advance()` は冒頭で `this.peeked = null` にしており、先読みは回している手の
  `finishStep()` でしか入らないので、2 回目の `advance()` は `this.steps.next()` で
  **次の手を先に引いて仕上げてしまう**。そのあと 1 回目の手の `finishStep()` が走り、
  さらに 1 手先読みする。絵の順（置く・外す）と探索の順が入れ替わる。
  - 例: 回している A の間に「A を外す」が先に仕上がり、その後 A が盤に置かれて残る
    （実害の画面は未確認。順が入れ替わること自体は下の実測で確認）
  - 解の直前なら、最後のピースがトレイで回っている間に `onSolved()` が走る（未確認）
  - 2 回目も回す手なら `this.turning`・`this.turnTimer` が上書きされ、1 回目の
    delayedCall の鎖は `cancelTurn()` から止められなくなる。`startSearch()` のあとに
    古い鎖が `finishStep()` を呼ぶと、新しい generator から先読みする（未確認）
- 根拠（実測。Playwright・headless Chromium・8×8・ランダム、`advance`/`playTurns` を包んで
  `this.turning` が残っている間の `advance()` 呼び出しと、`turnTimer` が残ったままの
  `playTurns(…, 0, …)` を数えた。各 20 秒）:
  - 速い: 回した手 20 回中、回している間の `advance()` が **2 回**（そのときの
    `waitScale` は 1（`startSearch()` 直後）と 2.11（外したあと））。`peeked` はどちらも null
  - ゆっくり: 回した手 12 回中、回している間の `advance()` が **1 回**、
    `turnTimer` の上書きが **1 回**。`pageerror` は 0
  - 実装担当の報告の実測は `finishStep()` の段数を数えただけで、ここは測っていない
- どうすればよい: 回している間は `update()` で進めない。例えば `update()` の先頭を
  `if (this.state === 'loading' || this.turning) return;` にする。こうすると回している
  間は `this.waited` が 0 のまま止まるので、下の「作り込みすぎ」1 の `extraScale` も要らなくなる

### 2. テストが「最短でない道」を返す壊し方で落ちない

- 場所: `tests.html:359-397`
- 問題: F の 3 つの目標（1 回転・裏返し・裏返し＋回転 2 回）しか見ていないので、
  最短でない道を返す実装でも通る。途中の段の形も見ていない
- 根拠（Node で `src/` を写し、`orientationSteps()` だけを差し替えて 5 件のテストを流した）:

  | 壊し方 | 5 件のテスト | 全ピース・全向きの組（405 組）で長さが食い違う組 |
  |---|---|---|
  | 元のまま | 通る | 0 |
  | 幅優先を深さ優先に（`queue.shift()` → `queue.pop()`） | **通る** | 80 |
  | 回転だけで探し、無ければ裏返してから回転 | **通る** | 56 |
  | 段の種類は正しいまま、全段の `cells` を最後の形にする | **通る** | 途中の段 540 件が不正 |
  | 回転 4 回→裏返し→回転の素朴な巡り | 落ちる（段数 5・7） | — |

  上の 2 つは「回転→裏返し」（`flip(rotateCw(start))`、最短 2 段）で 4 段を返す。
- どうすればよい: 次のどちらか（両方でも）を足すと、上の 3 つの壊し方はすべて落ちる（実測）
  - 全ピースの全向きの組で、段数が 3 以下、各段が前の段の `rotateCw` か `flip`
    （`kind` と合う）、最後が目標、を確かめる（元の実装: 最大 3・不正 0。壊し方 1・2 は最大 4、3 は不正 540）
  - `flip(rotateCw(start))` を目標にした 2 段のテスト（元 2 段、壊し方 1・2 は 4 段）

## 検討

### 3. 回転が右回りだけなので、3 段の手が多い（実害は未確認）

- 場所: `src/logic.js:131-133`（JSDoc）、`:137`
- 問題: 全 405 組の段数は 0: 63・1: 114・2: 144・**3: 84**。右回り 3 回（左 90° 1 回で済む向き）も
  3 段になる。`TODO.md` の項目は「1〜2 回まわしたり裏返したり」。JSDoc の理由「`turnPiece()` と
  同じくタップは常に先へ進むだけ」は本編のタップの話で、デモは手で回すわけではない
- 左回りを足すかは見た目の判断なので、利用者に見てもらう事柄。境界線上なので報告だけ

### 4. `docs/developer.md` の「探し方」の行に回す動きが無い

- 場所: `docs/developer.md:237`
- 問題: ランダムの動きを TODO-061〜063 まで細かく書いてある行に、TODO-065 が足されていない。
  `docs/UsersGuide.md` だけ直っている。同じ仕様を 2 か所に持つ文書の片方だけ（検討）

## 作り込みすぎ

- `demo.js:230, 266-269`: yagni: `turnCount` 引数と `extraScale`（回した時間を倍率へ直して足す）。
  要修正 1 の直し方（回している間は `update()` を止める）なら `this.waited` が 0 のまま残るので不要。
  `finishStep(value, animate, piece)` に戻せる。-4 行（重大度: 検討。要修正 1 の直し方次第）
- `demo.js:190, 196, 200`: shrink: `playTurns()` の `animate` 引数と `this.turning.animate`。
  `playTurns()` は `animate` が真のときしか呼ばれないので常に `true`。`finishStep(value, true, piece)` で足りる（好みの範囲）
- `demo.js:95-96, 196-219`: shrink: `this.turning` と `this.turnTimer` の 2 つ。1 つの
  `{ piece, value, timer }` にまとめれば `cancelTurn()` の null 代入が減る（好みの範囲）

net: -6 lines possible.

## 問題の無かった観点

- `cancelTurn()` と `startSearch()`: 仕上げた手のピースは続くループでトレイへ戻り
  （`settlePiece(piece, false)` が `killTweensOf()` で Tween も止める）、古い generator を
  1 手先読みするが `this.peeked = null` で捨てられる。要修正 1 が起きていなければ問題なし
- 解が見えて止まっているとき: `onSolved()` へ行く手は回さないので `turning` は残らない
- タイトルへ戻るとき: `scene.time` はシーンの停止で止まり、`create()` で `turning` を null に戻す
- `orientationSteps()` の最短性: 幅優先で、全 405 組で最大 3 段（D4 の右回り・裏返しでの最大と一致）。
  同じ段数の候補は回転を先に試す順で決まる。X は最初の `sameShape` で空を返す。裏返しは `flip()`（左右反転）で本編と同じ
- 外す手の連なり（TODO-060）: `skipWait` は `remove` の手だけで、`remove` は回さない（`turnCount` 0）ので壊していない
- 規約: `setTimeout` 無し（`scene.time.delayedCall`）、値は `DEMO.randomTurnStepMs`、状態はシーンのプロパティ、
  `GameScene`（`game.js`）は変更無し、`logic.js` に Phaser・DOM は持ち込んでいない
- JSDoc は「なぜ」を書いている。範囲外の変更は無い
