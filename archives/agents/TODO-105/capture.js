// TODO-105: 確認ダイアログの組み立てを ui.js へまとめる前後の撮り比べ。
// `browser_run_code_unsafe` の `filename` に渡す。前: OUT を .../before、後: .../after にするだけ
// （MCP はリポジトリと ~/tmp/playwright-mcp の外のファイルを読めないので、後は OUT だけ変えたコピーを
//  ~/tmp/playwright-mcp/todo105/ に置いて渡す）。前提: http://localhost:8765/ でサーバが立っている。
// 1280x720 の横、8×8、既定の色の組。使うのは各シーンに残る openConfirm() だけ。
//   game-confirm.png    … 本編で openConfirm('restart')（やり直しの確認）
//   records-confirm.png … 記録で、履歴 3 件を入れ 1 件チェックして openConfirm('trash')
// 確認の枠は中央（枠 460x200 → 画面の x 410..870, y 260..460）。その外に 40px の余白を付けて切る。
// 本編はネオンの明滅を止め、にじみの alpha を 1 に固定する（余白にピースが入っても揺れないように）。
async (page) => {
  const OUT = '/home/ytani/tmp/playwright-mcp/todo105/before';
  const CLIP = { x: 370, y: 220, width: 540, height: 280 };
  const sleep = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });   // 古い JS が残らないように
  await page.setViewportSize({ width: 1280, height: 720 });
  const ready = (scene) => page.waitForFunction((s) => {
    const g = window.game && window.game.scene.getScene(s);
    return g && g.sys.isActive();
  }, scene, { timeout: 5000 });
  const out = {};

  // 記録を入れておく（日時は固定。表示は同じマシンなら同じ）。
  const HISTORY = [
    { at: 1700000300000, ms: 61000, no: 3 },
    { at: 1700000200000, ms: 75000, no: 2 },
    { at: 1700000100000, ms: 90000, no: 1 },
  ];

  // 本編
  await page.goto('http://localhost:8765/');
  await page.evaluate(() => { window.localStorage.clear(); });
  await page.reload();
  await ready('Title'); await sleep(600);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
  await ready('Game'); await sleep(600);
  out.game = await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.tweens.killAll();
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
    s.openConfirm('restart');
    return { size: [s.scale.width, s.scale.height], kind: s.confirmKind, text: s.confirmText.text };
  });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/game-confirm.png`, clip: CLIP });

  // 記録
  await page.goto('http://localhost:8765/');
  await page.evaluate((h) => {
    window.localStorage.clear();
    window.localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify(h));
  }, HISTORY);
  await page.reload();
  await ready('Title'); await sleep(600);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Records'); });
  await ready('Records');
  await page.waitForFunction(() => window.game.scene.getScene('Records').entries.length === 3, null, { timeout: 5000 });
  await sleep(600);
  out.records = await page.evaluate(() => {
    const s = window.game.scene.getScene('Records');
    s.checked.add(s.entries[0].no);
    s.refresh();
    s.openConfirm('trash');
    return { entries: s.entries.length, kind: s.confirmKind, text: s.confirmText.text };
  });
  await sleep(500);
  await page.screenshot({ path: `${OUT}/records-confirm.png`, clip: CLIP });
  return out;
}
