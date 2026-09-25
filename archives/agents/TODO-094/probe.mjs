// タッチで「やり直し」を押した直後にツールチップが出るかを見る（TODO-094）。
// node probe.mjs <empty|placed> [portrait|landscape]
const { chromium } = await import(process.env.PLAYWRIGHT);
const portrait = (process.argv[3] ?? 'portrait') === 'portrait';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: portrait ? { width: 390, height: 844 } : { width: 844, height: 390 },
  hasTouch: true, isMobile: true,
});
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:8794/');
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
await page.evaluate(() => window.game.scene.getScene('Title').scene.start('Game', { resume: false }));
await page.waitForFunction(() => window.game.scene.isActive('Game'));
await page.waitForTimeout(300);
const tapAt = async (getter) => {
  const p = await page.evaluate((src) => {
    const s = window.game.scene.getScene('Game');
    // eslint-disable-next-line no-eval
    const b = eval(src)(s);
    const r = window.game.canvas.getBoundingClientRect();
    return {
      x: r.left + b.x * r.width / window.game.config.width,
      y: r.top + b.y * r.height / window.game.config.height,
    };
  }, getter);
  await page.touchscreen.tap(p.x, p.y);
};
const state = () => page.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  return {
    tip: s.tooltip.visible, text: s.tooltip.list[1].text,
    confirm: s.confirmParts?.[0].visible, onBoard: s.pieces.filter((p) => p.location === 'board').length,
  };
});
const mode = process.argv[2] ?? 'empty';
if (mode === 'placed') {
  await page.evaluate(() => window.game.scene.getScene('Game').useAuto());
  await page.waitForTimeout(800);
}
await page.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  const old = s.tooltip;
  window.__diag = { flashCalls: 0 };
  const f = old.flash;
  old.flash = (...a) => { window.__diag.flashCalls += 1; window.__diag.sceneStatusAtFlash = s.sys.settings.status; f(...a); window.__diag.visibleAfterFlash = old.visible; };
  s.events.once('shutdown', () => { window.__diag.oldVisibleAtShutdown = old.visible; });
  s.events.once('destroy', () => {});
  window.__oldTip = old;
});
await tapAt('(s) => s.buttons[4]');
await page.waitForTimeout(100);
console.log('diag', JSON.stringify(await page.evaluate(() => ({
  ...window.__diag,
  oldTipDestroyed: !window.__oldTip.scene,
  sameTooltip: window.__oldTip === window.game.scene.getScene('Game').tooltip,
}))));
await page.waitForTimeout(200);
console.log('restart tap +200ms', JSON.stringify(await state()));
if (mode === 'placed') {
  await page.screenshot({ path: `${process.env.HOME}/tmp/playwright-mcp/todo094-modal.png` });
  await tapAt('(s) => s.confirmParts.find((o) => o.list?.some((c) => c.text === "はい"))');
  await page.waitForTimeout(200);
  console.log('yes tap +200ms', JSON.stringify(await state()));
}
for (const ms of [500, 500, 1000]) { await page.waitForTimeout(ms); console.log("+", ms, JSON.stringify(await state()), await page.evaluate(() => { const s = window.game.scene.getScene("Game"); return [s.time.now, s.tooltip.timer?.getElapsed(), s.game.loop.actualFps]; })); }
console.log('+1.5s', JSON.stringify(await state()));
await browser.close();
