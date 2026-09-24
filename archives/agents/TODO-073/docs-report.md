# TODO-073 docs の報告

根拠は `git diff src/`（`records.js` の `confirmContinue()` / `continueProgress()` / `doContinue()`・`refresh()`、
`game.js` の `init()`、`storage.js` の `progressFromRecord()`）と `docs/images/records.png`（Ⓖ を画像で確かめた）。

## docs/UsersGuide.md

- 記録の画面の一覧: Ⓕ のあとに **Ⓖ この回を続ける** を足した（完成形から始める・盤が切り替わる・
  時計と印を引き継ぐ理由・並べた直後は新しい記録にならない・遊びかけがあるときだけ確認）
- つづきから: 「記録の画面の **この回を続ける** で始めたときも、その盤の遊びかけは選んだ回の盤面に
  置き換わる」を足した
- TODO 番号は書いていない

## docs/developer.md

- シーンの移り方の図: `Records --> Game: この回を続ける（確認あり）` を足した
- 図の下の説明: Records が `progressFromRecord()` で作った遊びかけを保存し `{ progress }` を渡して
  Game を始めること、直接渡す理由、確認は遊びかけがあるときだけ（TODO-073）
- registry のキー: 「Title で選び直すたびに書き換える」→ Records の「この回を続ける」でも
  `BOARD_REGISTRY_KEY` を書き換える旨を足した（本編は `registry` の盤で始まるため）
- 記録の画面の用語表: **この回を続ける**（continue）の行を足した（記録が無いと出ない、全解のデータ待ちの間は押せない）
- いつ書き込まれるか: 「記録の画面で『この回を続ける』 | `saveProgress()`」の行と、図の Records に
  `R2["この回を続ける"] --> RS["saveProgress()"]` を足した

## CLAUDE.md

- `src/scenes/records.js` の行: 「…まとめて消す（TODO-031・TODO-071）」→ 末尾に「、選んだ回の続きを遊ぶ（TODO-073）」

## 直さなかった食い違い

- なし（コード側の誤りは見つからなかった）

## 食い違っていなかったところ

- 「記録と遊びかけを書き込むのは Game・Clear・Records の 3 つのシーンだけ」— そのまま正しい
- 遊びかけの形（`solved` を含む）の説明 — `progressFromRecord()` も同じ形を作るので変えていない
- `docs/developer.md` のファイル構成の木（`records.js  クリア記録の一覧`）・README.md — 要約なので変えていない
- `BOARD_REGISTRY_KEY` は `records.js` で import 済み（22 行）
