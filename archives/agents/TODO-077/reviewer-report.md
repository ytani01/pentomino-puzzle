# TODO-077 レビュー報告（reviewer）

対象: 作業ツリーの `git diff`（src/logic.js・src/config.js・tests.html・
docs/developer.md・docs/UsersGuide.md）。コードは変えていない。
実測は `tools/window-shim.mjs` を読んだ node スクリプトで行った
（置き場は scratchpad。リポジトリには残していない）。

## 要修正（1 件）

### src/logic.js:686-688・697-700・709-713 `solveStepsRandom()` の JSDoc が新しい分岐を載せていない

- 何が: 「次の 3 つは行き詰まりを待たずに置いた直後にその場で外す。人も
  置いた瞬間に明らかな詰みだと気づくのはこの 3 つだけ」のまま。箇条書きにも
  TODO-077 の「残りのどのピースでも覆えない空きマス」が無い。「詰まり」に
  数えない手の列挙（712 行「…置き済みのピースと同じ形の空きのいずれも。
  TODO-060・066〜068」）にも入っていない
- なぜ: 実装（871 行の `else if (hasUncoverableCell(board, unused))`）は
  4 つ目を持つ。同じ説明を持つ docs/developer.md:257・docs/UsersGuide.md:179・
  src/config.js:779 は直してあり、この JSDoc だけ古い（対で保守すべきものの片方
  だけ）。CLAUDE.md「JSDoc には…なぜそうするのか」を書く場所がここなので、
  「3 つだけ」は誤りとして残る

## 検討（4 件）

### src/logic.js:864-870 TODO-067 の分岐は、新しい分岐に包含された（作り込みすぎの節にも再掲）

- 何が: 置き済みのピースと同じ形の 5 マスの閉じた空きは、残りのピースのどれとも
  形が違う（12 種の形はすべて異なる）ので、その 5 マスはどの置き方でも覆えない。
  つまり TODO-067 の条件が真なら `hasUncoverableCell(board, unused)` も必ず真で、
  外し方も同じ `yield undoLast()` 1 手。TODO-067 の分岐を消しても挙動は変わらない
- 根拠（実測）: `solveStepsRandom` を `hasSolution` を判定に渡して回し
  （8×8・6×10、シード 1〜4、各 20000 手まで）、place 直後ごとに比べた。
  TODO-067 の条件が真だった 748 回（8×8）・247 回（6×10）で、
  `hasUncoverableCell` が偽だったのは 0 回
- 判断が要る点: 消すと tests.html の `hasPlacedFormClosedRegion`・
  `sawPlacedFormUndo` の検査、docs の列挙（TODO-067 を独立に挙げている 3 か所）も
  合わせて直すことになる。範囲外として残すか、別項目にするかは管理者が決める。
  残すなら、包含関係を分岐のコメントに一言書いておくと、後から読む人が
  「順序に意味があるのか」で迷わない。実害は無い（挙動は同じ）

### src/scenes/demo.js:19-21 列挙の番号に TODO-077 が無い

- 何が: 「5 の倍数でない大きさの閉じた空きができたときなど…（`solveStepsRandom()`。
  TODO-060・066〜068）」。「など」で括っているので誤りではないが、
  config.js:779 は `・077` を足しており、揃っていない
- 根拠: 読んだコード。差分の範囲外のファイルなので、直すかは管理者判断

### tests.html:1553-1560・1672-1676 テストの説明コメントが新しい分岐を載せていない

- 何が: 1558-1560「5 の倍数でない空き・置き済みピースの形の空きの即座の remove
  （1 手）と…（TODO-066・TODO-067）」、1673-1676「置いた直後の判定
  （isForcedFillStep・hasUnfitClosedRegion・hasPlacedFormClosedRegion）で
  見分ける」。コードは `hasUncoverableRegion` を足してあるが、コメントは古いまま
- 根拠: 読んだコード（1570-1572 行・1730-1731 行で判定に足してある）

### tests.html:806-810 1 マスの取り残しのテストが、置き済みの F も「残り」に渡している

- 何が: `place(..., 'F', ...)` の後に `hasUncoverableCell(board, NAMES)`（12 種全部）。
  実装で渡るのは置いた後の残り（F を除く 11 種）
- なぜ: 1 マスの空きはどのピースでも覆えないので結果は同じで、テストとしては
  通る。ただ実装の呼び方と違う入力で確かめている。実害は未確認（今の盤面では無い）

## 好みの範囲（1 件）

- tests.html:1361 再現側の名前が `hasUncoverableRegion`、実装は
  `hasUncoverableCell`。見ているのは「マス」なので、実装に合わせた方が
  grep で対にしやすい

## 確かめて問題が無かったこと（1 行ずつ）

- 分岐の順序: 穴埋めの解なし（TODO-066）→ 5 の倍数でない空き（060・068）→
  置き済みの形（067）→ 覆えないマス（077）の `else if`。どれも 1 回だけ外す
  （066 だけ 2 回）。新しい分岐は `maybeCollapse()` を呼ばないので「詰まり」
  （TODO-063）に数えない
- `unused`: 855 行 `unused.splice(...)` で置いたピースを除いた後に判定しているので、
  置いた後の残りを指している
- `hasUncoverableCell`: `canPlace().ok` が盤外・穴・重なりを弾くので、
  `covered` の添字は常に `0..rows*cols-1`、穴のマスは `null` でないので判定に
  入らない。`orientations()` の形は正規化済み（左上が 0,0）で、row/col の全走査で
  置き方を漏らさない。ピースが全部置かれた盤（`names` が空・空きなし）は偽
- 解ける盤を外さないこと（実測）: `hasUncoverableCell` が真だった 7369 回
  （8×8）・2802 回（6×10）で、`hasSolution` が真だったのは 0 回
- 深さ優先 `solveSteps()`: 差分の hunk は 457 行（新関数）と 846 行
  （`solveStepsRandom` の末尾）だけで、`solveSteps()`（624 行〜）には触れていない
- 再現側 `hasUncoverableRegion`: 盤の置き済みから残りを出して同じ関数を呼ぶので、
  実装の `unused` と同じ集合（順序は結果に影響しない）。3 か所の再現ロジックとも
  `!forcedFail && !unfit && !placedForm` の後に置いており、実装の `else if` 順と一致
- 新しい統合テストの強さ（実測）: 実装から TODO-077 の分岐だけを消した写しで
  同じ判定を回すと、8×8 で 240 回中 173 回、6×10 で 212 回中 180 回、
  「次が同じ名前の remove でない」になった（元の実装では 0 回）。
  分岐を消せば落ちる
- 規約: `setTimeout`・トップレベルの書き換わる `let`・色の直書き・DOM/Phaser の
  持ち込みは無い。盤面は書き換えていない（`hasUncoverableCell` は読むだけ）。
  新関数の JSDoc は「なぜ」（何を拾うか・重さ）を書いている
- 範囲: 指示に無い変更は無い

## 作り込みすぎ

- src/logic.js:L864-870: delete: TODO-067 の分岐は `hasUncoverableCell` に包含
  （上の「検討」の 1 件目。実測で反例 0）。消しても挙動は同じ。重大度は検討
  （テストと文書の列挙も連動するため、消すかは管理者判断）
- それ以外は無し。新関数は既存の `canPlace`・`orientations` をそのまま使っており、
  `countCellMoves()` の流用は失敗手（`failed`）を除いた手を数える点で意味が違うため
  置き換えにならない

net: -7 lines possible（logic.js のみ。テスト・文書の連動分は別）

---

# 追記: 直したあとの再レビュー（2026-09-25）

対象: 今の作業ツリーの `git diff`（src/logic.js・src/config.js・src/scenes/demo.js・
tests.html・docs 2 か所）と tests-report.md の追記。

## 前回の指摘

- 要修正（`solveStepsRandom()` の JSDoc）: 片付いた。TODO-067 の分岐を消したので項目は 3 つになり、「3 つ」は正しい。箇条書きと「詰まり」に数えない手の列挙（logic.js:699-701・712-713）にも TODO-077 が入った
- 検討（TODO-067 の分岐が包含される）: 片付いた。分岐を消し、包含されることを logic.js:866-868 のコメントに書いてある
- 検討（demo.js:21 の番号）: 片付いた（`・077` を足した）
- 検討（tests.html の説明コメント）: 片付いた（1566-1569・1679-1681）
- 検討（1 マスのテストに F を渡していた）: 片付いた（F を除いた残りを渡す。806-812）
- 好み（再現側の名前）: 片付いた（`hasUncoverableCellOnBoard`）

## 消したことで出る問題

- 未使用の import・関数: 無い。logic.js の `forcedPlacements`・`PIECES` は穴埋めの手（818 行）などでまだ使う。tests.html の `hasPlacedFormClosedRegion` は含まれることの assert（1498・1883 行）で使っている
- 文書の食い違い: 無い。TODO-067 を独立の場合として挙げている箇所は、archives と TODO.md を除いて残っていない（`rg "同じ形の 5 マス|TODO-067"` で確認）。developer.md・UsersGuide.md・JSDoc・分岐のコメントは、どれも「覆えない空きマスに含まれる」と書いていて揃っている
- 再現ロジックと実装の else if の順: 合っている。実装は「穴埋めの解なし → 5 の倍数でない空き → 覆えないマス」。再現側 4 か所（1495-1531・1575-1580・1733-1750・2164）はどれも `forcedFail` → `unfitRegion` → `!unfitRegion && uncoverable` の順で、外す手数（2・1・1）も同じ

残る指摘: 無し。
