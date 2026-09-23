# TODO-050 implementer への依頼

目的: デモで探し方を深さ優先（今の `solveSteps()`）と幅優先から選べるようにする。
`TODO.md` の TODO-050 の節も読むこと。

## 実装すること

1. `src/logic.js` に幅優先の generator を足す（名前は任せる。例 `solveStepsBreadth(spec, random, canContinue = regionsFitPieces)`）
   - 返す手は `solveSteps()` と同じ `{type:'place', name, cells, row, col, ok}` / `{type:'remove', name}` / `{type:'solved'}`
   - ピースの並びと向きの並びは `solveSteps()` と同じく始める前に 1 回だけ `random` で入れ替える
   - 展開の仕方は `solveSteps()` と同じ（一番若い空きマスを埋める。置いたら `canContinue` で判定。
     false の手も place と remove の 2 手で返す。true の手は次の段の候補に積み、この段では外す）
   - 段（置いた枚数）の順に途中の盤面を調べる。次に調べる盤面へ移るときは、今の盤面との
     共通部分（置いた順の先頭が一致する分）を残し、違うピースだけ 1 手ずつ remove してから place し直す
   - 置き直しの place には `replay: true` を付ける（デモが「試した手」に数えないため。ok は true）
   - 全マス埋まった盤面へ移ったら `{type:'solved'}`。そのあと next() で続きを探し、出し切ったら終わる
   - 探索用の盤はその場で書き換えてよい（`solveSteps()` の JSDoc の理由と同じ）。
     段に積む途中の盤面は置いた手の列で持てばよい（6×10 で最大 9,356 件）
2. `src/scenes/demo.js`
   - HUD に探し方の切り替えボタンを足す（トグル 1 つ。ツールチップで今の探し方か切り替え先が分かるように）。アイコンは `src/icons.js` に Graphics API の線画で足す
   - 切り替えたら空の盤から探し直す（ピースをトレイへ戻し、試した手・見つけた解を 0 に）。全解のデータを待っている間（'loading'）に押されても壊れないこと
   - 既定は深さ優先。`replay` の place は `tried` に数えない
   - JSDoc の「深さ優先」の記述を直す
3. HUD のボタンが 7 つになる。`src/config.js` の `HUD_BUTTONS`（=6）で本編とレイアウトを共有している。
   **本編の見た目を変えずに**デモで 7 つ並ぶようにする（やり方は任せる。スマホ縦・横、PC 横長ではみ出さないこと）

## 保つもの・変えないもの
- `solveSteps()` の挙動と既存テスト（`tests.html`）は変えない
- 本編（`game.js` の HUD、レイアウト）の見た目を変えない
- プロジェクトの CLAUDE.md の規約（setTimeout 禁止、色・数値は config.js、logic.js に Phaser/DOM を持ち込まない、JSDoc は「なぜ」）
- テスト（tests.html への追加）と文書（CLAUDE.md の表・docs/developer.md）は別の担当がやるので触らない

## 完了条件・確認
- `python3 -m http.server 8765` を立て、Playwright MCP があれば使って、または Node（`tools/window-shim.mjs` を import）で、
  幅優先の generator を 8×8 で最初の solved まで回し、place（replay 以外）の数を出す。
  参考値: 全解のデータで判定したとき 28,383（`canContinue` に hasSolution を渡した場合）。
  既定の `regionsFitPieces` での数も出す
- 最初の solved の時点の盤が全マス埋まり、12 種が 1 枚ずつであることを確かめる
- 報告は `archives/agents/TODO-050/implementer-report.md` に書く（変更点、上の測定値、残る懸念）。
  返事は「終わったか・報告ファイルのパス・判断が要る点」の 5 行以内
