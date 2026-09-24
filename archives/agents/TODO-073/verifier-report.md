# TODO-073 verifier の報告

Playwright 1.63.0（`~/.npm/_npx/6bcb61ec6d5aea22/`）、`http://localhost:8765`、手順ごとに新しいコンテキスト、各手順 1 回。
スクリプトは自前で組んだ（implementer の `check.mjs` は使っていない）。スクリプトの終了コードは 0。
スクリプト: `/tmp/claude-649/-home-ytani-work-pentomino-puzzle/cca004d0-857c-4d9d-8a29-4fff99c43862/scratchpad/v.mjs`（scratchpad にあり、リポジトリには置いていない）。

## 結果

1. tests.html: 一致。`396 件すべて通った`、`li` 396 件中 `li.ng` 0 件、コンソールエラー 0
2. 記録画面の配置: 一致（撮影 `~/tmp/playwright-mcp/todo073-records-844x390.png`・`...-390x844.png`）
   - 844×390（内部 960×640）: ボタン top 500 / bottom 520。完成形の枠の下端 426、見出し（detailText）の下端 480、達成度 top 546、下段 top 588 → 重なりなし
   - 390×844（内部 640×1136）: ボタン top 998 / bottom 1018。完成形の枠の下端 980、達成度 top 1045、下段 top 1088 → 重なりなし（縦は見出しが完成形の上にあり、ボタンは完成形のすぐ下）
3. 記録から続ける（遊びかけなし、6×10 の記録 `{no:100, ms:123456, a:true}`、開始時の registry は 8x8）: 一致
   - 直後: board `6x10`、トレイ残り 0、elapsed 123623（時計 `02:03`）、usedAuto true・usedHint false、solved `[100]`、盤面の解番号 100
   - 1.5 秒後: Clear は非表示、playing true、recordText は空
4. 1 個外して同じ所へ戻す: 一致。外した時点で recordText 空 → 戻すと同じ (0,0) に置かれ、`記録済み（100 番）`、Clear 表示。履歴は 1 件 → 1 件（ms 123456 のまま）
5. 遊びかけありで続ける: 一致
   - 確認の文言 `6×10 の遊びかけの盤面が消えます\nこの回を続けますか？`
   - いいえ → Records のまま、Game は非活性、遊びかけ（ms 127335.86）の文字列は完全に同じ
   - もう一度 → はい → Game、残り 0、elapsed 125266（1 秒待ったあと）、usedAuto true、solved `[100]`、Clear なし。保存された遊びかけの ms は 123549.32 に置き換わった
6. はじめるで始め直す: 一致
   - 記録から続けた本編 → タイトル → はじめる: 残り 12、elapsed 933（`00:00`）、印なし、solved `[]`
   - つづきから（残り 0・elapsed 124576 で再開）→ タイトル → はじめる: 残り 12、elapsed 1008（`00:01`）、印なし、solved `[]`
   - 本編 → タイトルの移動は `goToTitle()` を evaluate で呼んだ（確認パネルのクリックは経由していない）。はじめる・つづきから・この回を続ける・はい・いいえ・盤の切り替えは、実際に座標をクリックした
7. `docs/UsersGuide.md` と `docs/images/records.png`: 一致。画像には Ⓐ 一覧・Ⓑ チェック・Ⓒ 全部選ぶ・Ⓓ 印・Ⓔ 完成形・Ⓕ 達成度・Ⓖ この回を続ける、①〜④ が下段の 4 つに付いていて、本文の Ⓐ〜Ⓖ と表の 1〜4 と合っている

## 変更されたファイル

`CLAUDE.md`・`docs/UsersGuide.md`・`docs/developer.md`・`docs/images/records.png`・`src/config.js`（コメントだけ）・`src/scenes/game.js`・`src/scenes/records.js`・`src/scenes/title.js`・`src/storage.js`・`tests.html`・`tools/capture.mjs`、未追跡の `archives/agents/TODO-073/`。
どれも TODO-073 の範囲（ボタン・続きの開始・はじめるの不具合・文書・キャプチャ）に収まっている。指示に無いファイルの変更は見当たらない。

## 確かめられなかったこと

- 下段のアイコンボタンは `getBounds()` の幅が 5〜9 px と小さく出た（アイコンの Graphics が大きさを持たないためとみられる。推定）。重なりの判定は縦の位置（下段 top 588 / 1088 とボタン bottom 520 / 1018）で行い、撮った画像でも重なっていないことを見た
- localStorage が使えない環境での「この回を続ける」は試していない（依頼の範囲外）
