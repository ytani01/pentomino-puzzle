# TODO-114 implementer 報告

## 移した関数
| 関数 | 置き場 | 引数 → 返す値 |
|---|---|---|
| `turnMarkKind(cells, origin = null)` | `src/logic.js`（`shapeSize()` の直後） | → `'rotate'` / `'flip'` / `null` |
| `turnMarkCenter(cells)` | 同上 | → `{x, y}`（**マスの単位**。例 `{x: 1.5, y: 1.5}`） |
| `strokeTurnMark(g, kind, center, cell)` | `src/icons.js`（`strokePieceEdges()` と `paletteIcon()` の間。export はこれだけ） | Graphics・種類・中心（**画面の座標**）・1 マスの大きさ。縁取り→本線の 2 回描き。色・太さは `config.js` の `TURN_MARK` |
| `strokeArrowHead` / `strokeRotateMark` / `strokeFlipMark` | 同上（内部関数。`cell` を引数で受ける） | |

`game.js` の `drawTurnMark()` は、印を出す条件・`g.clear()`・`cell` 取得・中心への `cell` 掛けだけを残した。`demo.js` の `drawTurnMark() {}` の上書きはそのまま効く。

## 同じ絵になる根拠
- 中心: 以前は `{ x: (best[1] + 0.5) * cell, ... }`。今は logic.js が `best[1] + 0.5` を返し、`game.js` が `center.x * cell`。同じ式の同じ順（`(a + 0.5)` を先に計算して `cell` を掛ける）なので、浮動小数点の結果も同じ。
- 矢じり・円弧・矢印の式は一字も変えず、`this.layout.board.cell` を引数 `cell` に置き換えただけ。`Phaser.Math.DegToRad` もそのまま（`icons.js` はグローバルの `Phaser` を関数の中でだけ使うので node でも読める）。
- 2 回描きの順（縁取り→本線）、`lineStyle(width * cell, ...)` も同じ。

## 検証
- `node --check src/logic.js src/icons.js src/scenes/game.js` … 成功（終了コード 0）
- `node -e "import('./src/logic.js')..."` で全 12 ピースに `turnMarkKind`・`turnMarkCenter` を実行。X（添字 9）は `null`、それ以外は `rotate` か `flip`、中心は `0.5/1.5/2.5` 刻み。`import('./src/icons.js')` も読めた。
- 画面の撮り比べ・`tests.html` は別の担当。テストは足していない（次の担当）。

## 判断が要る点・懸念
- **`game.js` に `turnMarkKind(piece)` を 1 行のメソッドで残した。** `tools/capture.mjs:211` が `s.turnMarkKind(p)` を画面の外から呼ぶため（消すとキャプチャの撮り直しが壊れる）。依頼は「移す」だったが、`capture.mjs` を書き換えるより、包んだメソッドを残すほうが小さいと判断した。不要なら `capture.mjs` を直して消せる。`turnMarkCenter` のメソッドは外から呼ばれていないので消した。
- `game.js` の import から `TURN_MARK`・`rotateCw` を外した（他に使っていない）。`shapeSize`・`nextTurn`・`sameShape` は他で使うので残した。
- `docs/developer.md` の `icons.js` の行と `logic.js` の記述、`CLAUDE.md` の `logic.js`・`icons.js` の行を直した（`game.js` の行は変更なし）。`TODO.md` は 1・2・4 つ目にチェックを入れた。
