# implementer-2 の報告（TODO-079）

## 直した件数（コメントのまとまり単位）

| ファイル | 件数 |
|---|---|
| `src/scenes/demo.js` | 21 |
| `src/scenes/records.js` | 36 |
| `src/scenes/game.js` | 66 |

## 検証

- `node --input-type=module --check < src/scenes/{game,demo,records}.js` … 3 本とも終了コード 0
- コメントを取り除いて `HEAD` と比べた（`scratchpad/impl2/cmp.mjs`。文字列・テンプレートリテラルは残し、
  行末の空白と空行だけ無視する。先頭のインデントは比べる）… 3 本とも一致（SAME）。
  文字列 1 文字・数値 1 か所を変えた複製では DIFF・終了コード 1 になることも確かめた
- `git diff -U0` の変わった行は、すべてコメントの行（`//`・` *`・`/**`）。空行の増減は無し

## 消した・書き換えたうち判断に迷ったもの

行番号は編集後のもの。

- `demo.js:120` `update()`: 「レビューの要修正 1」を消した（経緯）
- `game.js:122` `create()` の入力の説明、`game.js:660` `onPointerMove()`、`game.js:717` `turnDrag()`、
  `game.js:769` `startDrag()`: 「TODO-069 レビューの要修正 N」を消し、`TODO-069` の番号だけ残した
- `game.js:1184` `runHint()` の JSDoc: 「前は上限まで探索して 0.3 秒近く止まっていた…
  `SOLVE_CHECK_DELAY`…『？？？』」の段落をまるごと消した（経緯のみで、今の「なぜ」は前段落に残る）
- `game.js:1359` `recordSolved()`: 「前は `clear.js` が受け持っていた」を消した（経緯）
- `game.js:34` `DEPTH` の JSDoc: 盤・ピース・トレイ・ドラッグ・確認の重なり順の列挙を消し、
  コードから読めない tooltip の位置の理由だけ残した
- `records.js:16`・`records.js:60` ファイル冒頭・`L` の JSDoc: 「撮り比べて利用者が選んだ配置。もう一つの案は消した」
  を経緯として消した
- `records.js:46` `ROW_TEXT_WIDTH`: 「チェックボックスを足す前の `listWidth`（TODO-027 の頃からの値）」
  「TODO-071 の案を撮ったときに見つかった不具合」を経緯として縮めた

### 意味が少し変わった（元の記述が今のコードと合っていなかったので合わせた）

reviewer に見てほしい。

- `demo.js:315` `refreshStatus()`: 「探索が進むたびに毎フレーム呼ぶ」→「1 手ごとに呼ぶ」。
  呼ぶのは `finishStep()`（1 手ごと）と `refreshHud()` で、毎フレームではない（最速では結果的に毎フレーム）
- `records.js:595` `refresh()`: 「1 件も無いときだけ行ごと引っ込める」→「頁の数を消す」。
  コードは前へ・次へを隠さず押せなくするだけで、消えるのは頁の数の文字だけ

## 範囲外だが気づいたこと（直していない）

- `game.js` `recordSolved()` の JSDoc が `recordClear()` を名指ししているが、呼んでいるのは
  `recordCompletion()`（`storage.js`。中で `recordClear()` を呼ぶ）。誤りではないが間接的。コード参照なので変えていない
- `game.js` `turnMarkCenter()` の「外接矩形の真ん中は U や X のように空いていることがある」の X は、
  3×3 の真ん中が埋まっているので当てはまらないように見える。意味を変えないため残した（実害は未確認）
- スクラッチパッドが他の担当と共有されており、`scratchpad/strip.mjs` を別の担当に上書きされた。
  比較スクリプトは `scratchpad/impl2/` に置き直した
