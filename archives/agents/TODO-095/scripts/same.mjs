const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
async function dump(port, viewport) {
  const page = await browser.newPage({ viewport });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.game?.scene?.isActive('Title'), null, { timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  const snap = (key) => page.evaluate((key) => {
    const walk = (o) => {
      const r = [o.type, Math.round(o.x * 100) / 100, Math.round(o.y * 100) / 100, o.width ?? null, o.height ?? null, o.text ?? null, o.visible, o.depth, o.scaleX];
      if (o.list) r.push(o.list.map(walk));
      if (o.type === 'Graphics') r.push(o.commandBuffer.length);
      return r;
    };
    return JSON.stringify(game.scene.getScene(key).children.list.map(walk));
  }, key);
  const out = {};
  out.canvas = await page.evaluate(() => `${game.canvas.width}x${game.canvas.height} ${game.canvas.style.width} ${game.canvas.style.height}`);
  out.title = await page.evaluate(() => { const t = game.scene.getScene('Title'); t.previewTimer?.remove(false); t.previewGraphics.clear(); return 1; }) && await snap('Title');
  await page.evaluate(() => game.scene.getScene('Title').start());
  await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
  await page.evaluate(() => { const g = game.scene.getScene('Game'); g.tweens.killAll(); g.pieces.forEach((p) => p.glow?.setAlpha(1)); g.elapsed = 0; g.timeText.setText('00:00'); });
  out.game = await snap('Game');
  await page.evaluate(() => { const g = game.scene.getScene('Game'); g.goToTitle(); });
  await page.evaluate(() => game.scene.getScene('Title').scene.start('Records'));
  await page.waitForFunction(() => game.scene.getScene('Records')?.solutions);
  out.records = await snap('Records');
  await page.evaluate(() => game.scene.getScene('Records').goToTitle());
  await page.evaluate(() => { game.scene.getScene('Title').scene.start('Demo'); });
  await page.waitForFunction(() => game.scene.getScene('Demo')?.state === 'running');
  await page.evaluate(() => { const d = game.scene.getScene('Demo'); d.state = 'loading'; d.tweens.killAll(); d.pieces.forEach((p) => { p.location = 'tray'; p.cells = p.origin; d.refreshPiece(p); d.settlePiece(p, false); p.glow?.setAlpha(1); }); d.tried = 0; d.hintState = 'ok'; d.refreshStatus(); });
  out.demo = await snap('Demo');
  await page.evaluate(() => game.scene.getScene('Demo').goToTitle());
  await page.evaluate(() => game.scene.getScene('Title').start());
  await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
  await page.evaluate(() => { game.scene.getScene('Game').scene.launch('Clear', { ms: 1234, no: 3, total: 65, best: 1000, bestUpdated: false, status: 'added', usedAuto: false, usedHint: true }); });
  await page.waitForFunction(() => game.scene.isActive('Clear'));
  out.clear = await snap('Clear');
  await page.close();
  return out;
}
for (const vp of [{ width: 1200, height: 800 }, { width: 450, height: 800 }]) {
  const a = await dump(8797, vp);
  const b = await dump(8798, vp);
  for (const k of Object.keys(a)) console.log(`${vp.width}x${vp.height} ${k}: ${a[k] === b[k] ? 'same' : 'DIFF'} (${a[k].length} chars)`);
  for (const k of Object.keys(a)) if (a[k] !== b[k]) { const i = [...a[k]].findIndex((c, j) => c !== b[k][j]); console.log(k, 'base:', a[k].slice(i - 80, i + 80), '\n new:', b[k].slice(i - 80, i + 80)); }
}
await browser.close();
