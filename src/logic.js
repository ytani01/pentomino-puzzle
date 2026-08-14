/**
 * 盤面とピースの計算。Phaser にも DOM にも依存しない純関数だけを置く
 * （`tests.html` から確かめられるようにするため）。
 *
 * セルは `[行, 列]` の配列。ピースの形は「左上を原点へ寄せ、行優先で並べた」
 * 正規形で扱う。正規形にしておくと、向きの同一判定が配列の比較だけで済む。
 */

import { HOLE, PIECE_SIZE } from './config.js';

/**
 * 左上を原点へ寄せ、行優先に並べ替える。
 * 回転・反転の結果を突き合わせるための基準形。
 */
export function normalize(cells) {
  let minRow = Infinity;
  let minCol = Infinity;
  for (const [row, col] of cells) {
    if (row < minRow) minRow = row;
    if (col < minCol) minCol = col;
  }
  return cells
    .map(([row, col]) => [row - minRow, col - minCol])
    .sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
}

/**
 * 右 90° 回転。行が下向きの座標系なので、`(行, 列) → (列, -行)` が右回りになる
 * （`-行` のずれは `normalize()` が吸収する）。
 */
export function rotateCw(cells) {
  return normalize(cells.map(([row, col]) => [col, -row]));
}

/** 左右の反転。上下の反転は回転 2 回と組み合わせれば同じものが得られる。 */
export function flip(cells) {
  return normalize(cells.map(([row, col]) => [row, -col]));
}

/** 正規形どうしが同じ向きかを返す。 */
export function sameShape(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i][0] !== b[i][0] || a[i][1] !== b[i][1]) return false;
  }
  return true;
}

/**
 * 回転 4 通り × 反転 2 通りを作り、正規形が重なるものを除く。
 * X は 1 通り、I は 2 通り、T・U・V・W・Z は 4 通り、F・L・N・P・Y は 8 通り
 * （12 種の合計は 63 通り）。
 */
export function orientations(cells) {
  const found = [];
  for (const start of [normalize(cells), flip(cells)]) {
    let current = start;
    for (let turn = 0; turn < 4; turn += 1) {
      if (!found.some((known) => sameShape(known, current))) found.push(current);
      current = rotateCw(current);
    }
  }
  return found;
}

/** 正規形から、その向きの外接矩形の大きさを返す。トレイでの中央寄せに使う。 */
export function shapeSize(cells) {
  let rows = 0;
  let cols = 0;
  for (const [row, col] of cells) {
    if (row + 1 > rows) rows = row + 1;
    if (col + 1 > cols) cols = col + 1;
  }
  return { rows, cols };
}

/**
 * シルエットの外周にあたる辺を返す。1 本は `[行1, 列1, 行2, 列2]` で、
 * マスの格子を単位とした線分（マス 1 個は `[0,0]`〜`[1,1]` の正方形）。
 *
 * 5 マスを 1 個の塊として見せるために、外周だけを濃く描きたい。
 * 隣にマスがある辺は内側の格子なので外周から外す。
 * 描画に使う値だが、Phaser を持ち込まずに `tests.html` から確かめられるよう
 * ここに置く。返す順は「上・右・下・左」を各マスについて行優先で見た順。
 */
export function outlineEdges(cells) {
  const has = new Set(cells.map(([row, col]) => `${row},${col}`));
  const edges = [];
  for (const [row, col] of cells) {
    if (!has.has(`${row - 1},${col}`)) edges.push([row, col, row, col + 1]);
    if (!has.has(`${row},${col + 1}`)) edges.push([row, col + 1, row + 1, col + 1]);
    if (!has.has(`${row + 1},${col}`)) edges.push([row + 1, col, row + 1, col + 1]);
    if (!has.has(`${row},${col - 1}`)) edges.push([row, col, row + 1, col]);
  }
  return edges;
}

/**
 * 盤のうちピースを置けるマスを、行優先で並べて返す（穴は含まない）。
 * 穴の無い盤（`hole: null`）は、大きさ 0 の穴として同じ道を通す。
 */
export function boardCells(spec) {
  const hole = spec.hole || { row: 0, col: 0, rows: 0, cols: 0 };
  const {
    row: holeRow, col: holeCol, rows: holeRows, cols: holeCols,
  } = hole;
  const cells = [];
  for (let row = 0; row < spec.rows; row += 1) {
    for (let col = 0; col < spec.cols; col += 1) {
      const inHole = row >= holeRow && row < holeRow + holeRows
        && col >= holeCol && col < holeCol + holeCols;
      if (!inHole) cells.push([row, col]);
    }
  }
  return cells;
}

/**
 * 空の盤面を作る。マスの中身は「空きなら `null`、穴なら `HOLE`、
 * 置かれていればピース名」。1 次元配列にしているのは、複製が速く、
 * 求解の内側のループで添字計算だけで済むため。
 */
export function createBoard(spec) {
  const grid = new Array(spec.rows * spec.cols).fill(HOLE);
  for (const [row, col] of boardCells(spec)) grid[row * spec.cols + col] = null;
  return { rows: spec.rows, cols: spec.cols, grid };
}

/** マスの中身。盤外は `HOLE` 扱いにして、呼ぶ側の範囲検査を省く。 */
export function cellAt(board, row, col) {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) return HOLE;
  return board.grid[row * board.cols + col];
}

/**
 * 置けるかどうかと、置けない理由を返す。
 * 理由を返すのは、盤の外へはみ出したのか他のピースと重なったのかで
 * 画面の警告を出し分けるため。
 */
export function canPlace(board, cells, row, col) {
  for (const [dr, dc] of cells) {
    const r = row + dr;
    const c = col + dc;
    if (r < 0 || c < 0 || r >= board.rows || c >= board.cols) {
      return { ok: false, reason: 'outside' };
    }
    const value = board.grid[r * board.cols + c];
    if (value === HOLE) return { ok: false, reason: 'hole' };
    if (value !== null) return { ok: false, reason: 'overlap' };
  }
  return { ok: true, reason: null };
}

/**
 * ピースを置いた盤面を新しく作って返す。盤面を書き換えないのは、
 * Undo の履歴が過去の盤面を参照したままでも壊れないようにするため。
 */
export function place(board, name, cells, row, col) {
  const grid = board.grid.slice();
  for (const [dr, dc] of cells) grid[(row + dr) * board.cols + (col + dc)] = name;
  return { rows: board.rows, cols: board.cols, grid };
}

/** 指定したピースを取り除いた盤面を新しく作って返す。 */
export function remove(board, name) {
  const grid = board.grid.map((value) => (value === name ? null : value));
  return { rows: board.rows, cols: board.cols, grid };
}

/** 空きマスの座標を行優先で返す。求解の枝刈りと残りマス数の表示に使う。 */
export function emptyCells(board) {
  const cells = [];
  for (let index = 0; index < board.grid.length; index += 1) {
    if (board.grid[index] === null) {
      cells.push([Math.floor(index / board.cols), index % board.cols]);
    }
  }
  return cells;
}

/** 盤に置かれているピース名を、盤に現れた順で返す。 */
export function placedNames(board) {
  const names = [];
  for (const value of board.grid) {
    if (value !== null && value !== HOLE && !names.includes(value)) names.push(value);
  }
  return names;
}

/** 空きマスが無ければ完成。 */
export function isSolved(board) {
  return !board.grid.includes(null);
}

/**
 * 空き領域を上下左右の連結で分け、それぞれの大きさを返す。
 * 求解では「5 で割り切れない塊があれば置き方が無い」という枝刈りに使う。
 */
export function emptyRegionSizes(board) {
  const seen = new Uint8Array(board.grid.length);
  const sizes = [];
  const stack = [];
  for (let start = 0; start < board.grid.length; start += 1) {
    if (board.grid[start] !== null || seen[start]) continue;
    let size = 0;
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const index = stack.pop();
      size += 1;
      const row = Math.floor(index / board.cols);
      const col = index % board.cols;
      if (col > 0) pushIfEmpty(board, seen, stack, index - 1);
      if (col < board.cols - 1) pushIfEmpty(board, seen, stack, index + 1);
      if (row > 0) pushIfEmpty(board, seen, stack, index - board.cols);
      if (row < board.rows - 1) pushIfEmpty(board, seen, stack, index + board.cols);
    }
    sizes.push(size);
  }
  return sizes;
}

function pushIfEmpty(board, seen, stack, index) {
  if (board.grid[index] === null && !seen[index]) {
    seen[index] = 1;
    stack.push(index);
  }
}

/** 空き領域の大きさがすべて 5 の倍数か。`emptyRegionSizes()` の判定部分。 */
export function regionsFitPieces(board) {
  return emptyRegionSizes(board).every((size) => size % PIECE_SIZE === 0);
}

/** 経過時間の表示。1 時間を超えたら `h:mm:ss` に伸ばす。 */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const seconds = total % 60;
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
