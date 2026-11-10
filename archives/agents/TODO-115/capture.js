// TODO-115: title.js と clear.js の長い create() を部品ごとのメソッドに分ける前後の撮り比べ。
// `browser_run_code_unsafe` の `filename` に渡す。前: OUT を .../before、後: .../after にするだけ
// （MCP はリポジトリと ~/tmp/playwright-mcp の外のファイルを読めないので、後は OUT だけ変えたコピーを
//  ~/tmp/playwright-mcp/todo115/ に置いて渡す）。前提: BASE でサーバが立っている。
// タイトルとクリア表示を、横（1280x720）と縦（720x1280）で 1 枚ずつ、キャンバス全体（clip）で撮る。
// 縦は、向きが読み込み時に決まるので、ビューポートを変えてから読み込み直す。
// 動くものは止めてから撮る（TODO-108 と同じ）:
//   title … 動くボード（previewGraphics）を隠し、そのタイマーを止める
//   clear … 本編の経過時間を 00:00 に書き、ネオンの明滅を止め（glow の alpha 1）、clearData を決まった値で入れて
//           showClear()（Clear が読むのは clearData だけ）
// 撮ったあと、ボタンを 1 つずつ実際に押し、どのシーンが動いているかを返す:
//   タイトルの「はじめる」→ Game、クリア表示の「タイトルへ」→ Title
async (page) => {
  const OUT = '/home/ytani/tmp/playwright-mcp/todo115/before';
  const BASE = 'http://localhost:8765/';
  const sleep = (ms) => page.waitForTimeout(ms);
  const race = (p, ms, label) => Promise.race([p.then(() => 'ok'), page.waitForTimeout(ms).then(() => label)]);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });   // 古い JS が残らないように
  const ready = (scene) => page.waitForFunction((s) => {
    const g = window.game && window.game.scene.getScene(s);
    return g && g.sys.isActive();
  }, scene, { timeout: 5000 });
  const canvasClip = () => page.evaluate(() => {
    const r = window.game.canvas.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  });
  const shot = async (name) => {
    const clip = await canvasClip();
    await page.screenshot({ path: `${OUT}/${name}.png`, clip });
    return clip;
  };
  const fresh = async () => {
    await page.goto(BASE);
    await page.evaluate(() => { window.localStorage.clear(); });
    await page.reload();
    await ready('Title'); await sleep(600);
  };
  // 文字（ラベル）から、そのボタンの中心（ページ座標）を求めて実際にクリックする。
  const press = async (sceneKey, label) => {
    const p = await page.evaluate(({ key, label }) => {
      const s = window.game.scene.getScene(key);
      const t = s.children.list.flatMap((o) => (o.list ? [o, ...o.list] : [o]))
        .find((o) => o.type === 'Text' && o.text === label);
      const b = t.getBounds();
      const r = window.game.canvas.getBoundingClientRect();
      const k = r.width / window.game.scale.width;
      return { x: r.left + (b.x + b.width / 2) * k, y: r.top + (b.y + b.height / 2) * k };
    }, { key: sceneKey, label });
    const result = await race(page.mouse.click(p.x, p.y), 3000, 'click timeout');
    await sleep(1000);
    const active = await page.evaluate(() => window.game.scene.getScenes(true).map((s) => s.sys.settings.key));
    return { click: result, active };
  };
  const freezeGame = () => page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.tweens.killAll();
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
    s.elapsed = 0;
    s.timeText.setText('00:00');
  });
  const out = {};

  for (const [name, size] of [['landscape', { width: 1280, height: 720 }], ['portrait', { width: 720, height: 1280 }]]) {
    await page.setViewportSize(size);
    const o = { orientation: null };

    // タイトルを撮って「はじめる」を押す
    await fresh();
    o.orientation = await page.evaluate(() => ({
      size: [window.game.scale.width, window.game.scale.height],
      registry: window.game.registry.get('orientation') ?? null,
    }));
    await page.evaluate(() => {
      const s = window.game.scene.getScene('Title');
      if (s.previewTimer) s.previewTimer.remove(false);
      s.previewGraphics.clear().setVisible(false);
    });
    await sleep(300);
    o.titleClip = await shot(`title-${name}`);
    o.pressStart = await press('Title', 'はじめる');

    // クリア表示を撮って「タイトルへ」を押す
    await fresh();
    await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
    await ready('Game'); await sleep(600);
    await freezeGame();
    await page.evaluate(() => {
      const s = window.game.scene.getScene('Game');
      s.clearData = {
        ms: 83000, usedAuto: false, usedHint: false, no: 1, total: 65,
        best: 83000, bestUpdated: true, status: 'new',
      };
      s.showClear();
    });
    await ready('Clear'); await sleep(800);
    o.clearClip = await shot(`clear-${name}`);
    o.pressToTitle = await press('Clear', 'タイトルへ');
    out[name] = o;
  }
  return out;
}
