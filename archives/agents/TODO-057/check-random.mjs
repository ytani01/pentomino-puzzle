// solveStepsRandom の手を自前の盤へ当てて検査する（TODO-057）。
//   bad     … 盤の外・穴・他のピースの上への place、盤に無いピースの remove
//   repeats … 前に同じ盤面で「解なし」だった置き方、または同じ盤面から戻るときに外した手を、
//             その盤面でもう一度置いた回数（盤面は grid の中身で見分ける）
//   backs   … 行き詰まって戻った回数（直前の解なしの手を外す remove 以外の remove）
// node archives/agents/TODO-057/check-random.mjs        … 2 盤 × 2 判定 × 2 シードを 2000 手、常に偽を 2000 手
// node archives/agents/TODO-057/check-random.mjs long   … 既定の判定・シード 1 を 2 盤で 5 万手、hasSolution を 8x8 で
import '../../../tools/window-shim.mjs';
import { BOARDS } from '../../../src/config.js';
import { createBoard, solveStepsRandom } from '../../../src/logic.js';
import { buildSolutions, hasSolution } from '../../../src/solutions.js';

function mulberry32(a) {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function run(spec, seed, canContinue, limit) {
  const board = createBoard(spec);
  const keyOf = () => board.grid.map((v) => (v === null ? '.' : v)).join('');
  const memo = new Map(); // 盤面 → 置いてはいけない置き方
  const memoOf = (k) => { if (!memo.has(k)) memo.set(k, new Set()); return memo.get(k); };
  const on = new Map();
  const log = [];
  const r = { bad: 0, dead: 0, removes: 0, solved: 0, repeats: 0, backs: 0 };
  let prev = null;
  const it = solveStepsRandom(spec, mulberry32(seed), canContinue);
  const t0 = Date.now();
  for (let i = 0; i < limit; i += 1) {
    const { value, done } = it.next();
    if (done) { log.push('done'); break; }
    if (value.type === 'place') {
      const sig = `${value.name}:${JSON.stringify(value.cells)}:${value.row}:${value.col}`;
      const before = memoOf(keyOf());
      if (before.has(sig)) r.repeats += 1;
      if (!value.ok) { r.dead += 1; before.add(sig); }
      for (const [dr, dc] of value.cells) {
        const y = value.row + dr; const x = value.col + dc;
        if (y < 0 || x < 0 || y >= spec.rows || x >= spec.cols || board.grid[y * spec.cols + x] !== null) r.bad += 1;
        else board.grid[y * spec.cols + x] = value.name;
      }
      on.set(value.name, { ...value, sig });
      log.push(`p${sig}${value.ok ? '+' : '-'}`);
    } else if (value.type === 'remove') {
      const m = on.get(value.name);
      if (!m) { r.bad += 1; continue; }
      for (const [dr, dc] of m.cells) board.grid[(m.row + dr) * spec.cols + (m.col + dc)] = null;
      on.delete(value.name); r.removes += 1;
      if (!(prev && prev.type === 'place' && !prev.ok && prev.name === value.name)) {
        r.backs += 1; memoOf(keyOf()).add(m.sig);
      }
      log.push(`r${value.name}`);
    } else { r.solved += 1; log.push('solved'); }
    prev = value;
  }
  return { ...r, steps: log.length, onBoard: on.size, ms: Date.now() - t0, log: log.join(' ') };
}
const show = (label, { log, ...rest }) => console.log(label, JSON.stringify(rest));
const exactOf = async (spec) => {
  const { SOLUTIONS } = await import(`../../../src/data/${spec.key}.js`);
  const sols = buildSolutions(spec, SOLUTIONS);
  return (b) => hasSolution(sols, b);
};

if (process.argv[2] === 'long') {
  for (const spec of Object.values(BOARDS)) show(`${spec.key} regionsFitPieces seed=1 50000`, run(spec, 1, undefined, 50000));
  show('8x8 hasSolution seed=1 50000', run(BOARDS['8x8'], 1, await exactOf(BOARDS['8x8']), 50000));
  process.exit(0);
}
for (const spec of Object.values(BOARDS)) {
  const exact = await exactOf(spec);
  for (const [label, cc] of [['regionsFitPieces', undefined], ['hasSolution', exact], ['alwaysFalse', () => false]]) {
    const runs = [1, 2].map((seed) => [run(spec, seed, cc, 2000), run(spec, seed, cc, 2000)]);
    runs.forEach(([a, b], i) => show(`${spec.key} ${label} seed=${i + 1} sameSeedSame=${a.log === b.log}`, a));
    console.log(spec.key, label, 'seed1!=seed2', runs[0][0].log !== runs[1][0].log);
  }
}
