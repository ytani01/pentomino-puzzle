# TODO-093 依頼（implementer）

git worktree の中で作業する。依頼と報告のファイルは本体の木
`/home/ytani/work/pentomino-puzzle/archives/agents/TODO-093/` にある（worktree 側には無い）。
報告はそこへ絶対パスで書く。

## 目的
記録画面（`src/scenes/records.js`）の盤の選択・削除ボタンと、最上段のタイトル行（`src/ui.js` の `createTitleBar()`）を直す。
並行して別の担当がタイトル画面（`src/scenes/title.js`・`src/icons.js`・`CHOICE_ICON`）と本編（`src/scenes/game.js`）を直しているので、そこには触らない。

## やること
1. 記録画面の盤の選択ボタンを、タイトル画面と同じ図のボタンにする。タイトルは
   `boardIcon(board)`（`src/icons.js`）を `icon`、`${board.label}（${board.note}）` を `tooltip` に渡し、
   高さ `CHOICE_ICON_HEIGHT` で `createChoiceRow()` を呼んでいる（`src/scenes/title.js` の create を読む）。同じにする。
   高くなるぶん、記録画面の縦の配置（`L.*`）を詰め直し、縦・横どちらの画面でもはみ出さないようにする。
   記録画面にツールチップ（`createTooltip`）が無ければ足す。
2. 削除ボタン（ゴミ箱、`this.trashButton`）を「全部選ぶ」と同じ行の右端（一覧の右端に揃える）へ移し、今より少し大きくする。
   押せる／押せないの挙動、確認の表示は変えない。
3. `createTitleBar()` の「PENTOMINO PUZZLE」の文字を少し大きくし（例: `FONT.small` → `FONT.body` 程度）、
   その右横に小さめ（`FONT.small` 程度、薄い色）で `VERSION` を出す。タイトル行を使う本編・記録・デモすべてに効く。
   押せる範囲はこれまでどおり題字（バージョンの文字は押しても何も起きなくてよい）。
   バージョンが 2 か所に出ないよう、タイトル行を出す画面では右下の `createVersionText()` を呼ばない
   （タイトル画面とクリア表示は右下のまま）。`rg -n "createVersionText|createTitleBar" src` で呼び出し元を洗う。
   `src/scenes/game.js` の呼び出しを消す 1 行だけは触ってよい。
   本編（HUD の行）・デモでタイトル行が大きくなって重ならないかも見る。重なるならタイトル行の高さ（`config.js` の `TITLE_BAND` など）で調整する。
4. `docs/UsersGuide.md`・`docs/developer.md` に記録画面のボタン配置やバージョン表示の位置を書いた文があれば直す
   （`rg -n "バージョン|ゴミ箱|消す|全部選ぶ" docs README.md`）。

## 保つもの
- 規約（`CLAUDE.md`）: 色・数値は `config.js`、JSDoc は「なぜ」、`setTimeout` 禁止。
- 記録画面の既存の挙動: チェック・全部選ぶ・まとめて消す・頁送り・続きを遊ぶ・盤の切り替え。

## 完了条件
- 変更した js がすべて `node --check` を通る。
- `python3 -m http.server`（空いているポート）で `tests.html` が全件通る。
- worktree のブランチに `wip(TODO-093): …` で 1 コミットする。
- 報告は `/home/ytani/work/pentomino-puzzle/archives/agents/TODO-093/implementer-report.md`（変更点・決めた寸法・ブランチ名）。返事は 5 行以内。
