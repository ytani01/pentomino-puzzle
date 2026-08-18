# TODO-034. 画面の確認を Playwright MCP に一本化する

## きっかけ

`CLAUDE.md` には「この環境では Playwright MCP は使えなかった」と書いてあり、
代わりに同梱 Chromium を CDP で直接叩く 61 行のスクリプトを載せていた。

原因はシステムに Google Chrome が入っていないことだったので、
`~/.mcp.json` の起動引数に `--executable-path` で同梱 Chromium を
指定して直した（2026-08-18。この項目を立てる前に実施済み）。

```
--executable-path <同梱 Chromium> --headless --isolated --output-dir ~/tmp/playwright-mcp
```

`--output-dir` を外に逃がすのは、既定ではカレント（＝リポジトリ）に
`.playwright-mcp/` が作られるため。実際に `git status` に出た。

MCP に寄せた理由:

- CDP 方式で実際に使えていたのは画面を撮ることだけで、クリックや
  ドラッグを試すには、そのたびに CDP の命令を調べて書き足すことになる。
  MCP には `browser_drag` や `browser_console_messages` が最初からある
- `CLAUDE.md` から 61 行（約 830 トークン）減る。MCP のツール定義は
  遅延読み込みなので、置いてあるだけでは context を消費しない

## やったこと

### `~/.mcp.json`（リポジトリの外）

`@playwright/mcp@latest` を `@playwright/mcp@0.0.79` に固定した
（2026-08-18 時点の最新）。

### `CLAUDE.md` の「画面を撮って確かめる」

CDP のスクリプト 61 行を消し、`browser_resize` → `browser_navigate` →
`browser_take_screenshot` の 3 手順に置き換えた。画面を進めてから撮るときは
間に `browser_evaluate` をはさむ。

スマホ扱いの切り替えだけは CDP の覚書として残した。

### スマホ扱いを 2 つ目のサーバにしなかった理由

`--mobile` 付きの 2 つ目のサーバを登録する案もあったが、登録しないことにした。

- CDP 側は `browser_run_code_unsafe` 1 回で済み、幅・高さも自由に決められる。
  対する `--mobile` は Pixel 10 固定で、どのみち `browser_resize` が要る
- ツールが二重になる
- Claude Code は起動時にしか `~/.mcp.json` を読まないので、登録しても
  着手中には確かめられない

### 項目を立てたときの記述が違っていた点

- `Emulation.setDeviceMetricsOverride` の `mobile: true` **だけでは
  タッチ扱いにならない**（読み込み直しても `'ontouchstart' in window` は
  false のまま）。続けて `Emulation.setTouchEmulationEnabled` と
  `Emulation.setEmitTouchEventsForMouse` を呼ぶと true になる。
  立てたときは `setDeviceMetricsOverride` だけで切り替わると書いていた

## テスト

コードは触っていないので `tests.html` には足していない。
書いた手順を、まっさらな状態からそのままなぞって確かめた（568x320）。

- タイトル画面 … `browser_resize` → `browser_navigate` →
  `browser_take_screenshot` で撮れた
- スマホ扱い … 覚書の CDP を叩いたあと `'ontouchstart' in window` が true
- ゲーム本編 … `browser_evaluate` で `Game` へ進めてから撮れた

途中で 2 つ、書いた手順のままでは通らない点が見つかり、その場で直した。

- `browser_take_screenshot` の `filename` に**相対名を渡すと、
  `--output-dir` ではなくカレント（＝リポジトリ）へ落ちる**。
  省略する（`--output-dir` に既定の名前で入る）か、絶対パスで渡す。
  実際に `git status` に出たので気づいた
- `browser_evaluate` に渡す関数は**波かっこで包んで、値を返さないこと**。
  返り値を JSON にするので、`scene.start()` の戻り（Phaser の ScenePlugin）を
  返すと `Converting circular structure to JSON` で失敗する

なお、旧記述にあった「WebGL 由来の `GPU stall due to ReadPixels` が大量に出る」は
MCP 経由では出ないので、注記ごと落とした。
