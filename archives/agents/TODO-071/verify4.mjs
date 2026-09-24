// TODO-071 verifier: 手順 4（ページ送りでチェックが残る）を 10 件で確かめる。
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  const now = Date.now();
  localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify(Array.from({ length: 10 }, (_, i) => ({ at: now - i * 60000, ms: 10000 + i, no: i + 1 }))));
});
await page.goto('http://localhost:8765/');
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Records'); });
await page.waitForFunction(() => window.game.scene.isActive('Records') && window.game.scene.getScene('Records').solutions);
const click = async (e) => {
  const p = await page.evaluate((e) => { const s = window.game.scene.getScene('Records'); const o = eval(e); const r = window.game.canvas.getBoundingClientRect(); const k = r.width / window.game.scale.width; return { x: r.left + o.x * k, y: r.top + o.y * k }; }, e);
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(250);
};
const st = () => page.evaluate(() => { const s = window.game.scene.getScene('Records'); return { page: s.page, pageText: s.pageText.text, checked: [...s.checked], row0: s.rowChecks[0].selected, row1: s.rowChecks[1].selected, rowsVisible: s.rowButtons.filter((b) => b.visible).length }; });
await click('s.rowChecks[0]');
console.log('p1', JSON.stringify(await st()));
await click('s.nextButton');
console.log('p2', JSON.stringify(await st()));
await click('s.prevButton');
console.log('back', JSON.stringify(await st()));
await click('s.boardButtons[1]');
console.log('6x10', JSON.stringify(await st()));
await click('s.boardButtons[0]');
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions);
console.log('8x8', JSON.stringify(await st()));
await browser.close();
