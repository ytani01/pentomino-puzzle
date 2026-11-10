/**
 * TODO-117: solveStepsRandom() の手順が変更前後で一致するかを確かめる。
 *
 *   node archives/agents/TODO-117/record-random-steps.mjs > before.txt
 *   （変更後）同じコマンドで after.txt を作り、diff する
 *
 * 8x8・6x10 で各 3 種、既定の判定と全解のデータの判定の 2 通り、各 600 手。
 * 1 行 1 組で、手順を JSON にしたものの sha256 と手数・最後の手を出す。
 */
import crypto from 'node:crypto';
import { BOARDS } from '../../../src/config.js';
import { solveStepsRandom } from '../../../src/search.js';
import { buildSolutions, hasSolution } from '../../../src/solutions.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LIMIT = 600;
for (const spec of Object.values(BOARDS)) {
  const { SOLUTIONS } = await import(`../../../src/data/${spec.key}.js`);
  const solutions = buildSolutions(spec, SOLUTIONS);
  const judges = {
    default: undefined,
    solutions: (board) => hasSolution(solutions, board),
  };
  for (const [judgeName, judge] of Object.entries(judges)) {
    for (const seed of [1, 14, 164]) {
      let calls = 0;
      const base = mulberry32(seed);
      const random = () => { calls += 1; return base(); };
      const steps = [];
      for (const step of solveStepsRandom(spec, random, judge)) {
        steps.push(step);
        if (step.type === 'solved' || steps.length >= LIMIT) break;
      }
      const text = JSON.stringify(steps);
      const hash = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
      console.log(`${spec.key} ${judgeName} seed=${seed} steps=${steps.length} randomCalls=${calls} sha=${hash} last=${JSON.stringify(steps.at(-1))}`);
    }
  }
}
