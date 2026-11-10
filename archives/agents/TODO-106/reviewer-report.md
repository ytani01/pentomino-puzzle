# TODO-106 reviewer 報告

対象: `git diff 2ebf43c..c78c338 -- src/storage.js`（挙動を変えない項目）。

**要修正: 0 件。挙動の変化は見つからなかった。**

## 実測（挙動の一致）

旧版（`git archive 2ebf43c`）と新版の `src/storage.js` を、Node で同じ入力に対して動かして返り値と最後の保存内容を比べた。
スクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/ca3ec056-bc57-4758-b5fe-1db36446e374/scratchpad/diff.mjs`（リポジトリには置いていない）。

- 保存の状態 4 通り: 正常 / `getItem`・`setItem`・`removeItem` が全部例外 / `setItem`・`removeItem` だけ例外 / `window.localStorage` の取得自体が例外
- 保存データ 11 通り: 無し、`{{`、`5`、`[1,2,3]`、`{"a":1}`、`null`、`"x"`、履歴の形、`-5`、`constructor`、空文字
- 全 export（load / save / add / remove / clear / record / sanitize 系）を呼び、返り値・例外の有無・最後の保存内容を比較
- 追加: `loadHistory` に壊れた `solutions`（`numbers: null`）を渡す
- 結果: 4 通りすべてで旧版と新版の出力が完全に一致（`cmp` で差なし）。例外が外へ出たものも無い。
  （出力に出る `THROW` は、比較スクリプトが `BigInt` を `JSON.stringify` した分だけで、新旧とも同じ数）

## export ごとの照合（(a) 正常値 (b) 使えないとき (c) 壊れたデータ (d) 例外を出さない）

`loadBest`・`saveBest`・`loadPalette`・`savePalette`・`loadHistory`・`recordClear`・`removeHistoryMany`・
`loadFound`・`addFound`・`removeFound`・`clearFound`・`loadAuto`・`addAuto`・`removeAuto`・`clearAuto`・
`loadProgress`・`saveProgress`・`clearProgress`・`sanitizeHistory`・`sanitizeFound`・`sanitizeProgress`
— すべて (a)〜(d) が同じ。

読んで確かめた点:
- try の範囲: 書き込みの値の組み立て（`JSON.stringify`・`String(Math.round())`・`sanitizeHistory()`）は `writeItem(key, makeValue)` の thunk で `try` の中に残っている。`loadHistory`・`loadProgress`・`loadNumbers`・`removeNumber` も、元どおり `sanitize*()` などを含めて `try` で囲んでいる。狭くなった箇所は無い
- `keyOf()` / `boardOf()` は元は `try` の中だったが、`BOARDS[...] || 既定` で例外を出さない（読んで確認）ので、外に出ても同じ
- `removeNumber` の「使えない → `[]` を返して書かない」「無い（`null`）→ `[]` を書く」の区別は、`readItem` の `undefined` / `null` で保たれている（実測でも一致）
- 書き込み失敗時に呼ぶ側へ返す値（`saveBest` の `{ best: ms, updated: true }`、`recordClear` の `'new'`/`'improved'`、`removeHistoryMany` の `next`、`saveProgress` の `sane`、`addFound` の `next`）は同じ
- 失敗しても遊べる理由のコメントは、呼ぶ側に残っている

## 検討

1. `src/storage.js` の `readItem()` の JSDoc（「例外を外へ出さないのはここだけ（読み・書き・消すの 3 つ）」）
   — `parseStored()` も `JSON.parse` の例外を握りつぶしているので「ここだけ」は言い過ぎ。「localStorage の操作では」に限る言い方なら正確。
   根拠: 同じファイルの `parseStored()`。実害は無い（コメントのみ）
2. `tests.html` に、localStorage が使えない（例外を投げる）ときの返り値のテストが無い（`rg` で確認。実装者の報告も同じ指摘）。
   今回の実測は使い捨てなので、`writeItem` / `readItem` を通る経路は今後の変更で壊れても自動では落ちない。
   この項目の範囲外なので、足すなら別の項目。実害は未確認

## 好みの範囲

1. `savePalette()` の `writeItem(PALETTE_STORAGE_KEY, () => key)` は、値が既に文字列で組み立てが要らないのに thunk を挟む。
   `writeItem` の引数を「値を返す関数」に統一した結果で、読み手には少し回りくどい。挙動は同じ

## 作り込みすぎ

なし。`loadNumbers` / `addNumber` は 2 組（found・auto）の重複を消しており、`readItem` / `writeItem` / `removeItem` / `parseStored` も 4 か所以上で使われている。

## 文書との整合

`docs/developer.md`「読み書きの構え」の「localStorage への操作はすべて `try` で包み、例外を握りつぶす」は、今も正しい。直しは要らない。
`CLAUDE.md` の `storage.js` の説明も変更なし。規約（`setTimeout` 不使用・JSDoc に「なぜ」・空の `/** */` なし）に違反は無い。
