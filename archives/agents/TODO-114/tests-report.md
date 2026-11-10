# tests 報告（TODO-114）

- 結果: `466 件すべて通った`（直前 458 件 + 今回 8 件）。console のエラーは 0 件。
- 足したテスト（`tests.html`、`logic.js` の節の末尾、`storage.js` の前に 2 節）
  - `turnMarkKind`（4 件）: T・I は `'rotate'`／V は回転とする／L・F は `'flip'`／X は `null`
  - `turnMarkCenter`（4 件）: U は矩形の真ん中が空いていても `{x: 1.5, y: 1.5}`（埋まったマスの上）／
    P は `{x: 0.5, y: 1.5}`／12 種すべてで中心がピースのマスの中心／入力のマスを書き換えない
- 壊すと落ちるか: X の期待を `'flip'`、U の期待を `y: 0.5` に変えて 1 回走らせ、
  この 2 件だけが落ちた（464 件通過）。そのあと元に戻した。
- 判断が要る点: Playwright MCP の `browser_navigate` が 2 回とも 60 秒でタイムアウトした
  （`tests.html` は今 1 回の実行に約 90 秒かかる。サーバ自体は 200 を返す）。
  npx の置き場の Playwright と `chromium_headless_shell-1243` を `node` から直接動かして走らせた。
  `tests.html` が重くなっている件は実害は未確認。
