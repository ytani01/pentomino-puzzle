# TODO-083 画面確認（URL でデモを直接開く）

画面: 960x640 のみ。サーバ: `python3 -m http.server 8766`。

## 結果一覧

1. `http://localhost:8766/` → Title のみ開く（`getScenes(true)` = `["Title"]`）。コンソール 0 エラー / 0 警告。一致。
2. `?demo=random&board=8x8` → `getScene('Demo')` = `{strategy:"random", boardKey:"8x8", state:"running", tried:9}`（3 秒待機後）。一致。
   コンソールは WebGL の性能系警告のみ（`GPU stall due to ReadPixels`、4 件、エラー 0）。
   画像: `/home/ytani/tmp/playwright-mcp/todo083-demo-random-8x8-960x640.png`
3. `?demo=depth&board=6x10` → `getScene('Demo')` = `{strategy:"depth", boardKey:"6x10", state:"running", tried:11}`（3 秒待機後）。一致。コンソール 0 エラー / 0 警告。
   画像: `/home/ytani/tmp/playwright-mcp/todo083-demo-depth-6x10-960x640.png`（6×10 の盤が映っている）
4. `?demo=foo&board=bar` → `{strategy:"random", boardKey:"8x8", state:"running"}`。指示どおり random・8x8 にフォールバック。一致。コンソール 0 エラー / 0 警告。
5. 3 の状態から `getScene('Demo').goToTitle()` を呼ぶ →
   `location.search` = `""`（空）、`getScenes(true)` = `["Title"]`、`registry.get('board')` = `"8x8"`（URL の 6x10 は入っていない）。すべて一致。
   その後 `location.reload()` → Title が開く（`getScenes(true)` = `["Title"]`）。一致。コンソール 0 エラー / 0 警告。
6. 5 のあと、Title 画面上の「デモ」ボタンをマウスクリックで押す（`page.mouse.click` を実座標へ変換して実行）→
   Demo が開き `{strategy:"random", boardKey:"8x8"}`。registry の値（盤 8x8）どおりで、strategy は random（既定）。一致。コンソール 0 エラー / 0 警告。
7. 音: 直接測れなかった（未確認）。`src/audio.js` の AudioContext・unlock 状態はモジュール内の変数で
   `window` に公開されておらず、`browser_evaluate` から読めない。依頼文にある注意（`import()` で別インスタンス
   になるため使わない）のとおり、別ルートで読み込んでも同じ状態は見られない。
   手順 6 でクリックした「デモ」ボタンは `title.js` 199〜203 行目で `onClick` 内から
   `audio.unlock(); audio.button();` を呼んだあとに `scene.start('Demo')` している
   （実ユーザー操作＝マウスクリックで到達しているので、ブラウザの自動再生制限には引っかからないはず、という
   コードを読んだ限りの推測。実測はできていない）。

## コンソールのエラー・警告

全手順を通してエラーは 0 件。警告は手順 2 で WebGL の性能系ドライバメッセージが 4 件出たのみ
（`GPU stall due to ReadPixels`。描画のたびに出るブラウザ側のログで、コードの不具合を示すものではなさそう。
境界線上の判断はしない）。他の手順は警告も 0 件。

## 途中の障害（前回の中断分の補足）

前回、他の担当と同じブラウザセッションを共有していたためタブの内容が競合し中断した。
今回は「ブラウザを使う担当は自分だけ」との連絡を受けて `browser_close` → 開き直しで再実行し、
以降は競合なく完了した。

## 補足: 手順 2 のスクリーンショットについて

`browser_take_screenshot` はタイムアウト（5 秒既定）で 3 回連続失敗した（前回の中断時）。
今回は `browser_run_code_unsafe` から `page.screenshot({ path, timeout: 30000 })` を使い、
手順 2・3 とも 1 回で成功した。
