// TODO-105: 確認を開いて「いいえ」を実際にクリックして閉じ、表示が残らないことを見る。
// 開く前の同じ範囲の画像と、閉じたあとの画像が全バイト同じなら、何も残っていない。
// 本編（openConfirm('restart')）と記録（openConfirm('trash')）で 1 回ずつ。保存はしない。
async (page) => {
  const CLIP = { x: 370, y: 220, width: 540, height: 280 };
  const race = (p, ms, label) => Promise.race([p.then(() => 'ok'), page.waitForTimeout(ms).then(() => label)]);
  const sleep = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await page.setViewportSize({ width: 1280, height: 720 });
  const ready = (scene) => page.waitForFunction((s) => {
    const g = window.game && window.game.scene.getScene(s);
    return g && g.sys.isActive();
  }, scene, { timeout: 5000 });
  const HISTORY = [
    { at: 1700000300000, ms: 61000, no: 3 },
    { at: 1700000200000, ms: 75000, no: 2 },
    { at: 1700000100000, ms: 90000, no: 1 },
  ];
  // 「いいえ」の文字の中心（ページ座標）。ボタンの作りに依らず、文字から探す。
  const noButton = (sceneKey) => page.evaluate((key) => {
    const s = window.game.scene.getScene(key);
    const t = s.children.list.flatMap((o) => (o.list ? [o, ...o.list] : [o]))
      .find((o) => o.type === 'Text' && o.text === 'いいえ');
    const b = t.getBounds();
    const r = window.game.canvas.getBoundingClientRect();
    const k = r.width / window.game.scale.width;
    return { x: r.left + (b.x + b.width / 2) * k, y: r.top + (b.y + b.height / 2) * k };
  }, sceneKey);
  const run = async (sceneKey, open) => {
    const before = await page.screenshot({ clip: CLIP });
    await page.evaluate(open);
    await sleep(500);
    const opened = await page.screenshot({ clip: CLIP });
    const { x, y } = await noButton(sceneKey);
    const click = await race(page.mouse.click(x, y), 3000, 'click timeout');
    await page.mouse.move(5, 5, { steps: 3 });
    await sleep(500);
    const closed = await page.screenshot({ clip: CLIP });
    const state = await page.evaluate((key) => {
      const s = window.game.scene.getScene(key);
      return { confirmKind: s.confirmKind };
    }, sceneKey);
    return { click, openedDiffersFromBefore: !opened.equals(before), closedEqualsBefore: closed.equals(before), ...state };
  };
  const out = {};

  await page.goto('http://localhost:8765/');
  await page.evaluate(() => { window.localStorage.clear(); });
  await page.reload();
  await ready('Title'); await sleep(600);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
  await ready('Game'); await sleep(600);
  await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.tweens.killAll();
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
  });
  out.game = await run('Game', () => window.game.scene.getScene('Game').openConfirm('restart'));

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
  await page.evaluate(() => {
    const s = window.game.scene.getScene('Records');
    s.checked.add(s.entries[0].no);
    s.refresh();
  });
  await sleep(300);
  out.records = await run('Records', () => window.game.scene.getScene('Records').openConfirm('trash'));
  return out;
}
