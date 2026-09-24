# TODO-059 verifier 報告

対象: 今の作業ツリーの差分（`git diff`）。`python3 -m http.server 8765` を立て、
Playwright（Playwright MCP のツールが無かったので `tools/capture.mjs` と同じやり方で、
`~/.npm/_npx/*/node_modules/playwright` を `PLAYWRIGHT=` で渡して `node` から使った）で、
headless Chromium・画面 1280×720 で確かめた。スクリプトはリポジトリに残していない
（scratchpad のみ）。コードは直していない。

## 1. `tests.html` 全件

`316 件すべて通った`（`#summary` の文字列と `class="pass"`）。コンソールエラー無し。

## 2. デモ・ランダム・最速で最初の解まで

`window.game.scene.start('Demo')` → `toggleStrategy()` で `random` → `selectSpeed('fastest')`。
`state === 'solved'` まで 109.9 秒（3 分以内）、`tried` は 634。コンソールエラー無し。
途中経過（30 秒時点）: `strategy: 'random', speed: 'fastest', tried: 174` で `running` のまま
進んでいたので、止まっていたわけではない。

## 3. 待ち時間（食い違いあり。詳しく書く）

`steps.next()`（`advance()` の中で呼ばれるところ）を包み、呼ばれた時刻・`type`・`ok` を記録。

### 3a. `pickWaitScale()` 単体（`s.pickWaitScale('place'|'remove')` を各 2000 回直接呼ぶ）

設計どおり一致した。

| 種類 | 平均倍率 | 範囲 | 平均 ms（`intervalMs: 200` 換算） |
|---|---|---|---|
| place | 0.993 | 0.500〜1.500 | 198.6ms（狙い 200ms・100〜300ms） |
| remove | 1.978 | 1.000〜3.000 | 395.7ms（狙い 400ms 前後） |

### 3b. 実際の画面での間隔（ランダム・速い 200ms、60 手ぶん）

**狙いの範囲に収まらず、place と remove の平均がほぼ同じになった。**

| | 平均 | 最小 | 最大 |
|---|---|---|---|
| place のあと | 440.2ms | 167.0ms | 1591.4ms |
| remove のあと | 445.9ms | 249.8ms | 622.7ms |

狙いは place 平均 200ms（100〜300ms）・remove 平均 400ms 前後。実測は両方とも
440ms 台で、remove が place の約 2 倍になっていない。

### 3c. 深さ優先・速い（20 手ぶん。狙いは「ほぼ一定・200ms 前後」）

**一定にならなかった。**平均 569.0ms、最小 242.6ms、最大 1159.6ms。

### 3b・3c の食い違いの原因（推定。境界線上の判断はしていない）

`requestAnimationFrame` の間隔を、デモを起動する前と起動して動かしている間とで
比べた。

- デモを開く前（アイドル）: 平均 20.6ms/フレーム（min 16.6・max 33.4）
- デモを動かしている間（ランダム・速い）: 平均 86.0ms/フレーム（min 33.3・max 116.7）

デモが動いている間はフレーム自体が実時間で 4 倍前後遅くなっており（この
headless Chromium での描画・Tween・音の処理の重さと見られる。推定、実害の
切り分けはしていない）、これが `update()` の `delta` 加算のもとになる実時間を
押し上げていると考えられる。3a で `pickWaitScale()` 自体は設計どおりの値を
返しているので、**倍率を引く計算（レビュー後に直した箇所）は正しい**。
3b・3c の食い違いは、この headless 環境でのフレーム間隔の重さが乗った結果である
可能性が高いが、断定はできない（境界線上の判断は報告だけにとどめる）。

## 4. 解なしの手のあと、同じ盤面のまま次の place が続く例

3b で記録した最初の 2 件がそのまま例になる。

```
{"t":2950.0,   "type":"place", "ok":false}
{"t":4068.4,   "type":"place", "ok":false}
```

`ok:false`（解なし）の `place` の直後が `remove` ではなく次の `place` になっている
（このあと `place` が 9 回続き、10 件目でようやく `remove` が始まる）。仕様どおり、
解なしの手をすぐには外していない。

## 変更ファイルの範囲

`git status` は `TODO.md` / `docs/UsersGuide.md` / `docs/developer.md` /
`src/config.js` / `src/logic.js` / `src/scenes/demo.js` / `tests.html` の変更と、
`archives/agents/TODO-059/`（未追跡）のみ。reviewer 報告に載っている範囲と一致し、
指示に無いファイルの変更は無い。`src/logic.js`・`src/scenes/demo.js` は
reviewer 指摘（要修正 1・作り込みすぎ 2）に対応する差分が入っている
（`pickWaitScale()` を 1 手に 1 回だけ呼ぶ形、`weight` を選んだピースの
置き方だけに絞る形）。

## 確かめられなかったこと・判断できないこと

- 3b・3c の食い違いの根本原因（headless の描画・Tween・音の重さかどうか）は
  推定にとどまる。実ブラウザ（headless でない）や、別のマシンで測れば
  狙いの範囲に収まる可能性はあるが、確かめていない
- remove の平均が place とほぼ同じになった理由（2 倍のはずが 2 倍になっていない）
  について、フレーム間隔の重さだけで説明がつくかは計算していない（境界線上の
  判断は避けた）
- 3b・3c が「実害があるか」（利用者の目に、間隔の違いとして分かるかどうか）は
  見なくてよいこと（値の良し悪しは利用者が決める）に含まれると考え、踏み込んでいない
