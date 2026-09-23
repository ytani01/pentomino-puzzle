// forcedPlacements() を 8×8 の全解（代表形 65 件）で確かめる（TODO-044）。
// node archives/agents/TODO-044/check-forced.mjs
import '../../../tools/window-shim.mjs';
import { HOLE, PIECES } from '../../../src/config.js';
import { boardKey, forcedPlacements, place, remove } from '../../../src/logic.js';
import { SOLUTIONS } from '../../../src/data/8x8.js';

const ALL = PIECES.map((piece) => piece.name);
const toBoard = (key) => ({ rows: 8, cols: 8, grid: Array.from(key, (ch) => (ch === '.' ? null : ch)) });
const touches = (board, a, b) => board.grid.some((value, i) => value === a && (
  (i % 8 > 0 && board.grid[i - 1] === b) || (i % 8 < 7 && board.grid[i + 1] === b)
  || board.grid[i - 8] === b || board.grid[i + 8] === b));

const count = { a: 0, aNg: 0, b: 0, bNg: 0, adj: 0, adjNg: 0, c: 0, cNg: 0 };
for (const key of SOLUTIONS) {
  const solved = toBoard(key);
  for (const name of ALL) {
    const board = remove(solved, name);
    // (a) 取り除いたピースだけを返し、置き直すと元の盤に戻る（残りは全 12 種を渡す）
    for (const names of [[name], ALL]) {
      const got = forcedPlacements(board, names);
      const ok = got.length === 1 && got[0].name === name
        && boardKey(place(board, name, got[0].cells, got[0].row, got[0].col)) === key;
      count.a += 1; if (!ok) count.aNg += 1;
    }
    // (c) 残りに無いピースの形の空きは返さない
    count.c += 1;
    if (forcedPlacements(board, ALL.filter((n) => n !== name)).length !== 0) count.cNg += 1;
  }
  // (b) 2 つ取り除く。隣り合わなければ 2 つ返し、隣り合えば（10 マスの空き 1 つ）返さない
  for (let i = 0; i < ALL.length; i += 1) {
    for (let j = i + 1; j < ALL.length; j += 1) {
      const board = remove(remove(solved, ALL[i]), ALL[j]);
      const got = forcedPlacements(board, ALL);
      if (touches(solved, ALL[i], ALL[j])) {
        count.adj += 1; if (got.length !== 0) count.adjNg += 1;
        continue;
      }
      let after = board;
      for (const p of got) after = place(after, p.name, p.cells, p.row, p.col);
      const ok = got.length === 2 && new Set(got.map((p) => p.name)).size === 2
        && got.every((p) => p.name === ALL[i] || p.name === ALL[j]) && boardKey(after) === key;
      count.b += 1; if (!ok) count.bNg += 1;
    }
  }
}
// 同じピースが 2 つの空きに当たるときは 1 つだけ返す（I を縦 2 本置いた空きを 2 か所作る）
const dup = { rows: 8, cols: 8, grid: new Array(64).fill(HOLE) };
for (const col of [0, 2]) for (let row = 0; row < 5; row += 1) dup.grid[row * 8 + col] = null;
const dupGot = forcedPlacements(dup, ALL);
console.log(JSON.stringify({ ...count, dup: dupGot.map((p) => `${p.name}@${p.row},${p.col}`) }));
