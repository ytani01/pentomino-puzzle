// TODO-077 の測定。今のランダム探索の 1 手あたりの時間と、hasUncoverableCell 1 回の時間。
//   node archives/agents/TODO-077/bench.mjs
import '../../../tools/window-shim.mjs';
import { BOARDS } from '../../../src/config.js';
import { solveStepsRandom, hasUncoverableCell, placedNames } from '../../../src/logic.js';
import { buildSolutions, hasSolution } from '../../../src/solutions.js';

const seeded = (seed) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const PIECE_NAMES = 'FILNPTUVWXYZ'.split('');

for (const key of ['8x8', '6x10']) {
  const spec = BOARDS[key];
  const { SOLUTIONS } = await import(`../../../src/data/${key}.js`);
  const solutions = buildSolutions(spec, SOLUTIONS);
  const rows = [];
  for (let s = 1; s <= 5; s += 1) {
    const boards = [];
    const it = solveStepsRandom(spec, seeded(s), (board) => {
      boards.push({ rows: board.rows, cols: board.cols, grid: board.grid.slice() });
      return hasSolution(solutions, board);
    });
    const t0 = performance.now();
    let steps = 0;
    for (const step of it) { steps += 1; if (step.type === 'solved' || steps > 200000) break; }
    const ms = performance.now() - t0;
    const sample = boards.filter((_, i) => i % Math.max(1, Math.floor(boards.length / 300)) === 0);
    const t1 = performance.now();
    let hits = 0;
    for (const b of sample) {
      const unused = PIECE_NAMES.filter((n) => !placedNames(b).includes(n));
      if (hasUncoverableCell(b, unused)) hits += 1;
    }
    const perCall = (performance.now() - t1) / sample.length;
    rows.push({ seed: s, steps, perStepMs: +(ms / steps).toFixed(3), uncovMs: +perCall.toFixed(3), hitRate: +(hits / sample.length).toFixed(2) });
  }
  console.log(key); console.table(rows);
}
