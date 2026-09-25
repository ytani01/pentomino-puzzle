# TODO-078 画面確認報告（screens）

## 撮った画像
- `/home/ytani/tmp/playwright-mcp/todo078-demo-full.png` — デモ画面全体、844x390、探し方=ランダム（初期状態）
- `/home/ytani/tmp/playwright-mcp/todo078-demo-random-full.png` — 同、探し方=深さ優先に切り替え後
- `/home/ytani/tmp/playwright-mcp/todo078-strategy-random.png` — 探し方ボタンの切り出し（ランダム、散らばりの図）
- `/home/ytani/tmp/playwright-mcp/todo078-strategy-depth.png` — 同（深さ優先、木の図）

## 観点ごとの結果

1. **深さ優先とランダムを並べて見分けられるか**: 問題なし。木（分岐して下に広がる形）と
   散らばり（星状に放射する形）で、形がはっきり異なり見分けられる。
2. **0.5 倍相当の縮小で線・節が潰れないか**: 問題なし。実機の HUD ボタン上の実寸
   （ブラウザの devicePixelRatio 込みで内部解像度の約 0.61 倍。ICON.size=28px →
   節の直径は画面上で約 4px）で撮った切り出し画像でも、6 つの節と線がそれぞれ
   分離して見え、塊には見えない。
3. **`docs/images/demo.png` に新しい図案が映っているか**: 問題なし。ボタン 6
   （番号バッジ付き）に散らばり型の新しい図案が映っている。旧図案
   （[-0.6,-0.6] 起点の対称な形）ではない。

## コンソール
エラー 0、警告 4（すべて `GL Driver Message ... GPU stall due to ReadPixels` という
WebGL/GPU ドライバ由来のパフォーマンス警告で、アイコンの変更とは無関係）。
