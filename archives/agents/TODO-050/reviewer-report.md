# TODO-050 reviewer の報告

対象: `git diff`（src/config.js, src/icons.js, src/logic.js, src/scenes/demo.js, tests.html）。
実測は scratchpad に src/ と tools/ を写し、Node（`tools/window-shim.mjs`）で行った。

## 要修正

なし。

## 検討

### 1. tests.html:1029-1157 / 「違うピースだけ外して置き直す」をテストが押さえていない

- 問題: TODO-050 のチェック項目「今の盤面と違うピースだけを 1 手ずつ外して置き直す」を確かめるテストが無い
- 根拠（実測）: `src/logic.js` の共通の先頭を数える行
  （`while (common < current.length && current[common] === path[common]) common += 1;`）を消して、
  毎回盤を全部外してから並べ直すように壊した。追加したテストと同じ判定を Node で再現すると、
  整合・段の単調性・ok:false の直後の remove・solved の盤面の正しさが**すべて通った**
  （8×8・6×10 とも）。壊すと 8×8 の最初の solved までの手が 96,681 → 115,589 に増えるが、
  それを見るテストが無い
- 例えば「replay の place の直前に出た remove の数が、今の盤面と次の盤面で違う枚数と一致する」
  「replay の place の前に、次の盤面にも残るピースを remove しない」のような判定なら落ちるはず
  （未確認）

### 2. tests.html:1034-1036, 1119-1121 / テストのコメントが archives のファイルを参照し、数も合わない

- 問題: 「TODO-050 の implementer-report.md 参照」と archives の中のファイル名を書いている。
  既存の tests.html に archives を参照する箇所は無い（`rg -n archives tests.html` で 0 件）
- 根拠: ユーザー全体の CLAUDE.md「`archives/` は現行仕様ではない」「番号で参照し、詳細は archives 側に置く」。
  番号（TODO-050）だけで足りる
- 数も報告と食い違う。「regionsFitPieces だと 8×8 で 1100 万手」は、implementer の実測
  （試した手 4,969,285 + replay 3,585,878 + remove 8,555,151 = 約 1,710 万手、place だけなら約 855 万）
  のどれとも合わない。「hasSolution で約 5 万手」は place の数（48,346）で、手の総数は 96,680
  （上の実測でも 96,681 手目が solved）。どの数え方か書くか、数を外す

### 3. src/scenes/demo.js:236 / `startSearch()` の JSDoc が「何をするか」だけ

- 問題: 「ピースをトレイへ戻し、数え直して、今の探し方で最初から探す。」は手順の要約で、
  なぜかが無い。書く価値のある「なぜ」は、戻すときに滑らせない（`settlePiece(piece, false)`）
  理由のほう
- 根拠: プロジェクト CLAUDE.md「JSDoc には『何をするか』でなく『なぜそうするのか』を書く」

### 4. src/logic.js:535-541 / 幅優先で出し切ったあと盤にピースが残る（implementer が既に挙げた点）

- 深さ優先は空の盤で `done` になるが、幅優先は最後に調べた盤面のまま `done` になる。
  見た目の違いを許すかは管理者の判断。実害は未確認（切り替えれば `startSearch()` がトレイへ戻す）

## 観点ごと（問題なし）

- `solveStepsBreadth` の正しさ: 段ごとに `level` → `nextLevel` で展開し、solved の盤面は展開せず
  `continue` で同じ段の次へ進む。置き直しは同じオブジェクトかどうかで共通の先頭を比べ、後ろから外して
  から置くので盤は整合する（Node で 8×8・6×10 の 4,000 手と 8×8 の最初の solved まで、置けない
  place・盤に無い remove は 0 件）。`random` の入れ替えは `solveSteps()` と同じ順（名前の並び →
  PIECES 順に向き）。`order` から置いたものを飛ばす走査は `unused` の splice と同じ並びになる
- demo.js の切り替え: 'loading' では探し方だけ変わり、データ到着時の `startSearch()` が今の
  探し方を使う。'running' / 'solved' / 'done' では generator を差し替え、盤のピースをトレイへ
  戻し（`settlePiece` が Tween を止める）、`tried`・`solvedCount`・メッセージ・次の解ボタンを戻す。
  シーンに入り直すと `create()` が `solutions`・`strategy` を戻す。`replay` の place は `tried` に数えない
- config.js: 本編の `makeLayout()` の出力は変わらない（Node で横・縦 × 8×8・6×10 を比べた。
  本編は横 6 個・幅 130、縦 3 個ずつ・幅 130、HUD の高さ 112 / 168）。デモは HUD 以外が本編と一致
  （横 7 個・幅 123、縦 4+3 個・幅 130）。game.js の「縦画面ではこの 3 つずつがそのまま 1 段になる」も成り立つ
- 規約: setTimeout なし、色・数値は config.js（`DEMO_HUD_BUTTONS`）、logic.js に Phaser/DOM なし、
  空の JSDoc なし、100 字を超える行なし
- 範囲: 指示に無い変更は無い。`config.js:309` の「85 まで縮む」が実際の値と合わないのは以前からで、
  implementer も範囲外として残している
- 弱いテスト: 1 の他は、段の単調性のテストは深さ優先に差し替えると落ちる作り（後戻りするため）で、
  `replay` を付け忘れても落ちる（置き直しの place の直前は枚数が減るため）。ただし 4,000 手では
  8×8・6×10 とも段 2 までしか進まない（実測）

## 作り込みすぎ

- tests.html:1142-1159: shrink: 2 つのテストが `firstSolvedBreadth(mulberry32(1))` と盤の組み立てを
  同じに繰り返す。1 つのテストに `isSolved`・12 種・`hasSolution` の 3 つの assert をまとめれば約 9 行減り、
  0.2 秒の探索も 1 回で済む（好みの範囲）
- tests.html:1049, 1066, 1086: shrink: 同じ引数の `breadthSteps(..., 4000)` を盤ごとに 3 回作る。
  盤のループの頭で 1 回作って使い回せる（好みの範囲）

net: -12 lines possible.
