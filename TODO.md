# TODO

**残っている項目: TODO-105、TODO-106、TODO-107、TODO-108、TODO-109、TODO-110、TODO-111、TODO-112、TODO-114。** これまでに 104 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-115` から。**

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

## TODO-107. 配置の数値の置き場の規約を、今のコードに合わせて直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main のみ |

- [ ] `CLAUDE.md` の「数値と色は `src/config.js` に集約する」を、「その画面だけの配置の
      数値はシーンの先頭に置く。複数の画面で使う数値と、色は `src/config.js`」と直す
- [ ] `docs/developer.md` に同じ主張があれば揃える

`records.js`・`title.js`・`clear.js` の先頭に配置の数値（合わせて 150 行ほど）があり
（`ui.js` にも `CHOICE_BUTTON` などその部品だけの数値がある。同じ扱いにする）、
規約と食い違っている。`config.js` へ移さず規約のほうを直すと決めた（2026-11-10。
移しても `config.js` が 1000 行を超えるだけで、読む場所が画面から離れる）。コードは動かさない。

**無駄を省く工夫:** 文書だけの項目なので担当を立てない。シーンに色の直書きが無いことは
確かめ済み（`game.js` の透明な当たり判定の `0x000000` だけ）で、調べ直さない。

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

## TODO-109. 使われていないコードを消す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [ ] どこからも呼ばれないものを消す: `cachedSolutions()`（`src/solutions.js`）、
      `setMuted()`（`src/audio.js`）、`OUTLINE.width`（`src/config.js`。説明のコメントが
      ほかの値から参照しているので、参照も直す）
- [ ] テストからしか呼ばれない `removeHistory()`（`src/storage.js`）を、そのテストと一緒に消す
      （`removeHistoryMany()` に置き換わった。TODO-071）
- [ ] 文書（`docs/developer.md`・`CLAUDE.md`）に名前が残っていれば消す

`emptyCells()`・`placedNames()`・`PLAYABLE_CELLS` もテストからしか使われないが、
テストの道具として使われているので残す。

**無駄を省く工夫:** 消す前に `rg -w <名前> src tools tests.html docs` で呼ぶ側が無いことを
1 回ずつ見るだけにする。確認は `tests.html` が全件通ることと、本編が起動することだけ。

## TODO-110. darken()・pieceColor() を boot.js から logic.js へ移す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [ ] `src/scenes/boot.js` の `darken()` と `pieceColor()` を `src/logic.js` へ移し、
      `boot.js`・`game.js`・`ui.js`・`icons.js` の import を直す
- [ ] `tests.html` に 2 つの関数のテストを足す（`darken` は係数 0・1・中間、
      `pieceColor` は `mono`・`colors`・どちらも無い色の組）
- [ ] `docs/developer.md` と `CLAUDE.md` のファイル構成の説明を直す

`ui.js` と `icons.js` がシーンのファイルを import している（部品がシーンに依る向き）のを
直すのが目的。挙動は変えない。`TEX` は Boot シーンが作るテクスチャの名前なので `boot.js` に残す。

**無駄を省く工夫:** 関数の中身は動かすだけなので reviewer は入れない。画面は撮らず、
`tests.html` が全件通ることと、本編が起動してコンソールにエラーが無いことを見る。

## TODO-111. ピースの縁（外周の線とネオンの光）の描画を 1 つにまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [ ] `src/scenes/game.js` の `drawPieceEdges()` と `src/icons.js` の `paletteIcon()` にある、
      凹んだ角を探す処理と、外周を内側へ寄せて引く処理（ネオンは角も埋める）を 1 つの関数に
      して両方から呼ぶ
- [ ] `docs/developer.md` と `CLAUDE.md` の説明を直す

挙動は変えない。本編は原点が (0, 0)・1 マスが `layout.board.cell`、アイコンは原点が
`left`/`top`・1 マスが `CHOICE_ICON.pieceCell`・光の太さに `glowScale` が掛かる。この差は
引数で渡す。`paletteIcon()` の外周の線は 4 辺を別々に引く書き方で、`drawPieceEdges()` の
`outlineEdges()` を使う書き方と同じ絵になるかは、着手時に撮り比べてから寄せる
（違うなら外周の線は寄せず、光だけをまとめる）。

**無駄を省く工夫:** 画面は、色の組 3 種類（ふつう・ガラス・ネオン）で本編 1 枚ずつと
タイトルの色の選択肢 1 枚を、直す前後で撮り比べる。向きは片方で足りる（描画は向きに依らない）。
TODO-110 のあとに着手する（同じ import の行に触る）。

## TODO-112. audio.button() の中で unlock() を呼び、呼ぶ側の対を消す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ screens（Sonnet 5.5 / low） |

- [ ] `src/audio.js` の `button()` の先頭で `unlock()` を呼ぶ
- [ ] `audio.unlock(); audio.button();` と続けて書いている 13 か所（`title.js` 6、
      `records.js` 7）から `audio.unlock()` の行を消す
      （対象は `rg -n -U "audio\.unlock\(\);\s*\n\s*audio\.button\(\);" src`）

`button()` を鳴らすのは必ず利用者の操作の中なので、そこで `unlock()` しても害は無い
（`unlock()` は済んでいれば何もしない）。本編・デモ・クリア表示のボタンでも `unlock()` が
走るようになるが、音の出方は変わらない。`button()` を伴わない `unlock()`（`game.js` の
ピースを掴んだとき、`demo.js` の最初の `pointerup`）は残す。

**無駄を省く工夫:** 数行の項目なので main が書く。分岐は変わらないので reviewer は入れない。
確認は、タイトルと記録でボタンを 1 つずつ押してコンソールにエラーが無いことだけ
（音は撮れないので、画面の撮り比べはしない）。`tests.html` は流さない。

## TODO-114. 向きを変える印の計算と描画を game.js から出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Sonnet 5.5 / medium）+ tests（Sonnet 5.5 / low）+ screens（Sonnet 5.5 / low） |

- [ ] `src/scenes/game.js` の `turnMarkKind()` と `turnMarkCenter()`（Phaser に依らない計算）を
      `src/logic.js` へ移す。中心はマスの単位で返し、1 マスの大きさは呼ぶ側で掛ける
- [ ] `strokeArrowHead()`・`strokeRotateMark()`・`strokeFlipMark()` と、`drawTurnMark()` の
      縁取り・本線の 2 回描きを、`src/icons.js` の 1 つの関数（Graphics・種類・中心・
      1 マスの大きさを受け取る）にする
- [ ] `tests.html` に移した 2 つの計算のテストを足す（種類は回転・裏返し・X の null、
      中心は U のように外接矩形の真ん中が空いている形）
- [ ] `docs/developer.md` と `CLAUDE.md` の説明を直す

`game.js` が 1555 行あり、Phaser とのつなぎでない部分を出す。挙動は変えない。印を出す条件
（トレイにいるピースだけ・掴んでいる間は出さない）は `drawTurnMark()` に残す。

**無駄を省く工夫:** 画面は、トレイに回転の印と裏返しの印の両方が見える 1 枚を、直す前後で
撮り比べる（向きは片方）。TODO-111 のあとに着手する（`game.js` の隣り合う箇所と
`icons.js` の import に触る）。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
