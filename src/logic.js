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

/** 向きどうしを並べ替えるための鍵。マスは 0〜4 なので桁が揃い、文字列の比較で足りる。 */
function shapeKey(cells) {
  return cells.map(([row, col]) => `${row}${col}`).join('');
}

/**
 * その形の向き全部から、いつも同じ 1 つを選ぶ。巡りの起点をここに固定しないと、
 * 「今の向き」から数え始めることになり、巡りが表側の 4 通りだけで閉じてしまう。
 */
function baseTurn(cells) {
  let base = null;
  for (const shape of orientations(cells)) {
    if (base === null || shapeKey(shape) < shapeKey(base)) base = shape;
  }
  return base;
}

/**
 * タップで順に巡るときの向きの並び（TODO-019）。
 *
 * `orientations()` の並びをそのまま使うと、表を 4 回転したあと裏の起点へ
 * 移るところで、絵が「別の角度の鏡像」へ飛んで見える。ここでは裏の起点を
 * 「表の最後の向きをその場で裏返したもの」に取るので、隣り合う向きの
 * 変化は必ず 90° 回転か、その場の裏返しのどちらかになる
 * （最後から先頭へ戻るところも裏返しになる）。
 *
 * 探索の順を変えると `tools/enumerate.mjs` の数え上げの当たり方が変わるので、
 * `orientations()` 自体の並びには手を入れずに別の関数として持つ。
 *
 * 起点 `origin` は並びの先頭に来る向き（TODO-025）。ピース定義の向きを渡すと、
 * どのピースも「表を全部回ってから裏返し、裏を全部回る」に揃い、裏返しが
 * 何タップ目に来るかがピースごとにばらつかなくなる。省いたときは
 * `baseTurn()` で、今の向きに関わらず同じ並びになる。
 */
export function turnOrder(cells, origin = null) {
  const order = [];
  let current = origin ? normalize(origin) : baseTurn(cells);
  for (let side = 0; side < 2; side += 1) {
    let last = current;
    for (let turn = 0; turn < 4; turn += 1) {
      if (!order.some((known) => sameShape(known, current))) order.push(current);
      last = current;
      current = rotateCw(current);
    }
    current = flip(last);
  }
  return order;
}

/**
 * 今の向きの次を返す。並びの最後まで来たら先頭へ戻る。
 * X のように向きが 1 通りしかないピースは、同じ向きがそのまま返る。
 */
export function nextTurn(cells, origin = null) {
  const order = turnOrder(cells, origin);
  const shape = normalize(cells);
  const index = order.findIndex((known) => sameShape(known, shape));
  return order[(index + 1) % order.length];
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
 * 盤に置いたまま向きを変えるときの、次の向きを返す（TODO-023）。その場に
 * 置けない向きは飛ばす。置けるものが他に無ければ今の向きをそのまま返す。
 *
 * `board` には自分を取り除いた盤面を渡す（今いる場所を自分で塞いでいると
 * 見なさないため）。飛ばすのは、置けない向きで止まると赤く光るだけになり、
 * 置ける向きに当たるまでタップし続けることになるため。
 */
export function nextPlaceableTurn(board, cells, row, col, origin = null) {
  const order = turnOrder(cells, origin);
  const shape = normalize(cells);
  const start = order.findIndex((known) => sameShape(known, shape));
  for (let step = 1; step <= order.length; step += 1) {
    const candidate = order[(start + step) % order.length];
    if (canPlace(board, candidate, row, col).ok) return candidate;
  }
  return shape;
}

/**
 * 離した升目から、実際に置く升目を決める（TODO-023）。そこに置けなければ
 * 周りを `range` 升まで、近い順に探す。指を正確に合わせなくても置けるように
 * するため。同じ距離なら上・左が先。どこにも置けなければ null。
 */
export function snapSpot(board, cells, row, col, range) {
  const spots = [];
  for (let dr = -range; dr <= range; dr += 1) {
    for (let dc = -range; dc <= range; dc += 1) {
      spots.push({ row: row + dr, col: col + dc, distance: dr * dr + dc * dc });
    }
  }
  spots.sort((a, b) => a.distance - b.distance);
  for (const spot of spots) {
    if (canPlace(board, cells, spot.row, spot.col).ok) {
      return { row: spot.row, col: spot.col };
    }
  }
  return null;
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

/**
 * 盤面を右 90° 回転した盤面を新しく作る。行と列が入れ替わる。
 * `(行, 列) → (列, 行数-1-行)` で、`rotateCw()` と同じ向きの回転になる。
 */
function rotateBoardCw(board) {
  const grid = new Array(board.grid.length);
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      grid[col * board.rows + (board.rows - 1 - row)] = board.grid[row * board.cols + col];
    }
  }
  return { rows: board.cols, cols: board.rows, grid };
}

/** 盤面の左右を反転した盤面を新しく作る。上下の反転は回転 2 回と組み合わせて得る。 */
function flipBoardLr(board) {
  const grid = new Array(board.grid.length);
  for (let row = 0; row < board.rows; row += 1) {
    for (let col = 0; col < board.cols; col += 1) {
      grid[row * board.cols + (board.cols - 1 - col)] = board.grid[row * board.cols + col];
    }
  }
  return { rows: board.rows, cols: board.cols, grid };
}

/**
 * 盤面に当てはめられる変換 8 通り（回転 4 × 反転 2）。
 * `flipped` を先に、`turns` の回転をあとに掛ける。
 */
export const SYMMETRIES = [false, true].flatMap(
  (flipped) => [0, 1, 2, 3].map((turns) => ({ turns, flipped })),
);

/**
 * 盤面を 1 つの変換で写した盤面を新しく作る（元は書き換えない）。
 *
 * ピース名はそのまま移す。写った先の形も同じピースの別の向きなので
 * （`orientations()` は回転・反転を全部含む）、解を写したものはやはり解になる。
 */
export function transformBoard(board, { turns = 0, flipped = false } = {}) {
  let result = flipped
    ? flipBoardLr(board)
    : { rows: board.rows, cols: board.cols, grid: board.grid.slice() };
  for (let turn = 0; turn < turns; turn += 1) result = rotateBoardCw(result);
  return result;
}

/**
 * 盤面を 1 本の文字列にする。空きは `.`、穴は `HOLE`、置いてあればピース名。
 * 代表形を選ぶための比較と、盤の形が保たれるかの判定に使う。
 */
export function boardKey(board) {
  return board.grid.map((value) => (value === null ? '.' : value)).join('');
}

/** 盤の形（大きさと穴の位置）だけを取り出した鍵。置いてあるピースは無視する。 */
function shapeKeyOf(board) {
  return `${board.rows}x${board.cols}:`
    + board.grid.map((value) => (value === HOLE ? HOLE : '.')).join('');
}

/**
 * その盤の**形を保つ**変換だけを返す（`SYMMETRIES` の部分集合。TODO-012）。
 *
 * 8 通りを決め打ちで盤ごとに書かず、実際に当てはめて穴の位置が一致するものを
 * 残すのは、盤を足したときに書き足さずに済むようにするため。
 * 8×8（中央 2×2 が穴）は 8 通りすべて、6×10（穴なし）は縦横が違うので
 * 90° 回転が形を変え、恒等・180° 回転・左右反転・上下反転の 4 通りになる。
 */
export function boardSymmetries(board) {
  const shape = shapeKeyOf(board);
  return SYMMETRIES.filter((sym) => shapeKeyOf(transformBoard(board, sym)) === shape);
}

/**
 * 回転・反転で重なる盤面から、いつも同じ 1 つを選んで返す（TODO-012）。
 *
 * 完成した解は、盤の形を保つ変換で写してもやはり解になる。そのままでは
 * 見た目だけ違う同じ解を別々に数えてしまうので、**写した中で `boardKey()` が
 * 一番小さいもの**を代表とする。X ピースの位置で決めるやり方は盤ごとに
 * 条件を立て直すことになるので採らない（盤に依らないこちらを使う）。
 *
 * 途中の盤面にも当てはめられるが、意味を持つのは完成形どうしを見比べるとき。
 */
export function canonicalBoard(board) {
  let best = null;
  let bestKey = null;
  for (const sym of boardSymmetries(board)) {
    const turned = transformBoard(board, sym);
    const key = boardKey(turned);
    if (bestKey === null || key < bestKey) {
      best = turned;
      bestKey = key;
    }
  }
  return best;
}

/**
 * 履歴の `cells` 文字列（`boardKey()` の出力）を代表形の文字列にする（TODO-021）。
 *
 * 履歴の 1 件は盤ではなく文字列で持っているので、いったん盤へ戻してから
 * `canonicalBoard()` に通す。`storage.js` に盤を組み立てる処理を書かず
 * ここへ置くのは、Phaser に依存しない計算を `logic.js` に集める規約のため。
 * `spec` は `{ rows, cols }` を持つ盤の定義（`BOARDS[key]` をそのまま渡せる）。
 */
export function canonicalCellsKey(cells, spec) {
  const grid = Array.from(cells, (ch) => (ch === '.' ? null : ch));
  const board = { rows: spec.rows, cols: spec.cols, grid };
  return boardKey(canonicalBoard(board));
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
