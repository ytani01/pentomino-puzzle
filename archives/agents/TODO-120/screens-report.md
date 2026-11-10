# TODO-120 画面の確認（screens-120）

配信: コミット済みの HEAD を取り出して `http://localhost:8766/`（確認後に停止）。8×8、横画面 568x320 のみ。
**問題は見つからなかった。** コンソールのエラーは 0 件。

## 操作ごとの結果

| 操作 | 結果 |
|---|---|
| 1a ピースを置く（トレイの I をボードへドラッグ） | 盤上は I だけ（row 3, col 5）、`trayPieces()` 11、HUD「残り 11」、`history` 1、アンドゥのボタンが有効。表示は正常 |
| 1b 外す（I をボードの外のトレイ側へ離す） | I は `tray` へ戻り、`trayPieces()` 12、「残り 12」、`history` 2、盤上 0 個 |
| 1c 一手戻す（アンドゥのボタンをクリック） | I が盤上へ戻り、`trayPieces()` 11、「残り 11」、`history` 1 |
| 1d 向きを変える | 盤上の I は 2 向きのうち、もう一方がボードに収まらないため変わらない（`cells` 同じ。想定内）。代わりにトレイの L をタップし `[[0,0],[1,0],[2,0],[3,0],[3,1]]` → `[[0,0],[0,1],[0,2],[0,3],[1,0]]`。残りは 11 のまま、`history` も 1 のまま（トレイでの向き変更は履歴に入らない） |
| 2a ヒント表示をクリック | `hinting` true。I を (3,5) に置いた盤は `hintState` 'dead'。戻して空のボードにすると 'ok'（バッジ「解ける」） |
| 2b 自動で置かれる手 | `useAuto()` を 10 回で F・I・L・N・T・V・W・X・Y・Z が置かれ、`trayPieces()` は 12→2、「残り」は 1 ずつ減って「残り 2」。残りの P・U は 10 マスの 1 つの空きなので、ヒント入りでも自動では置かれない（想定内）。続けてもう 1 回 `useAuto()` を呼ぶと、1 手置いたあと残りの 1 個が形の決まった空きとして自動で置かれ、同時に「残り 0」・メッセージ「完成」・`solvedNumbers` [4]・2 秒後に Clear が前面に出た |
| 3 つづきから | `goToTitle()` → タイトルの「つづきから」をクリック。復元: 盤上 FILNTVWXYZ、トレイ PU、「残り 2」、時間 01:46（保存時 94.9 秒）、`usedAuto` true、`usedHint` true。`hinting` は false（保存しない値）、`history` 0。見た目はヒントが切のまま、盤とトレイが保存時と一致 |
| 4 デモ | Title から Demo を開き、約 2 秒ごとに「試した手 6→8→9」、盤上 FILNUY→FILNPUY→FILNPUVY、トレイ 6→5→4 と進んだ。ステータス「試した手 9　見つけた解 0　探し方 人間的」、バッジ「解なし」（人間的探索で行き詰まった状態）。欠け・余計な表示なし |

## 撮った画像（絶対パス）

すべて 568x320、8×8。
- /home/ytani/tmp/playwright-mcp/t120-game-568x320-8x8-placed.png — 本編、I を置いた直後（ボード中央の灰色の 2×2 は 8×8 の穴）
- /home/ytani/tmp/playwright-mcp/t120-game-568x320-8x8-hint-on.png — 本編、ヒント入（I を (3,5) に置いたまま。『解なし』のバッジ。確認時はバッジを読み取っていない）
- /home/ytani/tmp/playwright-mcp/t120-game-568x320-8x8-hint-left2.png — 本編、10 個置いて「残り 2」、バッジ「解ける」
- /home/ytani/tmp/playwright-mcp/t120-game-568x320-8x8-resumed.png — つづきから後（ヒント切、残り 2）
- /home/ytani/tmp/playwright-mcp/t120-game-568x320-8x8-forced-fill-clear.png — 自動で置かれて完成、Clear 表示
- /home/ytani/tmp/playwright-mcp/t120-demo-568x320-8x8.png — デモ（直後。撮影時点の画面は Clear の次の Demo 起動直後）
- /home/ytani/tmp/playwright-mcp/t120-demo-568x320-8x8-later.png — デモ、数手進んだ後

## 食い違い・気づき

- 食い違いなし。`hint-on.png` はバッジを読み取らず状態だけ evaluate で読んだ（`hintState` 'dead'）。画像でバッジを見る必要があれば別撮りが要る。
- 「ヒントの自動で置く手」は手作業のドラッグでは再現しにくく、`useAuto()`（おまかせ）経由で起こした。`fillForced()` → `slideIn()` → `refreshHud()` の経路は同じ。
- 向きを変える操作の確認は、盤上のピースでは I が変わらず、トレイの L で確認した。盤上での向き変更（置けない向きを飛ばす）は代表を試していない。

## コンソール

- エラー 0 件
- 警告 4 件（すべて同じ種類・Chromium の headless 由来）:
  `[.WebGL-0x…]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels @ http://localhost:8766/:0`（3 回、4 回目は「this message will no longer repeat」付き）

## 後始末

8766 のサーバ（PID 709324）を停止した。リポジトリのファイルは変更していない。
