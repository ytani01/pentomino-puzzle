# TODO-043 の分担

項目: [TODO-043](../../todo/TODO-043.%20デモを、ヒント表示を入にして解くときのような動きにする.md)

| 担当 | 受け持ち | その分担にした理由 | 報告 |
|------|---------|------------------|------|
| implementer（Opus 5.5） | `logic.js` の判定の差し替えと、`demo.js` の読み込みを待ってから始める流れ・HUD | 探索の手順を保ったまま判定を外から渡す設計が要るため | [implementer-report.md](implementer-report.md)（依頼は [implementer-brief.md](implementer-brief.md)） |
| reviewer（Opus 5.5） | 差分の規約・設計・壊れる筋の確認。指摘を直したあとの見直しも | 探索の挙動と状態の遷移が変わるため | [reviewer-report.md](reviewer-report.md) |
| tests（Sonnet 5） | `tests.html` に `canContinue` のテスト。壊すと落ちるかも | 実装した本人にテストの強さを判断させないため | [tests-report.md](tests-report.md) |
| screens（Sonnet 5） | 4 通りの配置で HUD の文字が重ならないか | 見た目は撮らないと分からないため | [screens-report.md](screens-report.md) |

reviewer の指摘（所要時間の記述、読み込みの取り違え、コメント）は main が直した。
