# TODO-108 screens 報告（前半: 直す前、HEAD 5f74578）

撮り方: `archives/agents/TODO-108/capture.js`（`browser_run_code_unsafe` の `filename` に渡す）。
後半は `OUT` の `before` を `after` にしたコピーを `~/tmp/playwright-mcp/todo108/` に置いて渡す
（MCP はリポジトリと `~/tmp/playwright-mcp` の外を読めない）。キャッシュは CDP で切ってある。
1280x720 の横・8×8・色の組は既定（ネオン）。

## 画像（すべて切った範囲は同じ: ページ座標 x=100, y=0, 幅 1080, 高さ 720 ＝ キャンバス全体）

| 画面 | 画像 | sha256 |
|---|---|---|
| タイトル | `/home/ytani/tmp/playwright-mcp/todo108/before/title.png` | `915832b98547d3fc8f06ac7c8a7c798d314b59b2b79d41ade90b03dc77dfeb37` |
| 本編 | `/home/ytani/tmp/playwright-mcp/todo108/before/game.png` | `8a5346f735b03e6d9d7ff9a2f768421dac5256ae51eb0aa21055ff82d937b4c3` |
| クリア表示 | `/home/ytani/tmp/playwright-mcp/todo108/before/clear.png` | `bd479b3d1250dfb893f27e8180887a1376443b229c8ca600672ee05126d22fed` |
| 記録 | `/home/ytani/tmp/playwright-mcp/todo108/before/records.png` | `d7bbc442cc83a4e18a4afc339401577baec422721cfb41828ead75cb6b1d9aab` |
| デモ | `/home/ytani/tmp/playwright-mcp/todo108/before/demo.png` | `cd1bdafe0e08928b0a762301bae558c8e97449c108f37ef8c47ebd7363abd2ce` |

## 状態の作り方（動くものを止めた方法）

- **タイトル**: 動くボード（`previewGraphics`）を消し、`previewTimer` を止めてから撮る。
  遊び方の枠の左（動くボードの場所）は空になる。ほかの文字・ボタンはそのまま映る。
- **本編**: 経過時間の文字を `00:00` にし、ネオンの明滅を止めて `glow` の alpha を 1 に固定して、
  `scene.pause('Game')`。下端の操作の説明と HUD（時間・残り・ボタン 6 つ）が映る。
- **クリア表示**: 本編を上と同じ状態にしてから、`clearData` に決まった値
  （1:23、正解の 1 番、全 65 解、新しい解、自己最短を更新）を入れて `showClear()`。
  **本編で実際に完成させてはいない**（Clear が読むのは `clearData` だけで、毎回同じ絵になるため）。
- **記録**: `pentomino-puzzle/history/v2/8x8` に履歴 3 件（固定の日時）を入れて開く。
  先頭の回が選ばれて完成形が出る。日時は `toLocale` 系の表示でこのマシンの時刻帯に依る
  （前後とも同じマシンなので一致する）。
- **デモ**: 開いた直後に `scene.pause('Demo')`、全解のデータが届くのを待ってから撮る。
  1 手も進んでいない（`state=running`、試した手 0、見つけた解 0、探し方 人間的）。

## 2 回撮って一致したか

5 枚とも一致（`cmp` で全バイト同じ）。

## 目視

5 枚とも開いて確認した。文字が映っている。
- タイトル: 題字・サブタイトル・遊び方の枠の 5 行・「ボード」「色」・色の見本・「記録なし」・3 つのボタン・「デモ」・キーの案内・版。
- 本編: HUD の「00:00」「残り 12」、ボタン 6 つ、下端の操作の説明。
- クリア表示: COMPLETE・01:23・番号・新しい解・自己最短・4 つのボタン（背後の本編が暗く透ける）。
- 記録: 題・ボード・「全部選ぶ」・履歴 3 行・完成形と日時・番号・「この回を続ける」・達成度・頁。
- デモ: 注記・HUD の状況（試した手・見つけた解・探し方）・「解ける」の札・ボタンの下の「人間的」。

## コンソール

エラー 0 件。

# 後半: 直した後（実装 872dc0b・空行の直し b2984e8 を含む HEAD b2984e8）

撮り方: `capture.js`（`OUT` だけ `after` にしたコピー
`/home/ytani/tmp/playwright-mcp/todo108/capture-after.js`）。キャッシュは CDP で切ってある。
切った範囲は前半と同じ（キャンバス全体、x=100, y=0, 1080x720）。

## 1 回目の結果と、撮り方の直し

1 回目は **4 枚が一致、`demo.png` だけ食い違った**（title・game・clear・records は全バイト一致）。
- 差のピクセル: 5888 個、各チャンネルの差は最大 1、範囲は x=488..736, y=298..650（デモのトレイのピースの周り）。
- 原因の切り分けはしないが、前半の `capture.js` は本編と違って**デモだけネオンの明滅（tween）を止めて
  `glow` の alpha を 1 に固定していなかった**ので、ネオンのにじみの alpha が撮る時点でわずかに違った
  可能性が高い（前半の 2 回が一致したのは、たまたま同じ値だったため）。

そこで `capture.js` のデモに、本編と同じ止め方（`tweens.killAll()` と `glow` の alpha 1）を足し、
**前も撮り直した**。前の画像は、HEAD 5f74578（直す前）をリポジトリの外に `git archive` で展開し、別ポート
8766 で配信して撮った（リポジトリは触っていない。撮ったあとサーバは止めた）。
`capture.js` は先頭の `BASE`（既定 `http://localhost:8765/`）で配信元を切り替える。

## 結果: 5 枚とも `cmp` で全バイト一致（直す前 5f74578 と 直した後 b2984e8）

| 画面 | 直した後の画像 | sha256（先頭 12 桁。前と同じ） |
|---|---|---|
| タイトル | `/home/ytani/tmp/playwright-mcp/todo108/after/title.png` | `915832b98547` |
| 本編 | `/home/ytani/tmp/playwright-mcp/todo108/after/game.png` | `8a5346f735b0` |
| クリア表示 | `/home/ytani/tmp/playwright-mcp/todo108/after/clear.png` | `bd479b3d1250` |
| 記録 | `/home/ytani/tmp/playwright-mcp/todo108/after/records.png` | `d7bbc442cc83` |
| デモ | `/home/ytani/tmp/playwright-mcp/todo108/after/demo.png` | `16b1fca29b4a` |

前の画像（`before/`）も撮り直したので、`before/demo.png` は前半に報告した sha256 と変わっている
（`cd1bdafe0e08…` → `16b1fca29b4a…`。明滅の固定を足したため）。ほかの 4 枚の sha256 は前半のまま。

デモの撮り直しは、前後それぞれ 1 回ずつ（2 回撮って一致、ではなく、前と後が一致）。

## コンソール

エラー 0 件。
