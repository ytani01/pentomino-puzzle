// TODO-114: 向きを変える印（回転・裏返し）の計算と描画を game.js から出す前後の撮り比べ。
// `browser_run_code_unsafe` の `filename` に渡す。前: OUT を .../before、後: .../after にするだけ
// （MCP はリポジトリと ~/tmp/playwright-mcp の外のファイルを読めないので、後は OUT だけ変えたコピーを
//  ~/tmp/playwright-mcp/todo114/ に置いて渡す）。前提: http://localhost:8765/ でサーバが立っている。
// 1280x720 の横、8×8、既定の色の組。本編を始め、トレイのピースを実際にクリック（タップ）して
// 向きを進め、回転の印と裏返しの印の両方が出る状態にしてから、トレイのパネルだけを clip で撮る。
// 撮る部分は turnMarkKind に頼らない（種類を読むのは報告用の kinds だけ。メソッドが無ければ null）。
async (page) => {
  const OUT = '/home/ytani/tmp/playwright-mcp/todo114/before';
  // タップの回数（名前→回数）。向きの並びは「回転が続いて裏返しが 1 回」なので、
  // 8 通りあるピースは 3 回、Z（4 通り）は 1 回で次が裏返しになる。ほかは回転のまま。
  const TAPS = { L: 3, P: 3, Z: 1 };
  const race = (p, ms, label) => Promise.race([p.then(() => 'ok'), page.waitForTimeout(ms).then(() => label)]);
  const sleep = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });   // 古い JS が残らないように
  await page.setViewportSize({ width: 1280, height: 720 });
  const ready = async (scene) => {
    await page.waitForFunction((s) => {
      const g = window.game && window.game.scene.getScene(s);
      return g && g.sys.isActive();
    }, scene, { timeout: 5000 });
    await sleep(600);
  };
  const kinds = () => page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    const out = {};
    for (const p of s.pieces) {
      out[p.name] = typeof s.turnMarkKind === 'function' ? s.turnMarkKind(p) : 'n/a';
    }
    return out;
  });

  await page.goto('http://localhost:8765/');
  await page.evaluate(() => { window.localStorage.clear(); });
  await page.reload();
  await ready('Title');
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
  await ready('Game');

  const kindsBefore = await kinds();
  const results = [];
  for (const [name, n] of Object.entries(TAPS)) {
    for (let i = 0; i < n; i += 1) {
      const { x, y } = await page.evaluate((nm) => {
        const s = window.game.scene.getScene('Game');
        const piece = s.pieces.find((p) => p.name === nm);
        const slot = s.layout.tray.slots[piece.slot];
        const r = window.game.canvas.getBoundingClientRect();
        const k = r.width / window.game.scale.width;
        return { x: r.left + slot.x * k, y: r.top + slot.y * k };
      }, name);
      results.push(await race(page.mouse.click(x, y), 3000, 'click timeout'));
      await sleep(300);
    }
  }
  await page.mouse.move(5, 5, { steps: 3 });   // ホバーが残らないように端へ
  await sleep(500);
  const info = await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.tweens.killAll();   // ネオンの明滅を止め、にじみの alpha を 1 に固定
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
    return { tray: s.layout.trayPanel, playing: s.playing, palette: s.palette.key, board: s.boardKey };
  });
  const kindsAfter = await kinds();
  const clip = await page.evaluate((t) => {
    const r = window.game.canvas.getBoundingClientRect();
    const k = r.width / window.game.scale.width;
    return { x: Math.floor(r.left + t.x * k - 4), y: Math.floor(r.top + t.y * k - 4),
             width: Math.ceil(t.width * k + 8), height: Math.ceil(t.height * k + 8) };
  }, info.tray);
  await page.screenshot({ path: `${OUT}/tray.png`, clip });
  return { clip, info, clicks: results, kindsBefore, kindsAfter };
}
