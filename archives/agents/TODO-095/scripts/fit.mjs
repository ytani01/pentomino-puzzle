const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
await page.goto('http://127.0.0.1:8798/', { waitUntil: 'commit' });
await page.waitForFunction(() => window.game?.scene?.isActive('Title'), null, { timeout: 30000 });
const c = () => page.evaluate(() => { const c = game.canvas; return `${c.width}x${c.height} ${c.style.width} ${c.style.height} parent=${game.scale.parentSize.width}x${game.scale.parentSize.height}`; });
for (const [w, h] of [[450, 800], [1200, 800], [450, 800], [1200, 800]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400); const a = await c();
  await page.waitForTimeout(1500); console.log(`${w}x${h}`, a, '|', await c());
}
await browser.close();
