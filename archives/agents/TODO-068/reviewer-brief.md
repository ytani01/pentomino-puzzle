# TODO-068 reviewer への依頼

## 対象

`git diff`（未コミット）。仕様は `TODO.md` の TODO-068 の節: 置いた直後に 5 の倍数でない閉じた空きができたら、
大きさによらず直前の 1 手をその場で外す（TODO-060 の「ピースより小さい空き」を広げた）。
報告: `archives/agents/TODO-068/implementer-report.md`・`tests-report.md`。

## 見てほしいこと

- 条件（`!regionsFitPieces(board)`）と分岐の並び（TODO-066 → 068 → 067）が仕様どおりか。TODO-059・062・066・067 を壊していないか。
  とくに、既定の `canContinue`（`regionsFitPieces`）では置いた直後の `ok:false` が必ずその場で外れることになる。
  「置ける手が尽きたら ok が真になるまで外す」流れや、TODO-066 の 2 手外しが死んだコードになっていないか（デモは `hasSolution` を渡す）
- JSDoc・`docs/`・`src/scenes/demo.js` のコメントに、古い言い方（ピースより小さい空きだけ、大きい空きは行き詰まってから戻す）が残っていないか
- テスト: 直した 7 件が元の狙いを弱めていないか。とくに近さのテスト（6×10）で `randomNearPower` を 8→12 に上げて通したのは、
  値を合わせて通しただけになっていないか（シードや盤で結果が揺れるか）。`canContinue` を `hasSolution` に差し替えた 2 件の妥当性

## 見なくてよいもの

画面の見た目、全解データ、値の良し悪し。

## 報告

`archives/agents/TODO-068/reviewer-report.md` に、指摘を重い順に（場所・問題・どうすればよいか）。問題の無い観点は 1 行ずつ。
コードは直さない。境界線上の判断は「実害は未確認」と添えて報告だけ。返事は 5 行以内。
