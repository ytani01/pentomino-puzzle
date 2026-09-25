// ホーム／タイトル行を空の盤で押したとき、遊びかけを残したまま確認なしで戻るか（TODO-094）。
const { chromium } = await import(process.env.PLAYWRIGHT);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await page.goto('http://localhost:8794/');
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
const click = async (src) => {
  const p = await page.evaluate((code) => {
    const s = window.game.scene.getScene('Game');
    const b = eval(code)(s); // eslint-disable-line no-eval
    const r = window.game.canvas.getBoundingClientRect();
    return { x: r.left + b.x * r.width / window.game.config.width, y: r.top + b.y * r.height / window.game.config.height };
  }, src);
  await page.mouse.click(p.x, p.y);
  await page.waitForTimeout(300);
};
const start = async () => {
  await page.evaluate(() => window.game.scene.getScene('Title').scene.start('Game', { resume: false }));
  await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').solutions);
};
const progress = () => page.evaluate(async () => {
  const { loadProgress } = await import('/src/storage.js');
  const p = loadProgress('8x8');
  return p ? p.pieces.filter((x) => x.location === 'board').length : null;
});
const where = () => page.evaluate(() => ({
  title: window.game.scene.isActive('Title'),
  confirm: window.game.scene.getScene('Game').confirmParts?.[0].visible,
}));

// 遊びかけを 1 つ作る（1 個置いてタイトルへ）
await start();
await page.evaluate(() => window.game.scene.getScene('Game').useAuto());
await click('(s) => s.buttons[0]');
console.log('placed + home:', JSON.stringify(await where()));
await click('(s) => s.confirmParts.find((o) => o.list?.some((c) => c.text === "はい"))');
console.log('after yes:', JSON.stringify(await where()), 'progress', await progress());

for (const [label, target] of [['HUD home', '(s) => s.buttons[0]'], ['title bar', '(s) => s.children.list.find((o) => o.text === "PENTOMINO PUZZLE")']]) {
  await start();
  console.log('  progress before click', await progress());
  await click(target);
  console.log(`empty + ${label}:`, JSON.stringify(await where()), 'progress', await progress());
}

// 空の盤でやり直し → 確認なし。置いてからやり直し → 確認、いいえで盤は残る
await start();
await click('(s) => s.buttons[4]');
console.log('empty restart confirm:', JSON.stringify(await where()));
await page.evaluate(() => window.game.scene.getScene('Game').useAuto());
await page.waitForTimeout(500);
await click('(s) => s.buttons[4]');
console.log('placed restart:', JSON.stringify(await where()));
await click('(s) => s.confirmParts[s.confirmParts.length - 1]');
console.log('after no:', JSON.stringify(await where()), 'onBoard',
  await page.evaluate(() => window.game.scene.getScene('Game').pieces.filter((p) => p.location === 'board').length));

// 空の盤でやり直し・ヒント表示を押しても遊びかけ（1 個）が残るか
await start();
console.log('  progress before', await progress());
await click('(s) => s.buttons[3]');
console.log('empty + hint on: progress', await progress());
await click('(s) => s.buttons[4]');
await page.waitForTimeout(300);
console.log('empty + restart: progress', await progress());

// 記録画面の「この回を続ける」と同じ経路（progress を渡す）で保存が効くか
const saved = await page.evaluate(async () => {
  const { loadProgress, clearProgress } = await import('/src/storage.js');
  const p = loadProgress('8x8');
  clearProgress('8x8');
  window.game.scene.getScene('Game').scene.start('Game', { progress: p });
  return p.pieces.filter((x) => x.location === 'board').length;
});
await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').solutions);
await page.waitForTimeout(300);
console.log('records path: passed', saved, 'progress after start', await progress());
await click('(s) => s.buttons[0]');
await click('(s) => s.confirmParts.find((o) => o.list?.some((c) => c.text === "はい"))');
console.log('records path + home yes: progress', await progress());

// このシーンで置いてから空に戻したら消える／置いてやり直しの「はい」でも消える
await start();
await page.evaluate(() => { const s = window.game.scene.getScene('Game'); s.useAuto(); });
await page.waitForTimeout(300);
console.log('placed: progress', await progress());
await page.evaluate(() => window.game.scene.getScene('Game').undo());
await page.waitForTimeout(300);
console.log('undo to empty: progress', await progress());
await page.evaluate(() => window.game.scene.getScene('Game').useAuto());
await page.waitForTimeout(300);
await click('(s) => s.buttons[4]');
await click('(s) => s.confirmParts.find((o) => o.list?.some((c) => c.text === "はい"))');
console.log('placed + restart yes: progress', await progress());
await browser.close();
