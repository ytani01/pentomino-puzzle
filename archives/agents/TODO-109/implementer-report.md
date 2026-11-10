# TODO-109 implementer 報告

## 消したもの
- `cachedSolutions()` — `src/solutions.js`（`rg -w` で呼ぶ側なし）
- `setMuted()` — `src/audio.js`（同上）
- `OUTLINE.width` — `src/config.js`（`OUTLINE` はコードの参照なし。`shadow*` は `game.js` が使うので残した）
- `removeHistory()` — `src/storage.js`。`tests.html` の呼ぶ側（3 件のテストと import）も消した。`removeHistoryMany()` のテストは残した

## 直した参照
- `src/config.js` NEON の説明: `OUTLINE.width` → `outlineWidth`
- `src/config.js` OUTLINE の説明の箇条書き: `OUTLINE.width` → `PALETTES[key].outlineWidth`（値は実際には 2〜3）
- `src/config.js` CHOICE_ICON の説明: 64px の出どころを `LAYOUT.board.cell` に
- `src/ui.js` MINI_EDGE のコメント: `OUTLINE.width`（2）→ `PALETTES[key].outlineWidth` の 2〜3
- `src/storage.js` のコメント 2 か所: `removeHistory()` → `removeHistoryMany()`。`removeHistoryMany()` の説明は、`removeHistory()` に書いてあった「番号で指す理由」を引き継いだ
- `docs/`・`CLAUDE.md`・`README.md` に 4 つの名前は無し（`rg -w` 確認済み）

## 検証
- `node --check` を `src/audio.js`・`config.js`・`solutions.js`・`storage.js`・`ui.js` に流した: すべて成功
- `rg -w 'removeHistory|cachedSolutions|setMuted|OUTLINE\.width'`（archives・TODO.md 以外）: 残りなし
- `tests.html` と画面は流していない（依頼どおり）

## 残る懸念
- 消した `removeHistory()` のテストのうち「番号を持たない古い形の件を読み替えてから消す」は、`removeHistoryMany()` のテストに同じ観点が無い（両方とも `loadHistory(…, solutions)` を通るので壊れる可能性は低い）。依頼の範囲外なので足していない。
