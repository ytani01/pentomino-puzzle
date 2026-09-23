# TODO-043 implementer への依頼

## 目的

デモ（`src/scenes/demo.js`）の探索を、人がヒント表示を入にして解くときの
動きにする。置いたら全解のデータで「解ける／解なし」を調べ、解なしなら
すぐ外す。HUD にも本編のヒント表示と同じ「解ける／解なし」を出す。

決まっていること（利用者と決めた。変えない）:

- 今の動き（区画の大きさが 5 の倍数かだけを見る）は残さず置き換える。ボタンを増やさない
- 解につながる手だけを選んで置く動きにはしない。**置いてから調べ、だめなら外す**
  （試行錯誤に見えなくなるため）

## 対象

```bash
rg -n "solveSteps|regionsFitPieces|hasSolution|ensureSolutions|hintText|runHint" src
```

触るのは `src/logic.js` と `src/scenes/demo.js`（`config.js` は要れば）。
`tests.html`・`README.md`・`docs/` は別の担当が直すので触らない。

## 設計（main が決めた。迷ったら報告に書いて、この形で進める）

1. **`solveSteps(spec, random, canContinue = regionsFitPieces)`**
   - 置いたあと先へ進むかを `canContinue(board)` で決める。既定は今の `regionsFitPieces`
     なので、引数を渡さなければ手順は今とまったく同じ（既存のテストがそのまま通ること）
   - 判定は **place を yield する前に**行い、結果を place の手に `ok` として載せる
     （`{ type: 'place', name, cells, row, col, ok }`）。デモが HUD に出すため。
     判定を前に動かしても、探索の順と手は変わらない
   - JSDoc の「探し方」の説明を合わせる（「5 の倍数でない空き領域が出たら捨てる」は
     既定の場合の話になる）
2. **デモは全解のデータを読んでから探索を始める**
   - `create()` で `ensureSolutions(this.registry, this.spec)` を呼び、届いたら
     `solveSteps(this.spec, Math.random, (board) => hasSolution(solutions, board))` を作って
     `state = 'running'` にする。届くまでは `state = 'loading'`（`update()` は進めない）
   - 届いたときにシーンが生きているか確かめる（`game.js` の `create()` と同じ
     `if (!this.scene.isActive()) return;`）
   - `hasSolution` は解につながる盤面なら真なので、5 の倍数の判定を重ねなくてよい
3. **HUD の 1 段目に「解ける／解なし」**
   - 文言と色は本編の `runHint()` と同じ（`解ける`＝`TEXT_COLORS.dim`、
     `解なし`＝`TEXT_COLORS.danger`、`FONT.small`）
   - 置いた手の `ok` で決める。外した手のあとは `解ける`（外した先は、探索が
     「解ける」と判断して潜った盤面なので必ず解ける。空の盤も解ける）。
     12 個置き切って解けたとき（solved）は、本編が残り 0 で消すのに合わせて空にする
   - 置き場所は 1 段目の右端（右寄せ）。左の「試した手 … 見つけた解 …」と
     重ならないこと。4 通りの配置（8×8/6×10 × 横/縦）で文字が最大になっても
     （試した手が 6 桁・見つけた解が 2 桁）重ならないか、計算で確かめて報告する
   - 解なしに変わった瞬間に `audio.invalid()` を鳴らす（本編と同じ）。ただしデモの
     他の音と同じく `animate` の速さのときだけ
4. 読み込み中に何か出すかは任せる（6×10 でもローカルでは一瞬）。出すなら
   `messageText` に短く

## 保つもの（変えない）

- 1 フレームに 1 手まで、速さの間隔、`animate` の扱い、試した手・見つけた解の数え方
  （試した手は place の回数。解なしで外した置き方も数える）
- `storage.js` を呼ばない（記録・遊びかけ・見つけた解に何も残さない）
- 規約: `setTimeout` を使わない、色は `config.js`、状態はシーンのプロパティ、
  `logic.js` に Phaser/DOM を持ち込まない、JSDoc は「なぜ」を書く
- デモのファイル冒頭の JSDoc も今の動きに合わせる

## 完了条件と確かめ方

- `node -e` などで `solveSteps` を回し、(a) 既定の引数で今と同じ手順（`git stash` 前後で
  同じシードの最初の解までの手を比べる等）、(b) `hasSolution` を渡すと `ok:false` の
  place の直後が同じピースの remove、を確かめる。Node から `src/` を読むときは
  `tools/window-shim.mjs` を使う
- `http://localhost:8765/tests.html` が全件通る（サーバが無ければ
  `python3 -m http.server 8765` をバックグラウンドで。Playwright MCP は使えないので、
  ブラウザでの確認は無理にしなくてよい。その場合は報告にそう書く）
- 画面の見た目の確認は別の担当がする

## 報告

`archives/agents/TODO-043/implementer-report.md` に、変更点・確かめた方法と結果（数値）・
迷った点を書く。返事は「終わったか・報告ファイルのパス・判断が要る点」の 5 行以内。
コミットはしない。
