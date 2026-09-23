# TODO-050 reviewer への依頼

対象: `git diff`（src/config.js, src/icons.js, src/logic.js, src/scenes/demo.js, tests.html）。
目的と範囲は TODO.md の TODO-050、実装の報告は archives/agents/TODO-050/implementer-report.md、
テストの報告は tests-report.md。

見ること:
- `solveStepsBreadth` の正しさ: 段の順に展開しているか、置き直し（共通の先頭を残して違う分だけ remove→place）が
  盤の整合を保つか、solved のあと next() で続きを探して出し切れるか、`random` の入れ替えが solveSteps と同じか
- demo.js: 探し方の切り替え（'loading' / 'running' / 'solved' / 'done' のどの状態で押しても壊れないか、
  前の generator の手が残らないか、ピースがトレイへ戻るか、tried に replay を数えないか）
- config.js のレイアウト変更で本編（game.js）の HUD が変わっていないか
- プロジェクト CLAUDE.md の規約（setTimeout 禁止、色・数値は config.js、logic.js に Phaser/DOM なし、JSDoc は「なぜ」、中身のない JSDoc なし）
- テストが実装の性質を捕まえているか（弱いテスト）

見なくてよいもの: 画面の撮影、性能の測り直し、文書（CLAUDE.md・docs/ は別担当）。
コードは直さない。原因の切り分けや境界線上の判断はせず「実害は未確認」と添えて報告だけ。
報告は archives/agents/TODO-050/reviewer-report.md（指摘を重い順に。問題の無い観点は 1 行）。返事は 5 行以内。
