# TODO-050 implementer の報告

## 変更したファイル

- `src/logic.js:451-543` … `solveStepsBreadth(spec, random, canContinue = regionsFitPieces)` を追加。
  途中の盤面は `{parent, name, cells, row, col}` の連なりで持ち、次の盤面へ移るときは
  置いた順の先頭が同じもの（同一オブジェクト）を残して、違う分を後ろから remove → place（`replay: true`, `ok: true`）。
  全マス埋まった盤面へ移ったら `{type:'solved'}` を返し、その盤面は展開しない。最後の盤面のあと盤にピースを残したまま終わる。
  `solveSteps()` には手を入れていない
- `src/config.js:247` … `DEMO_HUD_BUTTONS = 7`
- `src/config.js:295-302` … `makeLayout()` に `buttons`（既定 `HUD_BUTTONS`）を足した。縦画面の 1 段の個数を `3` から `Math.ceil(buttons / 2)` に変更（6 個なら 3 のまま、7 個なら 4 個で 2 段）
- `src/config.js:439-449` … `DEMO_LAYOUTS` を追加（本編の `LAYOUTS` は変えていない）
- `src/icons.js:163-178` … `ICONS.depthFirst`（縦に 3 点）・`ICONS.breadthFirst`（根から 3 本に分かれる）
- `src/scenes/demo.js`
  - 冒頭の JSDoc の「深さ優先」を直した（2-4, 12-13 行あたり）
  - `STRATEGIES`（35-40）… 探し方ごとの generator とボタンのアイコン・説明。ボタンには今の探し方を出す（音のボタンと同じ形）。説明の文字は「探し方: 深さ優先」「探し方: 幅優先」
  - `this.layout` を `DEMO_LAYOUTS` から取る（51-52）。`this.solutions`・`this.strategy = 'depth'` を追加
  - 全解のデータが届いたら `startSearch()` を呼ぶ（87-88）
  - `replay` の place は `tried` に数えない（118-119）
  - HUD の 5 番目（添字 4）に探し方のボタンを入れ、音は添字 5 に移した（189, 196-197）
  - `toggleStrategy()` / `startSearch()`（223-256）。データを待っている間（'loading'）に押されたら探し方だけ変え、データが届いたときにその探し方で始める。
    データがあれば、盤のピースをトレイへ戻し（滑らせない）、試した手・見つけた解を 0、メッセージを消して最初から探す
- 計測用: `archives/agents/TODO-050/measure-breadth.mjs`（使い回せるように残した）

## 検証

| コマンド | 結果 |
|---|---|
| `node archives/agents/TODO-050/measure-breadth.mjs 8x8 hasSolution 1`（シード 2, 3 も） | 最初の solved まで: 試した手（replay 以外の place）**28,383**、replay 19,963、remove 48,334、160ms。solved の時点で `isSolved` true、12 種が 1 枚ずつ true。シード 3 通りとも同じ数（最初の解は 12 段目で、それまでの段を全部調べるので並びに依らない。replay の数も木の形だけで決まる） |
| `node archives/agents/TODO-050/measure-breadth.mjs 8x8 regions 1`（既定の `regionsFitPieces`） | 試した手 **4,969,285**、replay 3,585,878、remove 8,555,151、11.0 秒。solved true、12 種 true |
| 計測中の手の整合（置いていない名前を remove / 置いた名前を二重に place したら例外） | 上の全実行で例外なし |
| 配置の比較（Node、`makeLayout` を横・縦 × 8×8・6×10） | 本編の `makeLayout()` の出力は変更前と byte 一致。デモの配置は HUD 以外が本編と一致。ボタン幅: 横 123（本編 130）で 7 個、縦 130 で 4+3 個。並びの幅 909 / 932（横）、544 / 612（縦） |
| Playwright（npx キャッシュの playwright-core + headless shell）で 1280×720・390×844・844×390 | Demo を開き、'loading' の間に切り替え → データ到着後に幅優先で走る。最速で回したあと切り替え → 試した手 0・見つけた解 0・盤上 0 枚・'running'。page error / console error なし。HUD の画像で 2 つのアイコンを目視（描けている） |
| `tests.html`（headless） | 266 件すべて通った |
| `node tools/gen-solutions.mjs --check` | 終了コード 0 |

## 判断が要る点・懸念

- 横画面ではデモのボタン幅が 130 → 123 に詰まる（7 個を 1 段に収めるため）。本編は 130 のまま
- `makeLayout()` の縦画面の折り返しを「3 個ずつ」から「2 段に分ける」に変えた。本編（6 個）では同じ結果になることを確認済み。`config.js` の既存コメント「横画面の 6 個は 104 では…85 まで縮む」は以前から実際の値（130）と合っていないが、範囲外なので触っていない
- 幅優先で解を出し切ったあと、盤に最後の盤面のピースが残ったまま 'done' になる（深さ優先は空の盤で終わる）。見た目で問題なら終わりに全部外す手を足す
- 切り替えで探し直すとき、滑っている途中のピースは `settlePiece(piece, false)` で Tween を止めてトレイへ置く
- 幅優先の最速は 8×8 の最初の解まで place 48,346（試した手 28,383 + 置き直し 19,963）と remove 48,334 の計 96,680 手。1 フレーム 1 手・60fps で約 27 分（TODO.md の約 16 分は、試した手の place と remove だけの見積もりに当たり、置き直しの分を含まない）
- テスト（tests.html）と文書は触っていない（別の担当）
