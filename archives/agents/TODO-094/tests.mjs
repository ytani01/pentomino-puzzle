// tests.html の結果と、デモが例外なく開くか（TODO-094）。
const { chromium } = await import(process.env.PLAYWRIGHT);
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:8794/tests.html', { waitUntil: 'commit' });
await page.waitForFunction(() => /件/.test(document.getElementById('summary')?.textContent ?? ''), null, { timeout: 300000 });
console.log(await page.textContent('#summary'));
await page.goto('http://localhost:8794/?demo=1&board=6x10');
await page.waitForFunction(() => window.game?.scene.isActive('Demo'));
await page.waitForTimeout(1500);
const demo = await page.evaluate(() => {
  const s = window.game.scene.getScene('Demo');
  return { help: s.children.list.some((o) => o.type === 'Text' && o.text.includes('ドラッグ')), lines: s.layout.help.lines };
});
console.log('demo', JSON.stringify(demo), 'errors', JSON.stringify(errors));
await browser.close();
