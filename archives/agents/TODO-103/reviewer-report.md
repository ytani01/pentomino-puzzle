# TODO-103 reviewer 報告

対象: 作業ツリーの `git diff`（src/config.js, src/scenes/demo.js, src/ui.js, docs 2 件, TODO.md）。
静的に読んだだけで、ブラウザでの実測はしていない（見た目は screens の担当）。

要修正: 0 件 / 検討: 2 件 / 好みの範囲: 1 件

## 検討

### 1. デモの `messageText` が常に空になり、持ち越しと消す処理が残っている

- `src/scenes/demo.js:164`（`relayout()` の `message: this.messageText.text`）、
  `:176`（`applyRelayout()` の `this.messageText.setText(saved.message)`）、
  `:450`（`startSearch()` の `this.messageText.setText('')`）、`:169` の JSDoc「メッセージを」
- 何が: デモでメッセージ欄に文字を入れていたのは `onSolved()` の「解けた！ N 手目」だけで、
  今回それを消した。デモが呼ぶメソッド（advance, applyRelayout, cancelTurn, createHud,
  createHudButtons, createMessage, createPieces, drawBoard, drawTray, finishStep, goToTitle,
  muteFace, onSolved, pickWaitScale, playTurns, refreshHud, refreshPiece, refreshStatus,
  searchNext, selectSpeed, settlePiece, startSearch, toggleMute, toggleStrategy）を
  `game.js` と突き合わせたが、`showMessage()` を呼ぶもの（game.js の dropDrag / turnPiece /
  useAuto / slideIn / fillForced / checkSolved）は含まれない。したがって上の 3 か所は
  空文字を控えて空文字を戻し、空を空にするだけになった
- なぜ: 使われない持ち越しが残ると、後から読む人が「デモにもメッセージが出る経路がある」と
  誤解する。消すなら 3 か所と JSDoc をまとめて。`createMessage()`（:133）自体を残すか
  （レイアウトは本編と共有）は判断が要る
- 境界線: 範囲外として次の項目に回す判断もありうる。報告だけ

### 2. TODO.md の背景と、札・寸法の説明が「2 状態」のまま

- `TODO.md:23`「解けたときは札が空になる（`hintState = null`）ので重ならない」は、
  札を共有する今の実装（`hintState = 'solved'`）と食い違う。項目を決着させて
  archives へ移すときに、そのまま残ると経緯が読み違えられる
- `src/ui.js:155-159` の JSDoc 冒頭「文言（`ok`→解ける、`dead`→解なし）の対応もここだけに持つ」
  「`ok` は緑、`dead` は赤」「2 つの文言は同じ文字数だが」は 2 状態の前提のまま
  （下に `solved` の段落を足してあるので誤りではないが、「同じ文字数」は今は成り立たない）。
  `src/config.js:795` の `HINT_BADGE` の JSDoc「「解ける／解なし」の札」も同様
- 根拠: 読んだコード。文言の好みではなく、事実との食い違いとして挙げる

## 好みの範囲

- `src/ui.js:193-194`: `state === 'solved'` を 2 回見ている。`TEXT` / `FILL` と同じく
  文字色も表（例 `{ solved: TEXT_COLORS.onBright }[state] ?? TEXT_COLORS.normal`）にする手もあるが、
  今の 2 行で十分読める

## 問題なしの観点

- 本編への影響: なし。game.js の呼び出し（:1290, :1302, :1310 と applyRelayout 経由の runHint）は
  同じ状態を続けて渡しても以前は同じ描画をやり直すだけだったので、早期 return で見た目は変わらない。
  初回の `setState(null)` は `current` が `undefined` なので素通りする。文字色も ok/dead は従来どおり `normal`
- killTweensOf: 札の face / label を tween するのは今回足した点滅だけ（rg で確認）。本編で巻き込む tween は無い
- デモの再開: 自動（update の `DEMO.pauseMs` 後）・「次の解を探す」・探し方の切り替えはすべて
  `startSearch()` で `hintState = 'ok'` → `refreshHud()` を通り、点滅は止まって alpha 1 に戻る
- 解けて止まっている間の速さ変更（`selectSpeed` → `refreshHud`）: 早期 return で点滅を始め直さない
- 向きの変更: `hintState` は RELAYOUT_KEYS で持ち越され、`create()` の `refreshHud()` で新しい札に
  'solved' が渡って点滅が始まる。古い札の tween は `scene.restart()` のシーン停止で消える
- 規約: 色は config.js（`COLORS.solved`, `TEXT_COLORS.onBright`）、間隔も `HINT_BADGE.blinkMs`。
  setTimeout 不使用（Tween）。`let current` はモジュールのトップレベルでなく札ごとのクロージャで規約に触れない
- テスト: tests.html は計算だけの層で、今回の変更は描画のみなので追加は不要
- 範囲: 指示外の変更なし
- コメント: 足したコメントは「なぜ」を書いている

## 作り込みすぎ

- `src/scenes/demo.js:164,176,450`: delete: 常に空のメッセージの持ち越しと消去（検討 1 と同じ）。何も置き換えない。重大度は検討

net: -3 lines possible.
