// ボタンの色を、状態の全組み合わせ（有効・hover・pressed・selected の 16 通り）で読み出して JSON にする。
// 使い方: PLAYWRIGHT=<playwright の index.mjs> node button-colors.mjs > out.json
// 変更の前後で出力を diff し、一致を見る（TODO-121）。
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const BASE = process.env.BASE ?? 'http://localhost:8765/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(BASE);
await page.waitForFunction(() => window.game?.scene.isActive('Title'));
const result = await page.evaluate(async () => {
  const { createButton } = await import('/src/ui.js');
  const { ICONS } = await import('/src/icons.js');
  const scene = window.game.scene.getScene('Title');
  const iconName = Object.keys(ICONS)[0];
  const button = createButton(scene, {
    x: 100, y: 100, width: 200, height: 60, label: 'ラベル', mark: '印', caption: '名前',
    icon: ICONS[iconName], onClick: () => {},
  });
  const [face, icon, text, mark, caption] = button.list;
  const out = {};
  for (let m = 0; m < 16; m += 1) {
    button.enabled = !!(m & 1);
    button.hovered = !!(m & 2);
    button.pressed = !!(m & 4);
    button.selected = !!(m & 8);
    button.setEnabled(button.enabled); // redraw を呼ぶ
    out[`en${m & 1}-hov${(m >> 1) & 1}-prs${(m >> 2) & 1}-sel${(m >> 3) & 1}`] = {
      face: Array.from(face.commandBuffer),
      icon: Array.from(icon.commandBuffer),
      text: text.style.color,
      mark: mark.style.color,
      caption: caption.style.color,
    };
  }
  button.destroy();
  return out;
});
console.log(JSON.stringify(result, null, 1));
if (errors.length) console.error('console errors:', errors);
await browser.close();
