# TODO-094 reviewer 報告

対象: worktree `agent-afd09e24b9cee6155` の `git diff 82c93d2 HEAD`（`c8b4c9a`）。
行番号は worktree の HEAD のもの。

**要修正: 0 件 / 検討: 6 件 / 好みの範囲: 2 件**

## 重点ごとの結論

1. **分岐は依頼どおり。** やり直しは空なら `restart()` 直行、置いてあれば確認（`game.js:1255-1261`）。
   ホームとタイトル行はどちらも `confirmToTitle()`（`:289`・`:321`）を通り、空なら
   `playing = false` のうえで `goToTitle()`。`onShutdown()` → `persist()` が `playing` で止まるので、
   保存も削除もしない（`:1098-1099`・`:1288-1292`）。確認の途中の振る舞いは下の「検討」3〜4。
   キー操作は本編に無い（`rg keyboard src` はタイトルだけ）。
2. **原因の説明はコードで裏付けられる。** Phaser 3.90.0 の `ScenePlugin.restart` は
   `manager.queueOp('stop')` と `queueOp('start', key, data)` を積むだけで、`queueOp` は `_queue.push` のみ
   （phaser.js 3.90.0 の 199662-199670・199315-199320）。`createButton` の `pointerup` は `onClick()` の後で
   `tip()?.flash()`（`ui.js:436-444`）なので、積んだ後に古いシーンの tooltip へ出る。
   `activePointer` は `onTouchStart` / `onTouchMove` / `onMouse*` で差し替わる（同 103527 ほか）ので、
   `restart()` の時点で押した指のポインタを指す。Undo・ヒント・タイトルへはシーンを作り直さないか
   Title へ移るだけで、`restartTip` を渡す経路は `restart()` 1 か所だけ（`rg "'Game'|\.restart\(" src`）。
   他の `scene.start('Game', …)` はどれも引数を明示しており、`restartTip` が前回の値で残ることは無い。
3. **取りこぼしは無い。** `save = false` で呼ぶのは `:127` だけで、盤が変わる箇所の `refreshHud()`
   （置く `:944`・`:957`、向き `:1035`、Undo `:1068`、おまかせ `:1188`、ヒント `:1206`、完成 `:1410`）は
   すべて既定の `save = true`。データが届いたときは盤が変わっていないので、控えなくて失うものは無い
   （経過時間は `onShutdown()` で控える）。
4. **規約違反なし。** `setTimeout` / `confirm()` は差分に無い。色・数値は `BOARD_GLASS`・`HELP_LINE`
   を `config.js` に置き、`createHelp()` も `FONT` / `TEXT_COLORS` を使う。JSDoc は「なぜ」になっている。
5. **1 か所に置いてある。** `ui.js:18-23` の `HOW_TO_OPERATE` は `title.js:102-104` の 3 行と
   一字一句同じなので、タイトル側を差し替えても表示は変わらない。

## 検討

### 1. 空の盤でも、やり直しとヒント表示は保存済みの遊びかけを消す（判断が要る）
- 場所: `game.js:1240-1247`（`restart()` が無条件に `clearProgress()`）、`:1198-1206`（`toggleHint()` →
  `refreshHud(true)` → `persist()` → 空なので `clearProgress()`）
- 何が起きるか: 「`はじめる` で始めて何も置かずにホーム」では遊びかけが残るようになったが、
  同じ状態で「やり直し」を押すと**確認なしで**消え、「ヒント表示」を入にしても消える。
  今回の `:127` の修正で遊びかけが始めた直後に消えなくなったため、この 2 経路が新しく目に見える。
  やり直しは実装者も懸念に挙げている。ヒント表示はコードを読んだ結果で、実害は未確認（実測していない）
- 補足: 3 経路（データの到着・ホーム・ヒント）はどれも「このシーンで盤を変えていないのに、空の盤で
  `persist()` が消す」で原因が同じ。`persist()` の中で「このシーンで一度でも控えたか（または続きから
  始めたか）」を見る条件 1 つにまとめれば、`refreshHud` の `save` 引数と `confirmToTitle()` の
  `playing = false` が要らなくなり、ヒントの経路も塞がる見込み。記録画面の「この回を続ける」
  （`progress` を渡す経路）との兼ね合いは未確認

### 2. 本編のレイアウト（`help: true`）が `tests.html` で確かめられていない
- 場所: `tests.html:181`（`makeLayout({ portrait, board: spec })`。`help` は既定の false）、`config.js:484-488`
- 何が起きるか: 本編の `LAYOUTS` は `help: true` になったが、トレイのスロットのテスト
  （収まる・重ならない・盤とトレイが重ならない）は `help` なしの配置を見ている。概要の帯が
  トレイの下端とメッセージの帯の間に収まるかのテストも無い。
  Node で測った値（`help: true`）ではどれも成り立っていた:
  横 8×8 トレイ下端 574 / 概要の中心 587（1 行）/ メッセージ 620、縦はトレイ下端 1018 / 概要の中心 1057（3 行）/ 1116。
  スロットはすべてトレイに収まり、盤とトレイは重ならない
- 根拠: CLAUDE.md「Phaser に依存しない計算は … `tests.html` から確かめられるようにする」

### 3. 確認を開いている間も経過時間が進む
- 場所: `game.js:157-160`（`update` は `playing` だけを見る）、`:1299-1304`
- 何が起きるか: やり直しの確認を開いて「いいえ」で閉じると、迷っていた時間が経過時間（最短記録の比較に使う）に入る。
  タイトルへの確認でも前から同じ。止めるかどうかは仕様の判断

### 4. 確認を開いたまま盤が変わる・クリア表示が重なる経路がありうる（実害は未確認）
- 場所: `ui.js:430-444`（ボタンは `scene.drag` だけを見て、`pending` は見ない）、`game.js:1399-1425`
- 何が起きるか（コードを読んだ結果。実測していない）:
  - タッチで 1 本目の指がピースを押さえ（`pending`、まだドラッグ前）、2 本目でやり直しを押すと確認が開く。
    そのまま 1 本目を動かすとドラッグが始まり、幕（depth 40）の下で盤が変わりうる
  - 完成の直後、`delayedCall(700)` でクリア表示が出るまでの間にやり直しを押すと、確認が開いたまま
    Game が止まり Clear が重なる。「続ける」（`continuePlay()`）で戻ると確認が出たまま
  - どちらもタイトルへの確認では前からある経路で、今回やり直しにも広がった

### 5. 文書が今の挙動と合わなくなる
- 場所: `docs/UsersGuide.md:54`・`:63`（タイトルへは常に「確認を挟んで」）・`:67`（やり直しに確認の記述なし）、
  `docs/developer.md:158`・`:173`・`:236`（本編は確認を挟む）・`:434`（シーンを離れるときは常に保存か削除）
- 依頼に文書は入っていないので、実装者が触らなかったのは範囲として正しい。項目を閉じる前に誰が直すか決める要がある。
  本体の木では `docs/UsersGuide.md` を別の担当が変更中（git status）なので、重ならないよう注意

### 6. 実装者の報告の「6×10 の横は 62 のまま」は誤り
- 場所: `implementer-report.md` の「懸念・気づいたこと」1 つ目
- Node で `makeLayout` を測った値: 横 6×10 のマスは `help` なし 64 → あり 62。横 8×8 は 49 → 46。
  横はどちらの盤も縮む（縦はどちらも変わらない。8×8 74、6×10 59）。
  scratch の計測スクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/f10f0b39-6a0c-4db6-b5e3-99ddf657eb61/scratchpad/lay.mjs`

## 好みの範囲

- `game.js:107` 説明の文言 `'やり直し'` を `:325` のボタンの `tooltip` と二重に持っている。片方だけ直すと食い違う
- 確認を開いたときのやり直しの説明が幕の下に暗く出る（`DEPTH.tooltip` 35 < `DEPTH.confirm` 40）。実装者の報告どおり

## 作り込みすぎ

- `game.js:429,438`: delete: `this.confirmYes` はどこからも読まれない（`rg confirmYes src` で代入と push だけ）。前と同じく `this.confirmParts.push(createButton(...))` に戻せる
- `boot.js:99-117`: delete: `makeTile()` の `beveled` が偽の分岐。盤のマスがガラスへ移り、呼ぶ所は 2 か所とも `true`（`:81`・`:90`）。引数と `if (beveled)`、`COLORS.boardCellEdge` の三項演算を消せる
- `game.js:1100`: shrink: `persist()` の `this.pieces.every(...)` は新しい `boardIsEmpty()` と同じ式。`if (this.boardIsEmpty())` にする
- `game.js:127`・`:1364`: yagni: `refreshHud` の真偽の位置引数 `save` は呼ぶ所 1 か所のため。検討 1 の形にすれば消える（重大度は検討）

net: -6 lines possible.
