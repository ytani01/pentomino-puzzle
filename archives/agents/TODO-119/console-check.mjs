// タイトル・本編・tests.html を 1 回ずつ開き、コンソールのエラーと tests.html の件数を見る。
// 使い方: PLAYWRIGHT=<playwright/index.mjs> node archives/agents/TODO-119/console-check.mjs
const { chromium } = await import(process.env.PLAYWRIGHT);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto('http://localhost:8765/');
await p.waitForTimeout(2000);
console.log('title scene:', await p.evaluate(() => window.game.scene.getScenes(true).map((s) => s.scene.key)));
await p.evaluate(() => window.game.scene.getScene('Title').scene.start('Game'));
await p.waitForTimeout(2000);
console.log('game scene:', await p.evaluate(() => window.game.scene.getScenes(true).map((s) => s.scene.key)));
await p.goto('http://localhost:8765/tests.html', { waitUntil: 'commit' });
await p.waitForTimeout(60000);
console.log('tests:', (await p.evaluate(() => document.body.innerText)).split('\n').filter((l) => /件|pass|fail|通/i.test(l)).slice(0, 5));
console.log('errors:', errs);
await b.close();
