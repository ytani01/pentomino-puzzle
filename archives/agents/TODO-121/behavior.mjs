// TODO-121 の動作確認。確認の枠（本編・記録）・向きが変わったときの開き直し・タイトルの始めるボタン・
// ボードの選択肢のツールチップ・記録の頁送りと全部選ぶ。結果を JSON で出す。コンソールのエラーも拾う。
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const result = {};

await page.addInitScript(() => {
  // 記録の画面用。8x8 の履歴を 10 件（1 頁の行数 7〜8 を超える）。
  window.__seed = (key) => {
    const entries = Array.from({ length: 10 }, (_, i) => ({ at: Date.now() - i * 60000, ms: 60000 + i * 1000, no: i + 1 }));
    window.localStorage.setItem(key, JSON.stringify(entries));
  };
});
await page.goto(BASE);
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
const key = await page.evaluate(async () => {
  const { BOARDS } = await import('/src/config.js');
  window.__seed(BOARDS['8x8']?.historyKey ?? Object.values(BOARDS)[0].historyKey);
  return Object.keys(BOARDS);
});
result.boardKeys = key;

// ---- タイトル: ボードの選択肢のツールチップ、始めるボタン ----
await page.evaluate(() => {
  const s = window.game.scene.getScene('Title');
  s.boardButtons[1].emit('pointerover', { wasTouch: false });
});
await page.waitForTimeout(700);
result.titleTooltip = await page.evaluate(() => {
  const s = window.game.scene.getScene('Title');
  return { visible: s.tooltip.visible, text: s.tooltip.list[1].text, resumeButton: !!s.resumeButton };
});
await page.evaluate(() => {
  const s = window.game.scene.getScene('Title');
  const b = s.children.list.find((c) => c.type === 'Container' && c.list[2]?.text === 'はじめる');
  b.emit('pointerdown', { wasTouch: false });
  b.emit('pointerup', { wasTouch: false });
});
await page.waitForFunction(() => window.game.scene.isActive('Game'));
await page.waitForTimeout(500);

// ---- 本編: 確認の枠 ----
const click = (sel) => `(() => { const b = ${sel}; b.emit('pointerdown', { wasTouch: false }); b.emit('pointerup', { wasTouch: false }); })()`;
const state = () => page.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  return { kind: s.confirmKind, visible: s.confirm.parts.map((p) => p.visible), text: s.confirm.text.text };
});
await page.evaluate(() => { window.game.scene.getScene('Game').openConfirm('restart'); });
result.gameOpen = await state();
await page.evaluate(click("window.game.scene.getScene('Game').confirm.parts[4]")); // いいえ
result.gameNo = await state();
await page.evaluate(() => {
  const s = window.game.scene.getScene('Game');
  window.__restarted = 0;
  s.restart = () => { window.__restarted += 1; };
  s.openConfirm('restart');
});
await page.evaluate(click("window.game.scene.getScene('Game').confirm.parts[3]")); // はい
result.gameYes = { restarted: await page.evaluate(() => window.__restarted) };
// 開いたまま向きを変える
await page.evaluate(() => { window.game.scene.getScene('Game').openConfirm('title'); });
await page.setViewportSize({ width: 640, height: 1136 });
await page.waitForFunction(() => window.game.scene.getScene('Game').layout.height > 900);
await page.waitForTimeout(600);
result.gameRelayout = await state();
await page.setViewportSize({ width: 960, height: 640 });
await page.waitForFunction(() => window.game.scene.getScene('Game').layout.height < 900);
await page.waitForTimeout(600);

// ---- 記録 ----
await page.evaluate(() => { window.game.scene.getScene('Game').scene.start('Records'); });
await page.waitForFunction(() => window.game.scene.isActive('Records') && window.game.scene.getScene('Records').solutions !== null);
await page.waitForTimeout(300);
const rec = () => page.evaluate(() => {
  const s = window.game.scene.getScene('Records');
  return {
    entries: s.entries.length, page: s.page, checked: s.checked.size,
    selectAllSelected: s.selectAllButton.selected, selectAllEnabled: s.selectAllButton.enabled,
    trashEnabled: s.trashButton.enabled, prev: s.prevButton.enabled, next: s.nextButton.enabled,
    pageText: s.pageText.text, kind: s.confirmKind, visible: s.confirm.parts.map((p) => p.visible),
    tooltip: s.boardButtons.length,
  };
});
result.recInit = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').nextButton"));
result.recNext = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').selectAllButton"));
result.recSelectAll = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').selectAllButton"));
result.recDeselectAll = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').selectAllButton"));
await page.evaluate(click("window.game.scene.getScene('Records').trashButton"));
result.recTrashOpen = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').confirm.parts[4]")); // いいえ
result.recTrashNo = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').trashButton"));
// 開いたまま向きを変える
await page.setViewportSize({ width: 640, height: 1136 });
await page.waitForFunction(() => window.game.scene.getScene('Records').L.rowsPerPage !== 8 || window.game.scene.getScene('Records').scale.height > 900);
await page.waitForTimeout(800);
result.recRelayout = await rec();
await page.evaluate(click("window.game.scene.getScene('Records').confirm.parts[3]")); // はい
result.recTrashYes = await rec();

console.log(JSON.stringify(result, null, 1));
console.log('console errors:', JSON.stringify(errors));
await browser.close();
