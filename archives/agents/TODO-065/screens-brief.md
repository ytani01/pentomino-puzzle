# TODO-065 screens への依頼

## 対象

未コミットの差分。デモのランダム・ゆっくり／速いで、ピースを置く前にトレイの位置で 1 段ずつ（`DEMO.randomTurnStepMs` ごと）向きを変え、
そのあと盤へ滑らせる（`src/scenes/demo.js` の `playTurns()`）。

## 撮るもの

`http://localhost:8765/`（`python3 -m http.server 8765`）を 844×390（スマホ横）で開き、デモをランダム・ゆっくりにして、
回している最中（`window.game.scene.getScene('Demo').turning` が null でない間）を 3 枚撮る。できれば裏返しの段・回転の段・
最後の段のあと盤へ滑っている途中を 1 枚ずつ。撮るときは `scene.time`・tweens を止める（`scene.time.paused = true`・
`scene.tweens.pauseAll()`）と狙いやすい。撮り終えたら戻す。

## 見るもの

- 回しているピースが、トレイの他のピースやスロットの枠・HUD と重なっていないか、はみ出していないか、欠けていないか
- 向きの変わったピースの絵が崩れていないか（マス目がずれる、余計なものが映る）
- コンソールエラーの数

## 見なくてよいもの

デザインの良し悪し、値の良し悪し、盤・HUD のレイアウトの測り直し、ほかの画面。

## 報告

画像は `~/tmp/playwright-mcp/` に置き、`archives/agents/TODO-065/screens-report.md` に画像のパスと、見たものごとに問題があるかを書く。
問題なしは 1 行、問題だけ詳しく。コードは直さない。返事は 5 行以内。
