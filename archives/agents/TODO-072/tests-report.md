# TODO-072 tests の報告

## 結果

`python3 -m http.server 8765` 経由の `tests.html`: **392 件すべて通った**
（MCP の Playwright と、下の壊し方のスクリプトの新しいコンテキストの両方で。コンソールのエラーは favicon.ico の 404 だけ）。
前は 362 件通過・2 件失敗（計 364）。足したのは 28 件。`src/` は触っていない。

## 変えたところ（`tests.html` だけ）

- import に `isBetterClear`・`dedupeHistory`・`recordClear` を足した
- 遊びかけの検証（sanitizeProgress）
  - 書き換え（前提が変わったため）:「12 個とも盤に載っていたら捨てる」→「12 個とも盤に載った（完成した）盤面も捨てずに通す」（8×8・6×10）
  - 追加:「完成させた解の番号は、正の整数だけを重なりなく持ち越す」「完成させた解の番号を持たない前の形は、空の一覧として読む」（各盤）
- 新しい節「成績の比べ方（isBetterClear・dedupeHistory）」: 純関数で 6 件（印の優先の両方向、時間の比較と同じ時間、印は有無だけ、まとめ方、同成績は新しい方・番号無しは通す）
- 保存して読み出す（各盤）
  - recordClear 7 件: `'new'`（先頭へ足す）／印ありの記録を印なしで遅い回が上書き `'improved'`（先頭へ移る・保存の時点で 1 件）／印が同じで短い回が上書き `'improved'`／印なしの記録を印ありで速い回は上書きしない `'kept'`／印が同じで遅い・同じ時間は `'kept'`／同じ解が複数ある履歴を読むと 1 件にまとまる／recordClear は最短時間に触らない
  - 前処理が 3 回以上出るので、節の中に `recordOnto(entries, entry)`（履歴を置いて recordClear を呼び、結果と読み直した履歴を返す）をまとめた。localStorage は全件 `withCleanStorage()` を通す
  - 遊びかけ 2 件: 完成した盤面と `solved` を保存して戻る／`solved` の無い前の形も読めて `solved` は空

## 壊し方ごとの落ちた件数

`src/` と `tests.html` の写しを scratchpad に作り、写しの `storage.js` を 1 か所ずつ書き換えて、別のポート（8793）で新しいコンテキストから走らせた（本物の `src/` は触っていない）。スクリプトは
`/tmp/claude-649/-home-ytani-work-pentomino-puzzle/cca004d0-857c-4d9d-8a29-4fff99c43862/scratchpad/mutate.mjs`（一時置き場）。

| 壊し方 | 落ちた件数 |
|---|---|
| 印の優先を外す | 9 |
| 印の優先を逆にする | 9 |
| 印を `a` だけで見る（`h` を無視） | 4 |
| 時間の比較 `<` を `<=` にする | 4 |
| 時間の比較を逆にする | 9 |
| まとめで最初の件を残す（成績を見ない） | 3 |
| まとめで同成績なら後（古い方）の件を残す | 1 |
| loadHistory でまとめない | 2 |
| recordClear で `'kept'` にしない | 4 |
| recordClear で上書きせず足す | 2（初回は 0。読むときのまとめに隠れたので、保存した件数を見る assert を足した） |
| recordClear で上書きした件を先頭へ移さない | 2 |
| 完成した盤面を捨てる（前の挙動） | 4 |
| `solved` の重なりを落とさない | 2 |
| `solved` を持ち越さない | 4 |

## 確かめていないこと

- 「記録に無い解は見つけた解にも加える」「最短時間は自力の回だけ」は本編（`game.js` の `recordSolved()`）が `addFound()`・`shouldRecordBest()`・`saveBest()` を呼んで行っており、`storage.js` の関数には無い。`tests.html` の対象外（Phaser）なので、確かめたのは「recordClear は最短時間に触らない」までと、既存の `shouldRecordBest`・`addFound` のテスト。本編の呼び方は verifier の範囲
- `addHistory()` のテスト（「同じ番号の解は既出として足されない」など、TODO-021/024 の決めごと）は書き換えていない。アプリから呼ばれなくなったので、残すか消すかは管理者の判断
