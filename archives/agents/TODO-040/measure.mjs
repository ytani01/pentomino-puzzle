import './window-shim.mjs';
import { PIECES, PIECE_SIZE, BOARDS } from '/home/ytani/work/pentomino-puzzle/src/config.js';
import { canonicalCellsKey, createBoard, orientations } from '/home/ytani/work/pentomino-puzzle/src/logic.js';

// mulberry32 PRNG
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

/**
 * placesTotal: 置いた回数（regionsFit で捨てたものを含む）
 * placesKept: regionsFit を通過して search() を再帰した回数（含まない側の対応値として、
 *   「置く」のうち有効だったものの累計。含まない版は regionsFit で切ってから探索を続けたものだけを数える）
 * removes: 外した回数
 * firstSolutionPlaces / secondSolutionPlaces: 各時点での累計（total 版 / kept 版）
 */
function runOnce(spec, seed) {
  const board = createBoard(spec);
  const { rows, cols } = board;
  const grid = board.grid.slice();

  const rng = seed === null ? null : mulberry32(seed);

  const shapesMap = new Map(PIECES.map((piece) => [piece.name, orientations(piece.cells).map((s) => s)]));
  const unused = PIECES.map((piece) => piece.name);
  if (rng) {
    shuffle(unused, rng);
    for (const name of shapesMap.keys()) shuffle(shapesMap.get(name), rng);
  }

  let placesTotal = 0; // fits が通って grid に書いた回数(regionsFit 落選含む)
  let placesKept = 0;  // そのうち regionsFit を通過したもの
  let removes = 0;
  let solutionsFound = 0;
  let firstSolutionPlacesTotal = null;
  let firstSolutionPlacesKept = null;
  let secondSolutionPlacesTotal = null;
  let secondSolutionPlacesKept = null;
  let stop = false;

  function firstEmpty() {
    for (let index = 0; index < grid.length; index += 1) {
      if (grid[index] === null) return index;
    }
    return -1;
  }

  function search() {
    if (stop) return;
    const target = firstEmpty();
    if (target < 0) {
      solutionsFound += 1;
      if (solutionsFound === 1) {
        firstSolutionPlacesTotal = placesTotal;
        firstSolutionPlacesKept = placesKept;
      } else if (solutionsFound === 2) {
        secondSolutionPlacesTotal = placesTotal;
        secondSolutionPlacesKept = placesKept;
        stop = true;
      }
      return;
    }
    const targetRow = Math.floor(target / cols);
    const targetCol = target % cols;

    for (let pick = 0; pick < unused.length; pick += 1) {
      if (stop) return;
      const name = unused[pick];
      for (const shape of shapesMap.get(name)) {
        if (stop) return;
        const row = targetRow - shape[0][0];
        const col = targetCol - shape[0][1];
        if (!fits(grid, rows, cols, shape, row, col)) continue;

        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = name;
        unused.splice(pick, 1);
        placesTotal += 1;

        if (regionsFit(grid, rows, cols)) {
          placesKept += 1;
          search();
        }

        unused.splice(pick, 0, name);
        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = null;
        if (!stop) removes += 1;
      }
    }
  }

  search();
  return { placesTotal, placesKept, removes, firstSolutionPlacesTotal, firstSolutionPlacesKept, secondSolutionPlacesTotal, secondSolutionPlacesKept };
}

function fits(grid, rows, cols, shape, row, col) {
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (grid[r * cols + c] !== null) return false;
  }
  return true;
}

function regionsFit(grid, rows, cols) {
  const seen = new Uint8Array(grid.length);
  const stack = [];
  for (let start = 0; start < grid.length; start += 1) {
    if (grid[start] !== null || seen[start]) continue;
    let size = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const index = stack.pop();
      size += 1;
      const row = Math.floor(index / cols);
      const col = index % cols;
      if (col > 0 && grid[index - 1] === null && !seen[index - 1]) { seen[index - 1] = 1; stack.push(index - 1); }
      if (col < cols - 1 && grid[index + 1] === null && !seen[index + 1]) { seen[index + 1] = 1; stack.push(index + 1); }
      if (row > 0 && grid[index - cols] === null && !seen[index - cols]) { seen[index - cols] = 1; stack.push(index - cols); }
      if (row < rows - 1 && grid[index + cols] === null && !seen[index + cols]) { seen[index + cols] = 1; stack.push(index + cols); }
    }
    if (size % PIECE_SIZE !== 0) return false;
  }
  return true;
}

function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  const pct = (p) => s[Math.min(n - 1, Math.floor(p * n))];
  return { min: s[0], median: pct(0.5), p90: pct(0.9), max: s[n - 1] };
}

async function main() {
  const boardKeys = ['8x8', '6x10'];
  const results = {};

  for (const key of boardKeys) {
    const spec = BOARDS[key];
    const first_total = [];
    const first_kept = [];
    const second_total = [];
    const second_kept = [];

    for (let seed = 1; seed <= 200; seed += 1) {
      const r = runOnce(spec, seed);
      first_total.push(r.firstSolutionPlacesTotal);
      first_kept.push(r.firstSolutionPlacesKept);
      if (r.secondSolutionPlacesTotal !== null) {
        second_total.push(r.secondSolutionPlacesTotal - r.firstSolutionPlacesTotal);
        second_kept.push(r.secondSolutionPlacesKept - r.firstSolutionPlacesKept);
      }
    }

    // 入れ替えなし(定義順)
    const noshuffle = runOnce(spec, null);

    // 1万手(置く)にかかる時間: 定義順・シード無しで、placesTotal が 10000 を超えるまで search を打ち切らず走らせる
    const board = createBoard(spec);
    const { rows, cols } = board;
    const grid = board.grid.slice();
    const shapesMap = new Map(PIECES.map((piece) => [piece.name, orientations(piece.cells)]));
    const unused = PIECES.map((piece) => piece.name);
    let placesTotal = 0;
    let stop = false;
    function firstEmpty() {
      for (let index = 0; index < grid.length; index += 1) if (grid[index] === null) return index;
      return -1;
    }
    function search() {
      if (stop) return;
      const target = firstEmpty();
      if (target < 0) return;
      const targetRow = Math.floor(target / cols);
      const targetCol = target % cols;
      for (let pick = 0; pick < unused.length; pick += 1) {
        if (stop) return;
        const name = unused[pick];
        for (const shape of shapesMap.get(name)) {
          if (stop) return;
          const row = targetRow - shape[0][0];
          const col = targetCol - shape[0][1];
          if (!fits(grid, rows, cols, shape, row, col)) continue;
          for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = name;
          unused.splice(pick, 1);
          placesTotal += 1;
          if (placesTotal >= 10000) { stop = true; }
          if (!stop && regionsFit(grid, rows, cols)) search();
          unused.splice(pick, 0, name);
          for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = null;
        }
      }
    }
    const t0 = process.hrtime.bigint();
    search();
    const t1 = process.hrtime.bigint();
    const timeMs10000 = Number(t1 - t0) / 1e6;

    results[key] = {
      first_total: stats(first_total),
      first_kept: stats(first_kept),
      second_total: stats(second_total),
      second_kept: stats(second_kept),
      second_n: second_total.length,
      noshuffle_first_total: noshuffle.firstSolutionPlacesTotal,
      noshuffle_first_kept: noshuffle.firstSolutionPlacesKept,
      timeMs10000,
      placesReached: placesTotal,
    };
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
