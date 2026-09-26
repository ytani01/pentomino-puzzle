const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 450, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://127.0.0.1:8798/', { waitUntil: 'commit' });
await page.waitForFunction(() => window.game?.scene?.isActive('Title'), null, { timeout: 30000 });
await page.evaluate(() => localStorage.clear());
const ev = (fn) => page.evaluate(fn);
console.log('start portrait:', await ev(() => `${game.registry.get('orientation')} ${game.scale.gameSize.width}x${game.scale.gameSize.height}`));
const rot = async (w, h) => { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(300); };

// Game: title confirm
await ev(() => game.scene.getScene('Title').start());
await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
await ev(() => { const g = game.scene.getScene('Game'); g.useAuto(); g.confirmToTitle(); });
await rot(1200, 800);
console.log('title confirm:', await ev(() => { const g = game.scene.getScene('Game'); return [g.confirmKind, g.confirmParts[0].visible, g.confirmText.text.split('\n')[0]]; }));
await ev(() => game.scene.getScene('Game').confirmAction());
await page.waitForTimeout(200);
console.log('yes -> ', await ev(() => game.scene.getScenes(true).map((s) => s.scene.key)));

// Game: rotate within 700ms after solving
await ev(() => game.scene.getScene('Title').start());
await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
await ev(() => { const g = game.scene.getScene('Game'); for (let i = 0; i < 12 && g.playing; i += 1) g.useAuto(); });
console.log('solved, clear active?', await ev(() => game.scene.isActive('Clear')));
await rot(450, 800);
await page.waitForFunction(() => game.scene.isActive('Clear'), null, { timeout: 10000 }).catch(() => {});
console.log('after rotate in delay:', await ev(() => ({ clear: game.scene.isActive('Clear'), gamePaused: game.scene.isPaused('Game'), hist: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => k.includes('history')) || 'null'))?.length })));
await ev(() => game.scene.getScene('Clear').leaveTo('Title'));
await page.waitForTimeout(200);
// fresh start after relayout: no stale state
await ev(() => game.scene.getScene('Title').start());
await page.waitForTimeout(300);
console.log('fresh game after relayouts:', await ev(() => { const g = game.scene.getScene('Game'); return { tray: g.pieces.filter((p) => p.location === 'tray').length, history: g.history.length, clearData: g.clearData, playing: g.playing }; }));

// Records: continue confirm
await ev(() => game.scene.getScene('Game').goToTitle());
await ev(() => game.scene.getScene('Title').scene.start('Records'));
await page.waitForFunction(() => game.scene.getScene('Records')?.solutions);
await ev(() => game.scene.getScene('Records').confirmContinue());
const rc = () => ev(() => { const r = game.scene.getScene('Records'); return [r.confirmKind, r.confirmParts[0].visible, r.confirmText.text.split('\n')[0], r.continueButton.enabled ?? null]; });
console.log('records continue before:', await rc());
await rot(1200, 800);
console.log('records continue after :', await rc());
await ev(() => game.scene.getScene('Records').confirmAction());
await page.waitForTimeout(300);
console.log('continue yes ->', await ev(() => { const g = game.scene.getScene('Game'); return [game.scene.getScenes(true).map((s) => s.scene.key), g.pieces.filter((p) => p.location === 'board').length]; }));
// Records fresh after relayout
await ev(() => game.scene.getScene('Game').goToTitle());
await ev(() => game.scene.getScene('Title').scene.start('Records'));
await page.waitForTimeout(300);
console.log('fresh records:', await ev(() => { const r = game.scene.getScene('Records'); return [r.confirmKind, r.confirmParts[0].visible, r.page, r.checked.size]; }));

// Demo mid-turn, and solved state
await ev(() => game.scene.getScene('Records').goToTitle());
await ev(() => game.scene.getScene('Title').scene.start('Demo'));
await page.waitForFunction(() => game.scene.getScene('Demo')?.state === 'running');
const before = await (await page.waitForFunction(() => {
  const d = game.scene.getScene('Demo');
  if (!d.turning) return false;
  const info = { name: d.turning.value.name, target: JSON.stringify(d.turning.value.cells), tried: d.tried };
  d.relayout();
  return info;
}, null, { timeout: 20000, polling: 'raf' })).jsonValue();
await page.waitForTimeout(100);
console.log('mid-turn relayout:', before, await ev(() => { const d = game.scene.getScene('Demo'); const p = d.pieces.find((q) => q.name === window.__n); return { turning: !!d.turning, tried: d.tried, onBoard: d.pieces.filter((p) => p.location === 'board').map((p) => p.name).join('') }; }));
await rot(450, 800);
await ev(() => game.scene.getScene('Demo').onSolved());
await rot(1200, 800);
console.log('solved state:', await ev(() => { const d = game.scene.getScene('Demo'); return [d.state, d.messageText.text, d.nextButton.enabled ?? null, d.solvedCount]; }));
console.log('errors', errors);
await browser.close();
