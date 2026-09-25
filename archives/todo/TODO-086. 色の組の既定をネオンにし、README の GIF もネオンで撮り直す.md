# TODO-086. 色の組の既定をネオンにし、README の GIF もネオンで撮り直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 3,155 | 9,132 | 54% |
| reviewer | Opus 5.5 | high | 345 | 35,030 | 23% |
| screens | Sonnet 5 | low | 843 | 43,372 | 23% |
| 合計 |  |  | 4,343 | 87,534 | 概算 $1.3 |

- reviewer は定義（`~/.claude/agents/reviewer.md`）のモデルが sonnet。既定の挙動が変わる項目なので Opus 5.5 に上書きした

## きっかけ

利用者の依頼（2026-09-26）。デモの既定の色をネオンにし、README の GIF も差し替えたい。
場面を聞いたところ、デモだけでなく本編の既定もネオンにすると決めた。

## やったこと

- `src/config.js`: `DEFAULT_PALETTE_KEY` を `'neon'` に。「ガラスを既定にする」と書いた JSDoc を直した
- `docs/UsersGuide.md`: 色の組の説明に「既定はネオン」
- `tools/capture.mjs`: GIF をネオンで撮るようにし、撮り直した（他の PNG は元に戻した）
- 既に色を保存している人は、その色のまま（`loadPalette()` が保存した値を先に見る）
- 見送り: `docs/UsersGuide.md` のタイトルの図（`title.png`）はガラスを選んだ状態で撮ってある
  （reviewer の指摘）。図が誤っているわけではなく、撮り直すと他の図も変わるので、そのままにした

## 確かめたこと

- reviewer: 既定の組を前提にした分岐・テスト・文書は他に無い
- screens（960×640）: 保存の無い状態でタイトル・デモとも registry が `'neon'`。
  `'glass'` を保存して読み直すと `'glass'`。コンソールのエラー 0
- GIF: 480×320・100 フレーム・10 秒。先頭・中央・末尾を抜いて見た。ネオンの色で、欠けや余計なものは無く、ピースが増えていく

## 分担の振り返り

- reviewer: 要修正は無し。`title.png` の食い違って見える点を拾った
- screens: 食い違いは見つけていない
- 見込みとの食い違い: 無し
- 次に同じ規模なら: 定数 1 つの変更なら、reviewer は Sonnet でも足りた。前提にした箇所を探すのは `rg` 1 本で済み、Opus の判断が要る場面が無かった
