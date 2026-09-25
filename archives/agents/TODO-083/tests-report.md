# TODO-083 テスト報告（tests.html）

## 追加したテスト

`tests.html` に節「`src/logic.js — URL のデモの指定（parseDemoParams, TODO-083）`」を
足し、`parseDemoParams(search)` を 7 件で確かめた。

1. `''` → `null`
2. `'?board=6x10'`（demo 無し）→ `null`
3. `'?demo=random&board=8x8'` → `{ strategy: 'random', board: '8x8' }`
4. `'?demo=depth&board=6x10'` → `{ strategy: 'depth', board: '6x10' }`
5. `'?demo'`（値なし）→ ランダム・8×8
6. `'?demo=xx&board=9x9'`（知らない値）→ ランダム・8×8
7. `'?demo=depth&board=constructor'`（継承したプロパティ名）→ board は `'8x8'`

`import` に `parseDemoParams` を追加した以外、`tests.html` の他の節には
手を入れていない。

## 実行結果

`python3 -m http.server 8765` を立て、Playwright MCP で
`http://localhost:8765/tests.html` を開いて確認した。

- 全体: **420 件すべて通った**（追加前は 413 件。7 件増加）
- 落ちたテストなし

## 壊して落ちることの確認

`src/logic.js` の `parseDemoParams` を一時的に書き換え、対応するテストが
落ちることを確かめたあと、元に戻した（`git diff src/` で
`parseDemoParams` 部分の差分が無いことを確認済み）。

1. `Object.hasOwn(BOARDS, board)` → `(board in BOARDS)` に変更
   → 「board=constructor のような継承したプロパティ名は 8x8 にする」が
   `期待 "8x8" / 実際 "constructor"` で失敗（1 件失敗・419 件通過）
2. `params.get('demo') === 'depth'` → `params.get('demo') !== 'random'` に変更
   → 「demo に値が無ければランダム・8×8」「知らない値はランダム・8×8にする」の
   2 件が `strategy: 'depth'` になり失敗（2 件失敗・418 件通過）

いずれも元に戻したあと再実行し、420 件すべて通ることを確認した。
`src/` はこのタスクで最終的に変更していない（`git diff src/` の
`parseDemoParams` 関連の差分はゼロ）。
