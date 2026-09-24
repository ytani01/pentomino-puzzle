# TODO-066 verifier report

## 1. `tests.html` を Playwright（headless Chromium）で開いて全件実行

`python3 -m http.server 8765` を立て、Playwright（`~/.npm/_npx/*/node_modules/playwright`）の
headless Chromium で `http://localhost:8765/tests.html` を開いた。

- `#summary`: `322 件すべて通った`
- ページ内コンソールエラー: 0 件

（変更前は 318 件だったので、TODO-066 で足した 4 件のテスト分だけ増えている。数の上でも一致）

## 2. `node tools/gen-solutions.mjs --check`

終了コード 0（通った）。

## 3. デモの実物（`window.game.scene.getScene('Demo')`）で generator の手を集めて数える

`src/main.js` でシーン名は `'Demo'`（`DemoScene extends GameScene { constructor() { super('Demo'); } }`）。

`game.scene.start('Demo')` で直接デモへ入り、`scene.strategy = 'random'` にしたうえで
`scene.startSearch()` を呼んで generator を作った。**タイマー（`update()`）を経由せず
`scene.steps.next()` を直接呼んで手を集めた**（速さ設定は無関係。依頼の「最速」に
相当する動きをタイミングの制約なしで確かめたことになる。待ち時間の見た目は確認していない）。

集めた手をそのまま `src/logic.js` の `forcedPlacements()` / `sameShape()`
（実装本体と同じ関数）で作った影の盤面に当てて判定した。300 手を 1 回、5000 手を
3 回（合計 15,300 手、乱数はブラウザの `Math.random`。実行ごとに手の並びは変わる）
集めて数えた。

- 埋められる 5 マスの穴があったのに別の場所へ置いた回数: **0 件**（4 回の実行すべてで 0）
- 埋めた回数（forced な手が選ばれた回数）: 22 / 57 / 51 / 22 件（合わせて 152 件ほど）
- 埋めて解なし（`place` の `ok` が偽）→ 直後に `remove` 2 手、2 手目の `name` が
  埋める直前の手と一致した回数の食い違い: **0 件**（forced な解なしは合計 109 回
  起きて、すべて「直後 2 手が remove・2 手目の name が一致」を満たした）
- コンソールエラー: 0 件（4 回の実行すべて）

## 4. 読み合わせ（`docs/UsersGuide.md`・`docs/developer.md`・`src/logic.js` の JSDoc）

3 の実測と食い違いは無かった。

- `docs/UsersGuide.md`: 「5 マスの穴に残りのピースがちょうど合うときは、他の置き方より
  先にそのピースで埋める」「5 マスの穴を埋めた直後に解なしになったときは…置いた直後に
  外す（穴を埋めた場合は、その前に置いた手もまとめて外す）」— 3 の結果と一致
- `docs/developer.md`（「解ける／解なし」の行）: 「5 マスの穴に合う残りのピースで埋めた
  直後に解なしになったときは…その場で外す（後者はその前に置いた手もまとめて外す）」—
  一致
- `src/logic.js` の `solveStepsRandom()` の JSDoc: 「5 マスの穴に合う残りのピースで
  埋めた手が、その `canContinue` を偽にしたとき…埋めた手と、その前に置いた手をまとめて
  外す」— 一致

## 変更されたファイルと指示の範囲

`git status` の変更（`TODO.md`, `docs/UsersGuide.md`, `docs/developer.md`, `src/logic.js`,
`tests.html`）はすべて TODO-066 のチェック項目（`solveStepsRandom()` の forced な埋め方と
二重の外し、`tests.html` のテスト追加、`UsersGuide.md`・`developer.md` の説明更新、
`TODO.md` 自体の追記）に対応しており、指示の範囲外のファイルは無かった。

## 確かめられなかったこと・判断できないこと

- 「合う置き方が控え（`failed`）に入っていれば選ばず、今までどおりに選ぶ」の枝は、
  3 の実測（15,300 手）では踏んだかどうかを個別に数えていない（依頼の数える項目に
  無かったため）。`tests.html` 側には専用のテストがある（読んだのみ、実行は 1 と同じ）
- デモの見た目（待ち時間・アニメーション）は依頼どおり確認していない（generator を
  直接進めたため）
- コード上の境界線の判断（forced の判定順序や `canContinue` の呼ぶ回数の妥当性など）は
  行っていない。報告のみ
