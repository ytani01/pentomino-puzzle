/**
 * 盤の全解を数え上げる（TODO-022）。**開発時にだけ動かすもの**で、
 * 遊ぶ側（`src/`）からは読まない。`tools/gen-solutions.mjs` が使う。
 *
 * 元は `src/solver.js`（ヒント用の求解）で、深さ優先に次の 2 つの枝刈りを
 * 足しただけの素朴な作り。ここへ移すにあたって「1 解見つけたら止める」のを
 * やめ、全部拾うようにしただけで、探索そのものは同じ。
 *
 *   - 空きマスのうち一番若い位置を必ず埋める（同じ配置を順番違いで何度も試さない）
 *   - 空き領域を連結成分に分け、5 で割り切れない塊があればその枝を捨てる
 *
 * **速くする工夫はしない。** 作るのは 1 回だけなので、6×10 に 2 分半かかっても
 * 構わない（Dancing Links を持ち込む、探索順を練る、といったことをしない）。
 * 試行回数の上限も持たない——最後まで数え上げるのが仕事なので、打ち切る意味が無い。
 */

import './window-shim.mjs';
import { PIECES, PIECE_SIZE } from '../src/config.js';
import { canonicalCellsKey, createBoard, orientations } from '../src/logic.js';

/**
 * その盤の解を全部返す（`logic.js` の `boardKey()` と同じ文字列の配列）。
 * 回転・反転で重なるものもそれぞれ 1 件として含む。
 */
export function enumerateSolutions(spec) {
  const board = createBoard(spec);
  const { rows, cols } = board;
  const grid = board.grid.slice();

  // 向きは名前ごとに一度だけ作る。内側のループで作り直すと桁違いに遅くなる。
  const shapes = new Map(PIECES.map((piece) => [piece.name, orientations(piece.cells)]));
  const unused = PIECES.map((piece) => piece.name);
  const found = [];

  function firstEmpty() {
    for (let index = 0; index < grid.length; index += 1) {
      if (grid[index] === null) return index;
    }
    return -1;
  }

  function search() {
    const target = firstEmpty();
    if (target < 0) {
      found.push(grid.join(''));
      return;
    }
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

        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = name;
        unused.splice(pick, 1);

        if (regionsFit(grid, rows, cols)) search();

        unused.splice(pick, 0, name);
        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = null;
      }
    }
  }

  search();
  return found;
}

/**
 * 代表形だけを、**文字列の昇順**に並べて返す。
 *
 * 昇順に固定するのは、この並びの順番（1 から数える）がそのまま解の番号になり、
 * 記録の保存に使うため。代表形は `canonicalBoard()` で一意に決まるので、
 * 作り直しても同じ並び＝同じ番号になる。
 */
export function canonicalSolutions(spec) {
  const all = enumerateSolutions(spec);
  const seen = new Set();
  for (const cells of all) seen.add(canonicalCellsKey(cells, spec));
  return { all: all.length, canonical: [...seen].sort() };
}

/** 盤の範囲に収まり、どのマスも空いているか。探索の内側のループなので添字で回す。 */
function fits(grid, rows, cols, shape, row, col) {
  for (const [dr, dc] of shape) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (grid[r * cols + c] !== null) return false;
  }
  return true;
}

/** 空き領域がすべて 5 の倍数か。探索の内側で毎回呼ぶので、生の配列を直接なめる。 */
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
