# tests 報告（TODO-116）

- 結果: `476 件すべて通った`（直前 466 件 + 今回 10 件）。console のエラーは favicon.ico の 404 の 1 件だけ。
- 足したテスト（`tests.html`、`storage.js` の節の末尾に 1 節）。`localStorage` が使えない状態は
  `Storage.prototype` の `getItem` / `setItem` / `removeItem` を差し替えて作り、finally で必ず戻す
  （`withThrowingStorage()`）。壊れたデータを置くテストは `withCleanStorage()` を通す。
  - ボードごと（8×8・6×10）に 4 件 = 8 件
    - 例外を投げるとき: `loadHistory` は `[]`、`loadProgress` は `null`、`loadFound` は `[]`
    - 例外を投げるとき: `addFound` は例外を出さず `[3]` を返す
    - 壊れたデータ（`'not json'`・途中で切れた JSON・形違い・`null` など 6 通り）: `loadHistory` `[]` / `loadProgress` `null` / `loadFound` `[]`
    - 壊れた見つけた解のデータ: `addFound` は例外を出さず `[3]` を返し、`loadFound` も `[3]` になる（書き直せる）
  - 色の組 2 件（ボードに依らない）
    - 例外を投げるとき: `savePalette` は例外を出さず `undefined`、`loadPalette` は既定の組
    - 壊れた値・知らないキー: `loadPalette` は既定の組、`savePalette` で書き直せる（元の値は finally で戻す）
- 壊すと落ちるか: `readItem()` と `writeItem()` の try/catch を一時的に外して 1 回走らせると
  3 件が落ちた（473 件通過）。そのあと `git checkout src/storage.js` で戻した（`git status` で `src/` に変更なし）。
  - 落ちた: `addFound` の例外テスト（8×8・6×10）、`savePalette` の例外テスト
  - `loadHistory` / `loadProgress` / `loadFound` のテストは落ちなかった。この 3 つは
    呼ぶ側にも try/catch があるため（`readItem()` の try だけを外しても外へ出ない）。実害は未確認。
- 既存のテストは書き直していない。`import` に `PALETTE_STORAGE_KEY`・`loadPalette`・`savePalette` を足しただけ。
