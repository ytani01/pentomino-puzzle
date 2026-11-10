// 確認の枠を本編と記録で 1 回ずつ開いて閉じ、コンソールのエラーが無いことを見る（TODO-121 の直し）。
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:8765/');
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
const shown = (name) => page.evaluate((n) => {
  const s = window.game.scene.getScene(n);
  return s.children.list.some((c) => c.type === 'Rectangle' && c.input && c.visible && c.fillAlpha === 0.55);
}, name);
for (const [name, kind] of [['Game', 'restart'], ['Records', 'trash']]) {
  await page.evaluate((n) => { window.game.scene.getScene('Title').scene.start(n); }, name);
  await page.waitForFunction((n) => window.game.scene.isActive(n), name);
  await page.waitForTimeout(500);
  await page.evaluate(([n, k]) => {
    const s = window.game.scene.getScene(n);
    s.checked?.add(1);
    s.openConfirm(k);
  }, [name, kind]);
  const open = await shown(name);
  const before = await page.evaluate((n) => window.game.scene.getScene(n).confirm && window.game.scene.getScene(n).children.list.filter((c) => c.type === 'Rectangle' && c.input && c.visible && c.depth >= 10).length, name);
  await page.evaluate((n) => window.game.scene.getScene(n).hideConfirm(), name);
  console.log(name, { before, open, afterHide: await shown(name) });
}
console.log('console errors:', JSON.stringify(errors));
await browser.close();
