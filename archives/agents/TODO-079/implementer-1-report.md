# implementer-1 の報告（TODO-079）

担当: `src/logic.js`・`src/solutions.js`・`src/config.js`

## 直した件数（コメントのまとまり単位）

| ファイル | 直した | うち丸ごと消した |
|---|---|---|
| `src/config.js` | 40 | 1（`firstButtonRow` の経緯の 1 行）＋段落 1（`SOLUTIONS_REGISTRY_PREFIX` の経緯） |
| `src/solutions.js` | 8 | 0 |
| `src/logic.js` | 43 | 4（`sameShape`・`remove`・`isSolved` の「何をするか」だけの JSDoc。関数名で分かる） |

## 検証

- コメントを除いたコード（空行・行末の空白を除く）を HEAD と比べて一致: 3 ファイルとも一致
  （比べるスクリプトは文字列・テンプレートを避けてコメントだけを落とすもの。正規表現リテラルは 3 ファイルに無い）
- `git diff -U0` に、空行の追加・削除は無い
- `node --input-type=module --check < <file>`: 3 ファイルとも終了コード 0

## 消したコメントのうち判断に迷ったもの

- `src/solutions.js` `autoFrom()` の JSDoc（旧 146〜150 行）: 「探索順を混ぜて引き直していた仕掛け
  （TODO-017 の `shuffle` と `HINT_RETRIES`）は要らなくなった」を経緯として消した。
  **このファイルから TODO-017 の参照が無くなる**（番号参照を残す決まりに当たるかは要判断）
- `src/config.js` `SOLUTIONS_REGISTRY_PREFIX`（旧 810〜813 行）: `SOLVER_LIMIT` などが TODO-022 で
  消えた経緯の段落を丸ごと消した（同じファイルの他の箇所に TODO-022 は残る）
- `src/config.js` `DEMO`（旧 748 行）: 「TODO-040 の 5 の倍数だけを見る探索では 1〜1.5 万手で、
  速いで 1〜2 時間かかった」を経緯として消した。深さ優先で全解データの判定を渡す理由の裏付けでもあった
- `src/logic.js` `turnPivot()`（旧 155〜156 行）: 「レビュー: 8 通りを辿る形は作り込みすぎで、
  I・Z では答えが割れる欠点もあった」を経緯として消した
- `src/config.js` `INPUT`（旧 655〜656 行）: ダブルタップを無くした話は、「使わない（TODO-023）」と
  理由だけ残した（今もダブルタップを足さない理由になるため）

## 範囲外だが気づいたこと（直していない。コメントの内容が今のコードと合わない）

- `src/config.js` `TILE`・`OUTLINE` の JSDoc: `edgeDarken` を「0.68 にしてある」「強くしすぎない」と
  書いているが、値は `0.0`（係数 0 は真っ黒）
- `src/config.js` `ICON`: 「ボタンの高さ（44）」とあるが、今の `HUD_BUTTON_HEIGHT` は 56（TODO-076）
- `src/config.js` `HINT_BADGE`: 「`HUD_ROW` = 56」とあるが、今の `HUD_ROW` は 68
- 意味が変わるので、どれも数値は書き換えずに残した
