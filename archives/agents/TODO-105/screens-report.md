# TODO-105 screens 報告（前半: 直す前、HEAD a79ee10）

撮り方: `archives/agents/TODO-105/capture.js`（`browser_run_code_unsafe` の `filename` に渡す）。
後半は `OUT` の `before` を `after` にしたコピーを `~/tmp/playwright-mcp/todo105/` に置いて渡す
（MCP はリポジトリと `~/tmp/playwright-mcp` の外を読めない）。キャッシュは CDP で切ってある。
使うのは各シーンに残る `openConfirm()` だけ。

## 画像

| 画像 | 開いた確認 | sha256 |
|---|---|---|
| `/home/ytani/tmp/playwright-mcp/todo105/before/game-confirm.png` | 本編 `openConfirm('restart')`（「やり直しますか？ 今の盤面は消えます」） | `f33046edbf6b237f5573bb118c9d870c2356847e5a040f946b41e323c2fc63c4` |
| `/home/ytani/tmp/playwright-mcp/todo105/before/records-confirm.png` | 記録 `openConfirm('trash')`（「8×8 の記録 1 件を消しますか？ もとに戻せません」） | `235b63db32a5e7354a64e28ea3b86c4d427d7f493fb83428ea9b34830e618422` |

## 状態の作り方

1280x720 の横・8×8・色の組は既定（ネオン）。
- 本編: 始めた直後にネオンの明滅を止めて `glow` の alpha を 1 に固定し、`openConfirm('restart')`。
- 記録: `localStorage` の `pentomino-puzzle/history/v2/8x8` に履歴 3 件
  （`{at: 1700000300000/…200000/…100000, ms: 61000/75000/90000, no: 3/2/1}`）を入れて記録の画面へ。
  一覧が 3 件になるのを待ち、先頭の回をチェックして `openConfirm('trash')`。

## 切った範囲

x=370, y=220, 幅 540, 高さ 280（ページ座標）。
注: ゲームの内部解像度は 960x640 で、1280x720 では `Scale.FIT` で 1.125 倍・左に 100px の余白になる。
確認の枠（内部 460x200 の中央）はページ座標で約 x=381..898, y=247..472 なので、切った範囲の
左に約 11px、上に約 27px、右に約 12px、下に約 28px の余白が付く。枠の外には暗くなった背景
（本編はトレイのピースの端、記録は日時の文字）が少し入る（どちらも動かない）。

## 2 回撮って一致したか

2 枚とも一致（`cmp` で全バイト同じ）。

## 目視

2 枚とも開いて確認した。確認の枠（パネル）・2 行の文言・「はい」「いいえ」の 2 つのボタンが映っており、
欠けは無い。

## コンソール

エラー 0 件。

# 後半: 直した後（実装・レビューの直しを含む HEAD 5a826a9）

撮り方: 前半と同じ `capture.js`（`OUT` だけ `after` にしたコピー
`/home/ytani/tmp/playwright-mcp/todo105/capture-after.js`。キャッシュは CDP で切ってある）。
状態の作り方・切った範囲（x=370, y=220, 540x280）も同じ。

## 結果: 2 枚とも `cmp` で全バイト一致

| 画像 | sha256（before と同じ） |
|---|---|
| `/home/ytani/tmp/playwright-mcp/todo105/after/game-confirm.png` | `f33046ed…c63c4` |
| `/home/ytani/tmp/playwright-mcp/todo105/after/records-confirm.png` | `235b63db…18422` |

差のピクセルが無いので、並べて見ることはしていない。

## 「いいえ」で閉じる（本編・記録で 1 回ずつ）

手順は `archives/agents/TODO-105/check-close.js`（保存はしない）。確認を開く前の同じ範囲の画像を撮っておき、
`openConfirm()` で開き、「いいえ」の文字の中心を実際にクリックして閉じ、閉じたあとの画像と全バイトを比べる。

| | クリック | 開くと画像が変わる | 閉じたあと開く前と同じ | `confirmKind` |
|---|---|---|---|---|
| 本編（`restart`） | ok | はい | **はい（全バイト一致）** | null |
| 記録（`trash`） | ok | はい | **はい（全バイト一致）** | null |

閉じたあとに表示は残っていない。

## コンソール

エラー 0 件。
