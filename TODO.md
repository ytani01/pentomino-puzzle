# TODO

**残っている項目: TODO-117、TODO-118、TODO-119、TODO-120、TODO-121。** これまでに 116 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-122` から。**

項目は、触るファイルと確かめ方が同じものでまとめてある。番号の順に進めると、
`config.js` の色（TODO-118）を先に直してから画面の項目に入れる。

## TODO-117. 計算側（search.js・logic.js・storage.js・tests.html）の重なりをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5.5 / medium） |

- [x] `search.js` の `solveStepsRandom()`（160 行）のうち、状態（`stack`・`boardOk`・`deadMoves` など）に触らない
  置ける手の一覧を作る処理と、手を選ぶ処理（詰めて置く手 → 1 種しか入らないマス → 埋めにくいマス → 重み）を
  モジュールの関数に出す。**`random()` を呼ぶ順番と回数は変えない**（同じ種から同じ手順が出ること）
- [x] `search.js` で、手が覆うマスを `"row,col"` にして回す処理（`countCellMoves()`・`singlePieceCell()`・`moveCoversCell()`）を 1 つの関数にする
- [x] `logic.js` の `nextTurn()`・`prevTurn()`・`nextPlaceableTurn()` で、`turnOrder()` の中の今の形の位置を引く処理を
  1 つの内部の関数にする。公開する関数の名前と返す値は変えない
- [x] `storage.js` の「正の整数か」「正の有限な数か」の検査（`sanitizeHistory()`・`migrateHistory()`・`sanitizeFound()`・
  `sanitizeProgress()` など）を名前の付いた関数にする。受け入れる値は変えない
- [x] `tests.html` の `firstSolutionSteps()` と `firstSolutionStepsWith()` を 1 つにし、テストの中で同じ形で書き直している補助
  （`sigOf` など。`rg -n "const \w+ = \(" tests.html` で洗い出す）のうち 2 か所以上あるものを上の関数にする。テストの数と中身は変えない

**無駄を省く工夫:** 画面は見ない。確かめるのは `tests.html` の全件（今は 281 件）と、`solveStepsRandom()` について同じ種で
変更前後の手順が一致するかの突き合わせ 1 回だけ。

## TODO-118. config.js の makeLayout() の分岐と、TEXT_COLORS の書き直しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / low） |

- [ ] `makeLayout()` に散らばった `portrait` の三項演算子（6 か所）と、`trayPanel` を幅か高さ 0 で作って書き直す形をやめ、
  ボードの枠とトレイの枠の位置・大きさを縦と横の `if` 1 つで決める。返す値は変えない
- [ ] `TEXT_COLORS` の値は `COLORS` の `text`・`textDim`・`accent`・`danger`・`buttonTextDisabled`・`background` を
  文字列で書き直したもの。数値から `'#rrggbb'` を作る関数で `COLORS` から作る

**無駄を省く工夫:** 画面は見ない。`node` で変更前後の `LAYOUTS`・`DEMO_LAYOUTS`・`TEXT_COLORS` を JSON にして一致を見れば足りる。

## TODO-119. ピースを名前で引く処理と、塗りの色・テクスチャを焼く手順をまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] ピースの定義を名前で引く処理（`ui.js` の `PIECE_BY_NAME`、`icons.js`・`storage.js` の `PIECES.find()`）を `config.js` の 1 つの Map にする
- [ ] 「ネオンなら暗くして塗る」色の決め方（`ui.js` の `drawMiniBoard()`、`icons.js` の `paletteIcon()`、`boot.js` の `makeNeonTile()`）を `logic.js` の 1 つの関数にする
- [ ] `boot.js` の 3 つの `make*Tile()` に共通する前後（`textures.exists()`・`make.graphics()`・`generateTexture()`・`destroy()`）を 1 つにする

**無駄を省く工夫:** 画面は 3 つの色の組でタイトル（色の見本と動くボード）と本編を 1 回ずつ撮るだけ。

## TODO-120. 本編とデモ（game.js・demo.js）の繰り返しをまとめ、create() を分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `game.js` の 105 行の `create()` を、状態の初期化・全解の読み込み・入力の登録などのメソッドに分ける（TODO-115 と同じやり方）。
  呼ぶ順（部品を組んでから遊びかけを読む、`ready` は最後に立てる）とコメントの「なぜ」は保つ
- [ ] `demo.js` の `create()` の前半（`relayoutState` の受け取り・ボード・レイアウト・色の組・空の盤面）は `game.js` と同じなので、
  分けたメソッドを `DemoScene` からも呼ぶ（レイアウトの表は `LAYOUTS`・`DEMO_LAYOUTS` を引数で渡す）
- [ ] `{ cells, location, row, col }` を読み書きする処理（`game.js` の `snapshot()`・`restoreState()`・`persist()`・`applyProgress()`・
  `slideIn()`、`demo.js` の `relayout()`・`applyRelayout()`・`finishStep()`）を、ピースから読む関数と書く関数の 1 つずつにする
- [ ] トレイに残るピースの数え方（`useAuto()`・`runHint()`・`refreshHud()`・`fillForced()` の 4 か所）と、
  向きを変えたときに鳴らす音の判定（`turnDrag()`・`turnPiece()`）をそれぞれ 1 つにする

**無駄を省く工夫:** 画面は本編で置く・外す・一手戻す・向きを変える・つづきからを 1 回ずつ、デモを 1 回開くだけ。`tests.html` は触らないので流さない。

## TODO-121. 部品（ui.js）と記録・タイトル画面の繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `createConfirmDialog()` が `open(text, onYes)`・`hide()` を返すようにし、`game.js`・`records.js` の `openConfirm()`・
  `hideConfirm()`・`doTrash()` に重なる処理（表示の切り替え・`confirmAction` の差し替え・音）を消す。
  `confirmKind`（向きが変わったときに開き直すため。TODO-095）と `silent` は保つ
- [ ] `createButton()` の `redraw()` で、状態（無効・選択・押下・hover・通常）を先に 1 つに決め、面・縁・文字・アイコン・印の色を
  `config.js` の表から引く（今の 4 つの if の連鎖をなくす）。色の結果は変えない
- [ ] `records.js` の 67 行の `refresh()` を、一覧の行・頁送り・全部選ぶ・選んだ回の詳細に分け、「全部にチェックが付いているか」の
  計算（`refresh()`・`toggleSelectAll()`）を 1 つにする。`restoreRelayout()` は `game.js`・`demo.js` と同じ `applyRelayout()` に改名する
  （`rg -n restoreRelayout` で出る箇所と文書をすべて）
- [ ] `title.js` の 3 つの始めるボタンを `clear.js` の `createButtons()` と同じく配列から作り、ボードの選択肢（`boardIcon()` と
  「ラベル（注記）」のツールチップ）を `title.js` と `records.js` で同じ関数から作る

**無駄を省く工夫:** ボタンの色の一致は状態ごとに `evaluate` でまとめて読み出す（1 つずつ押させない）。画面はタイトル・記録・
本編の確認の枠を縦・横で 1 回ずつ。同じ関数を通るボタンは 1 つ押せば足りる。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
