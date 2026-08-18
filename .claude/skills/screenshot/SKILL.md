---
name: screenshot
description: Pentomino Puzzle の画面を Playwright MCP で撮って見た目を確かめる（スマホ横画面ではみ出さないか、など）。画面の確認が必要なときに使う。
---

# 画面を撮って確かめる

見た目の確認（スマホの横画面ではみ出さないか、など）は、Playwright MCP で
headless の Chromium を動かして撮る（TODO-034）。設定は `~/.mcp.json` にあり、
Playwright に同梱の Chromium を `--executable-path` で指している
（システムに Google Chrome が入っていないため。`--isolated` で毎回まっさらな
プロファイル、撮ったものは `--output-dir` の `~/tmp/playwright-mcp` に入る）。

タイトル画面なら、大きさを決めて開いて撮るだけでよい。

```
browser_resize            568 x 320
browser_navigate          http://localhost:8765/
browser_take_screenshot
```

ゲーム本編のように**画面を進めてから撮る**ときは、間に一段はさむ。

```
browser_evaluate          () => { window.game.scene.getScene('Title').scene.start('Game'); }
```

**波かっこで包んで、値を返さないこと。** `browser_evaluate` は返り値を
JSON にするので、`scene.start()` の戻り（Phaser の ScenePlugin）を返すと
`Converting circular structure to JSON` で失敗する。

- スマホ横画面の確認に使った大きさ: `568x320`（iPhone SE 初代）、`667x375`、
  `844x390`、`915x412`。**一番厳しいのは 568x320**
- `browser_take_screenshot` の `filename` に**相対名を渡すと、`--output-dir`
  ではなくカレント（＝リポジトリ）へ落ちる**。省略する（`--output-dir` に
  既定の名前で入る）か、絶対パスで渡す
- コンソールは `browser_console_messages`、操作は `browser_click` や
  `browser_drag` で試せる
- Claude のブラウザ拡張（claude-in-chrome）は、この環境では未接続で使えない

**スマホ扱い**（画面の大きさだけでなく、タッチ機器として振る舞わせる）は、
Playwright の API ではブラウザコンテキストを作るときに決まり、後から
変えられない。CDP にはその制約が無いので、`browser_run_code_unsafe` から
開いて切り替える。

```javascript
async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride',
                 {width: 568, height: 320, deviceScaleFactor: 1, mobile: true});
  await cdp.send('Emulation.setTouchEmulationEnabled',
                 {enabled: true, maxTouchPoints: 5});
  await cdp.send('Emulation.setEmitTouchEventsForMouse',
                 {enabled: true, configuration: 'mobile'});
  await page.reload();   // 'ontouchstart' in window は読み込み時に決まるため
};
```

- **`setDeviceMetricsOverride` の `mobile: true` だけではタッチ扱いにならない。**
  残る 2 つも呼ぶこと（TODO-034 で実測）
- 効いたかどうかは `browser_evaluate` で `'ontouchstart' in window` を見る
