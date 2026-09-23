# TODO

**残っている項目: TODO-041、TODO-042。** これまでに 40 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-043` から。**

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

## TODO-042. HUD のボタンをアイコンにし、ホバーで説明を出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] 本編とデモの HUD のボタン（`createHudButtons()` を通る 12 個。音とタイトルへは共通）を
      文字からアイコンに替える。アイコンは Graphics API で描く
- [ ] マウスでホバーしたら、そのボタンの説明（今のラベルに当たる言葉）を出す
- [ ] タッチ端末では、押したときに動作させつつ説明を少しの間だけ出す
- [ ] screens に横 568x320・縦 390x844 で本編とデモを撮らせ、アイコンの見分けと
      説明の出る位置（画面からはみ出さないか）を確かめる
- [ ] implementer に `README.md` と `docs/developer.md` のボタンの説明も合わせさせる
      （docs の担当は立てない。直すのは数行で、コードを書いた本人なら読み直しが要らない。
      文書とコードの食い違いは reviewer が差分で見る）

背景（立てるときに決めたこと）:

- アイコンは Graphics API で描く。Unicode の記号や絵文字は OS やフォントで
  形が変わり、色の組（ネオンなど）とも合わないため。画像アセットは足さない（`CLAUDE.md`）
- デモの HUD も含める（同じ `createHudButtons()` を通るので見た目を揃える）
- タッチ端末にはホバーが無いので、押したときに短く説明を出す（手数は変えない）

分担: アイコン 12 個の設計と、ホバー・タッチで分かれる表示の実装が込み入るので
implementer を Opus 5.5 に上書きする。入力の扱いが変わるので reviewer も入れる。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
