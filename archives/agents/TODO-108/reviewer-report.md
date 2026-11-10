# TODO-108 レビュー（872dc0b）

要修正: 0 件 / 検討: 1 件 / 好みの範囲: 0 件

## 検討

- `src/scenes/game.js:323-328`（`createHud()`）: 差分の範囲外の整形が混ざった。
  `timeText` と `remainText` の間にあった空行が消え、`remainText` の後ろは空行が
  2 行連続になった（`rg -n -B1 -A1 '^$' ` で 327・328 行目が両方空）。
  挙動は変わらない（実害は未確認というより、見た目のみ）。「範囲」の観点で、
  元の空行 1 行ずつ（`timeText` の後ろに 1 行、`remainText` の後ろに 1 行）に戻すと
  差分が純粋な置き換えになる。

## 一致した箇所

- 差し替え 34 か所（`textStyle(` の呼び出し: clear 6、demo 2、title 5、game 5、
  records 6、ui 10）すべてで、前後のキーと値が同じ。キーの順だけ違う
  （`align` などを `extra` で後ろに足す）が、Phaser のスタイルでは順序は意味を持たない。
- `FONT` に無い大きさ（`TIME_FONT`=58、`ICON.captionSize`=16、`Math.round(fontSize * 0.85)`）は
  元と同じ式のまま `size` に渡している。`fontSize` は `${size}px` で元と同じ文字列。
- `title.js` の `bestText`: 元は `color` なし。`textStyle(FONT.hud)` は `color` を
  キーごと付けない（`color !== undefined` のときだけ代入）。`color: undefined` のキーは
  どこでも作られない。
- `color` 引数に渡している `TEXT_COLORS.*` はすべて `config.js` に定義がある
  （normal・dim・accent）。`undefined` が渡る経路は `bestText` 以外に無い。
- `align`・`lineSpacing`・`wordWrap`・`padding` の値は元と同じ
  （confirm 枠 `center`、本編の help `center`、記録の detail `center` + `lineSpacing: 2`、
  タイトルの遊び方 `center` + `lineSpacing: 4` + `wordWrap`、タイトルバー `padding`）。
- 差し替え漏れ: `rg -n "fontFamily" src` は `ui.js` の関数と JSDoc だけ。
  `add.text(` の呼び出しは、`ui.js` 以外も全部 `textStyle` 経由。
  `setStyle` は使われていない。
- `FONT`・`TEXT_COLORS` の import は各シーンでまだ使われており、未使用にならない。
- 文書: `CLAUDE.md` のファイル構成表と `docs/developer.md` の `ui.js` の行に
  `textStyle()` を足してあり、実装と合っている（README・`.claude/` に旧記述は無い）。
  規約（`setTimeout` 不使用、色は `config.js`、JSDoc は「なぜ」）に反する点は無い。
