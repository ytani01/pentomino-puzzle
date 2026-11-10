# TODO

**残っている項目: TODO-105、TODO-106、TODO-108、TODO-115。** これまでに 111 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-116` から。**

**着手の順番:** 同じ箇所に触る項目は TODO-109 → 110 → 111 → 114 と、TODO-105 → 108 → 115 の
順に進める。TODO-106・112・113 はどれとも独立（ただし TODO-113 は TODO-110 と同じく
`logic.js` と `tests.html` の import に触るので、続けて頼むときは前の項目のコミットを待つ）。

## TODO-105. 確認ダイアログの組み立てを ui.js にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [x] `src/scenes/game.js` と `src/scenes/records.js` の `createConfirmDialog()`
      （背景の帯・枠・文言・「はい」「いいえ」）を `src/ui.js` の 1 つの関数にする
- [x] 確認の枠の大きさを `src/config.js` の 1 か所に置き、`records.js` が
      `LAYOUTS.landscape['8x8'].confirm` から借りるのをやめる。`records.js` の
      `depth = 10` の直書きも無くす
- [x] `docs/developer.md` と `CLAUDE.md` の `src/ui.js` の説明に足す

挙動は変えない。`openConfirm()` / `hideConfirm()` の文言と行き先、向きが変わったときの
開き直し（`confirmKind`）は各シーンに残す。

**無駄を省く工夫:** 画面の確認は、本編と記録で確認を 1 つずつ開いた 2 枚
（縦・横のどちらか片方）で足りる。4 種類の確認を全部は開かない。`tests.html` は流さない
（`logic.js` に触らない）。

## TODO-106. storage.js の読み書きの繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [ ] `loadFound` / `addFound` / `clearFound` と `loadAuto` / `addAuto` / `clearAuto` の
      中身を、保存先のキーを引数に取る内部関数（今の `removeNumber()` と同じ形）へ寄せる
- [ ] `window.localStorage` の読み書きを囲む try/catch（10 か所ほど）を、読む・書く・消すの
      内部関数に寄せる。失敗しても遊べる理由のコメントは、呼ぶ側に残す
- [ ] `sanitizeHistory()` / `sanitizeFound()` / `sanitizeProgress()` の先頭にある
      「文字列なら `JSON.parse`、だめなら空」を 1 つにする

挙動は変えない。export の名前と引数は変えず、呼ぶ側（`game.js`・`records.js`・
`tests.html`）には触らない。

**無駄を省く工夫:** 確認は `tests.html` の既存のテストが全件通ることだけを見る。
テストは足さない（足りないものが見つかったら報告させる）。画面は撮らない。

## TODO-108. 文字のスタイルの組み立てを ui.js の 1 つの関数にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ reviewer（Sonnet 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [ ] `fontFamily`・`fontSize`・`color` の 3 つを組んだスタイルを返す関数を `src/ui.js` に
      置き、`this.add.text()` / `scene.add.text()` の 35 か所を差し替える
      （対象は `rg -n "fontFamily: FONT.family" src`）
- [ ] `docs/developer.md` と `CLAUDE.md` の `src/ui.js` の説明に足す

挙動は変えない。`align`・`lineSpacing`・`wordWrap`・`padding` を足している箇所と、
`color` を付けていない箇所（`title.js` の `bestText`）、`FONT` に無い大きさ
（`clear.js` の `TIME_FONT`、`ICON.captionSize`、`createButton()` の 0.85 倍）は、
差し替えたあとも同じスタイルになること。

**無駄を省く工夫:** reviewer は差し替えの前後でスタイルのキーと値が同じかを差分で見る。
画面は 5 つのシーンを 1 枚ずつ（縦・横のどちらか片方）で足りる。`tests.html` は流さない。
TODO-105 のあとに着手する（確認ダイアログの文字が `ui.js` へ移ってから差し替える）。

## TODO-115. title.js と clear.js の長い create() を部品ごとのメソッドに分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [ ] `src/scenes/title.js` の `create()`（156 行）を、`game.js`・`records.js` と同じく
      部品ごとの `createXxx()` に分ける
- [ ] `src/scenes/clear.js` の `create()`（128 行）も同じく分ける

挙動は変えない。部品を作る順番（重なりの順）と、縦に積む位置の計算（`stackTops()` に渡す
行と結果）は保つ。分け方（どこで切るか・メソッドの名前）は implementer に任せ、
JSDoc の「なぜ」は切った先へ一緒に動かす。

**無駄を省く工夫:** 画面はタイトルとクリア表示を縦・横 1 枚ずつ、直す前後で撮り比べる
（配置が向きで違うので両方要る）。`tests.html` は流さない。TODO-108 のあとに着手する
（同じ `add.text()` の行に触る）。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
