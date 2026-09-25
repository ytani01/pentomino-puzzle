# TODO

**残っている項目: TODO-084。** これまでに 84 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-086` から。**

---

## TODO-084. README のデモの GIF を撮り直し、デモを直接開くリンクにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main + screens（Sonnet 5 / low） |

- [ ] `README.md` の `docs/images/demo.gif` を、`https://ytani01.github.io/pentomino-puzzle/?demo=random&board=8x8` へのリンクにする（TODO-083 の URL）
- [ ] `tools/capture.mjs` の GIF を撮り直す（TODO-081・082 でランダムの動きが変わったため）。撮るときも同じ URL で開くようにできるなら、そうする
- [ ] GIF のフレームを抜いて、欠けていないか・余計なものが映っていないかを見る（screens）

**背景。** GitHub の README は `<iframe>` を取り除くので、動いているデモは
埋め込めない。代わりに今ある GIF をリンクにして、押せば本物のデモが開くようにする
（利用者が 1 と 3 の組み合わせを選んだ。2026-09-26）。TODO-083 が済んでから着手する。
文書と `tools/` だけなので、公開のタグは付けない。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
