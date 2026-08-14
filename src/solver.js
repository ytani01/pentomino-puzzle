/**
 * ヒント用の求解。`logic.js` と同じく Phaser にも DOM にも依存しない純関数。
 *
 * Dancing Links は持ち込まず、深さ優先に次の 2 つの枝刈りを足しただけで足りる。
 *   - 空きマスのうち一番若い位置を必ず埋める（同じ配置を順番違いで何度も試さない）
 *   - 空き領域を連結成分に分け、5 で割り切れない塊があればその枝を捨てる
 *
 * 探索は「1 解見つけたら止める」。全解を数える用途は持たない。
 */

import { PIECES, PIECE_SIZE, SOLVER_LIMIT } from './config.js';
import { orientations } from './logic.js';

/** 名前からピースの形を引く。`PIECES` の並びに依存しないようにするため。 */
function cellsOf(name) {
  const piece = PIECES.find((entry) => entry.name === name);
  if (!piece) throw new Error(`unknown piece: ${name}`);
  return piece.cells;
}

/**
 * 未使用のピースを盤の空きマスへ全部置く並べ方を 1 つ探す。
 *
 * 戻り値は `{ ok, placements, tries, reason }`。
 * `reason` は解が無ければ `'unsolvable'`、試行回数の上限で打ち切ったら `'limit'`。
 * 上限で打ち切ったときは「解が無い」とは言い切れないので、呼ぶ側で区別する。
 *
 * @param {object} board `logic.js` の盤面
 * @param {string[]} names 未使用のピース名
 * @param {{limit?: number}} [options] 試行回数の上限（既定は `SOLVER_LIMIT`）
 */
export function solve(board, names, options = {}) {
  const limit = options.limit === undefined ? SOLVER_LIMIT : options.limit;
  const { rows, cols } = board;
  const grid = board.grid.slice();

  let empty = 0;
  for (const value of grid) if (value === null) empty += 1;
  if (empty !== names.length * PIECE_SIZE) {
    return { ok: false, placements: [], tries: 0, reason: 'unsolvable' };
  }
  if (empty === 0) return { ok: true, placements: [], tries: 0, reason: null };

  // 向きは名前ごとに一度だけ作る。内側のループで作り直すと桁違いに遅くなる。
  const shapes = new Map(names.map((name) => [name, orientations(cellsOf(name))]));
  const unused = names.slice();
  const placements = [];
  let tries = 0;
  let stopped = false;

  function firstEmpty() {
    for (let index = 0; index < grid.length; index += 1) {
      if (grid[index] === null) return index;
    }
    return -1;
  }

  function search() {
    const target = firstEmpty();
    if (target < 0) return true;
    const targetRow = Math.floor(target / cols);
    const targetCol = target % cols;

    for (let pick = 0; pick < unused.length; pick += 1) {
      const name = unused[pick];
      for (const shape of shapes.get(name)) {
        // 正規形は行優先に並んでいるので、目標のマスを覆えるのは先頭のセルだけ。
        // （それより前のセルがあれば、目標より若い空きマスが残っていることになる）
        const row = targetRow - shape[0][0];
        const col = targetCol - shape[0][1];
        if (!fits(grid, rows, cols, shape, row, col)) continue;

        tries += 1;
        if (tries > limit) {
          stopped = true;
          return false;
        }

        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = name;
        unused.splice(pick, 1);
        placements.push({ name, cells: shape, row, col });

        if (regionsFit(grid, rows, cols) && search()) return true;

        placements.pop();
        unused.splice(pick, 0, name);
        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = null;

        if (stopped) return false;
      }
    }
    return false;
  }

  const ok = search();
  if (ok) return { ok: true, placements: placements.slice(), tries, reason: null };
  return { ok: false, placements: [], tries, reason: stopped ? 'limit' : 'unsolvable' };
}

/** 盤の範囲に収まり、どのマスも空いているか。求解の内側のループなので添字で回す。 */
function fits(grid, rows, cols, shape, row, col) {
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (grid[r * cols + c] !== null) return false;
  }
  return true;
}

/**
 * 空き領域がすべて 5 の倍数か。`logic.js` にも同じ判定があるが、
 * こちらは盤面オブジェクトを作らずに生の配列を直接なめる（探索の内側で毎回呼ぶため）。
 */
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
      if (col > 0 && grid[index - 1] === null && !seen[index - 1]) {
        seen[index - 1] = 1;
        stack.push(index - 1);
      }
      if (col < cols - 1 && grid[index + 1] === null && !seen[index + 1]) {
        seen[index + 1] = 1;
        stack.push(index + 1);
      }
      if (row > 0 && grid[index - cols] === null && !seen[index - cols]) {
        seen[index - cols] = 1;
        stack.push(index - cols);
      }
      if (row < rows - 1 && grid[index + cols] === null && !seen[index + cols]) {
        seen[index + cols] = 1;
        stack.push(index + cols);
      }
    }
    if (size % PIECE_SIZE !== 0) return false;
  }
  return true;
}

/**
 * ヒント 1 手ぶん。解ける置き方を求め、その最初の 1 ピースだけを返す。
 * 「どこを外せば解けるか」までは示さない（詰みは詰みと伝えるだけにする）。
 */
export function hintPlacement(board, names, options = {}) {
  const result = solve(board, names, options);
  if (!result.ok) return { ok: false, placement: null, reason: result.reason };
  return { ok: true, placement: result.placements[0] || null, reason: null };
}
