# TODO-065 screens の報告

## 撮った画像

- `/home/ytani/tmp/playwright-mcp/demo-844x390-turn-1.png` — 844x390、デモ・ランダム・ゆっくり、`turning` 中（1 段目付近）
- `/home/ytani/tmp/playwright-mcp/demo-844x390-turn-2.png` — 同上、別の手の `turning` 中（回転か裏返しの途中）
- `/home/ytani/tmp/playwright-mcp/demo-844x390-slide.png` — 同上、段を終えて盤へ滑らせている途中（`turning` が null に戻った直後）

## 見たもの

- 回しているピースが、トレイの他のピースやスロットの枠・HUD と重なっていないか、はみ出していないか、欠けていないか: 問題なし。3 枚とも回っているピースはスロット内に収まり、他のピース・HUD ボタンと重ならない。
- 向きの変わったピースの絵が崩れていないか: 問題なし。マス目のずれや余計な表示は見られない（turn-1 と turn-2 の画像はピクセル差分があり、実際に異なる段を捉えている）。
- コンソールエラーの数: 0 件。警告は WebGL の `GPU stall due to ReadPixels`（GL Driver のパフォーマンス通知）が 4 件のみで、今回の変更とは無関係。

