# TODO

**残っている項目: TODO-106。** これまでに 114 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-116` から。**

**着手の順番:** 同じ箇所に触る項目は TODO-109 → 110 → 111 → 114 と、TODO-105 → 108 → 115 の
順に進める。TODO-106・112・113 はどれとも独立（ただし TODO-113 は TODO-110 と同じく
`logic.js` と `tests.html` の import に触るので、続けて頼むときは前の項目のコミットを待つ）。

## TODO-106. storage.js の読み書きの繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [x] `loadFound` / `addFound` / `clearFound` と `loadAuto` / `addAuto` / `clearAuto` の
      中身を、保存先のキーを引数に取る内部関数（今の `removeNumber()` と同じ形）へ寄せる
- [x] `window.localStorage` の読み書きを囲む try/catch（10 か所ほど）を、読む・書く・消すの
      内部関数に寄せる。失敗しても遊べる理由のコメントは、呼ぶ側に残す
- [x] `sanitizeHistory()` / `sanitizeFound()` / `sanitizeProgress()` の先頭にある
      「文字列なら `JSON.parse`、だめなら空」を 1 つにする

挙動は変えない。export の名前と引数は変えず、呼ぶ側（`game.js`・`records.js`・
`tests.html`）には触らない。

**無駄を省く工夫:** 確認は `tests.html` の既存のテストが全件通ることだけを見る。
テストは足さない（足りないものが見つかったら報告させる）。画面は撮らない。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
