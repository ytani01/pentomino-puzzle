# TODO

**残っている項目: TODO-117、TODO-118、TODO-119、TODO-120、TODO-121、TODO-122、TODO-123、TODO-124、TODO-125、TODO-126、TODO-127、TODO-128、TODO-129。** これまでに 116 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-130` から。**

## TODO-117. 確認の枠の開閉を ui.js の createConfirmDialog() にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `createConfirmDialog()` が `open(text, onYes)`・`hide()` を返すようにし、`game.js`・`records.js` の
  `openConfirm()`・`hideConfirm()` の同じ処理（`confirmParts` の表示切り替え・`confirmAction` の差し替え・音）を消す。
  `confirmKind`（向きが変わったときに開き直すため。TODO-095）と `silent` は保つ

**無駄を省く工夫:** 画面の確認は本編の「やり直す」と記録の「消す」の 2 つを開いて閉じるだけ。向きの切り替えは 1 回。

## TODO-118. createButton() の色の選び方を表にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `ui.js` の `createButton()` の `redraw()` で、状態（無効・選択・押下・hover・通常）を先に 1 つに決め、
  面・縁・文字・アイコン・印の色を `config.js` の表から引く。今の 4 つの if の連鎖をなくす。色の結果は変えない

**無駄を省く工夫:** 色の一致は状態ごとに `evaluate` でまとめて読み出す（ボタンを 1 つずつ押させない）。

## TODO-119. game.js の create() を部品ごとのメソッドに分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] 105 行の `create()` を、状態の初期化・全解の読み込み・入力の登録などのメソッドに分ける（TODO-115 と同じやり方）。
  呼ぶ順（部品を組んでから遊びかけを読む、`ready` は最後に立てる）とコメントの「なぜ」は保つ
- [ ] `demo.js` の `create()` の前半（`relayoutState` の受け取り・ボード・レイアウト・色の組・空の盤面）は
  `game.js` と同じなので、分けたメソッドを `DemoScene` からも呼ぶ（レイアウトの表は `LAYOUTS`・`DEMO_LAYOUTS` を引数で渡す）

**無駄を省く工夫:** 画面は本編・つづきから・デモを 1 回ずつ開くだけ。`tests.html` は触らないので流さない。

## TODO-120. records.js の refresh() を分け、relayout から戻すメソッドの名前を揃える

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high） |

- [ ] 67 行の `refresh()` を、一覧の行・頁送り・全部選ぶ・選んだ回の詳細に分ける
- [ ] 「番号を持つ件」と「全部にチェックが付いているか」の計算が `refresh()` と `toggleSelectAll()` にあるので 1 つにする
- [ ] `restoreRelayout()` を `game.js`・`demo.js` と同じ `applyRelayout()` に改名する
  （`rg -n restoreRelayout` で出る箇所と文書をすべて）

**無駄を省く工夫:** 画面の確認は reviewer の差分の読み合わせで足りる（描く値は変えない）。気になる点が出たときだけ screens を足す。

## TODO-121. search.js の solveStepsRandom() から、置ける手の一覧と手の選び方を関数に出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |

- [ ] 160 行の `solveStepsRandom()` のうち、状態（`stack`・`boardOk`・`deadMoves` など）に触らない 2 つを
  モジュールの関数に出す: 置ける手の一覧を作る処理と、手を選ぶ処理（詰めて置く手 → 1 種しか入らないマス →
  埋めにくいマス → 重み）。**`random()` を呼ぶ順番と回数は変えない**（同じ種から同じ手順が出ること）
- [ ] 手が覆うマスを `"row,col"` の文字列にして回す処理が `countCellMoves()`・`singlePieceCell()`・`moveCoversCell()` で
  3 回書かれているので、1 つの関数にする

**無駄を省く工夫:** 確かめるのは `tests.html` の既存のテストと、同じ種で変更前後の手順が一致するかの突き合わせ 1 回だけ。デモの画面は見ない。

## TODO-122. config.js の makeLayout() で、縦横の分岐を 1 か所にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / low） |

- [ ] `makeLayout()` では `portrait` の三項演算子が 6 か所に散らばっていて、`trayPanel` は幅か高さを 0 で作ってから
  書き直している。ボードの枠とトレイの枠の位置・大きさを、縦と横の `if` 1 つで決める形にする。返す値は変えない

**無駄を省く工夫:** 画面は見ない。`node` で変更前後の `LAYOUTS`・`DEMO_LAYOUTS` を JSON にして一致を見れば足りる。

## TODO-123. ピースの位置を写す処理と、トレイに残るピースの数え方を 1 つにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `{ cells, location, row, col }` を読み書きする処理が、`game.js` の `snapshot()`・`restoreState()`・`persist()`・
  `applyProgress()`・`slideIn()` と `demo.js` の `relayout()`・`applyRelayout()`・`finishStep()` に散らばっている。
  ピースから読む関数と、ピースへ書く関数を 1 つずつにする
- [ ] `this.pieces.filter((piece) => piece.location === 'tray')` の 4 か所（`useAuto()`・`runHint()`・`refreshHud()`・`fillForced()`）を 1 つのメソッドにする
- [ ] 向きを変えたときに回転と裏返しのどちらの音を鳴らすかの判定（`turnDrag()`・`turnPiece()`）を 1 つにする

**無駄を省く工夫:** 画面は本編で置く・外す・一手戻す・向きを変える・つづきからを 1 回ずつと、デモで向きを 1 回変えるだけ。

## TODO-124. logic.js の nextTurn()・prevTurn()・nextPlaceableTurn() の重なりをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |

- [ ] 3 つとも「`turnOrder()` を作り、今の形の位置を `findIndex` で引く」ところが同じ。位置を引く内部の関数を 1 つにし、
  `nextTurn()`・`prevTurn()` は進む向きだけを渡す形にする。公開する関数の名前と返す値は変えない

**無駄を省く工夫:** 確かめるのは `tests.html` の既存のテストだけ（向きの関数はテストがある）。画面は見ない。

## TODO-125. title.js と records.js で、ボタンと選択肢の組み立ての繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ screens（Sonnet 5.5 / low） |

- [ ] `title.js` の `createStartButtons()` の 3 つのボタン（はじめる・つづきから・記録）を、`clear.js` の `createButtons()` と同じく配列から作る
- [ ] ボードの選択肢（`boardIcon()` と「ラベル（注記）」のツールチップを足したもの）を `title.js` と `records.js` で同じ関数から作る

**無駄を省く工夫:** 画面はタイトルと記録を縦・横で 1 回ずつ撮るだけ。ボタンは 1 つ押せば足りる（同じ関数を通る）。

## TODO-126. ピースを名前で引く処理と、ピースの塗りの色・テクスチャを焼く手順をまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] ピースの定義を名前で引く処理（`ui.js` の `PIECE_BY_NAME`、`icons.js`・`storage.js` の `PIECES.find()`）を `config.js` の 1 つの Map にする
- [ ] 「ネオンなら暗くして塗る」色の決め方（`ui.js` の `drawMiniBoard()`、`icons.js` の `paletteIcon()`、`boot.js` の `makeNeonTile()`）を `logic.js` の 1 つの関数にする
- [ ] `boot.js` の 3 つの `make*Tile()` に共通する前後（`textures.exists()`・`make.graphics()`・`generateTexture()`・`destroy()`）を 1 つにする

**無駄を省く工夫:** 画面は 3 つの色の組でタイトル（色の見本と動くボード）と本編を 1 回ずつ撮るだけ。

## TODO-127. storage.js の値の検査を小さな関数にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |

- [ ] 「正の整数か」（`Number.isInteger(x) && x > 0`）と「正の有限な数か」の検査が `sanitizeHistory()`・`migrateHistory()`・
  `sanitizeFound()`・`sanitizeProgress()` などに繰り返し出てくるので、名前の付いた関数にする。受け入れる値は変えない

**無駄を省く工夫:** 確かめるのは `tests.html` の既存のテストだけ（TODO-116 で、壊れた値と localStorage が使えないときのテストがある）。

## TODO-128. config.js の TEXT_COLORS を COLORS から作る

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ verifier（Haiku 5.5 / low） |

- [ ] `TEXT_COLORS` の `'#e8ecf4'` などは `COLORS` の `text`・`textDim`・`accent`・`danger`・`buttonTextDisabled`・`background` と
  同じ値を文字列で書き直したもの。数値から `'#rrggbb'` を作る関数で `COLORS` から作り、同じ色を 2 か所に書かないようにする

**無駄を省く工夫:** 画面は見ない。`node` で変更前後の `TEXT_COLORS` を JSON にして一致を見れば足りる。

## TODO-129. tests.html の補助関数の重なりを消す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ tests（Sonnet 5.5 / medium） |

- [ ] `firstSolutionSteps()` と `firstSolutionStepsWith()` は `canContinue` を渡すかどうかだけが違うので 1 つにする
- [ ] テストの中で同じ形で書き直している補助（`sigOf` など）を、`rg -n "const \w+ = \(" tests.html` で洗い出して
  2 か所以上あるものをファイルの上の関数にする。テストの数と中身は変えない

**無駄を省く工夫:** 確かめるのは `tests.html` を流して件数（今は 281 件）と全件通ることだけ。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
