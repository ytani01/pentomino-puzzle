# TODO-108 implementer の報告

## 関数
`src/ui.js:29` `textStyle(size, color, extra = {})`。`{ fontFamily: FONT.family, fontSize: `${size}px` }` に、
`color` が `undefined` でなければ `color` を足し、最後に `Object.assign` で `extra` を混ぜる。
キーの順は前と同じ（fontFamily、fontSize、color、そのほか）。`size` は数値（px の値）で受け、
`'NNpx'` の文字列にするのは関数の中（前も全箇所が `` `${...}px` `` の文字列だった）。

## 差し替えた件数
34 か所（`rg -n "fontFamily: FONT.family" src` は 0 件になった）。clear 6、demo 2、title 5、game 5、records 6（`記録なし` の 1 行書きを含む）、ui 10。

## 特別扱いした箇所
- `title.js` の `bestText`: `textStyle(FONT.hud)`（`color` のキーなし）。`setColor` で後から決める点は変えていない。
- `clear.js` の `TIME_FONT`、`ICON.captionSize`、`createButton()` の `Math.round(fontSize * 0.85)`: 数値のまま渡す（前と同じ `'NNpx'` になる）。
- `extra` を使う 5 か所: `title.js` の遊び方（align・lineSpacing・wordWrap）、`game.js` の操作の概要（align）、
  `records.js` の `detailText`（align・lineSpacing）、`ui.js` の `createTitleBar()`（padding）と `createConfirmDialog()`（align）。
  コメントも `extra` の中に残した。

## 検証
- `node --check` を `src/ui.js` と `src/scenes/*.js` に流した: 全て成功（終了コード 0）。
- `textStyle()` を `node` で呼び、`FONT.hud` 単独（`color` なし）、`ICON.captionSize` 付き、`extra` 付きの 3 つのキーと値が前と同じことを確認した。
- `git diff` を 1 か所ずつ見て、前後のキー・値が同じことを確認した（色の式、三項演算子の箇所を含む）。
- 画面の撮り比べと `tests.html` は流していない（依頼のとおり）。

## 注意・懸念
- 差し替えで行が長くなる箇所は、`add.text()` の引数の途中で折り返した（既存の最長行 112 桁を超えるものを折り返し。
  `clear.js` の `正解の …` の行のように、既存の揃え方のまま折り返したものがある）。長い行が数本 115 桁前後で残る。
- `CLAUDE.md` の `src/ui.js` の行に TODO-108 を書いた（CLAUDE.md のほかの行の書き方に合わせた）。`docs/developer.md` には TODO 番号を書いていない。
- 範囲外で気づいたこと: なし。
