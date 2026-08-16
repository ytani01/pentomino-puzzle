# TODO-033. 文書とコードの食い違いを直す

## きっかけ

文書・設定とコードを突き合わせたところ、TODO-022 以降の変更に文書が
追いついていない箇所が見つかった。存在しない関数名（`hintFrom`）や、
既に廃止した操作（ダブルタップ反転）が残っていて、読んだ人がコードを
探して初めて違うと気づく状態だった。

**コードの振る舞いは直さず、説明だけを合わせる**方針にした。

## やったこと

### `docs/20260816-0538 …構造分析.md`

- `hintFrom` → `autoFrom`、`shouldRecord` → `shouldRecordBest`
- `boardSymmetries` を solutions.js のものとして書いていたのを、
  「展開は `buildSolutions`。使う変換は `logic.js` の `boardSymmetries`」に直した
- clear.js の説明を TODO-024 に合わせた。自力限定なのは `saveBest` だけで、
  履歴と達成度は頼った回も印付きで残す
- game.js の操作から「ダブルタップ反転」を消した（TODO-023 で廃止）。
  今はタップで向きを巡る（TODO-019・TODO-025）
- storage.js の役割に遊びかけ（TODO-030）とおまかせで導いた解の番号を、
  title.js に `つづきから`、records.js に 1 件削除（TODO-031）を足した
- シーン遷移図に Clear →記録（TODO-032）と `つづきから` を入れ、
  Game →記録の線（存在しない）を消した
- registry のキーを `SOLUTIONS_REGISTRY_KEY`（無い）から、
  `solutionsRegistryKey()` が作る `solutions/<盤>` に直した

5 章（サンプル識別子の決めごと）はコードと矛盾しないのでそのままにした。

### `docs/developer.md`

- `LAYOUT` という export は無いので、「`makeLayout()` が返す配置を
  `LAYOUT` と呼ぶ。export してあるのは盤ごとに集めた `LAYOUTS`」と書いた
- スロットの並びは横画面が 3 列 × 4 行、縦画面が 4 列 × 3 行。
  「3 列 × 4 行」と決め打ちしていたのを両方に直した

### コードのコメント

`hudRows = buttonRows + 1` なので `firstButtonRow` は常に 1 になり、
文字と同じ段にボタンが並ぶことはもう無い（TODO-026）。それを前提にした
古い言い方を直した。

- `src/config.js` の `firstButtonRow`「0 なら文字と同じ段に並ぶ（横画面）」
- `src/scenes/game.js` の「時間の表示と分け合う段（横画面の 1 段目）」

中央寄せでない側の枝は残してある（消すと当たりの見た目が変わりうるため）。

### `CLAUDE.md`

ファイル構成表に `tools/window-shim.mjs` と `docs/developer.md` を足し、
storage.js に色の組の保存を、records.js に 1 件削除を書き足した。

## テスト

計算も見た目も変えていないので `tests.html` には足していない。
`src/config.js` を Node から読み込んで、`LAYOUTS` が 2 盤ぶんでき、
`firstButtonRow` が 1、横画面のトレイが 3 列 × 4 行になることだけ確かめた。
