# TODO-110 implementer 報告

終わった。判断が要る点なし。

## 変えたファイル
- `src/logic.js`（末尾）: `pieceColor()`・`darken()` を JSDoc ごとそのまま移した。2 つとも Phaser・DOM に依らない純関数
- `src/scenes/boot.js`: 2 つを削除。`TEX` は残した。import を `../logic.js` から取る形に（13 行目）
- `src/ui.js:12`・`src/icons.js:14`: import を `./logic.js` に変更（`icons.js` は既存の import に合流）
- `src/scenes/game.js:15,17,33`: `darken`・`pieceColor` を `../logic.js` の import へ、`./boot.js` からは `TEX` だけ
- `CLAUDE.md:66`（`logic.js` の行）・`docs/developer.md:100`（3 層の分け方）: 説明に足した。`boot.js` の行は変更不要
- `TODO.md`: TODO-110 の 1・3 つ目をチェック

## 検証
- `node --check src/*.js src/scenes/*.js`: 全て成功
- `rg -n -w -e darken -e pieceColor src tests.html tools`: `boot.js` から import している箇所は残っていない
- コード中のコメントに旧所在への参照は無かった

## 残る懸念
なし。`tests.html`・画面は次の担当。
