# TODO-092 依頼（implementer）

## 目的
タイトル画面（`src/scenes/title.js`）の概要文・ネオンの見本・ボタンの並びを直す。

## やること
1. 遊び方の枠の文言を盤に連動させない。1 行目を
   「12 種のピースを盤にすき間なく敷き詰めるパズル。」に統一し、空行のあとの操作 3 行は今のまま残す。
   盤を選び直したときに `howToText` を書き換える処理は要らなくなる（`howToPlay(board)` の引数も不要）。
   枠の幅で折り返さないか確かめ、折り返すなら切れ目を決め打ちで 2 行に割る（今のコメントの考え方）。
2. `src/icons.js` の `paletteIcon()` で、`palette.neon` のときに本編のネオンのにじみ
   （`src/scenes/game.js` の `drawPieceEdges()`、`NEON.glow` の層）と同じ描き方で、外周の内側へ太く薄い線を重ねる。
   太さは本編の盤の 1 マスに対する値なので、見本の 1 マス（`CHOICE_ICON.pieceCell`）の比で縮める。
   縮める比の出し方は任せるが、値を置くなら `src/config.js` の `CHOICE_ICON` にコメント付きで置く。
   凹の角の欠けの埋め方も本編に合わせる。明滅はしない。
   「ネオンのにじみは描かない」という JSDoc の記述を直す。
3. 「はじめる」「つづきから」「記録」を横 1 列に並べ、幅を詰める。`STACK` から `records` の行を消す。
   縦画面は内部解像度の幅 640 に収めること。高さは今の `START.height` 前後でよい。
4. 「デモ」ボタンを画面の右下に小さめ（例: 幅 110〜130・高さ 44 前後）で置く。右下のバージョン表示
   （`createVersionText()`、`ui.js`）と重ならないようにする（バージョンの上に置くなど）。
5. 空いた縦の余りに応じて `STACK` の間隔を見直してよい（横画面の余りのコメントも実態に合わせる）。
6. `docs/UsersGuide.md` の「記録の横にある デモ」など、タイトルのボタンの位置を書いた文を今の配置に合わせる。
   `rg -n "デモ|記録|つづきから|はじめる" docs/UsersGuide.md README.md docs/developer.md` で当たる行のうち、
   タイトルの並びに触れたものだけ直す。

## 保つもの
- 規約（`CLAUDE.md`）: 色・数値は `config.js`、`setTimeout` 禁止、JSDoc は「なぜ」。
- 既存の挙動: `つづきから` の押せる／押せない、Space/Enter で開始、動く盤、盤・色の選択。

## 変えないもの
- 本編・記録・デモのシーン。`docs/images/` は撮り直さない（管理者がやる）。

## 完了条件
- `node --check` が通る（変更した js 全部）。
- `python3 -m http.server 8765` を立てて `tests.html` が全件通る（Playwright がなければ node で import できるかまで）。
- 報告は `archives/agents/TODO-092/implementer-report.md` に、変更点と決めた寸法を書く。返事は 5 行以内。
