# TODO-105 レビュー（対象: 121d137）

## 要修正

### 1. `src/ui.js:351-372` — `createButton()` の JSDoc が新しい関数に横取りされている
- 問題: 新しい `createConfirmDialog()` が、`createButton()` の JSDoc（「ボタン。中心を `(x, y)` に置く。」〜「`setCaption()` で差し替えられる。」）と
  `BUTTON_PAD` / `createButton()` の間に入った。今は `createButton` の説明が `createConfirmDialog` の JSDoc の直前に浮いており、
  `createButton()` には説明が付いていない形になっている。
- 根拠: `git show 121d137^:src/ui.js` の 366〜377 行では、その JSDoc の直後が `BUTTON_PAD` と `createButton()` だった。
  エディタ・JSDoc ツールは直前の `/** */` を関数に結びつけるので、`createButton` の説明が失われる。
  CLAUDE.md「中身のない `/** */` を残さない」の趣旨にも外れる（どの関数にも付かない説明になる）。
- 挙動には影響しない（コメントだけ）。

### 2. `src/config.js:217-221` — `RECORDS_CONFIRM_DEPTH` は記録の画面だけの値
- 問題: 使っているのは `src/scenes/records.js:406` だけ（`rg RECORDS_CONFIRM_DEPTH src/`）。
- 根拠: CLAUDE.md「色と、複数の画面で使う数値は `src/config.js` に置く。…その画面だけの配置の数値は、使うファイルの先頭に置く（TODO-107）」。
  本編の側も重なり順は `game.js` の `DEPTH` に置いており、`config.js` に寄せていない。records.js の先頭の定数（`ROW`・`FOOT_GAP` などと同じ並び）に置くのが規約どおり。
  TODO の「`depth = 10` の直書きも無くす」は、records.js 先頭の名前付き定数でも満たせる。

## 検討

なし

## 好みの範囲

- `src/ui.js:9` の import 行が 109 桁。ほかの import 行は 100 桁以内で折っている。行長の決まりは CLAUDE.md に無く、既存にも 100 桁超えの行はある。

## 挙動を変えないか（一致を確かめたもの）

- 部品の順（帯・枠・文言・はい・いいえ）と `confirmParts` の並び: 本編・記録とも前と同じ。表示リストへ足す順も同じ。
- 帯: 位置 (0,0)・画面全体・`BACKDROP` の色と alpha・`setInteractive()`・`setOrigin(0)`: 同じ。
- 枠の位置 `(画面 - CONFIRM) / 2`、文言の位置 `y + 50`・`FONT.body`・`TEXT_COLORS.normal`・中央寄せ: 同じ。
- ボタンの y `y + height - 40`、x の式、幅・高さ・`FONT.small`・ラベル: 同じ。
- `CONFIRM` の値 460/200/130/56/20: 直す前の `makeLayout()` の `confirm` はレイアウトによらない定数だったので、縦・横・ボードのどれでも前と同じ。
- `layout.confirm` を読む箇所はほかに無い（`rg '\.confirm\b' src/` は `DEPTH.confirm` のみ）。
- depth: 本編 `DEPTH.confirm`(40)、記録 10。同じ。
- 画面の大きさ: 本編 `this.layout.width/height`、記録 `screenOf(this)`。前と同じ出どころ。
- 「はい」は押した時点の `this.confirmAction()` を呼ぶ（差し替えが効く）、「いいえ」は `hideConfirm()`: 同じ。
- 初期状態: 全部隠す、本編 `confirmAction = null`・記録 `confirmAction = () => this.hideConfirm()`: 同じ。
- `openConfirm()` / `hideConfirm()` / `confirmKind` と開き直し（game.js:1027・1044、records.js:234・250）: 差分の外で変わっていない。部品はシーンの `add` で作るので、`scene.restart()` で前と同じく破棄される。
- 外した import（game.js の `BACKDROP`、records.js の `BACKDROP`・`LAYOUTS`・`createPanel`）はほかで使われていない。

## 文書

- CLAUDE.md・docs/developer.md の `ui.js` の説明: 今のコードと合う。`createButton` / `createPanel` を組み合わせる旨の規約の文も合う。

作り込みすぎ: なし
