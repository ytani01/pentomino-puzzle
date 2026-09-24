// 文書に載せる画面のキャプチャを撮り直す（開発時のみ。TODO-056）。
//
// Playwright は依存に足さない（CLAUDE.md の「新しいライブラリを追加しない」）。
// Playwright MCP が npx で持ってくるものを、パスで渡して借りる。
//
//   python3 -m http.server 8765 &
//   PLAYWRIGHT=$(dirname "$(rg -l '"version": "1\.63\.0"' \
//     ~/.npm/_npx/*/node_modules/playwright/package.json | head -1)")/index.mjs \
//     node tools/capture.mjs
//
// 出力は docs/images/。番号付きの丸と吹き出しは、撮る直前に Canvas の上へ
// HTML で重ねる。画像を後から描き足すと、画面が変わるたびに座標を合わせ直す
// ことになるため。位置はシーンの部品（getBounds()）から取る。
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765/';
const OUT = new URL('../docs/images/', import.meta.url).pathname;
// 内部解像度（横画面）と同じ大きさで撮り、拡大縮小でぼけないようにする。
const VIEWPORT = { width: 960, height: 640 };
// HUD を指す吹き出しを置く場所が画面の中に無いので、上下に 40px ずつ帯を空ける
// （`Scale.FIT` が Canvas を縦の中央へ寄せる）。
const BANDED = { width: 960, height: 720 };
const BADGE = 's.children.list.find((c) => c.text === "解ける" || c.text === "解なし")';

const browser = await chromium.launch();

async function open(context, palette = 'glass') {
  const page = await context.newPage();
  await page.addInitScript((key) => {
    // 色の組は保存した値から読まれる（`loadPalette()`）ので、起動前に入れておく。
    window.localStorage.setItem('pentomino-puzzle/palette', key);
  }, palette);
  await page.goto(BASE);
  await page.waitForFunction(() => window.game?.scene.isActive('Title'));
  return page;
}

/** `scene.start()` の戻り値は循環していて返せないので、何も返さない。 */
async function go(page, key) {
  await page.evaluate((k) => { window.game.scene.getScene('Title').scene.start(k); }, key);
  await page.waitForFunction((k) => window.game.scene.isActive(k), key);
  await page.waitForTimeout(600);
}

/** おまかせで n 枚置く。滑り込む Tween を待ちながら 1 枚ずつ。 */
async function autoPlace(page, n) {
  for (let i = 0; i < n; i += 1) {
    await page.evaluate(() => { window.game.scene.getScene('Game').useAuto(); });
    await page.waitForTimeout(400);
  }
}

/**
 * 注記を重ねる。`at` はシーン `s` から部品（か部品の配列、か {x, y, width, height}）
 * を返す式。`text` があれば吹き出しを `side` の向きへ出し、無ければ丸だけを
 * 部品の枠の内側の左端に付ける（説明は文書の表に任せる）。`text` が無くても
 * `side` があれば、丸だけを部品の外へ出して線で指す（丸で隠れてしまう小さなボタン用）。
 */
async function annotate(page, sceneKey, notes) {
  await page.evaluate(({ sceneKey, notes }) => {
    const s = window.game.scene.getScene(sceneKey);
    const canvas = window.game.canvas.getBoundingClientRect();
    const k = canvas.width / window.game.config.width;
    const rectOf = (target) => {
      const list = (Array.isArray(target) ? target : [target])
        .map((t) => {
          // ボタン（Container）の getBounds() は中身の Graphics を測れず小さく出る。
          // setSize() した大きさのほうを使う。
          if (t.type === 'Container' && t.width) {
            return { x: t.x - t.width / 2, y: t.y - t.height / 2, width: t.width, height: t.height };
          }
          return t.getBounds ? t.getBounds() : t;
        });
      const x0 = Math.min(...list.map((r) => r.x));
      const y0 = Math.min(...list.map((r) => r.y));
      const x1 = Math.max(...list.map((r) => r.x + r.width));
      const y1 = Math.max(...list.map((r) => r.y + r.height));
      return {
        x: canvas.left + x0 * k, y: canvas.top + y0 * k,
        w: (x1 - x0) * k, h: (y1 - y0) * k,
      };
    };

    const layer = document.createElement('div');
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:10;'
      + 'font:bold 15px sans-serif;';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', innerWidth);
    svg.setAttribute('height', innerHeight);
    svg.style.cssText = 'position:absolute;inset:0;';
    layer.append(svg);
    document.body.append(layer);

    const ACCENT = '#ff5a36';
    const badge = (n) => `<span style="display:inline-flex;align-items:center;`
      + `justify-content:center;width:24px;height:24px;border-radius:50%;background:${ACCENT};`
      + `color:#fff;border:2px solid #fff;box-shadow:0 1px 4px #0008;flex:none">${n}</span>`;
    const line = (x1, y1, x2, y2) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      Object.entries({ x1, y1, x2, y2, stroke: ACCENT, 'stroke-width': 3 })
        .forEach(([a, v]) => el.setAttribute(a, v));
      svg.append(el);
    };
    const box = (r) => {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${r.x - 3}px;top:${r.y - 3}px;`
        + `width:${r.w + 6}px;height:${r.h + 6}px;border:3px solid ${ACCENT};border-radius:8px;`
        + 'box-sizing:border-box;';
      layer.append(el);
    };

    for (const note of notes) {
      const r = rectOf(new Function('s', `return (${note.at});`)(s));
      if (note.frame) box(r);
      if (!note.text && !note.side) {
        const el = document.createElement('div');
        // ボタンの枠の内側の左端に置く。角に載せると隣のボタンとの間に見え、
        // どちらの番号か紛れるため（TODO-057）。丸は枠線込みで 28px。
        el.style.cssText = `position:absolute;left:${r.x + 6}px;top:${r.y + r.h / 2 - 14}px;`;
        el.innerHTML = badge(note.n);
        layer.append(el);
        continue;
      }
      const dist = note.dist ?? 36;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const edge = {
        top: [cx, r.y], bottom: [cx, r.y + r.h], left: [r.x, cy], right: [r.x + r.w, cy],
      }[note.side];
      const dir = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[note.side];
      const ax = edge[0] + dir[0] * dist;
      const ay = edge[1] + dir[1] * dist;
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;display:flex;gap:6px;align-items:center;'
        + 'padding:4px 10px 4px 4px;background:#fff;color:#222;border-radius:16px;'
        + `border:2px solid ${ACCENT};box-shadow:0 2px 6px #0006;white-space:nowrap;`;
      // 文字の無い丸だけを外へ出すときは、枠を付けずに丸だけ置く（小さなボタン用）。
      if (note.text) el.innerHTML = `${badge(note.n)}<span>${note.text}</span>`;
      else { el.style.cssText = 'position:absolute;'; el.innerHTML = badge(note.n); }
      layer.append(el);
      // 吹き出しの中心を向きの先へ置き、はみ出す分だけ画面の内側へ戻す。
      const { width: bw, height: bh } = el.getBoundingClientRect();
      let left = ax - bw / 2 + dir[0] * bw / 2;
      let top = ay - bh / 2 + dir[1] * bh / 2;
      left = Math.max(4, Math.min(innerWidth - bw - 4, left));
      top = Math.max(4, Math.min(innerHeight - bh - 4, top));
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
      line(edge[0], edge[1], Math.max(left, Math.min(left + bw, ax)),
           Math.max(top, Math.min(top + bh, ay)));
    }
  }, { sceneKey, notes });
}

/** 「〜を置いた」の知らせを消す。消えるまで待つと経過時間が進みすぎる。 */
async function clearMessage(page, sceneKey) {
  await page.evaluate((k) => { window.game.scene.getScene(k).messageText.setText(''); }, sceneKey);
}

async function shot(page, name) {
  await page.screenshot({ path: join(OUT, name) });
  console.log(`docs/images/${name}`);
}

// ---- README: 遊んでいる途中の盤 ----------------------------------------
{
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await open(context, 'colorful');
  await go(page, 'Game');
  await autoPlace(page, 7);
  await clearMessage(page, 'Game');
  await shot(page, 'play.png');
  await context.close();
}

// ---- UsersGuide: タイトル ----------------------------------------------
{
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await open(context);
  await annotate(page, 'Title', [
    { n: 1, at: 's.boardButtons', text: '盤を選ぶ', side: 'left', frame: true, dist: 50 },
    { n: 2, at: 's.paletteButtons', text: '色の組を選ぶ', side: 'left', frame: true, dist: 50 },
    { n: 3, at: 's.children.list.find((c) => c.list?.[2]?.text === "はじめる")',
      text: 'はじめる', side: 'left' },
    { n: 4, at: 's.resumeButton', text: 'つづきから', side: 'right' },
    { n: 5, at: 's.children.list.find((c) => c.list?.[2]?.text === "記録")',
      text: '記録', side: 'left' },
    { n: 6, at: 's.children.list.find((c) => c.list?.[2]?.text === "デモ")',
      text: 'デモ', side: 'right' },
  ]);
  await shot(page, 'title.png');
  await context.close();
}

// ---- UsersGuide: 本編（ヒント表示を入にした途中） ------------------------
{
  const context = await browser.newContext({ viewport: BANDED });
  const page = await open(context);
  await go(page, 'Game');
  await autoPlace(page, 5);
  await page.evaluate(() => { window.game.scene.getScene('Game').toggleHint(); });
  await clearMessage(page, 'Game');
  const panel = (key) => `({ x: s.layout.${key}.x, y: s.layout.${key}.y,`
    + ` width: s.layout.${key}.width, height: s.layout.${key}.height })`;
  await annotate(page, 'Game', [
    { n: 'A', at: 's.timeText', text: '経過時間', side: 'top', dist: 14 },
    { n: 'B', at: 's.remainText', text: 'トレイの残り', side: 'top', dist: 14 },
    { n: 'C', at: BADGE, text: '解ける／解なし', side: 'right', dist: 16 },
    ...[1, 2, 3, 4, 5, 6].map((n) => ({ n, at: `s.buttons[${n - 1}]` })),
    { n: 'D', at: panel('boardPanel'), text: '盤', side: 'bottom', dist: 8 },
    { n: 'E', at: panel('trayPanel'), text: 'トレイ', side: 'bottom', dist: 8 },
    { n: 'F', at: 's.pieces.find((p) => p.location === "tray" && s.turnMarkKind(p) === "rotate").container',
      text: '次のタップで回る', side: 'right', dist: 40 },
  ]);
  await shot(page, 'game.png');
  await context.close();
}

// ---- UsersGuide: 記録の画面 --------------------------------------------
{
  // 下の段のボタンはアイコンだけで小さく、丸を載せると隠れる。下の帯へ出す。
  const context = await browser.newContext({ viewport: BANDED });
  const page = await open(context);
  await page.evaluate(async () => {
    const s = await import('/src/storage.js');
    const day = 24 * 60 * 60 * 1000;
    const now = Date.parse('2026-09-20T20:00:00+09:00');
    const entries = [
      { no: 12, ms: 412000 }, { no: 40, ms: 655000, h: true }, { no: 3, ms: 298000 },
      { no: 57, ms: 190000, a: true, h: true }, { no: 21, ms: 523000 },
    ];
    entries.reverse().forEach((e, i) => {
      s.recordClear('8x8', { at: now - (entries.length - i) * day, ...e });
      if (!e.a && !e.h) s.addFound('8x8', e.no, 65);
    });
  });
  await go(page, 'Records');
  await annotate(page, 'Records', [
    { n: 'A', at: 's.rowButtons.filter((b) => b.visible)', text: '一覧', side: 'bottom',
      frame: true, dist: 12 },
    // チェックボックスの左には余白が無いので、一番下のものを下から指す。
    { n: 'B', at: 's.rowChecks[4]', text: 'チェック', side: 'bottom', dist: 20 },
    { n: 'C', at: 's.selectAllButton', text: '全部選ぶ', side: 'top', dist: 16 },
    { n: 'D', at: 's.rowButtons[3].list[3]', text: '印', side: 'bottom', dist: 56 },
    // 完成形は Graphics で大きさを持たないので、下の見出しからの位置で指す。
    // ponytail: 数値は決め打ち。記録の画面の配置を変えたら撮った画像を見て合わせ直す。
    { n: 'E', at: '({ x: s.detailText.x - 140, y: s.detailText.y - 309, width: 280, height: 280 })',
      text: '完成形', side: 'top', dist: 12 },
    { n: 'F', at: 's.achieveText', text: '達成度', side: 'right', dist: 16 },
    { n: 'G', at: 's.continueButton', text: 'この回を続ける', side: 'left', dist: 16 },
    { n: 1, at: 's.prevButton', side: 'bottom', dist: 12 },
    { n: 2, at: 's.nextButton', side: 'bottom', dist: 12 },
    { n: 3, at: 's.trashButton', side: 'bottom', dist: 12 },
    { n: 4, at: 's.titleButton', side: 'bottom', dist: 12 },
  ]);
  await shot(page, 'records.png');
  await context.close();
}

// ---- UsersGuide: デモ（探している途中）-----------------------------------
{
  const context = await browser.newContext({ viewport: BANDED });
  const page = await open(context);
  await go(page, 'Demo');
  await page.evaluate(() => { window.game.scene.getScene('Demo').selectSpeed('fast'); });
  // 「解ける」の札が出ている瞬間で止める（解なしの手はすぐ外されるため）。
  await page.waitForTimeout(4000);
  await page.waitForFunction(() => {
    const s = window.game.scene.getScene('Demo');
    if (s.hintState !== 'ok') return false;
    s.scene.pause();
    return true;
  }, null, { polling: 'raf' });
  await annotate(page, 'Demo', [
    { n: 'A', at: 's.statusText', text: '試した手・見つけた解', side: 'top', dist: 14 },
    { n: 'B', at: BADGE, text: '解ける／解なし', side: 'top', dist: 14 },
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({ n, at: `s.buttons[${n - 1}]` })),
  ]);
  await shot(page, 'demo.png');
  await context.close();
}

// ---- README: デモの GIF ------------------------------------------------
{
  const dir = mkdtempSync(join(tmpdir(), 'capture-'));
  const context = await browser.newContext({
    viewport: VIEWPORT, recordVideo: { dir, size: VIEWPORT },
  });
  const page = await open(context, 'colorful');
  await go(page, 'Demo');
  await page.waitForTimeout(12000);
  await context.close();
  const video = join(dir, readdirSync(dir).find((f) => f.endsWith('.webm')));
  // 読み込みと画面の切り替えの分（最初の 2 秒）を落とす。
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-ss', '2', '-t', '10', '-i', video,
    '-vf', 'fps=10,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];'
      + '[b][p]paletteuse=dither=bayer',
    join(OUT, 'demo.gif'),
  ]);
  rmSync(dir, { recursive: true });
  console.log('docs/images/demo.gif');
}

await browser.close();
