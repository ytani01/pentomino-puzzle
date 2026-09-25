# TODO

**残っている項目: TODO-079・TODO-080。** これまでに 78 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-081` から。**

---

## TODO-079. `src/`・`tools/` のコメントを分かりやすく端的にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer ×3（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

- [ ] ① `src/logic.js`・`src/solutions.js`・`src/config.js` のコメントを直す
- [ ] ② `src/scenes/game.js`・`src/scenes/demo.js`・`src/scenes/records.js` のコメントを直す
- [ ] ③ その他の `src/`（`src/data/*.js` を除く）と `tools/*.mjs` のコメントを直す
- [ ] reviewer: 意味が変わったところ、消えた「なぜ」が無いかを見る
- [ ] verifier（reviewer の後）: 差分がコメントだけか（コメントを除いて比べる）、`tests.html` が全件通るか、`node tools/gen-solutions.mjs --check` が通るか

コメント行は約 2,100 行。冗長な言い回し・直訳調・要らない主語を直し、
自然な日本語で端的にする。利用者と決めたこと:

- 対象は `src/` と `tools/`。`tests.html` は外す。`src/data/*.js` は自動生成なので外す
- `（TODO-NNN）` の番号は残す。「TODO-069 レビューの要修正 4」のような経緯は削り、archives に任せる
- 「なぜそうするのか」は残す（`CLAUDE.md` の JSDoc の規約）。中身が無くなったコメントは消す
- コードは変えない
- 決着は `refactor(src): …（TODO-079）` でコミットし、パッチのタグを付けて push する

実装を 3 人に分けるのは量のため。言い回しの揃い方は reviewer が見る。

---

## TODO-080. 使われていない `clearHistory()` を消し、テストを直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（実装）+ verifier（Sonnet 5 / medium） |

- [ ] `src/storage.js` の `clearHistory()` を消す
- [ ] `tests.html` の `clearHistory` を使うテストを直す
  - `clearHistory の後は空の配列になる`・`clearHistory は最短時間を消さない` の 2 件は消す
  - `遊びかけは履歴・達成度と別に保たれる` は、`clearHistory()` の代わりに
    `localStorage.removeItem(spec.historyKey)` で履歴を消す
  - import から `clearHistory` を外す
- [ ] verifier: `rg -n clearHistory --glob '!archives/**'` で参照が残っていないか、`tests.html` が全件通るか

TODO-079 の途中で見つかった。ゲームからは呼ばれず、`tests.html` だけが使っている。
利用者が「使われていないコードは消す」と決めた。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
