# TODO-121. 部品（ui.js）と記録・タイトル画面の繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 51 | 13,466 | 21,314 | 2,622,253 | 36% |
| impl-121（implementer） | Sonnet 5.5 | medium | 72 | 26,847 | 110,435 | 2,768,491 | 39% |
| rev-121（reviewer） | Opus 5.5 | high | 16 | 4,951 | 51,399 | 322,850 | 5% |
| screens-121（screens） | Sonnet 5.5 | low | 54 | 10,533 | 64,596 | 1,434,598 | 20% |
| 合計 |  |  | 193 | 55,797 | 247,744 | 7,148,192 | 計 7,451,926 |

- TODO-119 と並行して進めた（利用者の指示）。main の行は同じ時間帯に TODO-119 と共有した値
- 集計は `token-usage.py TODO-121 --since '2026-11-11 04:28:00'`。同じ時間帯に動いた TODO-119 の担当の行は除いた

## きっかけ

全ファイルを読み直したリファクタリングの洗い出しで、確認の枠の開け閉め、ボタンの状態ごとの色の決め方、記録の `refresh()`、タイトルの始めるボタンとボードの選択肢が、画面ごとに書き直されていた。

## やったこと

- `createConfirmDialog()` が `open(text, onYes)`・`hide()` を返すようにし、`game.js`・`records.js` の表示の切り替え・`confirmAction` の差し替え・音の重なりを消した。`confirmKind` と `silent` は保った。使われなくなった返り値 `parts`・`text` も消した（レビューの好みの範囲）
- `createButton()` の `redraw()` で状態を先に 1 つに決め、面・縁・文字・アイコン・印の色を `config.js` の表から引く
- `records.js` の `refresh()` を一覧の行・頁送り・全部選ぶ・選んだ回の詳細に分け、「全部にチェックが付いているか」を 1 つにした。`restoreRelayout()` を `applyRelayout()` に改名し、`docs/developer.md`・`CLAUDE.md` も直した
- `title.js` の始めるボタンを配列から作り、ボードの選択肢を `title.js` と `records.js` で同じ関数から作る

## 確かめたこと

- ボタンの色: 状態の組み合わせ 16 通りで変更前後の出力が完全に一致（`archives/agents/TODO-121/button-colors.*.json`）
- レビュー: 要修正 0 件。好みの範囲 2 件（使われない返り値、JSDoc の後の空行）は直した
- 画面（88c8c13 を別ポートで配信。縦 320x568・横 568x320）: タイトル・記録・本編の確認の枠に欠け・重なり・文言の抜けが無い。始めるボタン・ツールチップ・全部選ぶ → 消すの確認の枠・本編の確認の枠の「はい」が動く。コンソールのエラー 0 件
- 音は呼び出しが前と同じことをコードで確かめただけで、耳では聞いていない

## 分担の振り返り

- implementer は色の一致を 16 通りで機械的に比べ、確認の枠の開き直しまでスクリプトで動かした。reviewer は使われなくなった返り値を見つけた。screens は食い違いを見つけなかった
- 見込みどおりの編成で、食い違いは無い。implementer が全体の 39% で、4 つの変更を 1 人で抱えたのと検証用のスクリプトを 3 本作ったため
- 次に同じ規模なら同じ編成でよい。ボタンの色のような値の一致は implementer のスクリプトで足りるので、screens には「映っているものが正しいか」と操作 1 回ずつだけを頼む（今回どおり）
