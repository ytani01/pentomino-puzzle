# TODO-086 reviewer 報告

対象: `git diff`（src/config.js・docs/UsersGuide.md・tools/capture.mjs）。demo.gif の中身と画面の見た目は見ていない。
調べ方: `rg -n "DEFAULT_PALETTE_KEY|'glass'|glass|ガラス|既定" src tests.html tools docs README.md CLAUDE.md .claude`。

## 要修正

なし。

## 検討

### 1. docs/UsersGuide.md:8 と 15 — 図の ② の選択が本文の「既定はネオン」と合わない可能性がある（実害は未確認）

- 何が問題か: 15 行目で「既定はネオン」と書いたが、すぐ上の `images/title.png` は
  `tools/capture.mjs` の `open()` の既定引数 `palette = 'glass'`（capture.mjs:31、
  172 行目で引数なしで呼ぶ）で撮られており、② ではガラスが選ばれた状態で写っているはず。
- なぜ問題か: 読み手が「図 = 初めて開いた画面」と受け取ると、本文と図が食い違って見える。
- 補足: TODO-086 の節は「他のキャプチャは色を指定して撮っているので変えない」と決めているので、
  変えないのは方針どおり。図に選択の強調が写っているかは見ていない（見た目は対象外）ため未確認。
  気になるなら「図はガラスで撮っている」と一言添えるか、capture の既定引数を `'neon'` に
  するかの判断になる（後者は title.png などを撮り直すことになり範囲が広がる）。

## 好みの範囲

### 2. tools/capture.mjs:31 — `open()` の既定引数 `'glass'` がゲームの既定と別物になった

ゲームの既定と一致していた頃の名残で、今は「文書用キャプチャの色」という意味になった。
挙動は変わらない（localStorage に必ず入れるので、ゲームの既定には依存しない）。直す必要は無い。

## 問題の無かった点

- 既定の組でだけ通る分岐: 無し。`DEFAULT_PALETTE_KEY` を使うのは `storage.js` の `loadPalette()`（68・70 行）と
  tests.html:157 の「PALETTES にある」の確認だけで、どちらも値によらない。
- 保存済みの人はその色のまま: `savePalette()` を呼ぶのは title.js:234（選び直したとき）だけで、起動時に
  既定を書き込まない。未選択の人だけがネオンになり、仕様どおり。boot.js:66 → registry → title/game/demo/records が読む流れも既定値に依存しない。
- tests.html: 「既定はガラス」を前提にした試験は無い（157 行は存在確認のみ）。
- 文書: README.md・CLAUDE.md・docs/developer.md に「既定はガラス」と読める記述は無い（developer.md:190 は選べる値の列挙）。
- src/config.js の JSDoc: 「ガラスを既定にする」を直し、既定の根拠を TODO 番号で参照している（規約どおり）。
- docs/UsersGuide.md:15 の行長: 46 字で、周りの行（最長 53 字）の範囲内。
- capture.mjs:285: README のリンク（`?demo=random&board=8x8`）で開いた新規の人は既定のネオンで見るので、GIF もネオンで撮るのは 284 行目のコメントの意図と合う。
- 範囲: 指示に無い変更は無い。
- テスト: 定数 1 つの差し替えで、既存の存在確認で足りる。

## 作り込みすぎ

作り込みすぎ: なし（Lean already. Ship.）。
