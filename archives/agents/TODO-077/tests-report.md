# TODO-077 テスト報告（tests.html）

## 足したテスト

- `hasUncoverableCell は空の盤で 12 種すべて渡すと偽（8×8）` / `（6×10）`
- `hasUncoverableCell は 1 マスだけの取り残しを覆えないと見る（8×8）` / `（6×10）`
- `hasUncoverableCell は、空き領域が 5 マスちょうどでも、形が合わなければ真（TODO-077）`
  （L ペントミノと同じ形の穴を、盤 spec を使わず grid を直接作って再現。
  `I` だけでは真、`L` を含めると偽になることを合わせて確かめる）
- `残りのどのピースでも覆えない空きマスができたら、行き詰まりを待たずにその場で外す（TODO-077, 8×8）` / `（6×10）`
  （`solveStepsRandom` を回し、TODO-060・067 のどちらにも当てはまらないのに
  `hasUncoverableCell` が真になる場面を探し、直後の `remove` が同じ名前かを見る）

あわせて `hasUncoverableCell` を `import` に追加。

## 既存テストの書き直し

TODO-077 の分岐（`solveStepsRandom` の place 直後の判定に `hasUncoverableCell`
チェックが増えた）により、以下の既存テストが**前提が古くなって**落ちた
（新しい分岐を知らない手元の再現ロジックが、それを無視してしまうため）。
共有ヘルパー `hasUncoverableRegion(board)` を足し、既存の
`hasUnfitClosedRegion` / `hasPlacedFormClosedRegion` と同じ扱い（即座の
`remove` の対象）に加えて直した。

- `置ける手が尽きて 1 手ずつ外す並び…` （既定・常に偽 × 8×8・6×10 の 4 件）
- `常に偽を返す判定だと、置ける手が尽きるたびに…` （8×8・6×10 の 2 件）
- `外す連なりが ok:true で止まったとき…` （8×8・6×10 の 2 件）

`置いた直後にその場で外れる手を除く` 目的で使う
`sumMoveDistanceFromLast`（TODO-062 の重みのテスト）の `immediateUndo` にも
同じ理由で `hasUncoverableRegion` を足した（このテストは今回の変更前から
落ちてはいなかったが、除外し忘れると統計にノイズが混じるため合わせた）。

## 実行結果

`http://localhost:8765/tests.html`（キャッシュを避けるため、一時的に
`Cache-Control: no-store` を返す python サーバを 8766 番で別に立てて確認。
確認後に停止済み）で **407 件すべて通った**。

## 壊すと落ちるかの確認

`src/logic.js` の `hasUncoverableCell` 内の
`covered[(row + dr) * board.cols + (col + dc)] = 1;` の行を一時的にコメント
アウトして再実行すると、23 件が失敗した（新しく足したテスト 4 件に加え、
`solveStepsRandom` を回す既存テスト群が軒並み巻き添えで落ちる。
壊すと盤面のほぼ全マスが「覆えない」扱いになり、置いた手が毎回その場で
外れて手が進まなくなるため）。確認後、行を元に戻し、
`git diff src/logic.js` が作業前と同じ（26 行の追加のみ）であることを
確かめた。

## src/ の変更

`src/` は 1 文字も変えていない（作業前と同じ diff であることを確認済み）。

---

# 追記: TODO-067 の分岐を消したあとの直し（2026-09-25）

`solveStepsRandom()` から TODO-067 の分岐（置き済みの形の空き）が消え、
`hasUncoverableCell` の分岐に含まれる形になったのに合わせて `tests.html` を直した。
`src/` は触っていない。

## 変えたこと

- 再現側の関数 `hasUncoverableRegion` を `hasUncoverableCellOnBoard` に改名
- 再現ロジック 4 か所（「置ける手が尽きて 1 手ずつ外す並び…」・「常に偽を返す判定だと…」・
  「外す連なりが ok:true で止まったとき…」・`sumMoveDistanceFromLast`）から、
  置き済みの形の空きを独立の分岐として扱うのをやめ、`hasUnfitClosedRegion` と
  `hasUncoverableCellOnBoard` の 2 つで判定する形にした
- `sawPlacedFormUndo` は残した。置き済みの形の空きが起きたら、
  (a) `hasUncoverableCellOnBoard` も真であること（含まれること）を assert し、
  (b) 覆えないマスとしてその場で外れたときに `sawPlacedFormUndo` を立てる
- 「残りのピースに合わない 5 マスの閉じた空きは…即座に外れる（TODO-060/066/067）」にも、
  `hasUncoverableCellOnBoard(board)` が真であることの assert を足した
- 「残りのどのピースでも覆えない空きマスができたら…（TODO-077）」から、
  置き済みの形の空きを除く条件を外した（今はその場面も同じ分岐で外れる）
- 1 マスの取り残しのテストは、`hasUncoverableCell` に置き済みの F を除いた名前を渡す形にした
- 「常に偽を返す判定だと…」・「外す連なりが ok:true…」の説明コメントを TODO-077 に合わせて直した

## 結果

- 全件: **407 件すべて通った**（Cache-Control: no-store の一時サーバ 8766 番で確認。終わったあと停止済み）
- 壊すと落ちるか: `src/logic.js` の `else if (hasUncoverableCell(board, unused))` を
  `else if (false && …)` にすると **10 件が失敗**。置き済みの形の空きを見る
  「残りのピースに合わない 5 マスの閉じた空きは…（TODO-060/066/067）」も
  8×8・6×10 の両方で落ちた（「F を置いて置き済みのピースの形の 5 マスの空きが
  できたのに、次が同じ名前の remove でない」など）。ほかは TODO-077 の専用テスト 2 件、
  「置ける手が尽きて…」4 件、「外す連なりが ok:true…」2 件
- 元に戻したあと、`git diff src/` の sha1 が作業前と一致することを確かめた
