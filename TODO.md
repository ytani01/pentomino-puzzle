# TODO

**残っている項目: TODO-041。** これまでに 40 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-042` から。**

---

## TODO-041. すべての画面の右下にバージョンを出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | main（実装）+ screens（Sonnet 5 / low） |

- [ ] `title.js` と `game.js` にある同じ表示のコードを、`src/ui.js` の
      `createVersionText(scene)` 1 つにまとめる（位置は `SCREEN` の右下）
- [ ] Title・Game（Demo は継承で同じものを呼ぶ）・Clear・Records から呼ぶ
- [ ] screens に横・縦の 4 画面（Title・Game・Clear・Records）を撮らせ、
      右下のバージョンが他の表示と重ならないか確かめる

背景: 今はタイトル・本編・デモにだけ出ていて、クリアと記録には無い。
`layout.width` / `layout.height` は `SCREEN` と同じ値なので、`SCREEN` で揃えてよい。
Boot は一瞬で切り替わるので対象外。分岐は変わらないので reviewer は入れない。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
