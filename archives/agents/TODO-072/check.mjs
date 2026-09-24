// TODO-072 の実測（tests.html の件数と、完成後に続けて遊ぶ流れ）。
//
//   python3 -m http.server 8765 &
//   PLAYWRIGHT=$(dirname "$(rg -l '"version": "1\.63\.0"' \
//     ~/.npm/_npx/*/node_modules/playwright/package.json | head -1)")/index.mjs \
//     node archives/agents/TODO-072/check.mjs [--shots <dir>]
//
// 8×8 をおまかせで完成させる → クリア表示が重なる → 「続ける」をクリック →
// 一手戻すを 12 回（空の盤まで）・おまかせを 12 回で別の解を作る（'new'）→ 「続ける」→
// 一手戻す 1 回・おまかせ 1 回で同じ解を作り直す（'kept'）。各段で
// HUD・クリア表示・localStorage を読み出して出力する。

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765';
const shotsAt = process.argv.indexOf('--shots');
const SHOTS = shotsAt > 0 ? process.argv[shotsAt + 1] : null;

const browser = await chromium.launch();
const out = (label, value) => console.log(`${label}: ${JSON.stringify(value)}`);

// ---- tests.html -------------------------------------------------------
{
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE}/tests.html`);
  await page.waitForFunction(() => /通った|失敗/.test(document.getElementById('summary')?.textContent ?? ''), null, { timeout: 120000 });
  out('tests.summary', await page.textContent('#summary'));
  out('tests.failed', await page.$$eval('li.ng', (items) => items.map((li) => li.textContent)));
  await context.close();
}

// ---- 本編 -------------------------------------------------------------
const context = await browser.newContext({ viewport: { width: 960, height: 640 } });
const page = await context.newPage();
page.on('pageerror', (error) => console.log(`pageerror: ${error.message}`));
await page.goto(`${BASE}/`);
await page.evaluate(() => window.localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
await page.evaluate(() => {
  window.game.scene.stop('Title');
  window.game.scene.start('Game', { resume: false });
});
await page.waitForFunction(() => window.game.scene.getScene('Game').solutions !== null);

const state = () => page.evaluate(() => {
  const g = window.game.scene.getScene('Game');
  const key = g.spec;
  const clear = window.game.scene.getScene('Clear');
  const read = (k) => JSON.parse(window.localStorage.getItem(k));
  return {
    gameStatus: g.sys.settings.status,
    clearActive: window.game.scene.isActive('Clear'),
    clearTexts: window.game.scene.isActive('Clear')
      ? clear.children.list.filter((o) => o.type === 'Text').map((o) => o.text) : null,
    playing: g.playing,
    elapsed: Math.round(g.elapsed),
    hud: g.recordText.text,
    left: g.pieces.filter((p) => p.location === 'tray').length,
    history: read(key.historyKey),
    found: read(key.foundKey),
    progressSolved: read(key.progressKey)?.solved ?? null,
    progressOnBoard: read(key.progressKey)?.pieces.filter((p) => p.location === 'board').length ?? null,
  };
});
const auto = (n) => page.evaluate((count) => {
  const g = window.game.scene.getScene('Game');
  for (let i = 0; i < count; i += 1) g.useAuto();
}, n);
const undo = (n) => page.evaluate((count) => {
  const g = window.game.scene.getScene('Game');
  for (let i = 0; i < count; i += 1) g.undo();
}, n);
const waitClear = () => page.waitForFunction(() => window.game.scene.isActive('Clear'), null, { timeout: 5000 });
const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };

// 「続ける」をクリック。Canvas 上の文字の位置から画面の座標へ直す。
const clickContinue = async () => {
  const point = await page.evaluate(() => {
    const clear = window.game.scene.getScene('Clear');
    const label = clear.children.list.find((o) => o.type === 'Container'
      && o.list.some((c) => c.type === 'Text' && c.text === '続ける'));
    const rect = window.game.canvas.getBoundingClientRect();
    const sx = rect.width / window.game.scale.width;
    const sy = rect.height / window.game.scale.height;
    return { x: rect.left + label.x * sx, y: rect.top + label.y * sy };
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => !window.game.scene.isActive('Clear'));
};

await auto(12);
await waitClear();
out('1.first', await state());
await shot('1-first');

await clickContinue();
const before = (await state()).elapsed;
await page.waitForTimeout(1000);
const after = await state();
out('2.continued', { ...after, clockAdvancedMs: after.elapsed - before });
await shot('2-continued');

await undo(12);
out('3.undone.hud', (await state()).hud);
await auto(12);
await waitClear();
out('3.second', await state());
await shot('3-second');

await clickContinue();
await undo(1);
await auto(1);
await waitClear();
out('4.same', await state());
await shot('4-same');

// ヒント表示を入にして「続ける」→ 盤のピースを実際のマウスで外す → 埋め戻されない
// （レビューの要修正 1）。続けて一手戻すで外した場合も埋め戻されないことを見る。
await clickContinue();
await page.evaluate(() => window.game.scene.getScene('Game').toggleHint());
const drag = await page.evaluate(() => {
  const g = window.game.scene.getScene('Game');
  const piece = g.pieces.find((p) => p.name === 'F');
  const cell = g.layout.board.cell;
  const [r, c] = piece.cells[0];
  const tray = g.layout.trayPanel;
  const rect = window.game.canvas.getBoundingClientRect();
  const sx = rect.width / window.game.scale.width;
  const sy = rect.height / window.game.scale.height;
  const at = (x, y) => ({ x: rect.left + x * sx, y: rect.top + y * sy });
  return {
    from: at(piece.container.x + (c + 0.5) * cell, piece.container.y + (r + 0.5) * cell),
    to: at(tray.x + tray.width / 2, tray.y + tray.height / 2),
  };
});
await page.mouse.move(drag.from.x, drag.from.y);
await page.mouse.down();
await page.mouse.move(drag.to.x, drag.to.y, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(1000);
const pick = ({ clearActive, playing, hud, left }) => ({ clearActive, playing, hud, left });
out('5.hint.dragOut', { ...pick(await state()), hinting: await page.evaluate(() => window.game.scene.getScene('Game').hinting) });
await auto(1);
await waitClear();
await clickContinue();
await undo(1);
await page.waitForTimeout(1000);
out('6.hint.undo', pick(await state()));

await browser.close();
