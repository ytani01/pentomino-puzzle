# TODO-057 の分担

項目: [TODO-057](../../todo/TODO-057.%20デモの幅優先をやめ、ランダムに置く探し方を足す.md)

| 担当 | 受け持ち | 理由 |
|---|---|---|
| implementer | `src/logic.js`・`src/scenes/demo.js`・`src/icons.js` | 探索の generator と状態遷移の書き換えで、判断が要るため Opus に上書き |
| tests | `tests.html` の差し替えと、壊すと落ちるかの確認 | 書き方が決まっているので Sonnet |
| reviewer | 差分のレビュー（2 回） | 分岐と状態遷移が変わるため。Opus に上書き |
| screens | デモの画面、撮り直した図の番号の位置 | 画面の実測。Sonnet |
| main | 文書（UsersGuide・developer・CLAUDE.md）、`tools/capture.mjs` の番号の丸の位置、図の撮り直し | 文書の直しが小さいため |

報告: [implementer](implementer-report.md)（3 回）・[tests](tests-report.md)（3 回）・
[reviewer](reviewer-report.md)（2 回）・[screens](screens-report.md)（2 回）。
`check-random.mjs` は implementer が作った Node での検査スクリプト。
