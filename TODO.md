# TODO

**残っている項目: TODO-105、TODO-106、TODO-107。** これまでに 104 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-108` から。**

## TODO-105. 確認ダイアログの組み立てを ui.js にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [ ] `src/scenes/game.js` と `src/scenes/records.js` の `createConfirmDialog()`
      （背景の帯・枠・文言・「はい」「いいえ」）を `src/ui.js` の 1 つの関数にする
- [ ] 確認の枠の大きさを `src/config.js` の 1 か所に置き、`records.js` が
      `LAYOUTS.landscape['8x8'].confirm` から借りるのをやめる。`records.js` の
      `depth = 10` の直書きも無くす
- [ ] `docs/developer.md` と `CLAUDE.md` の `src/ui.js` の説明に足す

挙動は変えない。`openConfirm()` / `hideConfirm()` の文言と行き先、向きが変わったときの
開き直し（`confirmKind`）は各シーンに残す。

**無駄を省く工夫:** 画面の確認は、本編と記録で確認を 1 つずつ開いた 2 枚
（縦・横のどちらか片方）で足りる。4 種類の確認を全部は開かない。`tests.html` は流さない
（`logic.js` に触らない）。

## TODO-106. storage.js の番号の保存（見つけた解・おまかせの解）を 1 組にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [ ] `loadFound` / `addFound` / `clearFound` と `loadAuto` / `addAuto` / `clearAuto` の
      中身を、保存先のキーを引数に取る内部関数（今の `removeNumber()` と同じ形）へ寄せる

挙動は変えない。export の名前と引数は変えず、呼ぶ側（`game.js`・`records.js`・
`tests.html`）には触らない。

**無駄を省く工夫:** 確認は `tests.html` の既存のテストが全件通ることだけを見る。
テストは足さない（足りないものが見つかったら報告させる）。画面は撮らない。

## TODO-107. 配置の数値の置き場の規約を、今のコードに合わせて直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main のみ |

- [ ] `CLAUDE.md` の「数値と色は `src/config.js` に集約する」を、「その画面だけの配置の
      数値はシーンの先頭に置く。複数の画面で使う数値と、色は `src/config.js`」と直す
- [ ] `docs/developer.md` に同じ主張があれば揃える

`records.js`・`title.js`・`clear.js` の先頭に配置の数値（合わせて 150 行ほど）があり、
規約と食い違っている。`config.js` へ移さず規約のほうを直すと決めた（2026-11-10。
移しても `config.js` が 1000 行を超えるだけで、読む場所が画面から離れる）。コードは動かさない。

**無駄を省く工夫:** 文書だけの項目なので担当を立てない。シーンに色の直書きが無いことは
確かめ済み（`game.js` の透明な当たり判定の `0x000000` だけ）で、調べ直さない。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
