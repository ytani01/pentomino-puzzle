// TODO-073 の実測（844×390、各手順 1 回）。
//   PLAYWRIGHT=.../playwright/index.mjs node archives/agents/TODO-073/check.mjs
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765';
const VIEW = { width: Number(process.env.W ?? 844), height: Number(process.env.H ?? 390) };
const SHOT = `${process.env.HOME}/tmp/playwright-mcp/todo073-records-${VIEW.width}x${VIEW.height}.png`;
const out = (label, value) => console.log(`${label}: ${JSON.stringify(value)}`);
const browser = await chromium.launch();

// ---- 1. tests.html ----
if (!process.env.SKIP_TESTS) {
  const context = await browser.newContext({ viewport: VIEW });
  const page = await context.newPage();
  await page.goto(`${BASE}/tests.html`);
  await page.waitForFunction(() => /通った|失敗/.test(document.getElementById('summary')?.textContent ?? ''), null, { timeout: 120000 });
  out('1.summary', await page.textContent('#summary'));
  out('1.failed', await page.$$eval('li.ng', (xs) => xs.map((x) => x.textContent)));
  await context.close();
}

const context = await browser.newContext({ viewport: VIEW });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${BASE}/`);
await page.evaluate(() => window.localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.game?.scene.isActive('Title'));

const toScreen = (x, y) => page.evaluate(([gx, gy]) => {
  const rect = window.game.canvas.getBoundingClientRect();
  return { x: rect.left + gx * rect.width / window.game.scale.width, y: rect.top + gy * rect.height / window.game.scale.height };
}, [x, y]);
const click = async (x, y) => { const s = await toScreen(x, y); await page.mouse.click(s.x, s.y); };
const drag = async (from, to) => {
  const a = await toScreen(from.x, from.y); const b = await toScreen(to.x, to.y);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
};
const openRecords = async () => {
  await page.evaluate(() => {
    for (const s of window.game.scene.getScenes(true)) window.game.scene.stop(s.sys.settings.key);
    window.game.scene.start('Records');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Records') && window.game.scene.getScene('Records').solutions !== null);
};
const clickContinue = async () => {
  const b = await page.evaluate(() => { const r = window.game.scene.getScene('Records'); return { x: r.continueButton.x, y: r.continueButton.y, enabled: r.continueButton.enabled, visible: r.continueButton.visible }; });
  out('continueButton', b);
  await click(b.x, b.y);
};
const game = () => page.evaluate(() => {
  const g = window.game.scene.getScene('Game');
  const read = (k) => JSON.parse(window.localStorage.getItem(k));
  return {
    board: window.game.registry.get('board'), left: g.pieces.filter((p) => p.location === 'tray').length,
    elapsed: Math.round(g.elapsed), usedAuto: g.usedAuto, usedHint: g.usedHint, solved: g.solvedNumbers,
    playing: g.playing, clearActive: window.game.scene.isActive('Clear'), hud: g.recordText.text,
    history: read(g.spec.historyKey), progressMs: read(g.spec.progressKey)?.ms ?? null,
  };
});

// 6×10 の記録を 1 件（ヒントの印つき・5 分）。タイトルの盤は 8×8 のまま。
await page.evaluate(async () => {
  const s = await import('/src/storage.js');
  s.recordClear('6x10', { at: Date.now() - 86400000, ms: 300000, no: 5, h: true });
  s.addFound('6x10', 5, 2339);
});

// ---- 2. 遊びかけ無し → 続ける ----
await openRecords();
await page.evaluate(() => window.game.scene.getScene('Records').selectBoard('6x10'));
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions?.canonical.length === 2339);
await page.screenshot({ path: SHOT });
out('2.layout', await page.evaluate(() => {
  const r = window.game.scene.getScene('Records');
  const box = (o) => { const b = o.getBounds(); return [Math.round(b.x), Math.round(b.y), Math.round(b.right), Math.round(b.bottom)]; };
  return { detail: box(r.detailText), cont: box(r.continueButton), achieve: box(r.achieveText), title: box(r.titleButton), prev: box(r.prevButton), trash: box(r.trashButton), boardBoxBottom: r.detailText.y };
}));
await clickContinue();
await page.waitForFunction(() => window.game.scene.isActive('Game'));
await page.waitForTimeout(1500);
const s2 = await game();
out('2.started', { ...s2, expected: { board: '6x10', left: 0, elapsedFrom: 300000, usedHint: true, solved: [5] } });

// ---- 3. 全部トレイへ戻し、おまかせで別の解を作る ----
const names = await page.evaluate(() => window.game.scene.getScene('Game').pieces.map((p) => p.name));
const trayCenter = await page.evaluate(() => { const t = window.game.scene.getScene('Game').layout.trayPanel; return { x: t.x + t.width - 10, y: t.y + t.height - 10 }; });
// トレイの中央へ落とすと、既にあるピースに重なって戻らないことがあるので、盤に残った分をもう一巡する。
for (let pass = 0; pass < 3; pass += 1) for (const n of names) {
  if (!(await page.evaluate((name) => window.game.scene.getScene('Game').pieces.find((q) => q.name === name).location === 'board', n))) continue;
  const grip = await page.evaluate((name) => {
    const g = window.game.scene.getScene('Game'); const p = g.pieces.find((q) => q.name === name);
    const cell = g.layout.board.cell; const [r, c] = p.cells[0];
    return { x: p.container.x + (c + 0.5) * cell, y: p.container.y + (r + 0.5) * cell };
  }, n);
  await drag(grip, trayCenter);
  await page.waitForTimeout(150);
}
out('3.allInTray', (await game()).left);
await page.evaluate(() => { const g = window.game.scene.getScene('Game'); for (let i = 0; i < 12; i += 1) g.useAuto(); });
await page.waitForFunction(() => window.game.scene.isActive('Clear'), null, { timeout: 5000 });
const s3 = await game();
out('3.newSolution', { hud: s3.hud, history: s3.history, solved: s3.solved });

// ---- 4. 遊びかけがある → 確認 → いいえ ----
await openRecords();
await page.evaluate(() => window.game.scene.getScene('Records').selectBoard('6x10'));
await page.waitForFunction(() => window.game.scene.getScene('Records').solutions?.canonical.length === 2339);
const readProgress = () => page.evaluate(async () => localStorage.getItem((await import('/src/config.js')).BOARDS['6x10'].progressKey));
const progressBefore = await readProgress();
out('4.progressExists', progressBefore !== null);
// いま選んでいるのは先頭（新しい解）。元の 5 番を選び直す。
await page.evaluate(() => { const r = window.game.scene.getScene('Records'); r.selected = r.entries.findIndex((e) => e.no === 5); r.refresh(); });
await clickContinue();
await page.waitForTimeout(300);
const dialog = await page.evaluate(() => { const r = window.game.scene.getScene('Records'); return { visible: r.confirmText.visible, text: r.confirmText.text }; });
out('4.confirm', dialog);
const noButton = await page.evaluate(() => { const r = window.game.scene.getScene('Records'); const b = r.confirmParts[r.confirmParts.length - 1]; return { x: b.x, y: b.y }; });
await click(noButton.x, noButton.y);
await page.waitForTimeout(300);
out('4.afterNo', { ...(await page.evaluate(() => ({
  records: window.game.scene.isActive('Records'), gameActive: window.game.scene.isActive('Game'),
  dialog: window.game.scene.getScene('Records').confirmText.visible,
}))), progressKept: (await readProgress()) === progressBefore });

// ---- 5. もう一度 → はい → 置き換わる ----
await clickContinue();
await page.waitForTimeout(300);
const yesButton = await page.evaluate(() => { const r = window.game.scene.getScene('Records'); const b = r.confirmParts[r.confirmParts.length - 2]; return { x: b.x, y: b.y }; });
await click(yesButton.x, yesButton.y);
await page.waitForFunction(() => window.game.scene.isActive('Game'));
await page.waitForTimeout(800);
const s5 = await game();
out('5.afterYes', { left: s5.left, elapsed: s5.elapsed, usedAuto: s5.usedAuto, usedHint: s5.usedHint, solved: s5.solved, clearActive: s5.clearActive, progressMs: s5.progressMs });
// ---- 6・7. 続けた／つづきからのあと、タイトルの「はじめる」はまっさら（レビュー要修正 1）----
const titleButton = async (label) => {
  const b = await page.evaluate((l) => {
    const t = window.game.scene.getScene('Title');
    const c = t.children.list.find((o) => o.type === 'Container' && o.list.some((x) => x.type === 'Text' && x.text === l));
    return { x: c.x, y: c.y };
  }, label);
  await click(b.x, b.y);
};
const toTitle = async () => {
  await page.evaluate(() => window.game.scene.getScene('Game').scene.start('Title'));
  await page.waitForFunction(() => window.game.scene.isActive('Title'));
};
const fresh = async () => {
  await page.waitForFunction(() => window.game.scene.isActive('Game'));
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const g = window.game.scene.getScene('Game');
    return { board: g.spec.key, left: g.pieces.filter((p) => p.location === 'tray').length,
      elapsed: Math.round(g.elapsed), solved: g.solvedNumbers, data: g.sys.settings.data };
  });
};
// 6: 5 の続きで Game にいる → タイトル → はじめる
await toTitle();
await titleButton('はじめる');
out('6.continue→title→start', await fresh());
// 7: つづきから → タイトル → はじめる（6 の Game を離れたときの遊びかけは消えている場合があるので入れ直す）
await page.evaluate(() => window.game.scene.getScene('Game').useAuto());
await toTitle();
await titleButton('つづきから');
out('7.resumed', await fresh());
await toTitle();
await titleButton('はじめる');
out('7.resume→title→start', await fresh());
out('errors', errors);
await browser.close();
