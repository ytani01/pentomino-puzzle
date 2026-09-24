# TODO-057 画面確認

サーバ: `python3 -m http.server 8765`（既に起動済みを確認）。

## 撮った画像

| 画面 | 大きさ | 盤 | パス |
|---|---|---|---|
| デモ（深さ優先） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-depth.png` |
| デモ（探し方ボタン押下直後） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-random-tooltip.png` |
| デモ（ランダム、ツールチップ表示） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-random-tooltip2.png` |
| デモ（ランダム・最速、序盤） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-random-fastest-1.png` |
| デモ（ランダム・最速、3 秒後） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-random-fastest-2.png` |
| デモ（ランダム・最速、解けた後） | 1280x720 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-8x8-random-solved.png` |
| デモ（ランダム） | 1280x720 | 6x10 | `/home/ytani/tmp/playwright-mcp/demo-1280x720-6x10-random.png` |
| デモ（ランダム） | 844x390 | 8x8 | `/home/ytani/tmp/playwright-mcp/demo-844x390-8x8-random-fixed.png` |
| デモ（ランダム） | 844x390 | 6x10 | `/home/ytani/tmp/playwright-mcp/demo-844x390-6x10-random.png` |

（`/home/ytani/tmp/playwright-mcp/demo-844x390-8x8-random.png` は
`browser_resize` 前の誤ったビューポートで撮ったもの。上の `-fixed` が
正しいサイズのもの）

## 見たこと

- HUD 5 番目のボタンのアイコン: サイコロ（角丸の四角に目 5 つ）。
  1280x720・844x390 のどちらでも欠け・はみ出しなし
- ツールチップ: 押した直後は「探し方: ランダム」（`d.tooltip.list` から
  読み出した文字列と一致）。ボタン列や「解ける」ボタンとの重なりなし
- もう一度押すと `strategy` が `'depth'` に戻ることを `evaluate` で確認
  （見た目は深さ優先時のアイコン・縦の点。1280x720 で確認）
- ランダム・最速で数秒回すと、盤の左上から順ではなく、盤の中央寄りや
  右寄りにピースが置かれ、外れてトレイへ戻る様子が見えた（`試した手` が
  32 → 69 → 114 と増加）。ピースが盤の外へはみ出す・重なる・トレイに
  戻らない、は見られなかった
- 60 秒待たずに解に到達（`solvedCount` が 20 秒ほどで 2 に到達）。
  この過程は自動で進むため「解けた！ N 手目」の文言そのものは
  スクリーンショットで捉えられていない（`solvedCount` の増加のみ確認）
- 6x10・844x390・8x8/844x390 とも、盤とトレイが両方画面に収まり、
  枠からのはみ出し・重なりは見られなかった
- コンソール: エラー 0 件。警告は WebGL の `GPU stall due to ReadPixels`
  のみ（Chromium の描画ドライバのメッセージで、アプリのコードとは無関係）

## 気になった点（判断はしていない）

- 1280x720・6x10・ランダムで、`試した手 2` の直後に撮った 1 枚
  （`/home/ytani/tmp/playwright-mcp/demo-1280x720-6x10-random.png`）で、
  I ピース（5 マス縦）が盤の右端の枠線とトレイの間の隙間に、枠線へ
  半分かかった位置で描かれていた。ランダム配置はアニメーションで
  盤とトレイの間を動くため、たまたまその移動中の1コマを捉えた
  可能性がある。直後の 844x390・6x10 のスクリーンショットでは
  同様の位置関係は見られなかった。実害は未確認

## 2 回目（追加確認）

### 1. I ピースの位置合わせ（数値比較）

1280x720・6x10・ランダム・速さ「速い」（既定）で、`tweens.getTweensOf(piece.container).length === 0`
（そのピースの動きが止まっている）ときに、盤上の各ピースの
`container.x / y` と、`pieceTransform()`（`src/scenes/game.js:579`）と同じ式
（`layout.board.x + piece.col * cell`、`layout.board.y + piece.row * cell`）
で求めた期待値を比べた。2.5 秒間隔で 3 回サンプルした（`browser_evaluate` で
数値を直接読み出し）。

- 3 回とも、盤上の全ピース（6 枚: I, N, T, W, X, Z。同じ 6 枚だったのは、
  この回で配置がそこから進まなかったため）で `actualX/Y` と
  `expectedX/Y` が完全に一致した（例: I `600,239` = `600,239`）
- 一致したので、前回の報告にあった「I ピースが盤の枠線にかかって見えた」
  1 枚は、**移動中の 1 コマ**と判断してよい根拠が得られた
  （落ち着いている状態では常に期待値どおりの位置に描かれている）

### 2. 番号の丸の位置（`docs/images/demo.png` / `docs/images/game.png`）

- `demo.png`: HUD の 7 個のボタン（1〜7）とも、番号の丸はボタンの枠の
  内側の左端にあり、アイコンや隣のボタンと重なっていない。どの丸が
  どのボタンを指すか紛れない。上部の `A`（試した手・見つけた解）・
  `B`（解ける／解なし）も同様に、指す対象の直上に置かれ重なりなし
- `game.png`: HUD の 6 個のボタン（1〜6）も同じ配置で、丸はボタン内側
  左端、重なりなし。`A`〜`F` の説明（経過時間・トレイの残り・解ける／
  解なし・盤・トレイ・次のタップで回る）も、指す先との対応が紛れない
- どちらの画像も、丸が隣のボタンへはみ出す・アイコンと重なる、という
  見た目は無かった
