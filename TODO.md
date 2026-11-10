# TODO

**残っている項目: TODO-121。** これまでに 120 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-122` から。**

項目は、触るファイルと確かめ方が同じものでまとめてある。

## TODO-121. 部品（ui.js）と記録・タイトル画面の繰り返しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `createConfirmDialog()` が `open(text, onYes)`・`hide()` を返すようにし、`game.js`・`records.js` の `openConfirm()`・
  `hideConfirm()`・`doTrash()` に重なる処理（表示の切り替え・`confirmAction` の差し替え・音）を消す。
  `confirmKind`（向きが変わったときに開き直すため。TODO-095）と `silent` は保つ
- [ ] `createButton()` の `redraw()` で、状態（無効・選択・押下・hover・通常）を先に 1 つに決め、面・縁・文字・アイコン・印の色を
  `config.js` の表から引く（今の 4 つの if の連鎖をなくす）。色の結果は変えない
- [ ] `records.js` の 67 行の `refresh()` を、一覧の行・頁送り・全部選ぶ・選んだ回の詳細に分け、「全部にチェックが付いているか」の
  計算（`refresh()`・`toggleSelectAll()`）を 1 つにする。`restoreRelayout()` は `game.js`・`demo.js` と同じ `applyRelayout()` に改名する
  （`rg -n restoreRelayout` で出る箇所と文書をすべて）
- [ ] `title.js` の 3 つの始めるボタンを `clear.js` の `createButtons()` と同じく配列から作り、ボードの選択肢（`boardIcon()` と
  「ラベル（注記）」のツールチップ）を `title.js` と `records.js` で同じ関数から作る

**無駄を省く工夫:** ボタンの色の一致は状態ごとに `evaluate` でまとめて読み出す（1 つずつ押させない）。画面はタイトル・記録・
本編の確認の枠を縦・横で 1 回ずつ。同じ関数を通るボタンは 1 つ押せば足りる。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
