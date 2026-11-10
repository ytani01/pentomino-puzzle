// TODO-108: 文字のスタイルの組み立てを ui.js の 1 つの関数にまとめる前後の撮り比べ。
// `browser_run_code_unsafe` の `filename` に渡す。前: OUT を .../before、後: .../after にするだけ
// （MCP はリポジトリと ~/tmp/playwright-mcp の外のファイルを読めないので、後は OUT だけ変えたコピーを
//  ~/tmp/playwright-mcp/todo108/ に置いて渡す）。前提: http://localhost:8765/ でサーバが立っている。
// 1280x720 の横、8×8、既定の色の組。5 つのシーンをキャンバス全体（clip）で 1 枚ずつ撮る。
// 動くものは止めてから撮る:
//   title   … 動くボード（previewGraphics）を隠し、そのタイマーを止める
//   game    … 経過時間を 00:00 に書いてシーンを pause。ネオンの明滅は止めて alpha 1 に固定
//   records … 履歴 3 件（日時は固定）を localStorage に入れる。先頭の回が選ばれて完成形が出る
//   clear   … game と同じ状態から clearData を決まった値で入れて showClear()（本編で完成させる代わり。
//             Clear が読むのは clearData だけ）
//   demo    … 開いた直後に明滅を止めて pause し、全解のデータが届くのを待つ（まだ 1 手も進んでいない状態）
async (page) => {
  const OUT = '/home/ytani/tmp/playwright-mcp/todo108/before';
  const BASE = 'http://localhost:8765/';
  const sleep = (ms) => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });   // 古い JS が残らないように
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
  const canvasClip = async () => page.evaluate(() => {
    const r = window.game.canvas.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) };
  });
  const shot = async (name) => {
    const clip = await canvasClip();
    await page.screenshot({ path: `${OUT}/${name}.png`, clip });
    return clip;
  };
  const fresh = async (history) => {
    await page.goto(BASE);
    await page.evaluate((h) => {
      window.localStorage.clear();
      if (h) window.localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify(h));
    }, history);
    await page.reload();
    await ready('Title'); await sleep(600);
  };
  const out = {};

  // タイトル
  await fresh(null);
  await page.evaluate(() => {
    const s = window.game.scene.getScene('Title');
    if (s.previewTimer) s.previewTimer.remove(false);
    s.previewGraphics.clear().setVisible(false);
  });
  await sleep(300);
  out.title = await shot('title');

  // 本編
  const freezeGame = () => page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.tweens.killAll();
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
    s.elapsed = 0;
    s.timeText.setText('00:00');
  });
  await fresh(null);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
  await ready('Game'); await sleep(600);
  await freezeGame();
  await page.evaluate(() => { window.game.scene.pause('Game'); });
  await sleep(500);
  out.game = await shot('game');

  // クリア表示（本編を作り直して同じ状態にしてから）
  await fresh(null);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
  await ready('Game'); await sleep(600);
  await freezeGame();
  await page.evaluate(() => {
    const s = window.game.scene.getScene('Game');
    s.clearData = {
      ms: 83000, usedAuto: false, usedHint: false, no: 1, total: 65,
      best: 83000, bestUpdated: true, status: 'new',
    };
    s.showClear();
  });
  await ready('Clear'); await sleep(800);
  out.clear = await shot('clear');

  // 記録
  await fresh(HISTORY);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Records'); });
  await ready('Records');
  await page.waitForFunction(() => window.game.scene.getScene('Records').entries.length === 3, null, { timeout: 5000 });
  await sleep(800);
  out.records = await shot('records');

  // デモ
  await fresh(null);
  await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Demo'); });
  await ready('Demo');
  await page.evaluate(() => {
    const s = window.game.scene.getScene('Demo');
    s.tweens.killAll();   // ネオンの明滅を止め、にじみの alpha を 1 に固定
    s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
    window.game.scene.pause('Demo');
  });
  await page.waitForFunction(() => window.game.scene.getScene('Demo').solutions !== null, null, { timeout: 5000 });
  await sleep(800);
  out.demo = await shot('demo');
  out.demoState = await page.evaluate(() => {
    const s = window.game.scene.getScene('Demo');
    return { state: s.state, tried: s.tried, status: s.statusText.text };
  });
  return out;
}
