# TODO-046 verifier 報告

ブラウザは使わず、main が撮った画像（`~/tmp/claude-img/todo046-*.png`）と
`src/scenes/title.js`・`src/config.js`・`src/ui.js` を読んで確認した。

## 1. 各画像の図（はみ出し・欠け・仕様どおりか・文字が残っていないか）

- todo046-landscape.png（844×390、開いた直後）… 一致。盤ボタン 2 つ・色ボタン
  3 つとも枠内に収まり、文字は残っていない。8×8 は中央に小さな穴、6×10 は
  横長のマス目。色は左からガラス（水色半透明 1 色）・12 色（赤緑青の
  2×1 片 3 つ）・ネオン（暗い中身＋色の外周）に見える。
- todo046-portrait.png（390×844）… 一致。同上、縮小されているが枠からの
  はみ出し・欠けは無い。
- todo046-selected.png（844×390、6×10・ガラスを選択後）… 一致。
- todo046-tooltip.png（844×390、ガラスに 0.9 秒ホバー）… 一致。
- todo046-records.png（844×390、記録の画面）… 一致。盤の選択は「8×8」
  「6×10」の文字ボタンのままで、図には変わっていない（記録画面はこの
  項目の対象外なので、これでよい）。

## 2. selected で強調色が押したボタン（6×10・ガラス）へ移っているか

一致。todo046-selected.png で、盤は 6×10 側の枠が水色に光り、盤の図の
マス目も水色に強調されている（8×8 側は非選択の暗い枠）。色はガラスの
枠が水色に光っている（12 色・ネオンは非選択）。main が evaluate で確かめた
状態（`board 6x10, palette glass`、`selected` が盤 `[false,true]`・色
`[true,false,false]`）と画像の見え方が一致している。

## 3. tooltip で「ガラス」が出ていて、画面の外へ切れていないか

一致。todo046-tooltip.png で色の行の下、ガラスボタンの真下あたりに
「ガラス」という札が出ており、画面の左右上下いずれの端にも掛かっていない。

## 4. records で盤の選択が文字のままか

一致。todo046-records.png の盤の行は「8×8」「6×10」という文字のボタンの
ままで、図には変わっていない（この項目の対象は記録画面ではないため、
文字のままで正しい）。

## 5. src/scenes/title.js のツールチップ文言と、src/config.js の label・note

`src/scenes/title.js` の該当箇所（`boardChoices` / `paletteChoices` の
組み立て、113〜131 行あたり）を確認した。

```js
const boardChoices = Object.values(BOARDS).map((board) => ({
  ...board, icon: boardIcon(board), tooltip: `${board.label}（${board.note}）`,
}));
const paletteChoices = Object.values(PALETTES).map((palette) => ({
  ...palette, icon: paletteIcon(palette), tooltip: palette.label,
}));
```

`src/config.js` の `BOARDS` / `PALETTES` の値:

- `8x8`: `label: '8×8'`, `note: '中央 2×2 は穴'` → ツールチップ
  「8×8（中央 2×2 は穴）」。一致。
- `6x10`: `label: '6×10'`, `note: '穴なし'` → ツールチップ
  「6×10（穴なし）」。一致。
- `glass`: `label: 'ガラス'` → ツールチップ「ガラス」。一致。
- `colorful`: `label: '12 色'` → ツールチップ「12 色」。一致。
- `neon`: `label: 'ネオン'` → ツールチップ「ネオン」。一致。

指示の 5 つの文言すべてと一致した。

## 確かめられなかったこと・判断できないこと

- コンソールのエラー・pageerror 0 件は main の報告をそのまま受けた
  （自分では実行していない）。
- 実際のブラウザでの操作（クリック・ホバーのタイミングなど）は行っておらず、
  画像とコードの読み合わせのみでの判定。画像自体が加工されていないか、
  提示された撮影条件（サイズ・クリック順など）が事実かどうかは検証できない。
- デザインの良し悪し、他の部品のレイアウトは指示どおり見ていない。
- 境界線上の判断（例: ネオンの図が「暗い中身に光る色の外周」に見えるかは
  縮小画像での主観的判定）は、実害は未確認。
