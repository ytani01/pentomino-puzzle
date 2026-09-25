// hasUncoverableCell が、解ける盤面（hasSolution が真）で真を返さないか。
import '../../../tools/window-shim.mjs';
import { BOARDS } from '../../../src/config.js';
import { solveStepsRandom, hasUncoverableCell, placedNames } from '../../../src/logic.js';
import { buildSolutions, hasSolution } from '../../../src/solutions.js';
const seeded = (seed) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const NAMES = 'FILNPTUVWXYZ'.split('');
for (const key of ['8x8', '6x10']) {
  const spec = BOARDS[key];
  const { SOLUTIONS } = await import(`../../../src/data/${key}.js`);
  const sol = buildSolutions(spec, SOLUTIONS);
  let solvable = 0, bad = 0, dead = 0, caught = 0;
  for (let s = 1; s <= 5; s += 1) {
    const it = solveStepsRandom(spec, seeded(s), (board) => {
      const b = { rows: board.rows, cols: board.cols, grid: board.grid.slice() };
      const ok = hasSolution(sol, b);
      const unc = hasUncoverableCell(b, NAMES.filter((n) => !placedNames(b).includes(n)));
      if (ok) { solvable += 1; if (unc) bad += 1; } else { dead += 1; if (unc) caught += 1; }
      return ok;
    });
    for (const step of it) if (step.type === 'solved') break;
  }
  console.log(key, { solvable, falsePositive: bad, dead, caughtByUncoverable: caught });
}
