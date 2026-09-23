import { chromium } from '/home/ytani/work/star-base-defender/tests/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:8765/');
await page.waitForFunction(() => window.game && window.game.scene.isActive('Title'));
for (const key of ['Game', 'Demo']) {
  await page.evaluate((k) => { const m = window.game.scene; m.getScenes(true).forEach((s) => m.stop(s.scene.key)); m.start(k); }, key);
  await page.waitForFunction((k) => window.game.scene.isActive(k), key);
  await page.waitForTimeout(500);
  const pt = await page.evaluate((k) => {
    const s = window.game.scene.getScene(k); const c = window.game.canvas.getBoundingClientRect();
    const b = s.buttons[0];
    return { x: c.left + b.x * c.width / window.game.scale.width, y: c.top + b.y * c.height / window.game.scale.height, left: c.left };
  }, key);
  const st = () => page.evaluate((k) => { const s = window.game.scene.getScene(k); return { vis: s.tooltip.visible, hovered: s.buttons[0].hovered }; }, key);
  await page.mouse.move(pt.x, pt.y);
  await page.waitForTimeout(6000);
  const on = await st();
  await page.mouse.move(pt.left - 20, pt.y, { steps: 1 });
  await page.waitForTimeout(1500);
  const off = await st();
  // 戻ってきたらまた出るか
  await page.mouse.move(pt.x, pt.y, { steps: 1 });
  await page.waitForTimeout(300);
  const back1 = await st();
  await page.mouse.move(pt.x + 3, pt.y);
  await page.waitForTimeout(6000);
  console.log('back1', JSON.stringify(back1));
  const again = await st();
  console.log(key, 'canvasLeft', Math.round(pt.left), 'on', JSON.stringify(on), 'afterOut', JSON.stringify(off), 'back', JSON.stringify(again));
}
// シーンを 2 回作り直したあと gameout でエラーが出ないか
await page.evaluate(() => window.game.scene.getScene('Demo').scene.restart());
await page.waitForTimeout(500);
await page.mouse.move(400, 200); await page.mouse.move(-1, 200);
await page.waitForTimeout(500);
console.log('errors', JSON.stringify(errors));
await browser.close();
