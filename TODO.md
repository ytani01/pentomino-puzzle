# TODO

**残っている項目: TODO-102。** これまでに 101 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-102` から。**

---

## TODO-102. デモの既定の速さを「ゆっくり」にし、今の探し方を HUD に出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `DEMO.defaultSpeed` を `'fast'` から `'slow'` にする
- [ ] HUD の 1 段目を「試した手 N　見つけた解 N　探し方 人間的」にし、探し方を切り替えたら書き換える
- [ ] `docs/UsersGuide.md` と `docs/developer.md` の該当箇所を直す

探し方の既定はすでに人間的（`demo.js` の `this.strategy`）なので変えない。
表示の位置は利用者が HUD の 1 段目に決めた。縦画面では右端の札
（解ける／解なし）と重ならないかを screens で撮って確かめる。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
