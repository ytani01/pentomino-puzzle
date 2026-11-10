# TODO-118 確認報告（verifier）

## 結論

`src/config.js` の `LAYOUTS`・`DEMO_LAYOUTS`・`TEXT_COLORS` は、変更前（8068479）と今の HEAD（2ec29d2）で**完全に一致**した。

## 実行したこと

1. 変更前と HEAD の `src/config.js` を git から取り出した（作業ツリーは読んでいない）。
   ```bash
   git show 8068479:src/config.js > $S/before/config.mjs
   git show HEAD:src/config.js    > $S/after/config.mjs
   ```
   `$S` は自分のセッションの scratchpad（`/tmp/claude-649/-home-ytani-work-pentomino-puzzle/f92b9bd3-88d4-4520-94f5-1c72bae10696/scratchpad`）。
   取り出したファイルは 910 行（before）と 916 行（after）。`import` 文は無い（単独で読める）。

2. `archives/agents/TODO-118/dump-config.mjs` は使わなかった。このスクリプトは `../../../src/config.js`（作業ツリー）を読むため、別の担当が編集中の内容を見てしまう。代わりに、引数で渡したファイルだけを読む同じ処理を scratchpad に書いた（`$S/dump.mjs`）。
   ```bash
   node $S/dump.mjs $S/before/config.mjs > $S/before.json   # exit 0
   node $S/dump.mjs $S/after/config.mjs  > $S/after.json    # exit 0
   diff $S/before.json $S/after.json                        # exit 0（差分なし）
   ```

3. 3 つの値が空でないことを確かめた。
   - `LAYOUTS`: object、キー 2 つ（`landscape`, `portrait`）
   - `DEMO_LAYOUTS`: object、キー 2 つ
   - `TEXT_COLORS`: object、キー 6 つ
   - 両 JSON とも 14821 バイトで同じ。

4. 作業ツリーの `src/config.js` は HEAD と差分なし（`git diff HEAD -- src/config.js` が空）。今回の比較は HEAD 側の内容で行った。

## diff の結果

食い違いなし（diff の終了コード 0、出力なし）。

## 確かめられなかったこと・判断できなかったこと

- `JSON.stringify` で比べているため、関数の値や `undefined` の値は比べられていない。3 つの値は数値・文字列・配列・オブジェクトだけだと見て読んだ範囲で、この前提は実測していない。
- 比べたのは `src/config.js` の 3 つの値だけ。ほかの定数や、この値を使う側（`src/logic.js` など）は確かめていない（範囲外）。
- 画面は見ていない（依頼どおり）。
