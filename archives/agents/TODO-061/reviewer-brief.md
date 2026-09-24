# TODO-061 reviewer への依頼

## 対象

`git diff`（未コミット）。仕様は `TODO.md` の TODO-061 の節と、利用者が決めたこと: 「狭い空き」は置ける手の少ないマスで測る。
狭い所を覆えるピースを `DEMO.randomTightWeight`（仮の値 4）で選ばれやすくし、選んだら狭い所を覆う置き方に絞る。
報告: `archives/agents/TODO-061/implementer-report.md`・`tests-report.md`。

## 見てほしいこと

- 狭い所の選び方（`countCellMoves()`・`pickTightCell()`）と、ピースの重み・置き方の絞り込みが仕様どおりか。控え `failed` を除いた
  `choices` から数えているので、控えで消えた手の分だけ狭く見えることの影響（実害は未確認でよい）
- TODO-059・062・066〜068 の動きを壊していないか。乱数は `random` だけか
- JSDoc・`docs/`・`config.js` の説明が今の動きと合うか（TODO-062 の「ピースは近さに関係なく選ぶ」などの古い言い方）
- テスト: 直した既存 2 件と足した 6 件が狙いを弱めていないか。比べるテストがシードの組をずらしても通るか（tests は 10 組で確かめたと報告）
- 1 手あたりの重さ（implementer は 0.3ms と報告）

## 見なくてよいもの

画面の見た目、全解データ、`randomTightWeight` の値の良し悪し。

## 報告

`archives/agents/TODO-061/reviewer-report.md` に、指摘を重い順に（場所・問題・どうすればよいか）。問題の無い観点は 1 行ずつ。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
