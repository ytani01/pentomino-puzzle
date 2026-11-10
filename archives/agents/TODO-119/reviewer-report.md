# TODO-119 reviewer 報告（01e7341・b6e86c8）

挙動の変化: **なし**（要修正 0 件）。

## 問題の無い観点

- Map と `PIECES.find()`: 見つからない名前の扱いは同じ。`undefined`・`null`・`'__proto__'`・`'constructor'`・`'toString'`・`'f'`・`'F '`・`0`・`NaN`・`{}`・`['F']` の 11 種で、両方とも `undefined` を返すことを node で実測した。`storage.js:590` の `!definition` の検査は前と同じに効く
- `fillColor()`: `ui.js`・`icons.js` は前と同じ三項。`boot.js:74` の `makeNeonTile` は `palette.neon` の分岐でしか呼ばれないので、必ず `darken` 側を通る。glass と neon が両方立つ組では、`paletteIcon` が前もネオンの暗さを使っていたので変わらない
- `bakeTile()`: `textures.exists` で早く返す・`make.graphics({x:0,y:0}, false)`・`generateTexture(key, size, size)`・`destroy` の順番と引数が、3 つとも前と同じ。`draw` が例外を投げたときに `destroy` されないのも前と同じ
- `isPositiveNumber()`: `Number.isFinite` は型を変換しないので、`typeof` の検査は重複していた。`'5'`・`true`・`null`・`[3]`・`new Number(5)`・`Infinity`・`-1`・`0`・`1e-300`・`5n` で前と同じ結果になることを実測した
- 規約: `logic.js` に足したのは `config.js` の `NEON` の import だけで、Phaser・DOM は無い。`search.js` は読まない。色はコードに直接書いていない。トップレベルに書き換わる `let` は無い。JSDoc には理由が書いてある
- 使われなくなった import: `ui.js` の `NEON`・`PIECES` は消えている。`darken` は `ui.js:274`・`icons.js`・`boot.js` で今も使う
- 古い名前: `rg -n "PIECE_BY_NAME|fillDarken"` の結果は、どれも新しい定義か `NEON.fillDarken` の定義・説明で、古い名前は残っていない
- 範囲: 指示に無い変更は b6e86c8（typeof の削除）だけ。管理者が把握していて、挙動も変わらない

## 検討

1. **`CLAUDE.md:66`（ファイル構成の表の `src/logic.js` の行）に `fillColor()` が無い。**
   この行には `pieceColor()`・`darken()` のように色の関数を名前で並べているので、新しく足した `fillColor()` も並べると揃う。根拠は表の今の書き方。`config.js` の行は export を並べていないので、`PIECE_BY_NAME` は足さなくてよい。
2. **`tests.html` に `fillColor()` のテストが無い。**
   `darken()`・`pieceColor()` には TODO-110 で足したテストがある（`tests.html:2947` から）。`fillColor()` も `logic.js` の純関数で、CLAUDE.md は「`tests.html` から確かめられるよう `logic.js` に置く」としている。テストを足すなら、ネオンの組で `darken(c, NEON.fillDarken)` になること・ネオンでない組で `c` のままになることの 2 件で足りる。`check-fill.mjs` は archives にある使い捨てのスクリプトで、リグレッションテストの代わりにはならない。

## 好みの範囲

3. **`boot.js:151` の `makeNeonTile(key, size, palette, color)`。** `palette` は `fillColor()` に渡すためだけの引数で、`fillColor` はここで必ず `palette.neon` が立った状態で呼ばれる。決め方を 1 か所にまとめるという項目の目的には合っているが、引数が 1 つ増えた。今のままでよい。
4. **`logic.js` の `darken()` の JSDoc。** 「マスの縁と外周が使う」と書いてあるが、塗りの色（`fillColor`）にも使われている。これは今回より前から書かれていなかったことで、今回の差分が古くしたわけではない。

## 作り込みすぎ: なし
