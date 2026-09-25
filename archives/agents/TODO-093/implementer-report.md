# TODO-093 implementer 報告

## 前提の食い違い（作業前に直したこと）

依頼を受けた worktree のブランチ `worktree-agent-afd122b130ce050ce` は、
`develop` から 113 コミット遅れていた（`createTitleBar` や `boardIcon` を
導入した TODO-089・TODO-087 などが無い状態）。作業前に
`git merge --ff-only develop`（ローカルの `develop` を一時的な
リモート参照 `local/develop` として取り込み、統合後に削除）で `develop`
の最新（`82c93d2`）まで早送りしてから着手した。差分は無いので巻き戻しの
心配は無い（fast-forward のみ）。

## 変更したファイル

- `src/ui.js:35-66` `createTitleBar()` — 題字を `FONT.small` → `FONT.body` に
  拡大。右横に `VERSION`（`FONT.small`・薄い色）を添えた。押せる範囲は題字
  だけ（バージョンは非インタラクティブ）。呼び出し側の `.setDepth()` が
  両方に効くよう、2 つの文字を `Container` にまとめて返す形に変更（戻り値の
  型が `Text` → `Container` に変わったが、既存の呼び出し元はどれも
  `.setDepth()` を呼ぶか無視するだけなので、動作は変わらない）。
- `src/config.js:242-243` `TITLE_BAND` — 34 → 42（題字を大きくしたぶん、
  本編・デモの HUD がタイトル行と重ならないように）。
- `src/scenes/game.js:99-100` — `createVersionText(this);` の呼び出しを削除
  （タイトル行にバージョンを出すようになったため。依頼で明示された 1 行の
  変更のみ）。
- `src/scenes/records.js` — 複数箇所。
  - `boardButtons` をタイトルと同じ図のボタンにした（`boardIcon(board)` を
    `icon`、`${label}（${note}）` を `tooltip`、`CHOICE_ICON_HEIGHT` で
    `createChoiceRow()` を呼ぶ）。
  - `createVersionText(this)` の呼び出しと import を削除（タイトル行に
    バージョンが出るため）。
  - `createSelectAll()` に、ゴミ箱ボタンを「全部選ぶ」と同じ行の右端
    （`L.listX + L.listWidth/2` に揃える）へ追加。大きさは新しい
    `L.trash`（縦画面 50×60、横画面 42×54。前は `L.foot` と同じ
    42×56 / 36×48 だった）。
  - `createFoot()` からゴミ箱を削除し、前へ・次へ・頁数だけの行に詰め直した。
  - `L`（画面ごとの配置）を全面的に組み直した（下の「決めた寸法」）。
- `docs/UsersGuide.md` — 記録の画面の説明（Ⓒ の項）にゴミ箱の位置を追記し、
  画面下のボタン表からゴミ箱の行を削除（3 → タイトルへ、に詰めた）。
- `docs/developer.md` — 用語集の「ゴミ箱」の説明を「下段のボタン」→
  「全部選ぶと同じ行の右端」に、「タイトル行」の説明にバージョンを
  添えたことを追記。

## 決めた寸法（`src/scenes/records.js` の `L`）

盤の選択ボタンが高くなった分（46→58）と、ゴミ箱が「全部選ぶ」の行へ
移って行が高くなった分（32→60/54）を吸収するため、`titleY` から下を
全部組み直した。横画面は一覧（左列）と完成形（右列）が別の列なので、
一覧側の高さが増えた分は `rowsPerPage` を 8→7 に減らして吸収し、右列
（`boardBox`・`detailY`・`continueY`・`achieveY`）は共有の `chooseY` 行が
高くなった分だけ動かした。縦画面も `rowsPerPage` を 9→8 に減らしている。

具体的な値は `src/scenes/records.js` の `L` 定義（コメント付き）を見てほしい。
手計算で「重ならないだけの余白」を積み上げて決めており、実測ではない
（後述のスクリーンショットで確認済みだが、フォントの実際の描画高さは
見積もりなので、境界に近い箇所があれば詰め直しの余地がある）。

## 確認したこと

- `node --check` — `src/ui.js`・`src/config.js`・`src/scenes/records.js`・
  `src/scenes/game.js` すべて通過。
- `tests.html` — `python3 -m http.server` + 同梱の Playwright Chromium を
  ヘッドレスで動かして開き、**430 件すべて通った**ことを確認（このプロジェクトの
  `screenshot` skill・Playwright MCP はこの環境で使えなかったため、CDP を
  直接叩くスクリプトで代用。使い終えて Chromium と http.server は停止済み）。
- 見た目 — 同じ Chromium で記録画面を 568×320・320×568・390×844 で撮影
  （記録が無い状態、および localStorage に履歴を仕込んで完成形・達成度・
  「この回を続ける」まで出した状態の両方）。どのサイズでもはみ出し・重なりは
  見当たらなかった。本編・デモの横画面（568×320）も撮り、タイトル行と
  HUD が重ならないことを確認した。

## 判断が要る点・範囲外の気づき

- **`src/scenes/demo.js` はバージョンが 2 か所に出たまま。** 依頼は
  「`game.js` の呼び出しを消す 1 行だけは触ってよい」だったので、
  `demo.js`（`createVersionText(this)` と `createTitleBar()` の両方を持つ）
  には手を付けていない。スクリーンショットで実際に「PENTOMINO PUZZLE dev」
  （タイトル行）と右下の「dev」が両方出ることを確認した。直すなら
  `demo.js:44` の import から `createVersionText` を外し、108 行目の呼び出しを
  消すだけで済むはず（範囲外なので実施していない）。
- `docs/images/records.png`・`docs/images/game.png` などのキャプチャは
  今回の配置変更を反映していない（吹き出しの文字が指す位置がずれる）。
  `CLAUDE.md` の方針どおり `tools/capture.mjs` で撮り直す作業だが、依頼の
  範囲外なので手を付けていない。
- 寸法は手計算（フォントの実描画高さは概算）。境界に近い箇所（縦画面の
  `footY` 付近など）があるので、確認担当は実機幅に近いサイズ
  （568×320 が一番厳しい）でのスクリーンショットを重ねて見てほしい。
