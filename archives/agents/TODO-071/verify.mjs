// TODO-071 verifier の確認スクリプト。
//   PLAYWRIGHT=~/.npm/_npx/<hash>/node_modules/playwright/index.mjs node archives/agents/TODO-071/verify.mjs
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765/';
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

// 1. tests.html
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(`${BASE}tests.html`);
  await page.waitForFunction(() => !document.getElementById('summary').textContent.includes('実行中'), null, { timeout: 60000 });
  log('[1] summary:', await page.textContent('#summary'), 'consoleErrors:', JSON.stringify(errs));
  await ctx.close();
}

const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.addInitScript(() => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  const now = Date.now();
  const h8 = [];
  for (let i = 0; i < 10; i += 1) h8.push({ at: now - i * 60000, ms: 10000 + i * 1000, no: i + 1 });
  localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify(h8));
  localStorage.setItem('pentomino-puzzle/found/8x8', JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20]));
  localStorage.setItem('pentomino-puzzle/auto/8x8', JSON.stringify([2, 3, 30]));
  localStorage.setItem('pentomino-puzzle/history/v2/6x10', JSON.stringify([{ at: now, ms: 50000, no: 5 }]));
  localStorage.setItem('pentomino-puzzle/found/6x10', JSON.stringify([5]));
  localStorage.setItem('pentomino-puzzle/auto/6x10', JSON.stringify([5]));
});
await page.goto(BASE);
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Records'); });
await page.waitForFunction(() => window.game.scene.isActive('Records') && window.game.scene.getScene('Records').solutions);
await page.waitForTimeout(500);

// ゲーム座標 -> ページ座標
async function pt(expr) {
  return page.evaluate((e) => {
    const s = window.game.scene.getScene('Records');
    const o = eval(e);
    const r = window.game.canvas.getBoundingClientRect();
    const k = r.width / window.game.scale.width;
    return { x: r.left + o.x * k, y: r.top + o.y * k };
  }, expr);
}
async function click(expr) { const p = await pt(expr); await page.mouse.click(p.x, p.y); await page.waitForTimeout(250); }
const state = () => page.evaluate(() => {
  const s = window.game.scene.getScene('Records');
  const ls = (k) => localStorage.getItem(`pentomino-puzzle/${k}`);
  return {
    n: s.entries.length, nos: s.entries.map((e) => e.no), selected: s.selected, selNo: s.entries[s.selected]?.no,
    page: s.page, checked: [...s.checked], trash: s.trashButton.enabled,
    confirm: s.confirmParts[0].visible, confirmText: s.confirmText.text,
    detail: s.detailText.text, achieve: s.achieveText.text, empty: s.emptyText.visible,
    ls: { f8: ls('found/8x8'), a8: ls('auto/8x8'), h6: ls('history/v2/6x10'), f6: ls('found/6x10'), a6: ls('auto/6x10') },
  };
});
const confirmOk = async () => {
  // 確認の「消す」ボタンを探す
  const ok = await page.evaluate(() => {
    const s = window.game.scene.getScene('Records');
    const idx = s.confirmParts.findIndex((p) => p.list && p.list.some((c) => c.text === 'はい'));
    return idx;
  });
  await click(`s.confirmParts[${ok}]`);
};

log('[init]', JSON.stringify(await state()));

// 6. チェックを押しても完成形が変わらない／行を押してもチェックが変わらない
let before = await state();
await click('s.rowChecks[4]');
let after = await state();
log('[6a] check row5: selected', before.selected, '->', after.selected, 'detail same:', before.detail === after.detail, 'checked', JSON.stringify(after.checked));
await click('s.rowButtons[6]');
let after2 = await state();
log('[6b] click row7: selected', after2.selected, 'checked', JSON.stringify(after2.checked));
await click('s.rowChecks[4]'); // 戻す

// 2. 何もチェックしていないときゴミ箱
before = await state();
await click('s.trashButton');
after = await state();
log('[2] checked', JSON.stringify(before.checked), 'trashEnabled', before.trash, 'confirmVisible after click', after.confirm);

// 3. 3 行目を表示、1,2 行目チェック、ゴミ箱→確認→消す
await click('s.rowButtons[2]');
const shownNo = (await state()).selNo;
await click('s.rowChecks[0]');
await click('s.rowChecks[1]');
await click('s.trashButton');
after = await state();
log('[3] shownNo', shownNo, 'checked', JSON.stringify(after.checked), 'confirm', after.confirm, 'text', JSON.stringify(after.confirmText));
await confirmOk();
after = await state();
log('[3] after: n', after.n, 'selNo', after.selNo, 'selected', after.selected, 'page', after.page, 'checked', JSON.stringify(after.checked), 'ls', JSON.stringify(after.ls), 'achieve', after.achieve);

// 4. 1 ページ目で 1 件チェック→次へ→前へ
await click('s.rowChecks[0]');
await click('s.nextButton');
const p2 = await state();
await click('s.prevButton');
after = await state();
log('[4] page after next', p2.page, 'checked on p2', JSON.stringify(p2.checked), 'back page', after.page, 'checked', JSON.stringify(after.checked), 'row0 icon selected', await page.evaluate(() => window.game.scene.getScene('Records').rowChecks[0].selected));
await click('s.boardButtons[1]');
const b6 = await state();
await click('s.boardButtons[0]');
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions);
await page.waitForTimeout(300);
after = await state();
log('[4] board6x10 checked', JSON.stringify(b6.checked), 'n', b6.n, '/ back to 8x8 checked', JSON.stringify(after.checked), 'n', after.n);

// 5. 全部選ぶ→ゴミ箱→消す
await click('s.selectAllButton');
const sa = await state();
await click('s.trashButton');
const cf = await state();
await confirmOk();
after = await state();
log('[5] selectAll checked', JSON.stringify(sa.checked), 'confirm', JSON.stringify(cf.confirmText));
log('[5] after: n', after.n, 'empty', after.empty, 'achieve', JSON.stringify(after.achieve), 'ls', JSON.stringify(after.ls), 'h8', await page.evaluate(() => localStorage.getItem('pentomino-puzzle/history/v2/8x8')));
await click('s.boardButtons[1]');
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions);
after = await state();
log('[5] 6x10 n', after.n, 'achieve', after.achieve);
await click('s.boardButtons[0]');
await page.waitForTimeout(500);

// 7. ツールチップ（ゴミ箱）。8x8 に記録を戻してから
await page.evaluate(() => {
  localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify([{ at: Date.now(), ms: 1000, no: 1 }]));
  window.game.scene.getScene('Records').scene.restart();
});
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions);
await page.waitForTimeout(300);
const tp = await pt('s.trashButton');
await page.mouse.move(tp.x, tp.y);
await page.waitForTimeout(1500);
const tip = await page.evaluate(() => {
  const s = window.game.scene.getScene('Records');
  const b = s.tooltip.getBounds();
  return { visible: s.tooltip.visible, text: s.tooltip.list[1].text, x: b.x, y: b.y, w: b.width, h: b.height, screenH: window.game.scale.height, screenW: window.game.scale.width, trashY: s.trashButton.y };
});
log('[7] tooltip', JSON.stringify(tip));
await page.screenshot({ path: `${process.env.HOME}/tmp/playwright-mcp/todo071-tooltip.png` });

log('[errors]', JSON.stringify(errs));
await browser.close();
