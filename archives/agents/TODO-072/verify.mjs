// TODO-072 verifier の実測（844×390、各手順 1 回）。
//   PLAYWRIGHT=.../playwright/index.mjs node archives/agents/TODO-072/verify.mjs
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765';
const SHOT = `${process.env.HOME}/tmp/playwright-mcp/todo072-overlay.png`;
const DEMO_SHOT = `${process.env.HOME}/tmp/playwright-mcp/todo072-demo.png`;
const VIEW = { width: 844, height: 390 };
const out = (label, value) => console.log(`${label}: ${JSON.stringify(value)}`);
const browser = await chromium.launch();

// ---- 1. tests.html ----
{
  const context = await browser.newContext({ viewport: VIEW });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${BASE}/tests.html`);
  await page.waitForFunction(() => /通った|失敗/.test(document.getElementById('summary')?.textContent ?? ''), null, { timeout: 120000 });
  out('1.summary', await page.textContent('#summary'));
  out('1.ok/ng', await page.evaluate(() => [document.querySelectorAll('li.ok').length, document.querySelectorAll('li.ng').length]));
  out('1.failed', await page.$$eval('li.ng', (xs) => xs.map((x) => x.textContent)));
  out('1.consoleErrors', errors);
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

const startGame = async (resume = false) => {
  await page.evaluate((r) => {
    for (const s of window.game.scene.getScenes(true)) window.game.scene.stop(s.sys.settings.key);
    window.game.registry.set('board', window.game.registry.get('board'));
    window.game.scene.start('Game', { resume: r });
  }, resume);
  await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').solutions !== null);
};
const state = () => page.evaluate(() => {
  const g = window.game.scene.getScene('Game');
  const clear = window.game.scene.getScene('Clear');
  const read = (k) => JSON.parse(window.localStorage.getItem(k));
  const { boardKey } = g.board ? { boardKey: null } : {};
  return {
    spec: g.spec.key,
    status: g.sys.settings.status,
    clearActive: window.game.scene.isActive('Clear'),
    clearTexts: window.game.scene.isActive('Clear')
      ? clear.children.list.filter((o) => o.type === 'Text').map((o) => o.text) : null,
    playing: g.playing,
    elapsed: Math.round(g.elapsed),
    hud: g.recordText.text,
    left: g.pieces.filter((p) => p.location === 'tray').length,
    historyLen: g.history.length,
    boardSig: JSON.stringify(g.board),
    lsHistory: read(g.spec.historyKey),
    solvedNumbers: g.solvedNumbers,
    progressSolved: read(g.spec.progressKey)?.solved ?? null,
  };
});
const auto = (n) => page.evaluate((c) => { const g = window.game.scene.getScene('Game'); for (let i = 0; i < c; i += 1) g.useAuto(); }, n);
const undo = (n) => page.evaluate((c) => { const g = window.game.scene.getScene('Game'); for (let i = 0; i < c; i += 1) g.undo(); }, n);
const waitClear = () => page.waitForFunction(() => window.game.scene.isActive('Clear'), null, { timeout: 5000 });
const toScreen = (x, y) => page.evaluate(([gx, gy]) => {
  const rect = window.game.canvas.getBoundingClientRect();
  return { x: rect.left + gx * rect.width / window.game.scale.width, y: rect.top + gy * rect.height / window.game.scale.height };
}, [x, y]);
const clearButton = async (label) => {
  const p = await page.evaluate((l) => {
    const c = window.game.scene.getScene('Clear');
    const b = c.children.list.find((o) => o.type === 'Container' && o.list.some((t) => t.type === 'Text' && t.text === l));
    return { x: b.x, y: b.y };
  }, label);
  const s = await toScreen(p.x, p.y);
  await page.mouse.click(s.x, s.y);
};
// 盤の上のピースの 1 マス目をつかむ座標と、そのピースの盤上の位置
const boardPieceGrip = (name) => page.evaluate((n) => {
  const g = window.game.scene.getScene('Game');
  const piece = g.pieces.find((p) => p.name === n);
  const cell = g.layout.board.cell;
  const [r, c] = piece.cells[0];
  return { x: piece.container.x + (c + 0.5) * cell, y: piece.container.y + (r + 0.5) * cell,
           row: piece.row, col: piece.col, cells: piece.cells };
}, name);
const drag = async (from, to) => {
  const a = await toScreen(from.x, from.y);
  const b = await toScreen(to.x, to.y);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 12 });
  await page.mouse.up();
};
const trayCenter = () => page.evaluate(() => { const t = window.game.scene.getScene('Game').layout.trayPanel; return { x: t.x + t.width / 2, y: t.y + t.height / 2 }; });
const pieceNames = () => page.evaluate(() => window.game.scene.getScene('Game').pieces.map((p) => p.name));

// ---- 2. おまかせで完成 ----
await startGame(false);
await auto(12);
await waitClear();
const s2a = await state();
await page.waitForTimeout(1500);
const s2b = await state();
out('2.completed', { ...s2a, boardSig: undefined });
out('2.clockStopped(elapsed +1.5s)', [s2a.elapsed, s2b.elapsed]);
// 表示中の操作: HUD の一手戻す・おまかせ・ヒントを押す、盤のピースをドラッグ
const hudButtons = await page.evaluate(() => window.game.scene.getScene('Game').buttons.slice(0, 3).map((b) => ({ x: b.x, y: b.y })));
for (const b of hudButtons) { const s = await toScreen(b.x, b.y); await page.mouse.click(s.x, s.y); await page.waitForTimeout(200); }
const name0 = (await pieceNames())[0];
await drag(await boardPieceGrip(name0), await trayCenter());
await page.waitForTimeout(500);
const s2c = await state();
out('2.inputBlocked', { boardSame: s2c.boardSig === s2a.boardSig, historyLen: [s2a.historyLen, s2c.historyLen], clearActive: s2c.clearActive, hinting: await page.evaluate(() => window.game.scene.getScene('Game').hinting) });
await page.screenshot({ path: SHOT });
out('2.clearBounds', await page.evaluate(() => {
  const c = window.game.scene.getScene('Clear');
  const W = window.game.scale.width; const H = window.game.scale.height;
  return { W, H, items: c.children.list.filter((o) => typeof o.getBounds === 'function' && (o.type !== 'Rectangle' || o.width < W)).map((o) => { const b = o.getBounds(); return { type: o.type, text: o.type === 'Text' ? o.text : (o.list?.find((t) => t.type === 'Text')?.text ?? null), x0: Math.round(b.x), y0: Math.round(b.y), x1: Math.round(b.right), y1: Math.round(b.bottom) }; }) };
}));

// ---- 3. 続ける ----
await page.waitForTimeout(2000); // 表示中の時間を延ばす
const beforeCont = (await state()).elapsed;
await clearButton('続ける');
await page.waitForFunction(() => !window.game.scene.isActive('Clear'));
const justAfter = (await state()).elapsed;
await page.waitForTimeout(1000);
const s3a = await state();
out('3.continue', { atCompletion: s2a.elapsed, beforeClick: beforeCont, justAfter, after1s: s3a.elapsed, playing: s3a.playing, status: s3a.status, hud: s3a.hud });
// 1 つ外して同じ場所へ戻す（実際のマウス）
const grip = await boardPieceGrip(name0);
await drag(grip, await trayCenter());
await page.waitForTimeout(600);
const s3b = await state();
out('3.removed', { left: s3b.left, hud: s3b.hud });
const tray = await page.evaluate((n) => {
  const g = window.game.scene.getScene('Game');
  const p = g.pieces.find((q) => q.name === n);
  const s = p.container.scaleX; const cell = g.layout.board.cell; const [r, c] = p.cells[0];
  return { x: p.container.x + (c + 0.5) * cell * s, y: p.container.y + (r + 0.5) * cell * s, cells: p.cells };
}, name0);
out('3.cellsSame', JSON.stringify(tray.cells) === JSON.stringify(grip.cells));
await drag(tray, grip);
await page.waitForTimeout(1200);
const s3c = await state();
let backByHand = s3c.left === 0;
if (!backByHand) { await auto(1); await page.waitForTimeout(1200); }
const s3d = await state();
out('3.putBack', { byHand: backByHand, left: s3d.left, hud: s3d.hud, clearActive: s3d.clearActive, clearTexts: s3d.clearTexts, lsHistoryLen: s3d.lsHistory.length, lsHistory: s3d.lsHistory });
const firstNo = s3d.lsHistory[0].no;

// ---- 4. 印の比べ方 ----
// 4a: 印なし 10:00 の履歴 → おまかせ（印あり）で同じ解 → kept
if (s3d.clearActive) await clearButton('続ける');
await page.waitForFunction(() => !window.game.scene.isActive('Clear'));
await page.evaluate((no) => {
  const g = window.game.scene.getScene('Game');
  window.localStorage.setItem(g.spec.historyKey, JSON.stringify([{ at: 1700000000000, ms: 600000, no }]));
}, firstNo);
await undo(1);
await auto(1);
await waitClear();
const s4a = await state();
out('4a.unmarked10min_vs_auto', { hud: s4a.hud, clearTexts: s4a.clearTexts, lsHistory: s4a.lsHistory });
// 4b: 印あり 00:05 の履歴 → 印なしで作る（recordCompletion を直接）→ improved
out('4b.marked5s_vs_unmarked', await page.evaluate(async (no) => {
  const st = await import('/src/storage.js');
  const g = window.game.scene.getScene('Game');
  window.localStorage.setItem(g.spec.historyKey, JSON.stringify([{ at: 1700000000000, ms: 5000, no, a: true }]));
  const r = st.recordCompletion(g.spec.key, { at: 1700000001000, ms: 900000, no, usedAuto: false, usedHint: false }, g.solutions);
  const r2 = st.recordClear(g.spec.key, { at: 1700000002000, ms: 950000, no }, g.solutions);
  return { result: r, secondUnmarkedSlower: r2, ls: JSON.parse(window.localStorage.getItem(g.spec.historyKey)) };
}, firstNo));

// ---- 5. 完成したまま タイトルへ → つづきから ----
await clearButton('タイトルへ');
await page.waitForFunction(() => window.game.scene.isActive('Title'));
out('5.afterTitle', await page.evaluate(() => ({ gameActive: window.game.scene.isActive('Game'), gameStatus: window.game.scene.getScene('Game').sys.settings.status, clearActive: window.game.scene.isActive('Clear') })));
const resumePos = await page.evaluate(() => { const b = window.game.scene.getScene('Title').resumeButton; return { x: b.x, y: b.y, enabled: b.enabled }; });
out('5.resumeEnabled', resumePos.enabled);
{ const s = await toScreen(resumePos.x, resumePos.y); await page.mouse.click(s.x, s.y); }
await page.waitForFunction(() => window.game.scene.isActive('Game'));
await page.waitForTimeout(1500);
const s5 = await state();
out('5.resumed', { left: s5.left, clearActive: s5.clearActive, solvedNumbers: s5.solvedNumbers, playing: s5.playing, hud: s5.hud, expectNo: firstNo });

// ---- 6. 同じ解 3 件の履歴 → 記録画面で 1 件 ----
const s6 = await page.evaluate(async () => {
  const g = window.game.scene.getScene('Game');
  const key = g.spec.historyKey;
  window.localStorage.setItem(key, JSON.stringify([
    { at: 1700000300000, ms: 50000, no: 3, a: true },
    { at: 1700000200000, ms: 30000, no: 3 },
    { at: 1700000150000, ms: 70000, no: 7 },
    { at: 1700000100000, ms: 20000, no: 3, h: true },
  ]));
  for (const s of window.game.scene.getScenes(true)) window.game.scene.stop(s.sys.settings.key);
  window.game.scene.start('Records');
  return key;
});
await page.waitForFunction(() => window.game.scene.isActive('Records') && window.game.scene.getScene('Records').solutions);
await page.waitForTimeout(800);
out('6.records', await page.evaluate(() => {
  const r = window.game.scene.getScene('Records');
  return { entries: r.entries, texts: r.children.list.filter((o) => o.type === 'Text').map((o) => o.text).filter((t) => /\d/.test(t)).slice(0, 20) };
}));

// ---- 7. ヒント表示を入にして完成 → 続ける → 外すと埋め戻されない ----
await page.evaluate(() => window.localStorage.clear());
await startGame(false);
await page.evaluate(() => window.game.scene.getScene('Game').toggleHint());
out('7.afterHintOn', { hinting: await page.evaluate(() => window.game.scene.getScene('Game').hinting), left: (await state()).left });
await auto(12);
await waitClear();
out('7.completed', { hud: (await state()).hud, clearTexts: (await state()).clearTexts });
await clearButton('続ける');
await page.waitForFunction(() => !window.game.scene.isActive('Clear'));
const n7 = (await pieceNames())[3];
await drag(await boardPieceGrip(n7), await trayCenter());
await page.waitForTimeout(1200);
const s7 = await state();
out('7.dragOut', { left: s7.left, clearActive: s7.clearActive, playing: s7.playing, hud: s7.hud, hinting: await page.evaluate(() => window.game.scene.getScene('Game').hinting) });

// ---- 8. デモで解が出たとき ----
await page.evaluate(() => {
  for (const s of window.game.scene.getScenes(true)) window.game.scene.stop(s.sys.settings.key);
  window.game.scene.start('Demo');
});
await page.waitForFunction(() => window.game.scene.getScene('Demo').state === 'running', null, { timeout: 15000 });
await page.evaluate(() => window.game.scene.getScene('Demo').selectSpeed('fastest'));
await page.waitForFunction(() => window.game.scene.getScene('Demo').state === 'solved', null, { timeout: 180000, polling: 500 });
await page.screenshot({ path: DEMO_SHOT });
out('8.demo', await page.evaluate(() => ({
  active: window.game.scene.getScenes(true).map((s) => s.sys.settings.key),
  message: window.game.scene.getScene('Demo').messageText.text,
  lsKeys: Object.keys(window.localStorage),
})));

out('pageErrors', errors);
await browser.close();
