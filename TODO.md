# TODO

**残っている項目: TODO-117、TODO-118、TODO-119、TODO-120。** これまでに 116 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-121` から。**

## TODO-117. 確認の枠の開閉を ui.js の createConfirmDialog() にまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `createConfirmDialog()` が `open(text, onYes)`・`hide()` を返すようにし、`game.js`・`records.js` の
  `openConfirm()`・`hideConfirm()` の同じ処理（`confirmParts` の表示切り替え・`confirmAction` の差し替え・音）を消す。
  `confirmKind`（向きが変わったときに開き直すため。TODO-095）と `silent` は保つ

**無駄を省く工夫:** 画面の確認は本編の「やり直す」と記録の「消す」の 2 つを開いて閉じるだけ。向きの切り替えは 1 回。

## TODO-118. createButton() の色の選び方を表にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] `ui.js` の `createButton()` の `redraw()` で、状態（無効・選択・押下・hover・通常）を先に 1 つに決め、
  面・縁・文字・アイコン・印の色を `config.js` の表から引く。今の 4 つの if の連鎖をなくす。色の結果は変えない

**無駄を省く工夫:** 色の一致は状態ごとに `evaluate` でまとめて読み出す（ボタンを 1 つずつ押させない）。

## TODO-119. game.js の create() を部品ごとのメソッドに分ける

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

- [ ] 105 行の `create()` を、状態の初期化・全解の読み込み・入力の登録などのメソッドに分ける（TODO-115 と同じやり方）。
  呼ぶ順（部品を組んでから遊びかけを読む、`ready` は最後に立てる）とコメントの「なぜ」は保つ
- [ ] `DemoScene`（`GameScene` を継承）の `create()` が呼ぶメソッドと食い違わないか見る

**無駄を省く工夫:** 画面は本編・つづきから・デモを 1 回ずつ開くだけ。`tests.html` は触らないので流さない。

## TODO-120. records.js の refresh() を分け、relayout から戻すメソッドの名前を揃える

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high） |

- [ ] 67 行の `refresh()` を、一覧の行・頁送り・全部選ぶ・選んだ回の詳細に分ける
- [ ] `restoreRelayout()` を `game.js`・`demo.js` と同じ `applyRelayout()` に改名する
  （`rg -n restoreRelayout` で出る箇所と文書をすべて）

**無駄を省く工夫:** 画面の確認は reviewer の差分の読み合わせで足りる（描く値は変えない）。気になる点が出たときだけ screens を足す。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
