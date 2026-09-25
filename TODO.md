# TODO

**残っている項目: TODO-080。** これまでに 79 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-081` から。**

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
