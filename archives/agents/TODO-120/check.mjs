const { chromium } = await import(process.env.PLAYWRIGHT);
const browser = await chromium.launch({ executablePath: process.env.EXE });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:8765/');
await page.evaluate(() => localStorage.clear());
await page.waitForFunction(() => window.game?.scene.getScene('Title')?.sys.isActive());
await page.evaluate(() => window.game.scene.getScene('Title').scene.start('Game', { resume: false }));
await page.waitForFunction(() => { const g = window.game.scene.getScene('Game'); return g?.sys.isActive() && g.solutions; });
const G = (fn, arg) => page.evaluate(fn, arg);
const st = () => G(() => { const g = window.game.scene.getScene('Game');
  return { tray: g.trayPieces().length, hist: g.history.length, onBoard: g.pieces.filter(p=>p.location==='board').map(p=>`${p.name}@${p.row},${p.col}`).join(' '), remain: g.remainText.text }; });
// screen point of a piece tile center
const pt = (name) => G((name) => { const g = window.game.scene.getScene('Game'); const p = g.pieces.find(x=>x.name===name);
  const t = p.tiles[0]; const m = t.getWorldTransformMatrix(); const r = g.game.canvas.getBoundingClientRect();
  const sx = r.width / g.game.config.width, sy = r.height / g.game.config.height;
  const b = t.getBounds(); return { x: r.left + b.centerX * sx, y: r.top + b.centerY * sy, bx: r.left + (g.layout.board.x + g.layout.board.cell*4) * sx, by: r.top + (g.layout.board.y + g.layout.board.cell*4)*sy, tx: r.right - 5, ty: r.top + r.height / 2 }; }, name);
const log = [];
log.push(['start', await st()]);
// 置く（マウスでドラッグ。途中でホイールで向きを変える）
const name = await G(() => window.game.scene.getScene('Game').pieces.find(p=>p.name!=='X').name);
let p = await pt(name);
await page.mouse.move(p.x, p.y); await page.mouse.down();
await page.mouse.move((p.x+p.bx)/2, (p.y+p.by)/2, { steps: 5 });
const before = await G((n) => JSON.stringify(window.game.scene.getScene('Game').pieces.find(x=>x.name===n).cells), name);
await page.mouse.wheel(0, 100);
const after = await G((n) => JSON.stringify(window.game.scene.getScene('Game').pieces.find(x=>x.name===n).cells), name);
log.push(['turnDrag changed cells', before !== after]);
await page.mouse.move(p.bx, p.by, { steps: 5 }); await page.mouse.up();
await page.waitForTimeout(600);
log.push(['after drop', await st()]);
// 向きを変える（ボード上のピースをタップ）
p = await pt(name);
const c0 = await G((n) => JSON.stringify(window.game.scene.getScene('Game').pieces.find(x=>x.name===n).cells), name);
await G((n) => { const g = window.game.scene.getScene('Game'); g.turnPiece(g.pieces.find(x=>x.name===n)); }, name);
const c1 = await G((n) => JSON.stringify(window.game.scene.getScene('Game').pieces.find(x=>x.name===n).cells), name);
log.push(['turnPiece on board changed', c0 !== c1, await st()]);
// 一手戻す
await G(() => window.game.scene.getScene('Game').undo());
await page.waitForTimeout(500);
const c2 = await G((n) => JSON.stringify(window.game.scene.getScene('Game').pieces.find(x=>x.name===n).cells), name);
log.push(['undo restored cells', c2 === c0, await st()]);
// 外す（ボードからトレイへドラッグ）
p = await pt(name);
await page.mouse.move(p.x, p.y); await page.mouse.down();
await page.mouse.move(p.tx, p.ty, { steps: 8 }); await page.mouse.up();
await page.waitForTimeout(600);
log.push(['after remove', await st()]);
// おまかせ 2 手（slideIn）→ 保存 → つづきから
await G(() => { const g = window.game.scene.getScene('Game'); g.useAuto(); g.useAuto(); });
await page.waitForTimeout(600);
const saved = await st();
log.push(['after auto x2', saved]);
await G(() => window.game.scene.getScene('Game').scene.start('Title'));
await page.waitForFunction(() => window.game.scene.getScene('Title').sys.isActive());
log.push(['progress saved', await G(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.includes('progress')) ?? 'null'))?.pieces?.slice(0,1))]);
await G(() => window.game.scene.getScene('Title').scene.start('Game', { resume: true }));
await page.waitForFunction(() => { const g = window.game.scene.getScene('Game'); return g?.sys.isActive() && g.ready; });
await page.waitForTimeout(600);
const resumed = await st();
log.push(['resumed', resumed, 'same board', resumed.onBoard === saved.onBoard]);
// 向きの切り替えで作り直し（applyRelayout）
await G(() => window.game.scene.getScene('Game').relayout());
await page.waitForFunction(() => { const g = window.game.scene.getScene('Game'); return g?.sys.isActive() && g.ready; });
await page.waitForTimeout(600);
log.push(['relayout', (await st()).onBoard === saved.onBoard]);
// デモ
await G(() => window.game.scene.getScene('Game').scene.start('Demo'));
await page.waitForTimeout(4000);
log.push(['demo', await G(() => { const d = window.game.scene.getScene('Demo'); return { state: d.state, tried: d.tried, onBoard: d.pieces.filter(p=>p.location==='board').length, layoutHud: !!d.layout.hud }; })]);
await G(() => window.game.scene.getScene('Demo').relayout());
await page.waitForTimeout(1500);
log.push(['demo relayout', await G(() => { const d = window.game.scene.getScene('Demo'); return { state: d.state, tried: d.tried, onBoard: d.pieces.filter(p=>p.location==='board').length }; })]);
console.log(JSON.stringify(log, null, 1));
console.log('errors:', JSON.stringify(errors));
await browser.close();
