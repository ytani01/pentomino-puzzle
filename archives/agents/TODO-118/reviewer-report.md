# TODO-118 reviewer 報告（f5eead4）

要修正: 0 件 / 検討: 1 件 / 好みの範囲: 1 件

## 検討

- `src/config.js:231` / `onBright: cssColor(COLORS.background)` の理由がコメントに無い
  - 前は `'#181b26'` を直接書いていたので、地の色と同じなのはたまたまにも読めた。今は `COLORS.background` を
    参照するので、地の色を変えると `onBright`（`COLORS.solved` の上の文字）も一緒に変わる。TODO の指示どおりで
    値も同じ（`0x181b26`）。ただ、残っているコメント「白では読みにくいため（TODO-103）」は「白でない」理由しか
    言っておらず、「地の色を使う」理由が無い。地の色に合わせる意図なら一言足すとよい。
    実害は未確認（今の値は前と同じ）。

## 好みの範囲

- `src/config.js:419-445` / `boardSize` を作って `...boardSize` で広げる。`boardPanel` の幅・高さを
  `if` の前に 1 回だけ書くためで、筋は通っている。キーの順（width, height, x, y）も前と同じ。

## 問題なしの観点

- 値が変わる経路: なし。`boardPanel`・`trayPanel` は呼び出しごとに新しいオブジェクトで、`boardSize` は外へ出ない
  （`rg` で `config.js` の中だけ）。スプレッドで別オブジェクトになるので参照の共有も無い。
  `trayPanel` のキーの順（x, y, width, height）も前と同じ。返り値の他のキーは触っていない。
- 評価順: `cssColor` は `const` で `TEXT_COLORS` より前（217 行）、`COLORS` も 179 行で先に定義済み。TDZ なし。
  `COLORS`・`TEXT_COLORS` を書き換える箇所は `src`・`tests.html` に無い（`rg "COLORS\.\w+\s*="`）ので、
  モジュール読み込み時に 1 回作る形で前と同じ。
- `cssColor`: `padStart(6, '0')` で上位が 0 の色にも対応。小文字の 16 進で前の文字列と同じ表記。
- 規約: 色は `config.js` の中、JSDoc は「なぜ」（`TEXT_COLORS` を `COLORS` から作る理由）が書いてある。
- 文書との整合: `TEXT_COLORS` の作り方や `makeLayout()` の中身を書いた文書は無い（`rg TEXT_COLORS docs README.md CLAUDE.md`）。
  `src/ui.js:469` の「`TEXT_COLORS` に対応する `COLORS` の値」も今のままで正しい。
- 範囲: `src/config.js` だけ。指示外の変更なし。テスト: 値の一致を JSON で確かめる方針で足りる（計算の挙動は変わらない）。
- 作り込みすぎ: なし。
- 残した三項演算子 3 か所（helpLines・trayLength・スロット座標）: 対象外とした判断で問題なし。
  `helpLines` は HUD より前、`trayLength` はボードの大きさを決める前に要り、スロットは `trayInner` の後なので、
  枠の `if` に入れるには `makeLayout()` の並びを変えることになる。
  ただし `TODO.md` の「三項演算子（6 か所）」は、変更前の 8 か所から `helpLines`・スロットを除いた数で、
  `trayLength` を含むと読める。実際に消したのは 5 か所（boardPanel.x / .y / trayPanel / .height / .width）。
  決着のときに項目の文言（6 → 5、または `trayLength` は残す旨）を合わせるとよい。
