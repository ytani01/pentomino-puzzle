import { chromium } from '/home/ytani/work/star-base-defender/tests/node_modules/playwright-core/index.mjs';
const out = process.argv[2];
const browser = await chromium.launch();
for (const [w, h, touch] of [[568, 320, false], [390, 844, true]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: touch });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:8765/');
  await page.waitForFunction(() => window.game && window.game.scene.isActive('Title'));
  for (const key of ['Game', 'Demo']) {
    await page.evaluate((k) => { const m = window.game.scene; m.getScenes(true).forEach((s) => m.stop(s.scene.key)); m.start(k); }, key);
    await page.waitForFunction((k) => window.game.scene.isActive(k), key);
    await page.waitForTimeout(500);
    // ボタン中心を画面座標へ
    const pts = await page.evaluate((k) => {
      const s = window.game.scene.getScene(k);
      const c = window.game.canvas.getBoundingClientRect();
      const sx = c.width / window.game.scale.width; const sy = c.height / window.game.scale.height;
      return s.buttons.map((b) => ({ x: c.left + b.x * sx, y: c.top + b.y * sy }));
    }, key);
    const state = () => page.evaluate((k) => { const t = window.game.scene.getScene(k).tooltip; return { vis: t.visible, text: t.list[1].text, x: Math.round(t.x), y: Math.round(t.y), w: Math.round(t.list[1].width) }; }, key);
    if (!touch) {
      await page.mouse.move(pts[5].x, pts[5].y);
      await page.waitForTimeout(100);
      const early = await state();
      await page.waitForTimeout(3000);
      const late = await state();
      await page.screenshot({ path: `${out}/${key}-${w}x${h}-hover.png` });
      await page.mouse.move(pts[0].x, pts[0].y + 200);
      await page.waitForTimeout(100);
      const gone = await state();
      // 音の切り替え（クリック）
      const muteBefore = await page.evaluate(() => localStorage.length);
      await page.mouse.click(pts[4].x, pts[4].y);
      await page.waitForTimeout(3000);
      const afterMute = await state();
      await page.mouse.click(pts[4].x, pts[4].y);
      console.log(key, w, h, 'hover early', JSON.stringify(early), 'late', JSON.stringify(late), 'out', JSON.stringify(gone), 'after click+hover', JSON.stringify(afterMute));
    } else {
      await page.touchscreen.tap(pts[2].x, pts[2].y);
      await page.waitForTimeout(200);
      const shown = await state();
      await page.screenshot({ path: `${out}/${key}-${w}x${h}-tap.png` });
      await page.waitForTimeout(8000);
      const gone = await state();
      await page.touchscreen.tap(pts[4].x, pts[4].y);
      await page.waitForTimeout(200);
      const mute = await state();
      await page.touchscreen.tap(pts[4].x, pts[4].y);
      await page.waitForTimeout(200);
      const mute2 = await state();
      const sel = await page.evaluate((k) => { const s = window.game.scene.getScene(k); return k === 'Game' ? s.hinting : s.speed; }, key);
      console.log(key, w, h, 'tap', JSON.stringify(shown), 'after', JSON.stringify(gone), 'mute', mute.text, mute2.text, 'state', sel);
    }
  }
  console.log('errors', w, h, JSON.stringify(errors));
  await page.close();
}
await browser.close();
