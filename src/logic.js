/**
 * 盤面とピースの計算。`tests.html` から確かめられるよう、Phaser にも DOM にも
 * 依存しない純関数だけを置く。
 *
 * セルは `[行, 列]` の配列。ピースの形は「左上を原点へ寄せ、行優先で並べた」
 * 正規形で扱う。こうすると、向きが同じかを配列の比較だけで判定できる。
 */

import {
  BOARDS, DEFAULT_BOARD_KEY, HOLE, PIECES, PIECE_SIZE,
} from './config.js';

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

/**
 * 左 90° 回転（`rotateCw` の逆）。`(行, 列) → (-列, 行)`。
 * タップで巡る向き（`turnOrder()`・`nextTurn()`）は右回りだけで足りる。
 * デモで置く前に向きを合わせるときに、右へ 3 回より左へ 1 回で済む場合が
 * あるので使う（`orientationSteps()`。TODO-065）。
 */
export function rotateCcw(cells) {
  return normalize(cells.map(([row, col]) => [-col, row]));
}

/** 左右の反転。上下の反転は、これと回転 2 回で得られる。 */
export function flip(cells) {
  return normalize(cells.map(([row, col]) => [row, -col]));
}

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
 * その形の向き全部から、いつも同じ 1 つを選ぶ。巡りの起点を固定しないと
 * 「今の向き」から数えることになり、巡りが表側の 4 通りだけで閉じてしまう。
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
 * `orientations()` の並びのままだと、表を 4 回転して裏の起点へ移るところで、
 * 絵が「別の角度の鏡像」へ飛んで見える。ここでは裏の起点を「表の最後の向きを
 * その場で裏返したもの」に取るので、隣り合う向きは必ず 90° 回転か、その場の
 * 裏返しで移れる（最後から先頭へ戻るところも裏返し）。
 *
 * `orientations()` の並びを変えると `tools/enumerate.mjs` の数え上げの順が
 * 変わるので、別の関数にしてある。
 *
 * 起点 `origin` は並びの先頭に来る向き（TODO-025）。ピース定義の向きを渡すと、
 * どのピースも「表を全部回ってから裏返し、裏を全部回る」に揃い、裏返しが
 * 何タップ目に来るかがピースごとにばらつかない。省くと `baseTurn()` を使い、
 * 今の向きに関わらず同じ並びになる。
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
 * `turnOrder()` の並びと、その中での今の向きの位置を返す。次・前・置ける次の
 * 向きを引く 3 つの関数（`nextTurn()`・`prevTurn()`・`nextPlaceableTurn()`）が
 * 同じ引き方をするので、正規化と比べ方を 1 か所に揃えるため。
 * `shape` は正規化した今の向き（置ける向きが無いとき、そのまま返すのに使う）。
 */
function turnPosition(cells, origin) {
  const order = turnOrder(cells, origin);
  const shape = normalize(cells);
  const index = order.findIndex((known) => sameShape(known, shape));
  return { order, shape, index };
}

/**
 * 今の向きの次を返す。並びの最後まで来たら先頭へ戻る。
 * X のように向きが 1 通りしかないピースは、同じ向きがそのまま返る。
 */
export function nextTurn(cells, origin = null) {
  const { order, index } = turnPosition(cells, origin);
  return order[(index + 1) % order.length];
}

/**
 * 今の向きの 1 つ前を返す。ドラッグ中にホイールを上へ回したとき、1 つ前の
 * 向きへ戻すため（TODO-069）。`nextTurn()` と同じ並びを逆に辿る。
 */
export function prevTurn(cells, origin = null) {
  const { order, index } = turnPosition(cells, origin);
  return order[(index - 1 + order.length) % order.length];
}

/**
 * ドラッグ中に向きを変えるとき、つかんでいる点（`from` の座標系での
 * `[行, 列]`。マス単位の小数）が `to` の座標系でどこに来るかを返す
 * （TODO-069）。`turnOrder()` の隣どうしは必ず「右へ 90° 回転」「左へ 90° 回転」
 * 「その場の裏返し」のどれか 1 つで移れる（テスト
 * `turnOrder の隣どうしは、90° 回転かその場の裏返しで移れる` で確かめてある）。
 * そこで、その一歩がどれかを `sameShape()` で見分け、一歩ぶんだけ点を動かす。
 *
 * 各変換の式は、`from` の外接矩形の大きさ（`rows` / `cols`）を使った
 * `rotateCw()` / `rotateCcw()` / `flip()` の連続版で、マスの中の点まで動かす。
 * `from` は正規形（左上が原点）である前提。
 *
 * I のように右回りと左回りが同じ形になる向き（`cw` と `ccw` が両方真）で、
 * 往復（次の向きへ→1 つ前へ）のたびに同じ回り方を選ぶと正味 180° 回り、
 * つかんだ点が元へ戻らない。`shapeKey()` の大小で、一方では右回り、逆向きの
 * 呼び出し（`from`/`to` が入れ替わる）では左回りを選び、往復で打ち消し合う
 * ようにしてある。
 */
export function turnPivot(from, to, point) {
  const { rows, cols } = shapeSize(from);
  const [row, col] = point;
  const cw = sameShape(rotateCw(from), to);
  const ccw = sameShape(rotateCcw(from), to);
  if (cw && ccw) {
    return shapeKey(from) < shapeKey(to) ? [col, rows - row] : [cols - col, row];
  }
  if (cw) return [col, rows - row];
  if (ccw) return [cols - col, row];
  if (sameShape(flip(from), to)) return [row, cols - col];
  return point; // 一歩で移れない（起きない想定）。念のため動かさずに返す。
}

/**
 * `from` から `to`（どちらも正規形）まで、`rotateCw()`・`rotateCcw()`・`flip()` を
 * 使う最短の道を返す（デモで、置く前にトレイで向きを合わせて見せるため。TODO-065）。
 * 左回りも使うのは、右 3 回で着く向きが左 1 回で着くことがあるため
 * （`turnPiece()` のタップは「次はどれか」を一意に決める並びが要るので
 * 右回りだけだが、ここは見た目の短さだけが要る）。
 *
 * `from` は含まず `to` を含む。各段は `{ cells, kind }`（`kind` は `'rotate'` か
 * `'flip'`。左右の回転は音が同じなので区別しない）。同じ向きなら空を返す。
 *
 * 向きは高々 8 通り（回転 4 通り × 反転の有無）なので、幅優先探索で足りる
 * （先に見つかった道が最短）。利用者と決めた「最大で裏返し 1 回＋回転 2 回」も、
 * この 8 通りで確かめてある。
 */
export function orientationSteps(from, to) {
  const start = normalize(from);
  const target = normalize(to);
  if (sameShape(start, target)) return [];
  const visited = [start];
  const queue = [{ cells: start, path: [] }];
  while (queue.length > 0) {
    const { cells, path } = queue.shift();
    for (const [kind, transform] of [
      ['rotate', rotateCw], ['rotate', rotateCcw], ['flip', flip],
    ]) {
      const next = transform(cells);
      if (visited.some((known) => sameShape(known, next))) continue;
      const nextPath = [...path, { cells: next, kind }];
      if (sameShape(next, target)) return nextPath;
      visited.push(next);
      queue.push({ cells: next, path: nextPath });
    }
  }
  return []; // 到達できない形のとき（呼ぶ側は同じピースの向きだけを渡す想定）。
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
 * 次のタップでこのピースがどう変わるかを返す。`turnOrder()` の並びは
 * 定義の向きを起点にすると「回転が続いて、裏返しが 1 回」に揃うので、
 * 回転か裏返しかを見分ければ足りる（上下反転は並びに出てこない）。
 *
 * V のように回転でも裏返しでも同じ向きになる遷移があるので、回転で
 * 説明できるものは回転とする。X は向きが 1 通りなので null（印を出さない）。
 */
export function turnMarkKind(cells, origin = null) {
  const next = nextTurn(cells, origin);
  if (sameShape(next, cells)) return null;
  if (sameShape(next, rotateCw(cells))) return 'rotate';
  return 'flip';
}

/**
 * 印を置くマスの中心を、マスの単位（左上のマスの左上が `{x: 0, y: 0}`）で返す。
 * 外接矩形の真ん中は U のように空いていることがあるので、そこへ一番近い
 * **埋まっているマス**を選ぶ（印がピースから外れて浮かないように）。
 * 1 マスの大きさは呼ぶ側が掛ける。
 */
export function turnMarkCenter(cells) {
  const size = shapeSize(cells);
  let best = cells[0];
  let bestDistance = Infinity;
  for (const [row, col] of cells) {
    const dx = col + 0.5 - size.cols / 2;
    const dy = row + 0.5 - size.rows / 2;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = [row, col];
    }
  }
  return { x: best[1] + 0.5, y: best[0] + 0.5 };
}

/**
 * シルエットの外周にあたる辺を返す。1 本は `[行1, 列1, 行2, 列2]` で、
 * マスの格子を単位とした線分（マス 1 個は `[0,0]`〜`[1,1]` の正方形）。
 *
 * 5 マスを 1 個の塊に見せるため、外周だけを濃く描く。隣にマスがある辺は
 * 内側の格子なので外す。描画に使う値だが、`tests.html` から確かめられるよう
 * ここに置く。返す順は、各マスを行優先で見て「上・右・下・左」。
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
 * ボードのうちピースを置けるマスを、行優先で返す（穴は含まない）。
 * 穴の無いボード（`hole: null`）は、大きさ 0 の穴として扱う。
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
 * 空の盤面を作る。マスの中身は、空きなら `null`、穴なら `HOLE`、
 * 置かれていればピース名。1 次元配列にするのは、複製が速く、
 * 探索の内側のループで添字計算だけで済むため。
 */
export function createBoard(spec) {
  const grid = new Array(spec.rows * spec.cols).fill(HOLE);
  for (const [row, col] of boardCells(spec)) grid[row * spec.cols + col] = null;
  return { rows: spec.rows, cols: spec.cols, grid };
}

/** マスの中身。ボードの外は `HOLE` 扱いにして、呼ぶ側の範囲検査を省く。 */
export function cellAt(board, row, col) {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) return HOLE;
  return board.grid[row * board.cols + col];
}

/**
 * 置けるかどうかと、置けない理由を返す。理由も返すのは、ボードの外へ
 * はみ出したのか他のピースと重なったのかで、画面の警告を出し分けるため。
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
 * ボードに置いたまま向きを変えるときの、次の向きを返す（TODO-023）。その場に
 * 置けない向きは飛ばし、他に無ければ今の向きを返す。
 *
 * `board` には自分を取り除いた盤面を渡す（自分のいる場所を塞がっていると
 * 見なさないため）。飛ばすのは、置けない向きで止まると赤く光るだけで、
 * 置ける向きまでタップし続けることになるため。
 */
export function nextPlaceableTurn(board, cells, row, col, origin = null) {
  const { order, shape, index: start } = turnPosition(cells, origin);
  for (let step = 1; step <= order.length; step += 1) {
    const candidate = order[(start + step) % order.length];
    if (canPlace(board, candidate, row, col).ok) return candidate;
  }
  return shape;
}

/**
 * 離した升目から、実際に置く升目を決める（TODO-023）。指を正確に合わせなくても
 * 置けるよう、そこに置けなければ周りを `range` 升まで近い順に探す。
 * 同じ距離なら上・左が先。どこにも置けなければ null。
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
 * ピースを置いた盤面を新しく作って返す。書き換えないのは、Undo の履歴が
 * 過去の盤面を参照したままでも壊れないようにするため。
 */
export function place(board, name, cells, row, col) {
  const grid = board.grid.slice();
  for (const [dr, dc] of cells) grid[(row + dr) * board.cols + (col + dc)] = name;
  return { rows: board.rows, cols: board.cols, grid };
}

export function remove(board, name) {
  const grid = board.grid.map((value) => (value === name ? null : value));
  return { rows: board.rows, cols: board.cols, grid };
}

/** 空きマスの座標を行優先で返す。探索の枝刈りと残りマス数の表示に使う。 */
export function emptyCells(board) {
  const cells = [];
  for (let index = 0; index < board.grid.length; index += 1) {
    if (board.grid[index] === null) {
      cells.push([Math.floor(index / board.cols), index % board.cols]);
    }
  }
  return cells;
}

/** ボードに置かれているピース名を、ボードに現れた順で返す。 */
export function placedNames(board) {
  const names = [];
  for (const value of board.grid) {
    if (value !== null && value !== HOLE && !names.includes(value)) names.push(value);
  }
  return names;
}

export function isSolved(board) {
  return !board.grid.includes(null);
}

/**
 * 空き領域を上下左右の連結で分け、領域ごとのマスの添字を返す（行優先の順）。
 * 大きさだけ要る枝刈りと、形まで要る `forcedPlacements()` で共通に使う。
 */
function emptyRegions(board) {
  const seen = new Uint8Array(board.grid.length);
  const regions = [];
  const stack = [];
  for (let start = 0; start < board.grid.length; start += 1) {
    if (board.grid[start] !== null || seen[start]) continue;
    const region = [];
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const index = stack.pop();
      region.push(index);
      const row = Math.floor(index / board.cols);
      const col = index % board.cols;
      if (col > 0) pushIfEmpty(board, seen, stack, index - 1);
      if (col < board.cols - 1) pushIfEmpty(board, seen, stack, index + 1);
      if (row > 0) pushIfEmpty(board, seen, stack, index - board.cols);
      if (row < board.rows - 1) pushIfEmpty(board, seen, stack, index + board.cols);
    }
    regions.push(region);
  }
  return regions;
}

/**
 * 空き領域を上下左右の連結で分け、それぞれの大きさを返す。
 * 「5 で割り切れない塊があれば解が無い」という枝刈りに使う。
 */
export function emptyRegionSizes(board) {
  return emptyRegions(board).map((region) => region.length);
}

function pushIfEmpty(board, seen, stack, index) {
  if (board.grid[index] === null && !seen[index]) {
    seen[index] = 1;
    stack.push(index);
  }
}

/**
 * 周りから切り離された 5 マスの空きのうち、残りのピース `names` のどれかと同じ形のものを、
 * そのピースの置き方 `{ name, cells, row, col }` にして返す（TODO-044。`place()` にそのまま渡せる）。
 *
 * 12 種の形はどれも違うので、解ける盤面ならその空きはそのピースで埋めるしかなく、
 * 埋めても解けるまま。1 つ埋めても他の空きは変わらないので、一度に全部返す。
 * 見るのは形だけで、解の有無は見ない。同じピースが 2 つの空きに当たる盤面は
 * 解なしだが、同じピースを 2 回置く手は返さないよう最初の 1 つだけにする。
 */
export function forcedPlacements(board, names) {
  const shapes = PIECES
    .filter((piece) => names.includes(piece.name))
    .map((piece) => ({ name: piece.name, turns: orientations(piece.cells) }));
  const found = [];
  for (const region of emptyRegions(board)) {
    if (region.length !== PIECE_SIZE) continue;
    const cells = region.map((index) => [Math.floor(index / board.cols), index % board.cols]);
    const shape = normalize(cells);
    const match = shapes.find(({ name, turns }) => !found.some((entry) => entry.name === name)
      && turns.some((turn) => sameShape(turn, shape)));
    if (!match) continue;
    const row = Math.min(...cells.map(([r]) => r));
    const col = Math.min(...cells.map(([, c]) => c));
    found.push({ name: match.name, cells: shape, row, col });
  }
  return found;
}

/**
 * 残りのピース `names` のどの置き方でも覆えない空きマスがあるか（TODO-077）。
 * あれば、その盤面は必ず解なし。空き領域の大きさ（`regionsFitPieces()`）だけでは
 * 見えない、細い袋小路や角に残る 1 マスを拾う。置ける手を全部当てるので、
 * `regionsFitPieces()` より重い。
 */
export function hasUncoverableCell(board, names) {
  const covered = new Uint8Array(board.grid.length);
  for (const piece of PIECES) {
    if (!names.includes(piece.name)) continue;
    for (const shape of orientations(piece.cells)) {
      for (let row = 0; row < board.rows; row += 1) {
        for (let col = 0; col < board.cols; col += 1) {
          if (!canPlace(board, shape, row, col).ok) continue;
          for (const [dr, dc] of shape) covered[(row + dr) * board.cols + (col + dc)] = 1;
        }
      }
    }
  }
  return board.grid.some((value, index) => value === null && !covered[index]);
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
 * 代表形を選ぶための比較と、ボードの形が保たれるかの判定に使う。
 */
export function boardKey(board) {
  return board.grid.map((value) => (value === null ? '.' : value)).join('');
}

/** ボードの形（大きさと穴の位置）だけを取り出した鍵。置いてあるピースは無視する。 */
function shapeKeyOf(board) {
  return `${board.rows}x${board.cols}:`
    + board.grid.map((value) => (value === HOLE ? HOLE : '.')).join('');
}

/**
 * そのボードの**形を保つ**変換だけを返す（`SYMMETRIES` の部分集合。TODO-012）。
 *
 * ボードごとに決め打ちで書かず、実際に当てはめて穴の位置が一致するものを残すのは、
 * ボードを足したときに書き足さずに済ませるため。
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
 * 解は、ボードの形を保つ変換で写してもやはり解になる。見た目だけ違う同じ解を
 * 別々に数えないよう、**写した中で `boardKey()` が一番小さいもの**を代表とする。
 * X ピースの位置で決めるやり方は、ボードごとに条件を立て直すことになるので採らない。
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
 * 履歴の 1 件は文字列なので、いったんボードへ戻してから `canonicalBoard()` に通す。
 * `storage.js` でなくここに置くのは、Phaser に依存しない計算を `logic.js` に
 * 集める規約のため。
 * `spec` は `{ rows, cols }` を持つボードの定義（`BOARDS[key]` をそのまま渡せる）。
 */
export function canonicalCellsKey(cells, spec) {
  const grid = Array.from(cells, (ch) => (ch === '.' ? null : ch));
  const board = { rows: spec.rows, cols: spec.cols, grid };
  return boardKey(canonicalBoard(board));
}

/**
 * 一覧で選んでいる位置と頁を、件数が変わったあとに合わせ直す（純関数。TODO-071）。
 *
 * 選んでいた位置（一覧全体での添字）を保ち、件数からはみ出したときだけ
 * 末尾へ詰める。頁も、はみ出したときだけ最後の頁へ詰める。選んでいた回を
 * 消したあとに使い（`selectionAfterRemoval()`）、次の回（末尾なら 1 つ前）が
 * 選ばれる（TODO-031）。
 */
export function clampSelection(length, selected, page, rowsPerPage) {
  const nextSelected = Math.max(0, Math.min(selected, length - 1));
  const pages = Math.max(1, Math.ceil(length / rowsPerPage));
  const nextPage = Math.min(Math.max(page, 0), pages - 1);
  return { selected: nextSelected, page: nextPage };
}

/**
 * 記録画面でチェックした回を消したあとの、選ぶ位置と頁（純関数。TODO-071）。
 * `nos` は消す前の一覧の番号を並びどおりに、`removed` は消した番号を渡す。
 *
 * 見ていた回が残っていれば、それを選んだまま見える頁へ移る。前の行が
 * 消えて添字がずれても、別の回の完成形に差し替わらないようにするため。
 * 見ていた回を消したときだけ、残った中で次の回（末尾なら 1 つ前）へ移り、
 * 頁は `clampSelection()` で詰める（TODO-031）。
 */
export function selectionAfterRemoval(nos, selected, page, removed, rowsPerPage) {
  const gone = new Set(removed);
  const kept = nos.filter((no) => !gone.has(no));
  const keptBefore = nos.slice(0, selected).filter((no) => !gone.has(no)).length;
  if (selected < nos.length && !gone.has(nos[selected])) {
    return { selected: keptBefore, page: Math.floor(keptBefore / rowsPerPage) };
  }
  return clampSelection(kept.length, keptBefore, page, rowsPerPage);
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

/**
 * URL のパラメータ（`?demo=random&board=8x8`）からデモの開き方を読む
 * （TODO-083）。README から動いているデモへ直接飛べるようにするため。
 * `demo` が無ければ `null`（タイトルを開く）。省いたものと知らない値は既定
 * （ランダム・8×8）に倒す。書き間違えたリンクでも、何かが動いて見えるほうがよい。
 */
export function parseDemoParams(search) {
  const params = new URLSearchParams(search);
  if (!params.has('demo')) return null;
  const board = params.get('board');
  return {
    strategy: params.get('demo') === 'depth' ? 'depth' : 'random',
    board: Object.hasOwn(BOARDS, board) ? board : DEFAULT_BOARD_KEY,
  };
}

/** ピース 1 種を、選んでいる色の組ではどの色で描くか。 */
export function pieceColor(palette, piece) {
  if (palette.mono !== null) return palette.mono;
  return palette.colors === null ? piece.color : palette.colors[piece.name];
}

/**
 * 縁取り用に色を暗くする。マスの縁と、ピースの外周（`game.js`）が使う。
 * ここに置くのは、マスの縁と外周で同じ作り方を保つため。
 */
export function darken(color, factor) {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}
