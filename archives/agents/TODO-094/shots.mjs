// 本編を縦・横 × 8×8・6×10 で撮る（TODO-094）。はみ出しの有無を見るため、
// 概要の文字の外接矩形と、トレイ・メッセージの位置も出す。
const { chromium } = await import(process.env.PLAYWRIGHT);
const browser = await chromium.launch();
for (const portrait of [true, false]) {
  for (const board of ['8x8', '6x10']) {
    const ctx = await browser.newContext({
      viewport: portrait ? { width: 390, height: 693 } : { width: 960, height: 640 },
      deviceScaleFactor: portrait ? 2 : 1,
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await page.goto('http://localhost:8794/');
    await page.waitForFunction(() => window.game?.scene.isActive('Title'));
    await page.evaluate((key) => {
      window.game.registry.set('board', key);
      window.game.scene.getScene('Title').scene.start('Game', { resume: false });
    }, board);
    await page.waitForFunction(() => window.game.scene.getScene('Game')?.solutions);
    const info = await page.evaluate(() => {
      const s = window.game.scene.getScene('Game');
      s.useAuto();
      s.useAuto();
      s.showMessage('メッセージの位置');
      const help = s.children.list.find((o) => o.type === 'Text' && o.text.includes('ドラッグ'));
      const b = help.getBounds();
      const t = s.layout.trayPanel;
      return {
        size: [s.layout.width, s.layout.height], cell: s.layout.board.cell,
        trayBottom: t.y + t.height, help: [b.x, b.y, b.right, b.bottom].map(Math.round),
        messageY: s.layout.message.y,
      };
    });
    await page.waitForTimeout(600);
    const name = `todo094-${portrait ? 'portrait' : 'landscape'}-${board}.png`;
    await page.screenshot({ path: `${process.env.HOME}/tmp/playwright-mcp/${name}` });
    console.log(name, JSON.stringify(info));
    await ctx.close();
  }
}
await browser.close();
