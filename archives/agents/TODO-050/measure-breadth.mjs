// 幅優先の generator を最初の solved まで回し、試した手（replay 以外の place）を数える。
// 使い方: node archives/agents/TODO-050/measure-breadth.mjs [8x8|6x10] [hasSolution|regions] [seed]
import '../../../tools/window-shim.mjs';
import { BOARDS, PIECES } from '../../../src/config.js';
import { solveStepsBreadth, regionsFitPieces, isSolved, createBoard, place as placeOn } from '../../../src/logic.js';
import { buildSolutions, hasSolution } from '../../../src/solutions.js';

const [key = '8x8', mode = 'hasSolution', seedArg = '1'] = process.argv.slice(2);
const spec = BOARDS[key];
let seed = Number(seedArg);
const random = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
let canContinue = regionsFitPieces;
if (mode === 'hasSolution') {
  const mod = await import(`../../../src/data/${key}.js`);
  const solutions = buildSolutions(spec, mod.default ?? Object.values(mod)[0]);
  canContinue = (board) => hasSolution(solutions, board);
}
const onBoard = new Map();
let tried = 0; let replays = 0; let removes = 0;
const t0 = Date.now();
for (const step of solveStepsBreadth(spec, random, canContinue)) {
  if (step.type === 'place') {
    if (step.replay) replays += 1; else tried += 1;
    if (onBoard.has(step.name)) throw new Error(`二重に置いた ${step.name}`);
    onBoard.set(step.name, step);
  } else if (step.type === 'remove') {
    if (!onBoard.delete(step.name)) throw new Error(`無いものを外した ${step.name}`);
    removes += 1;
  } else {
    let board = createBoard(spec);
    for (const s of onBoard.values()) board = placeOn(board, s.name, s.cells, s.row, s.col);
    const names = [...onBoard.keys()].sort().join('');
    const all = PIECES.map((p) => p.name).sort().join('');
    console.log(JSON.stringify({ key, mode, seed: seedArg, tried, replays, removes,
      solved: isSolved(board), pieces12: names === all, ms: Date.now() - t0 }));
    break;
  }
}
