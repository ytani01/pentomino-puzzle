# TODO-094 依頼（implementer）

git worktree の中で作業する。依頼と報告のファイルは本体の木
`/home/ytani/work/pentomino-puzzle/archives/agents/TODO-094/` にある（worktree 側には無い）。
報告はそこへ絶対パスで書く。

## 目的
プレー画面（`src/scenes/game.js`）の操作概要・ガラスの下地・やり直しの確認・ホームの動きを直し、ツールチップのバグを直す。
並行して別の担当がタイトル画面（`src/scenes/title.js`・`src/icons.js`）と記録画面・`createTitleBar()`（`src/ui.js`）を直している。
`title.js` と `records.js` には触らない。`ui.js` は足すだけにする（`createTitleBar` は触らない）。

## やること
1. 画面の下に操作方法の概要を常に出す。内容はタイトルの操作 3 行と同じ:
   「ドラッグ … 置く / 動かす」「タップ … 次の向きへ（回転と裏返しを順に巡る）」「盤から外す … 盤の外で離す / トレイの方へ振る」。
   文言は 1 か所に定数として置き（`src/ui.js` から export するなど）、タイトル側はあとで管理者がそれを読むように直す。
   入らなければ 1 行に詰める（例: 「ドラッグで置く・タップで向きを変える・盤の外で離すと外す」）。
   デモ（`GameScene` を継承する `src/scenes/demo.js`）には出さない。今ある下端のメッセージ（`layout.message`）と重ねない。
   縦（640×1136 前後）・横（960×640 前後）の両方でレイアウト（`src/config.js` の `layout()`）が破綻しないようにする。
2. 8×8・6×10 の両方で、盤の空きマスの下地を「半透明＋斜めの反射」でガラス面に見せる。Graphics API で描く（画像アセット禁止）。
   色・濃さは `config.js` に置く。8×8 の中央の板（`drawAcrylic()`）とは見分けがつくように控えめに。
3. 「やり直し」の前に確認のモーダルを出す（`createButton` / `createPanel` で作る。既存の「タイトルへ」の確認があれば同じ作りに揃える）。
   盤にピースが 1 つも無ければ確認なしですぐやり直す。
4. 盤に何も置いていないときにホームを押したら、つづきからのデータを保存せず（今あるデータは消さずそのまま）、確認なしですぐタイトルへ戻る。
   最上段のタイトル行（押すとタイトルへ）も同じ経路なら同じ挙動にする。
5. バグ: スマホ（タッチ）で「やり直し」を押した直後、HUD のボタンの説明（ツールチップ、`createTooltip()`・`TOOLTIP.touchMs`）が出ない。
   **先に原因を切り分け、報告に原因を書いてから直す。** 3 のモーダルが入ると経路が変わるので、モーダル経由でも出ることを確かめる。
   Playwright でタッチを模すなら `hasTouch: true` のコンテキストと `page.touchscreen.tap()` を使う。

## 保つもの
- 規約（`CLAUDE.md`）: `setTimeout` 禁止・ネイティブ `confirm()` 禁止・色と数値は `config.js`・盤面は作り直して返す・JSDoc は「なぜ」。
- Undo の履歴、経過時間、遊びかけの保存（盤にピースがあるとき）の既存の挙動。

## 完了条件
- 変更した js がすべて `node --check` を通る。`tests.html` が全件通る。
- 縦・横それぞれで本編を 1 枚ずつ撮り、はみ出しが無いことを自分で見る（画像は `~/tmp/playwright-mcp/` へ）。
- worktree のブランチに `wip(TODO-094): …` で 1 コミットする。
- 報告は `/home/ytani/work/pentomino-puzzle/archives/agents/TODO-094/implementer-report.md`
  （変更点・ツールチップの原因・ブランチ名）。返事は 5 行以内。
