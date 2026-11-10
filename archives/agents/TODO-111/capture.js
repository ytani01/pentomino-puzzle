// TODO-111: ピースの縁の描画を 1 つにまとめる前後の撮り比べ。
// `browser_run_code_unsafe` の `filename` にこのファイルを渡す（前後で同じものを使う）。
// 前: OUT を .../before、後: .../after に変えるだけ。前提: http://localhost:8765/ でサーバが立っている。
// 1280x720 の横だけ。時間で変わるもの（HUD、タイトルの動くボード）は clip で外し、
// ネオンの明滅は tween を止めて glow の alpha を 1 に固定する。
async (page) => {
  const OUT = '/home/ytani/tmp/playwright-mcp/todo111/before';
  const KEYS = ['colorful', 'glass', 'neon']; // PALETTES のキー（ラベルは 12 色・ガラス・ネオン）。画像名は game-<キー>.png
  const log = [];
  await page.setViewportSize({ width: 1280, height: 720 });
  const sleep = (ms) => page.waitForTimeout(ms);
  const ready = async (scene) => {
    await page.waitForFunction((s) => {
      const g = window.game && window.game.scene.getScene(s);
      return g && g.sys.isActive();
    }, scene, { timeout: 5000 });
    await sleep(600);
  };
  // ゲーム内部座標の矩形 → ページ座標の clip
  const toClip = (rects, pad = 4) => page.evaluate(({ rects, pad }) => {
    const r = window.game.canvas.getBoundingClientRect();
    const k = r.width / window.game.scale.width;
    const x0 = Math.min(...rects.map((q) => q.x)), y0 = Math.min(...rects.map((q) => q.y));
    const x1 = Math.max(...rects.map((q) => q.x + q.width)), y1 = Math.max(...rects.map((q) => q.y + q.height));
    return {
      x: Math.floor(r.left + x0 * k - pad), y: Math.floor(r.top + y0 * k - pad),
      width: Math.ceil((x1 - x0) * k + pad * 2), height: Math.ceil((y1 - y0) * k + pad * 2),
    };
  }, { rects, pad });

  // 本編（8×8）。色の組ごとに localStorage を書いて読み込み直す。
  for (const key of KEYS) {
    await page.goto('http://localhost:8765/');
    await page.evaluate((k) => {
      window.localStorage.clear();
      window.localStorage.setItem('pentomino-puzzle/palette', k);
    }, key);
    await page.reload();
    await ready('Title');
    await page.evaluate(() => { window.game.scene.getScene('Title').scene.start('Game'); });
    await ready('Game');
    const clip = await page.evaluate(() => {
      const s = window.game.scene.getScene('Game');
      s.tweens.killAll();                       // ネオンの明滅を止める
      s.pieces.forEach((p) => { if (p.glow) p.glow.setAlpha(1); });
      return { b: s.layout.boardPanel, t: s.layout.trayPanel, palette: s.palette.key, board: s.boardKey };
    });
    await sleep(300);
    const c = await toClip([clip.b, clip.t]);
    await page.screenshot({ path: `${OUT}/game-${key}.png`, clip: c });
    log.push({ file: `game-${key}.png`, palette: clip.palette, board: clip.board, clip: c });
  }

  // タイトルの色の選択肢（3 つのアイコン）。ネオン（既定）のまま。
  await page.goto('http://localhost:8765/');
  await page.evaluate(() => { window.localStorage.clear(); });
  await page.reload();
  await ready('Title');
  const rects = await page.evaluate(() => {
    const s = window.game.scene.getScene('Title');
    return s.paletteButtons.map((b) => { const q = b.getBounds(); return { x: q.x, y: q.y, width: q.width, height: q.height }; });
  });
  const c = await toClip(rects, 90);
  await page.screenshot({ path: `${OUT}/title-palette.png`, clip: c });
  log.push({ file: 'title-palette.png', clip: c });
  return log;
}
