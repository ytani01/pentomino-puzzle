// 同じ tick の中で向きの変化を偽装する: registry の向きを逆にしてから resize を送る。
const { chromium } = await import('/home/ytani/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs');
const PORT = process.env.PORT || 8798;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'commit' });
await page.waitForFunction(() => window.game?.scene?.isActive('Title'), null, { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  window.__fake = () => { const k = 'orientation'; game.registry.set(k, game.registry.get(k) === 'portrait' ? 'landscape' : 'portrait'); window.dispatchEvent(new Event('resize')); };
  // ファンファーレの回数を数える（Clear の create で鳴る）
  window.__fanfare = 0;
  window.__rl = {};
  for (const sc of game.scene.getScenes(false)) {
    if (!sc.relayout) continue;
    const orig = sc.relayout;
    sc.relayout = function () { window.__rl[sc.scene.key] = (window.__rl[sc.scene.key] || 0) + 1; return orig.call(this); };
  }
});
await page.evaluate(async () => { const a = await import('/src/audio.js'); });
const ev = (fn) => page.evaluate(fn);
const settle = () => page.waitForTimeout(600);
const scenes = () => ev(() => ({ relayouts: (() => { const r = window.__rl; window.__rl = {}; return r; })(), running: game.scene.getScenes(true).map((s) => s.scene.key), paused: game.scene.getScenes(false).filter((s) => s.sys.isPaused()).map((s) => s.scene.key), orient: game.registry.get('orientation'), size: `${game.scale.gameSize.width}x${game.scale.gameSize.height}` }));
const gstate = () => ev(() => { const g = game.scene.getScene('Game'); return { hist: g.history.length, onBoard: g.pieces.filter((p) => p.location === 'board').length, portrait: g.layout.portrait }; });
const rows = [];

// A1
await ev(() => { game.scene.getScene('Title').scene.start('Records'); window.__fake(); });
await settle();
rows.push(['A1 Title→Records と同じ tick に向きが変わる', JSON.stringify(await scenes())]);
await ev(() => game.scene.getScene('Records').goToTitle()); await settle();

// A2
await ev(() => game.scene.getScene('Title').start());
await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
await ev(() => { const g = game.scene.getScene('Game'); g.useAuto(); g.useAuto(); });
await ev(() => { game.scene.getScene('Game').goToTitle(); window.__fake(); });
await settle();
rows.push(['A2 Game で goToTitle() と同じ tick に向きが変わる', JSON.stringify(await scenes())]);

// B: 同じ tick で 2 回（registry を 2 回逆に → 最後は元の向き）
await ev(() => game.scene.getScene('Title').start());
await page.waitForFunction(() => game.scene.getScene('Game')?.solutions);
await ev(() => { const g = game.scene.getScene('Game'); g.useAuto(); g.useAuto(); g.useAuto(); });
const b0 = await gstate();
await ev(() => { window.__fake(); window.__fake(); });
await settle();
rows.push(['B 同じ tick で 2 回（元の向きへ戻る）', `前 ${JSON.stringify(b0)} → 後 ${JSON.stringify(await gstate())} ${JSON.stringify(await scenes())}`]);

// B': 同じ tick で 2 回 resize（registry は 1 回だけ逆に。向きは変わったまま）
const b1 = await gstate();
await ev(() => { window.__fake(); window.dispatchEvent(new Event('resize')); });
await settle();
rows.push(["B' 同じ tick で resize 2 回（向きは変わる）", `前 ${JSON.stringify(b1)} → 後 ${JSON.stringify(await gstate())} ${JSON.stringify(await scenes())}`]);

// B'': 作り直しの予約が処理される前（poststep で予約した直後）にもう一度変わる
const b2 = await gstate();
await ev(() => {
  window.__fake();
  let n = 0;
  const later = () => { n += 1; if (game.scene._queue.length > 0) { game.events.off('poststep', later); window.__fake(); window.__hit = n; } if (n > 30) game.events.off('poststep', later); };
  game.events.on('poststep', later);
});
await settle(); await settle();
rows.push(["B'' 作り直しの予約が残っている間にもう一度変わる", `前 ${JSON.stringify(b2)} → 後 ${JSON.stringify(await gstate())} ${JSON.stringify(await scenes())} 予約中に偽装=${await ev(() => window.__hit ?? 'なし')}`]);

// Clear を重ねている場合の B（ファンファーレを数える）
await ev(async () => { const g = game.scene.getScene('Game'); for (let i = 0; i < 12 && g.playing; i += 1) g.useAuto(); });
await page.waitForFunction(() => game.scene.isActive('Clear'), null, { timeout: 15000 });
await ev(() => { const c = game.scene.getScene('Clear'); window.__creates = 0; const proto = Object.getPrototypeOf(c); const orig = proto.create; proto.create = function () { window.__creates += 1; if (!this.relayouting) window.__fanfare += 1; return orig.call(this); }; });
await ev(() => { window.__fake(); window.dispatchEvent(new Event('resize')); });
await settle();
await ev(() => {
  window.__fake();
  let n = 0;
  const later = () => { n += 1; if (game.scene._queue.length > 0) { game.events.off('poststep', later); window.__fake(); } if (n > 30) game.events.off('poststep', later); };
  game.events.on('poststep', later);
});
await settle(); await settle();
rows.push(['Clear を重ねて向きを続けて変える', `${JSON.stringify(await scenes())} Clear の create ${await ev(() => window.__creates)} 回・うちファンファーレを鳴らす create ${await ev(() => window.__fanfare)} 回`]);

for (const [k, v] of rows) console.log(`| ${k} | ${v} |`);
console.log('errors', errors);
await browser.close();
