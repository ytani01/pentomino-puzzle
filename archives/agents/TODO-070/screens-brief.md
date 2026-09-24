# TODO-070 screens への依頼（アイコンの案を並べて撮る）

## 対象

`src/icons.js` に足したデモの探し方のアイコンの案 3 組（`depthFirstA`/`randomA`〜`C`）と、今の `depthFirst`/`random`。
各案の意図は `archives/agents/TODO-070/implementer-report.md`。

## 撮るもの

`python3 -m http.server 8765` を立て、Playwright MCP で `http://localhost:8765/` を 844×390 で開き、デモ画面へ入る。
`browser_evaluate` の中で `await import('/src/icons.js')` して `ICONS` を取り、デモの探し方ボタン（`scene.strategyButton.setIcon(...)`）に
案を 1 つずつ差し込んで、HUD のボタンの段（速さ・虫眼鏡・探し方・ミュート・ホームが並ぶ所）を切り抜いて撮る。
今の組と A〜C の各組について、深さ優先側とランダム側の 2 枚ずつ（計 8 枚）。

撮ったら `magick` で 1 枚にまとめる: 行が組（今・A・B・C）、左が深さ優先・右がランダム、各行の左端に組の名前の文字。
まとめた画像を `~/tmp/playwright-mcp/todo070-icons.png` に置く。最後にボタンを今のアイコンへ戻す。

## 見るもの

- 描き損じ（ボタンの枠からのはみ出し、線の欠け、つぶれて読めない細部）
- ほかの HUD のアイコンと取り違えそうな形か（見た目の感想ではなく、形が似ているものを名指しする）
- コンソールエラーの数

## 見なくてよいもの

どの案がよいか（利用者が選ぶ）、盤・トレイ、ほかの画面。

## 報告

`archives/agents/TODO-070/screens-report.md` に画像のパスと、見たものごとの結果。問題なしは 1 行。コードは直さない。返事は 5 行以内。

---

# 2 回目の依頼（仕上げたアイコンと、撮り直したキャプチャ）

implementer が案 C を正式にした（`depthFirst`＝歯車、`random`＝顔と「?」。報告の追記を見る）。main が `node tools/capture.mjs` で
`docs/images/` を撮り直した（変わったのは `demo.gif`・`demo.png`・`game.png`・`play.png`）。

## 撮るもの・見るもの

1. 1 回目と同じやり方で、探し方ボタンの深さ優先・ランダムを撮り、4 倍に拡大した画像を `~/tmp/playwright-mcp/todo070-final-depth.png`・
   `todo070-final-random.png` に置く（別ファイル。1 枚にまとめない）。描き損じ、HUD の虫眼鏡・ミュート・ホームと似ていないか、
   小さい大きさで「?」が読めるか
2. `docs/images/demo.png` と `demo.gif`（`magick` でフレームを 3 枚ほど抜く）: 新しいアイコンが映っているか、フレームが欠けていないか・
   不透明か、余計なもの（撮影用の吹き出しの位置ずれ、別の画面）が映っていないか
3. `docs/images/game.png`・`play.png`: 変わった理由（今回はアイコン以外も撮り直しで変わる。TODO-065・069 の変更が映る可能性）を
   `git diff --stat` と見比べて、映っているものが正しいか（吹き出しの位置ずれ・欠け）

デザインの良し悪しは見なくてよい。報告は `screens-report.md` に追記。返事は 5 行以内。
