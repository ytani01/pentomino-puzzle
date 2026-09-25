# TODO

**残っている項目: TODO-078。** これまでに 77 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-079` から。**

---

## TODO-078. デモのランダムのアイコンを別の図案に替える

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ screens（Sonnet 5 / low） |

- [ ] `src/icons.js` の `SCATTER_NODES`・`SCATTER_EDGES` を下の図案に替える
- [ ] `ICONS.depthFirst` の JSDoc の「輪もできる」を直す（この図案は輪が無く、一筆でつながる）
- [ ] `node tools/capture.mjs` で `docs/images/` のデモのキャプチャを撮り直す

利用者が 10 通りの候補から 3 番を選んだ（2026-09-25。比較画像は
`~/tmp/playwright-mcp/random-icon-ten.png`）。節 6 つ・大きさは今と同じで、交差は 2 か所。
線が関係ない節の上を通らないことは座標から計算して確かめてある。

```js
const SCATTER_NODES = [[-0.5, 0.25], [0.45, -0.65], [-0.25, -0.7], [0.7, -0.05], [0.1, 0.45], [0.6, 0.7]];
const SCATTER_EDGES = [[1, 0], [3, 5], [2, 3], [4, 2], [0, 4]];
```

`docs/UsersGuide.md` の「線が絡まった点」はそのままで合う。
形だけの変更で挙動は変わらないので reviewer は入れない。screens には
深さ優先と並べて見分けられるか、0.5 倍で潰れないかを見させる。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
