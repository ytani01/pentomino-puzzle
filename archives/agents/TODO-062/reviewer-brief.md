# TODO-062 reviewer への依頼

## 対象

`git diff`（未コミット。`src/logic.js`・`src/config.js`・`tests.html`・`docs/UsersGuide.md`・`docs/developer.md`）。
目的: デモのランダム（`solveStepsRandom()`）で、置き方の重みに直前の手からの近さを掛け、近くから順に埋めていくようにする。
実装・テストの報告: `archives/agents/TODO-062/implementer-report.md`・`tests-report.md`。

## 見てほしいこと

- 重みの式と「直前の手」（`stack` の最後。外したあとは 1 つ前の手になる）の選び方が目的に合うか。
  TODO-059（`touchWeight`）・TODO-060・TODO-066 の既存の動きを壊していないか
- `logic.js` が `config.js` の `DEMO` を読むことが規約（`CLAUDE.md`）に反しないか
- テスト: 直した既存テストが元の狙いを弱めていないか（tests の報告では原因が「limit で打ち切った末尾」のガード漏れ）。
  足したテストが近さを外すと落ちるか
- JSDoc・文書が今の動きと合っているか

## 見なくてよいもの

- 値 `randomNearPower = 2` の良し悪し（仮の値で、利用者が画面で決める）
- 画面の見た目、全解データ

## 報告

`archives/agents/TODO-062/reviewer-report.md` に、指摘を重い順に（場所・何が問題か・どうすればよいか）。
問題の無い観点は 1 行ずつ。コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。
返事は 5 行以内。
