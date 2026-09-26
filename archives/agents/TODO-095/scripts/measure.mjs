const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto('http://127.0.0.1:8796/');
await page.waitForFunction(() => window.game?.scene?.isActive('Title'));
await page.evaluate(() => {
  window.__ev = [];
  window.addEventListener('resize', () => window.__ev.push(`resize ${innerWidth}x${innerHeight}`));
  matchMedia('(orientation: portrait)').addEventListener('change', (e) => window.__ev.push(`mq portrait=${e.matches}`));
  window.game.scale.on('resize', (gs) => window.__ev.push(`phaser-resize ${gs.width}x${gs.height}`));
});
const canvas = () => page.evaluate(() => { const c = document.querySelector('canvas'); return `${c.width}x${c.height} style ${c.style.width} ${c.style.height} ml=${c.style.marginLeft} mt=${c.style.marginTop}`; });
const wait = (ms) => new Promise((r) => { const t = Date.now(); while (Date.now() - t < 0) {} ; return page.waitForTimeout(ms).then(r); });
for (const [w, h] of [[400, 800], [1200, 800]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(300);
  console.log(`viewport ${w}x${h}:`, JSON.stringify(await page.evaluate(() => window.__ev.splice(0))), await canvas());
}
await page.setViewportSize({ width: 400, height: 800 });
await page.waitForTimeout(300);
await page.evaluate(() => window.__ev.splice(0));
await page.evaluate(() => window.game.scale.setGameSize(640, 1136));
await page.waitForTimeout(300);
console.log('after setGameSize(640,1136) at 400x800:', JSON.stringify(await page.evaluate(() => window.__ev.splice(0))), await canvas());
await browser.close();
