# implementer-3 の報告（TODO-079）

## ファイルごとの直した件数（コメントのブロック単位）

| ファイル | 件数 |
|---|---|
| `src/main.js` | 3 |
| `src/audio.js` | 3 |
| `src/storage.js` | 28 |
| `src/ui.js` | 14 |
| `src/icons.js` | 4 |
| `src/scenes/boot.js` | 7 |
| `src/scenes/title.js` | 7 |
| `src/scenes/clear.js` | 9 |
| `tools/capture.mjs` | 4 |
| `tools/enumerate.mjs` | 4 |
| `tools/gen-solutions.mjs` | 1 |
| `tools/window-shim.mjs` | 0（直すところが無かった） |

`tools/gen-solutions.mjs` の 28〜40 行目はテンプレートリテラル（`src/data/*.js` へ書き出す文字列）なので触っていない。

## 検証

- `git diff -U0` の `+`/`-` 行のうち、コメント（`//`・`*`・`/**`）で始まらない行は 0 行
- `node --check`（`.mjs`）と `node --input-type=module --check < file`（`src/`）を 12 ファイルすべてに実行し、すべて終了コード 0

## 消したコメントのうち判断に迷ったもの

- `src/main.js:29-32` 「TODO-069 レビューの要修正 4」と `GameScene.create()` から呼んでいた経緯を消し、理由（シーンへ入るたびに設定するとリスナーが積み上がる）だけを残した
- `src/storage.js` 履歴の説明（元 121-132 行）: `canonicalCellsKey()` が要らなくなった経緯を消した。`h` / `c` → `a` / `h` の付け替え（TODO-028）は `historyKey` を変えた理由なので、短くして残した
- `src/storage.js` `shouldRecordBest()`（元 90-93 行）: 「前は履歴と達成度も落としていた」の経緯を消し、「どの解を解いたか辿れるようにする」という理由に言い換えた
- `src/storage.js` `dedupeHistory()`（元 247 行）: 「TODO-072 より前は最初に解いた回を残していた」を「同じ番号は普段 1 件」に言い換えた
- `src/storage.js` 見つけた解の説明（元 406-407 行）: 「履歴 1 件（60 マスぶんの文字列）を 50 件持つのと大差ない」を消した。履歴はもう `cells` を持たない（TODO-022）ので、比べる相手として古い
- `src/ui.js` `createChoiceRow()`（元 156-158 行）: タイトルの private メソッドだった経緯を消した
- `src/scenes/title.js` `STACK`（元 26-29 行）: 行や文字を足した経緯（TODO-008・TODO-026・TODO-076）を番号だけにまとめた。「合わせて 632 で下端に 8」は計算して確かめた（632）
- `tools/enumerate.mjs:5-7` `src/solver.js` から移した経緯を「（元は `src/solver.js`）」だけにした（`CLAUDE.md` の表にも同じ記述がある）

## 範囲外だが気づいたこと（直していない）

- `src/storage.js` `clearBest()` の JSDoc「タイトルからの操作用」: いまは `src/` のどこからも呼ばれていない（`rg clearBest src` で定義だけ）。説明が現状と合わない。意味が変わるので直していない
- `src/storage.js` `clearFound()`・`clearAuto()` の「履歴を消すときに一緒に呼ぶ」: 実際に呼ぶのは `removeRecords()`（記録が 1 件も残らないとき）。大きくは外れていないのでそのまま
- `src/scenes/clear.js` の最短時間・状態の行のコメント（元 128-132 行）は、状態の行（`status`）の直前に最短時間（`bestLine`）の説明も書かれている。コメントを動かすと空行やコードとの並びが変わるので、位置は変えず、最短時間の話と状態の行の話を文で分けるだけにした
