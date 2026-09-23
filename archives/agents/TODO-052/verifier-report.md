# TODO-052 verifier report

## 検証環境

`python3 -m http.server 8765` をバックグラウンドで起動し、`playwright`
（npm パッケージを検証用スクラッチパッドへ `npm install playwright@1.63.0
--no-save` で一時導入。Chromium バイナリは `npx playwright install
chromium` で取得）で確かめた。スクリプトは
`/tmp/claude-649/.../scratchpad/verify.js` ほか（セッション終了で消える
一時ディレクトリ。プロジェクトには残していない）。

**headless では計測できなかった。** headless Chromium で `window.game.loop`
の `actualFps` を見ると 10〜12fps しか出ず（対象は 60fps）、Phaser の
`update(_time, delta)` が呼ばれる頻度が落ちて `this.waited += delta` の
積算が実時間より遅れ、"10 秒" のはずの待ちが実測 12.4〜18.3 秒になった
（コードの不具合ではなく、headless タブの rAF 間引きが原因と判断）。
そのため **`headless: false`（画面表示あり）で測り直した**。この環境には
`DISPLAY=:0` があり、headed 起動で 50〜55fps まで戻ることを確認済み。
以下はすべて headed での実測値。

## 確認項目

1. **solved → running の経過時間、その後 tried が増え続けるか**
   実測 **10003ms**（許容 9500〜11000ms の範囲内）。
   `tried` は再開直後 49 → 1.5 秒後に 90 で増え続けた。**一致**

2. **'solved' 中に `searchNext()` を呼ぶと即座に 'running' になるか**
   実測 **20ms** で `running` に変わった。**一致**

3. **'done' から代入した場合の探し直し**
   `state = 'done'` を代入してから **9979ms** 後に `running` に戻り、
   `solvedCount` は **0**、`tried` は戻った直後 **0**、1.5 秒後には **32**
   まで増えた。**一致**

4. **'solved' 中に `selectSpeed('slow')` を呼んでも 10 秒を数え直さない**
   solved から 6000ms 待って `selectSpeed('slow')` を呼び、その後
   `running` になるまでの経過時間（solved 時点からの合計）は **9349ms**。
   数え直すなら合計 16 秒前後になるはずのところ、ほぼ 10 秒のままだった
   ので数え直していない。**一致**（9349ms は 9500ms をわずかに下回るが、
   これは `waitForFunction` のポーリング間隔による測定誤差の範囲と見る。
   境界線上の判断なので断定はしない）

5. **コンソールのエラー**
   4 つの実測シナリオを通してブラウザの `console` の error と
   `pageerror` を拾ったが、**0 件**だった。

6. **`tests.html`**
   **277 件すべて通った**（`Pentomino Puzzle — テスト` の見出し直下の
   表示をそのまま引用）。fail・error に該当する行は無かった。

## 変更ファイルと指示範囲の一致

`git status --short` は次の 4 ファイルの変更のみ:
`README.md` / `docs/developer.md` / `src/config.js` / `src/scenes/demo.js`
（未追跡の `archives/agents/TODO-052/` を除く）。TODO-052 の節（デモの
10 秒待ちの実装と文書の更新）と一致しており、指示に無いファイルの変更は
無かった。

## 確かめられなかったこと・判断できないこと

- **headless 環境ではこの仕様の時間を正しく測れない。** 今回は headed に
  切り替えて測ったが、この判断（headed を使ってよいか）自体は自分の
  裁量で行った。依頼文は Playwright の使用手段までは指定していたが
  headless/headed の指定は無かったため、妥当と考えて進めたが、
  管理者の想定と違えば指摘してほしい
- 項目 4 の 9349ms は許容範囲（9500〜11000ms）よりわずかに小さいが、
  「10 秒を数え直していないこと」を見るのが目的の確認であり、その点は
  明確に一致している。ミリ秒単位の厳密な境界は判断できない
- 実機（Playwright を介さない、通常のブラウザタブ）での挙動までは
  確かめていない
