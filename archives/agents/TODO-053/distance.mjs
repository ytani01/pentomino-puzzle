// トレイの各スロットの中心から盤（枠の内側）までの距離を、4 通りの配置で出す。
// 直す前（tray.cols / rows の等分）と後（tray.slots）の両方で動く。
// 使い方: node archives/agents/TODO-053/distance.mjs
import '../../../tools/window-shim.mjs';
const { makeLayout, BOARDS } = await import('../../../src/config.js');

function centers(tray) {
  if (tray.slots) return tray.slots.map((s) => [s.x, s.y]);
  const w = tray.width / tray.cols;
  const h = tray.height / tray.rows;
  return Array.from({ length: 12 }, (_, i) => [
    tray.x + (i % tray.cols) * w + w / 2, tray.y + Math.floor(i / tray.cols) * h + h / 2]);
}

for (const portrait of [false, true]) {
  for (const spec of Object.values(BOARDS)) {
    const { board, tray } = makeLayout({ portrait, board: spec });
    const x1 = board.x + spec.cols * board.cell;
    const y1 = board.y + spec.rows * board.cell;
    const d = centers(tray).map(([x, y]) => Math.hypot(
      Math.max(board.x - x, 0, x - x1), Math.max(board.y - y, 0, y - y1)));
    const mean = d.reduce((a, b) => a + b, 0) / d.length;
    console.log(`${portrait ? '縦' : '横'} ${spec.key.padEnd(4)} 盤のマス ${board.cell}  トレイのマス ${tray.cell}`
      + `  距離 平均 ${mean.toFixed(0)} 最大 ${Math.max(...d).toFixed(0)}`);
  }
}
