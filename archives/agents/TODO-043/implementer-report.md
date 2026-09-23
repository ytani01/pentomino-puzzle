# TODO-043 implementer の報告

## 変更点

- `src/logic.js:344-372`（`solveSteps` の JSDoc とシグネチャ）
  - `solveSteps(spec, random, canContinue = regionsFitPieces)`。JSDoc の「探し方」を
    `canContinue` 前提に書き直し、既定なら enumerate.mjs と同じこと、外から受ける理由、
    place に `ok` が載ることと判定を yield の前に置いた理由を足した
- `src/logic.js:397-403`
  - `const ok = canContinue(board);` を place の yield の前に移し、手に `ok` を載せ、
    `if (ok) yield* search();`
- `src/scenes/demo.js:11-18` 冒頭の JSDoc に、置いてから全解のデータで調べて解なしなら
  外すこと・試行錯誤に見せるため選んで置かないこと・データが届くまで始めないことを追記
- `src/scenes/demo.js:24` `ensureSolutions, hasSolution` を import
- `src/scenes/demo.js:48-53` `state = 'loading'`・`steps = null`・`hintState = 'ok'` で始める
- `src/scenes/demo.js:69-75` `create()` の最後で `ensureSolutions()`。届いたら
  `scene.isActive()` を確かめ、`solveSteps(spec, Math.random, (board) => hasSolution(solutions, board))`
  を作って `running` にする（`update()` は `running` 以外で進まないので読み込み中は止まる）
- `src/scenes/demo.js:110-113` place で `ok` から `hintState` を決め、`animate` かつ
  解なしに変わった瞬間だけ `audio.invalid()`
- `src/scenes/demo.js:118-119` remove のあとは `hintState = 'ok'`
- `src/scenes/demo.js:131-132` `onSolved()` で `hintState = null`（表示を空に）
- `src/scenes/demo.js:160-166` `hintText` を 1 段目の右端（`hud.x + hud.width - hud.padding`、
  `setOrigin(1, 0.5)`）に `FONT.small`・`TEXT_COLORS.dim` で作る
- `src/scenes/demo.js:194-197` `refreshStatus()` で文言と色を塗る（本編の `runHint()` と同じ
  `解ける`＝dim／`解なし`＝danger）

読み込み中の表示は出していない（brief の 4. は任意。ローカルでは一瞬のため）。
読み込み中も HUD は「解ける」（空の盤なので正しい）。

## 確かめた方法と結果

- (a) 既定引数で手順が変わらないこと: シード付き乱数（mulberry32、seed 1/42/2026）×
  8×8/6×10 の 6 通りで、3 件目の solved までの手（place は名前・位置・cells、remove、solved）を
  文字列にし、`git stash` 前後で `cmp`。**一致**（手数 42,435〜420,937）。
  スクリプトは scratchpad の `dump.mjs`（`tools/window-shim.mjs` を先に import）
- (b) `hasSolution` を渡したとき: 同じ 6 通りで 3 件目の solved まで回した。
  `ok:false` の place 116〜152 件（8×8）/79〜134 件（6×10）すべてで、直後が同じピースの
  remove（違反 0）。`ok:true` の place の直後が同じピースの remove になった例も 0
  （＝外したあとの盤面を「解ける」と出す前提と合う）。3 件とも solved に届いた
- `tests.html`: ポート 8765 のサーバは既に動いていたので、それを headless Chromium
  （`~/.cache/ms-playwright/chromium_headless_shell-1234` の `--dump-dom`）で開いて summary を読んだ。
  **「250 件すべて通った」**（class="pass"）
- `node --check src/scenes/demo.js` / `src/logic.js`: 通った
- `node tools/gen-solutions.mjs --check`: 8×8・6×10 とも「一致した」、終了コード 0
  （6×10 は 466.8 秒かかった）
- デモ画面の実行時の確認（ブラウザでデモを動かす）はしていない。Playwright MCP が無いため。
  見た目の確認は別担当の範囲

## 1 段目の文字が重ならないか（計算）

HUD の幅は盤によらず向きだけで決まる（`makeLayout` の `hudWidth = width - MARGIN*2`）ので、
4 通りは実質 2 通り。

- 左の文字の左端: `hud.x + padding` = 14 + 20 = 34
- 右の文字の右端: 横 14 + 932 − 20 = 926 ／ 縦 14 + 612 − 20 = 606
- 最大の左の文字「試した手 999,999　見つけた解 99」（26px）の幅の見積もり:
  漢字・かな 9 字 × 26 = 234、全角空白 26、半角空白 2 × 約 7 = 14、数字 8 × 約 0.6em（16）= 125、
  カンマ 約 8 → 約 407。右端は 34 + 407 ≈ 441
- 右の文字「解なし」（20px）: 3 × 20 = 60。左端は横 866 ／ 縦 546
- 隙間: 横 約 425、縦 約 105。どちらも重ならない
  （数字の幅は system-ui で 0.55〜0.6em を見込んだ見積もり。実測ではない）

## 判断が要る点・懸念

- `hintState` はデモでも本編と同じ名前のプロパティにした（デモは `runHint()` を通らないので
  衝突しない。本編の `refreshHud()` はデモが上書きしている）
- 範囲外で気づいたこと: 特に無し
