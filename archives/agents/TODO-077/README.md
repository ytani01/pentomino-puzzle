# TODO-077 の分担

- main: `hasUncoverableCell()` の実装と `solveStepsRandom()` への分岐、文書の直し。
  1 関数と 1 分岐の小さな変更なので implementer は立てなかった
- tests（Sonnet 5 / medium）: `tests.html` のテスト追加と、新しい分岐で前提が古くなった
  既存テストの直し、壊すと落ちるかの確認。TODO-067 の分岐を消したあとの直しも同じ担当に
  続けて頼んだ（`tests-report.md`。後半は追記）
- reviewer（Opus 5.5 / high）: 分岐の条件と順序、再現ロジックが実装と合うかを見る。
  挙動が変わる項目なので入れた（`reviewer-report.md`。再レビューは追記）

`bench.mjs` は着手前に 1 手あたりの時間を測ったもの、`sound.mjs` は解ける盤面で
`hasUncoverableCell` が真を返さないかを確かめたもの。
