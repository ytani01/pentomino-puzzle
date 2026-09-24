# TODO-062 verifier 報告

## 対象

未コミットの差分（`src/config.js`・`src/logic.js`・`docs/UsersGuide.md`・`docs/developer.md`・`tests.html`）。
`solveStepsRandom()` の置き方の抽選に `moveDistance()` と `DEMO.randomNearPower` を使った近さの重みを掛けた件。

## 1. `node tools/gen-solutions.mjs --check`

終了コード 0。

```
8×8: 全 520 解、代表形 65 件（6.1 秒）
  → src/data/8x8.js と一致した
6×10: 全 9356 解、代表形 2339 件（149.0 秒）
  → src/data/6x10.js と一致した
```

## 2. `tests.html`（Playwright headless Chromium、`http://localhost:8765/tests.html`）

ページの見出しは「327 件すべて通った」。コンソールエラーは 1 件のみで、
別途 `response` イベントで 400 以上のステータスを取り直したところ再現せず
（`favicon.ico` 等ブラウザ側の既定リクエストとみられる。テストの実行とは
無関係と判断。**実害は未確認**）。

- Playwright は `~/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs` を借用。
- ヘッドレスシェル（`chromium_headless_shell-1237`）が未インストールだったため、
  代わりに `~/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
  （フル chromium、既にキャッシュ済み）を `executablePath` で指定して起動した。

## 3. デモの実物（ランダム・最速、2000 手）

`window.game.scene.start('Demo')` でデモへ入り、全解データを待ってから
`scene.strategy = 'random'; scene.speed = 'fastest';` を設定し、`scene.advance()`
を直接 2000 回呼んで進めた（`update()` の時間待ちを介さず、テスト用に
ループで駆動）。

- 呼び出し 2000 回とも例外なし
- コンソールエラー 0 件
- `tried`（置いた回数）972、`solvedCount`（解けた回数）1、最終状態 `running`

## 4. JSDoc・文書と差分の動きの食い違い

- `src/config.js`・`src/logic.js` の JSDoc、`docs/UsersGuide.md`、
  `docs/developer.md` を読んだ範囲で、「近さは選んだピースの置き方にだけ掛かる
  （ピースの選び方は変えていない）」「`stack` が空なら掛けない」という説明と
  実装（`solveStepsRandom()` の `last ? touch / (1 + moveDistance(m, last)) ** DEMO.randomNearPower : touch`）は一致していた。食い違いなし。
- `docs/developer.md` の探し方の表には「直前に置いた手に近いほど
  （`moveDistance()`）重みが大きくなる」とだけ書かれ、`stack` が空（最初の手）
  のときに掛からない点までは明記されていない。誤りではないが省略はある。
  **実害は未確認**（読み手の理解に支障があるかは判断できない。境界線上の
  判断として報告のみ）。

## 見なかったもの

依頼どおり、値の良し悪し・画面の見た目・レイアウト・テストの強さは見ていない。

## 変更ファイルと指示の範囲

`git status` は
`docs/UsersGuide.md` / `docs/developer.md` / `src/config.js` / `src/logic.js` / `tests.html`
の変更と、`archives/agents/TODO-062/`（未追跡）のみ。依頼の対象範囲と一致。
