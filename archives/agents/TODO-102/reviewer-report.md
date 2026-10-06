# TODO-102 reviewer 報告

対象: 未コミットの `git diff`（`src/config.js`、`src/scenes/demo.js`、`docs/UsersGuide.md`、
`docs/developer.md`、`TODO.md`）。画面のレイアウトと待ち時間の値の良し悪しは見ていない。

## 要修正

### 1. `docs/images/demo.png` が古いまま（`docs/UsersGuide.md:181` と食い違う）

- 何が: UsersGuide は「試した手数と見つけた解の数、今の探し方を画面に出す（Ⓐ）」に
  変わったが、その上に載せている `images/demo.png`（`docs/UsersGuide.md:166`）は
  1 段目に「探し方」が無い HUD のまま。注記の文言も `tools/capture.mjs:271` が
  `text: '試した手・見つけた解'` のままで、撮り直しても Ⓐ のラベルが本文と合わない。
- 根拠: `git log -- docs/images/demo.png` を見ると、デモの HUD やボタンの見た目を変えた
  項目（TODO-057・070・075・076・078・094）は同じコミットで撮り直している。
  CLAUDE.md の「`docs/images/` は `tools/capture.mjs` で撮り直す」。
  TODO.md のチェックリストにも撮り直しが入っていない。

## 検討

### 2. `docs/UsersGuide.md:211` 「ゆっくりで 0.2〜2 秒」は置く手だけの値

- 何が: 「1 手の間隔も揺れる（ゆっくりで 0.2〜2 秒…）」とあるが、外す手のあと
  （次が置く手のとき）は `randomRemoveMultiplier` で 2 倍、0.4〜4 秒になる
  （`src/scenes/demo.js:211`）。「1 手」と書くと外す手も含むように読める。
- 根拠: コードを読んだ。`src/config.js:820` の JSDoc の「ゆっくりで 200〜2000ms」は
  倍率 `randomWaitMin`/`randomWaitMax` の説明なので正しい。実害は未確認
  （利用者向けの文で外す手の 2 倍を書くかは判断）。

### 3. README の GIF（`docs/images/demo.gif`）を撮り直すと動きが大きく減る

- 何が: `tools/capture.mjs:289` は `?demo=random&board=8x8` を既定の速さのまま 10 秒撮る。
  既定が fast（200ms × 0.5〜1.5）から slow（400ms × 0.5〜5、平均 1100ms 前後）に
  変わるので、次に撮り直すと 10 秒で動く手数が数分の 1 になる見込み。
  今の GIF は 1 段目に「探し方」が無い HUD のまま。
- 根拠: コードを読んだ計算のみ。実測は未確認。1. で撮り直すなら GIF も撮り直すか、
  GIF だけ `selectSpeed('fast')` を挟むかは判断が要る（README のリンク先は slow で開くので、
  GIF と開いた画面の速さが食い違う方を取るかどうか）。

### 4. `TODO.md:21` の背景が実装前の値のまま

- 「今は `1 ± DEMO.randomJitter`（0.5）」は旧名。決着時に archives へ移すときに
  「元は」と書き換えるか消す。範囲の `rg` には入っていないので念のため。

## 問題が無かった観点

- 表示と今の探し方の食い違い: なし。`toggleStrategy()` は待ち中も `refreshStatus()` を
  通る（`demo.js:418`）。作り直しは `strategy` が `RELAYOUT_KEYS` にあり、`createHud()`・
  `refreshHud()` より前に戻す（`demo.js:124`）。URL は `parseDemoParams()` が
  `'depth'`/`'random'` 以外を返さない（`logic.js:1087`）ので `STRATEGIES[...]` が
  undefined になる経路も無い。`selectSpeed()`・`startSearch()`・`onSolved()` も
  `refreshHud()` 経由で同じ文を作る。
- `randomJitter` と「±」の残り: `rg -n -e randomJitter -e '揺' src docs tests.html CLAUDE.md README.md`
  で旧名は 0 件。「揺」の 3 件（`demo.js:14`・`demo.js:202`・`UsersGuide.md:211`）は
  新しい挙動でも正しい。`±` は 0 件。`tests.html` に `DEMO` の待ち時間を見るテストは無い。
- 規約: 数値は `config.js` に置かれ、JSDoc に理由（考え込む手、利用者が決めた）がある。
  `demo.js` の追加コメントも理由を書いている。行長は既存（最長 99）の範囲。
- 範囲: 指示外の変更なし。
- テスト: 純関数の変更が無く、`tests.html` に足すものは無い。

## 好みの範囲

- `docs/UsersGuide.md:176`・`181`・`211` は追記で 1 行が 45 字前後に伸び、前後（35〜40 字）と
  折り返し位置がそろっていない。

## 作り込みすぎ

- `src/scenes/demo.js:417-419`: shrink（好みの範囲）。データがあるときは `startSearch()` →
  `refreshHud()` で同じ文をもう一度作るので 2 回書き換える。
  `if (this.solutions) this.startSearch(); else this.refreshStatus();` にすればコメントごと 1 行で済む。
  実害は無い（ボタンを押したときだけ）。

net: -1 lines possible.
