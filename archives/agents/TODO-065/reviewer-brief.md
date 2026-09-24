# TODO-065 reviewer への依頼

## 対象

`git diff`（未コミット）。仕様: デモのランダム・`animate` の速さで、置く前にトレイでの向きから置く向きまで最短の回転・裏返し
（`orientationSteps()`）で 1 段ずつ見せてから盤へ滑らせる。回した分の時間を次の手までの待ちに足す。最速と深さ優先は回さない。
報告: `archives/agents/TODO-065/implementer-report.md`。

## 見てほしいこと

- 回している間に `update()` が次の `advance()` を呼ばないか（`this.waited` と前の手の `waitScale` の関係。回し始める時点の待ちの扱い）。
  呼ぶなら、手が重なって絵と探索がずれる
- `cancelTurn()`: 速さの切り替え・探し方の切り替え・次の解へ（`startSearch()`）で、仕上げる手が古い generator を先読みしないか、
  `startSearch()` の中で仕上げた手が盤に残らないか。解が見えて止まっているときや、タイトルへ戻るときの扱い
- `orientationSteps()` が最短か（BFS なら同じ段数の候補の選び方）、X など向きが 1 つのピース、裏返しの段の向き
- 待ちの足し方（`extraScale` を `pickWaitScale()` の揺らぎに足す。外す手の連なり（TODO-060）を壊していないか）
- 規約（`setTimeout` 無し、値は `config.js`、状態はシーンのプロパティ、本編 `GameScene` の動きを変えない）
- テスト: 足した `orientationSteps()` のテストが、最短でない経路（例: 回転を 3 回）を返す壊し方で落ちるか。Node で確かめる

## 見なくてよいもの

画面の見た目、`randomTurnStepMs` の値の良し悪し、全解データ。

## 報告

`archives/agents/TODO-065/reviewer-report.md` に、指摘を重い順に（場所・問題・どうすればよいか）。問題の無い観点は 1 行ずつ。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
