const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const URL = 'http://127.0.0.1:8798/';
const OUT = process.env.OUT || '.';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(URL, { waitUntil: 'commit' });
await page.waitForFunction(() => window.game?.scene?.isActive('Title'), null, { timeout: 30000 });
await page.evaluate(() => localStorage.clear());
const ev = (fn, arg) => page.evaluate(fn, arg);
const LAND = { width: 1200, height: 800 };
const PORT = { width: 450, height: 800 };
async function rotate(size, label) {
  await page.setViewportSize(size);
  await page.waitForTimeout(400);
  const info = await ev(() => ({
    orientation: game.registry.get('orientation'),
    size: `${game.scale.gameSize.width}x${game.scale.gameSize.height}`,
    running: game.scene.getScenes(false).filter((s) => s.sys.isActive()).map((s) => s.scene.key),
    paused: game.scene.getScenes(false).filter((s) => s.sys.isPaused()).map((s) => s.scene.key),
  }));
  console.log(`  [${label}] ${JSON.stringify(info)}`);
  return info;
}
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const toGame = async (x, y) => ev(([x, y]) => {
  const c = game.canvas.getBoundingClientRect();
  return { x: c.left + x * c.width / game.scale.width, y: c.top + y * c.height / game.scale.height };
}, [x, y]);

// ---- Title
console.log('Title');
await ev(() => game.scene.getScene('Title').selectBoard('6x10'));
await ev(() => game.scene.getScene('Title').selectPalette('colorful'));
await rotate(PORT, '縦');
console.log('  ', await ev(() => { const t = game.scene.getScene('Title'); return { board: t.boardKey, palette: t.paletteKey, previewBox: t.previewBox }; }));
await shot('title-portrait');
await rotate(LAND, '横');
console.log('  ', await ev(() => { const t = game.scene.getScene('Title'); return { board: t.boardKey, palette: t.paletteKey, previewBox: t.previewBox }; }));
await ev(() => game.scene.getScene('Title').selectBoard('8x8'));

// ---- Game
console.log('Game');
await ev(() => game.scene.getScene('Title').start());
await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
await ev(() => { const g = game.scene.getScene('Game'); g.useAuto(); g.useAuto(); g.toggleHint(); g.confirmRestart(); });
await page.waitForTimeout(300);
const gameState = () => ev(() => {
  const g = game.scene.getScene('Game');
  const posOk = g.pieces.every((p) => { const t = g.pieceTransform(p); return Math.abs(p.container.x - t.x) < 0.5 && Math.abs(p.container.y - t.y) < 0.5; });
  return {
    board: g.board.grid.map((c) => c ?? '.').join(''), history: g.history.length, elapsed: Math.round(g.elapsed),
    hinting: g.hinting, hintState: g.hintState, usedAuto: g.usedAuto, usedHint: g.usedHint, confirmKind: g.confirmKind,
    confirmVisible: g.confirmParts[0].visible, portrait: g.layout.portrait, drag: !!g.drag,
    trayPieces: g.pieces.filter((p) => p.location === 'tray').length, posOk, solutionsLoaded: !!g.solutions,
    undoEnabled: g.undoButton.enabled ?? null,
  };
});
const g1 = await gameState(); console.log('  before', JSON.stringify(g1));
await rotate(PORT, '縦');
const g2 = await gameState(); console.log('  after ', JSON.stringify(g2));
await shot('game-portrait-confirm');
// close confirm, begin a drag on a tray piece, rotate mid-drag
await ev(() => game.scene.getScene('Game').hideConfirm());
const slot = await ev(() => { const g = game.scene.getScene('Game'); const p = g.pieces.find((q) => q.location === 'tray'); const s = g.layout.tray.slots[p.slot]; return { name: p.name, x: s.x, y: s.y }; });
const from = await toGame(slot.x, slot.y);
await page.mouse.move(from.x, from.y);
await page.mouse.down();
await page.mouse.move(from.x + 5, from.y - 60, { steps: 5 });
console.log('  dragging', await ev(() => !!game.scene.getScene('Game').drag), slot.name);
await rotate(LAND, '横(ドラッグ中)');
await page.mouse.up();
const g3 = await gameState(); console.log('  after ', JSON.stringify(g3));
console.log('  same board as before drag:', g3.board === g2.board, 'history same:', g3.history === g2.history);
await shot('game-landscape');

// ---- Clear
console.log('Clear');
await ev(() => { const g = game.scene.getScene('Game'); for (let i = 0; i < 12 && g.playing; i += 1) g.useAuto(); });
await page.waitForFunction(() => game.scene.isActive('Clear'), null, { timeout: 5000 });
const histBefore = await ev(async () => (await import('/src/storage.js')).loadHistory('8x8').length);
const clearInfo = () => ev(() => { const c = game.scene.getScene('Clear'); const g = game.scene.getScene('Game'); return { texts: c.children.list.filter((o) => o.type === 'Text').map((o) => o.text).join(' | '), gamePlaying: g.playing, gamePaused: g.scene.isPaused(), gamePortrait: g.layout.portrait, record: g.recordText.text }; });
console.log('  before', JSON.stringify(await clearInfo()));
await rotate(PORT, '縦');
console.log('  after ', JSON.stringify(await clearInfo()));
const histAfter = await ev(async () => (await import('/src/storage.js')).loadHistory('8x8').length);
console.log('  history length', histBefore, '->', histAfter);
await shot('clear-portrait');
await rotate(LAND, '横');
console.log('  after ', JSON.stringify(await clearInfo()));
await ev(() => game.scene.getScene('Clear').continueGame());
await page.waitForTimeout(200);
console.log('  continue:', JSON.stringify(await ev(() => { const g = game.scene.getScene('Game'); return { playing: g.playing, paused: g.scene.isPaused(), clear: game.scene.isActive('Clear'), clearData: g.clearData }; })));

// ---- Records
console.log('Records');
await ev(async () => {
  const st = await import('/src/storage.js');
  const sol = game.registry.get('solutions/8x8');
  for (let i = 1; i <= 12; i += 1) st.recordCompletion('8x8', { at: Date.now() - i * 60000, ms: 1000 * i, no: i + 10, usedAuto: false, usedHint: false }, sol);
});
await ev(() => game.scene.getScene('Game').goToTitle());
await ev(() => game.scene.getScene('Title').scene.start('Records'));
await page.waitForFunction(() => game.scene.getScene('Records')?.solutions);
await ev(() => { const r = game.scene.getScene('Records'); r.turnPage(1); r.selectRow(1); r.toggleRow(0); r.toggleRow(2); r.confirmTrash(); });
const recInfo = () => ev(() => { const r = game.scene.getScene('Records'); return { board: r.boardKey, page: r.page, rowsPerPage: r.L.rowsPerPage, selected: r.selected, checked: [...r.checked], confirmKind: r.confirmKind, confirmVisible: r.confirmParts[0].visible, confirmText: r.confirmText.text, entries: r.entries.length }; });
console.log('  before', JSON.stringify(await recInfo()));
await rotate(PORT, '縦');
await page.waitForTimeout(200);
console.log('  after ', JSON.stringify(await recInfo()));
await shot('records-portrait');
await rotate(LAND, '横');
await page.waitForTimeout(200);
console.log('  after ', JSON.stringify(await recInfo()));

// ---- Demo
console.log('Demo');
await ev(() => game.scene.getScene('Records').goToTitle());
await ev(() => game.scene.getScene('Title').scene.start('Demo'));
await page.waitForFunction(() => game.scene.getScene('Demo')?.state === 'running');
await ev(() => {
  const d = game.scene.getScene('Demo');
  window.__viol = []; window.__moves = 0;
  const proto = Object.getPrototypeOf(d);
  const orig = proto.finishStep;
  proto.finishStep = function (value, animate, piece) {
    window.__moves += 1;
    // 置く手は盤に無いピース、外す手は盤にあるピースのはず（generator と画面が揃っているか）。
    const expected = value.type === 'place' ? 'tray' : 'board';
    const turningPlace = value.type === 'place' && piece.location === 'tray';
    if (piece.location !== expected && !turningPlace) window.__viol.push(`${value.type} ${value.name} but ${piece.location}`);
    return orig.call(this, value, animate, piece);
  };
  d.selectSpeed(window.__speed || 'slow');
});
await page.waitForTimeout(1500);
await ev(() => { const d = game.scene.getScene('Demo'); window.__steps = d.steps; });
const demoInfo = () => ev(() => { const d = game.scene.getScene('Demo'); return { state: d.state, strategy: d.strategy, speed: d.speed, tried: d.tried, solved: d.solvedCount, sameGen: d.steps === window.__steps, onBoard: d.pieces.filter((p) => p.location === 'board').map((p) => p.name).join(''), portrait: d.layout.portrait, status: d.statusText.text, turning: !!d.turning, moves: window.__moves, viol: window.__viol }; });
console.log('  before', JSON.stringify(await demoInfo()));
await rotate(PORT, '縦');
console.log('  after ', JSON.stringify(await demoInfo()));
await page.waitForTimeout(1500);
console.log('  +1.5s ', JSON.stringify(await demoInfo()));
await ev(() => game.scene.getScene('Demo').selectSpeed('fastest'));
for (let i = 0; i < 4; i += 1) { await rotate(i % 2 ? PORT : LAND, `連続${i}`); }
await page.waitForTimeout(3000);
console.log('  fastest+rotations', JSON.stringify(await demoInfo()));
await shot('demo-portrait');
await rotate(LAND, '横');
console.log('  after ', JSON.stringify(await demoInfo()));
console.log('errors', errors);
await browser.close();
