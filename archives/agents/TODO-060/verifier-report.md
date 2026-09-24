# TODO-060 verifier report

## 1. `tests.html` を実際に開いて全件実行

`python3 -m http.server 8765` を立て、Playwright（`~/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`）の
headless Chromium で `http://localhost:8765/tests.html` を開いた。

- `#summary`: `318 件すべて通った`
- PASS 318 / FAIL 0
- ページ内コンソールエラー: なし

## 2. デモ（ランダム・速さ「速い」）を 200 手ほど計測

`window.game.scene.start('Demo')` でデモを直接起動し、`scene.steps.next` をラップして
`advance()` が処理した各手（type/name/ok）を記録。並行して、記録した `place`/`remove` を
`logic.js` の `place()`/`remove()`（実装本体と同じ関数）でそのまま検証用の影の盤面に
適用し、`emptyRegionSizes()` で判定した。`scene.waitScale` は `advance()` 呼び出し直後の
値をそのまま読んだ（別実装で再現していない）。

- 記録した手数: 200
- `place` の直後に `PIECE_SIZE` 未満の空きがある盤面: **80 件**、うち次の手が同じ名前の
  `remove` でなかったもの: **0 件**（一致）
- `remove` のあとの `remove`（連なり）: **17 件**、うち `waitScaleAfter !== 0` だったもの:
  **0 件**（一致。すべて 0）
- `place` のあとの `remove`: **81 件**、うち `waitScaleAfter === 0` だったもの:
  **0 件**（一致。すべて 0 でない値）

## 3. 深さ優先・50 手ほど

同じ仕組みで `strategy = 'depth'` に切り替えて 50 手記録。

- 記録した手数: 50
- `place` のあとの `remove`: **18 件**、うち `waitScaleAfter !== 1` だったもの:
  **0 件**（一致。すべて 1）

## 4. 最速で 100 手進め、コンソールエラーが無いこと

`strategy = 'random'`、`speed = 'fastest'` で 100 手進めた。`page.on('pageerror')` /
`console.error` を全区間で監視した結果、エラーは **0 件**。

## 5. `node tools/gen-solutions.mjs --check`

依頼どおり実行しなかった（依頼書に「済んでいるので要らない」とある）。

## 変更ファイルと範囲

`git status` の変更（`TODO.md`, `docs/UsersGuide.md`, `docs/developer.md`, `src/config.js`,
`src/logic.js`, `src/scenes/demo.js`, `tests.html`）はすべて TODO-060 のチェック項目
（`solveStepsRandom()` の即外し、`demo.js` の連なり時の待ち時間、`tests.html` のテスト追加、
`UsersGuide.md`・`developer.md` の説明更新、`TODO.md` 自体の追記）に対応しており、
指示の範囲外のファイルは無かった。

## 確かめられなかったこと・判断できないこと

- 計測は Playwright で実際に `DemoScene` を動かし、実装本体の `place()`/`remove()`/
  `emptyRegionSizes()` をそのまま使って判定したが、乱数シードは Playwright 側の
  `Math.random()`（TODO-060 の実装は `Math.random` を渡す）で、再現性のある固定シードでは
  ない。同じコードを別セッションで動かすと手の並びは変わるが、今回の実測では 5 項目とも
  違反 0 件だった
- `tests.html` の中身（テストの強さ、例えば「壊すと落ちるか」）は確認していない。
  依頼書の範囲が実測 4 項目＋`gen-solutions.mjs`（不要）だったため
- コード上の境界線の判断（例えば `PIECE_SIZE` ちょうど 5 マスの空きを即外ししない設計の
  妥当性）は行っていない。報告のみ
