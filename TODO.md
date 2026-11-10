# TODO

**残っている項目: TODO-105、TODO-106、TODO-108、TODO-109、TODO-110、TODO-111、TODO-113、TODO-114、TODO-115。** これまでに 106 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-116` から。**

**着手の順番:** 同じ箇所に触る項目は TODO-109 → 110 → 111 → 114 と、TODO-105 → 108 → 115 の
順に進める。TODO-106・112・113 はどれとも独立（ただし TODO-113 は TODO-110 と同じく
`logic.js` と `tests.html` の import に触るので、続けて頼むときは前の項目のコミットを待つ）。

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

## TODO-113. デモの探索を logic.js から search.js へ分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / low）+ tests（Sonnet 5.5 / low） |

- [ ] `src/logic.js` の `touchingEdges()` から `solveStepsRandom()` まで（内部関数の
      `touchWeight`・`moveCoversCell`・`pickTightCell`・`pickWeighted`・`shuffle` を含む
      約 440 行）を、新しい `src/search.js` へ中身を変えずに移す
- [ ] `src/scenes/demo.js`・`src/scenes/title.js`・`tests.html` の import を直す
- [ ] `CLAUDE.md`（規約の「Phaser に依存しない計算は…」とファイル構成）、
      `docs/developer.md`、コード中のコメントの `logic.js の solveSteps()` などの参照を直す
      （対象は `rg -n -w -e solveSteps -e solveStepsRandom -e moveDistance -e touchingEdges -e countCellMoves -e singlePieceCell .`）

`logic.js` が 1090 行あり、その 4 割がデモ（とタイトルの動くボード）だけが使う探索。
本編の判定と分けて読めるようにする。挙動は変えない。`forcedPlacements()`・
`hasUncoverableCell()`・`regionsFitPieces()` は本編のヒント表示も使うので `logic.js` に残す。

**無駄を省く工夫:** 動かすだけなので reviewer は入れない。確認は `tests.html` が全件通ることと、
デモが起動して 1 手進むことだけ。向きの生成には触らないので `gen-solutions.mjs --check` は流さない。

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
