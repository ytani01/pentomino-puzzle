/**
 * 盤面とピースの計算。`tests.html` から確かめられるよう、Phaser にも DOM にも
 * 依存しない純関数だけを置く。
 *
 * セルは `[行, 列]` の配列。ピースの形は「左上を原点へ寄せ、行優先で並べた」
 * 正規形で扱う。こうすると、向きが同じかを配列の比較だけで判定できる。
 */

import {
  BOARDS, DEFAULT_BOARD_KEY, DEMO, HOLE, PIECES, PIECE_SIZE,
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
 * 今の向きの次を返す。並びの最後まで来たら先頭へ戻る。
 * X のように向きが 1 通りしかないピースは、同じ向きがそのまま返る。
 */
export function nextTurn(cells, origin = null) {
  const order = turnOrder(cells, origin);
  const shape = normalize(cells);
  const index = order.findIndex((known) => sameShape(known, shape));
  return order[(index + 1) % order.length];
}

/**
 * 今の向きの 1 つ前を返す。ドラッグ中にホイールを上へ回したとき、1 つ前の
 * 向きへ戻すため（TODO-069）。`nextTurn()` と同じ並びを逆に辿る。
 */
export function prevTurn(cells, origin = null) {
  const order = turnOrder(cells, origin);
  const shape = normalize(cells);
  const index = order.findIndex((known) => sameShape(known, shape));
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
 * 盤のうちピースを置けるマスを、行優先で返す（穴は含まない）。
 * 穴の無い盤（`hole: null`）は、大きさ 0 の穴として扱う。
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

/** マスの中身。盤外は `HOLE` 扱いにして、呼ぶ側の範囲検査を省く。 */
export function cellAt(board, row, col) {
  if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) return HOLE;
  return board.grid[row * board.cols + col];
}

/**
 * 置けるかどうかと、置けない理由を返す。理由も返すのは、盤の外へ
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
 * 盤に置いたまま向きを変えるときの、次の向きを返す（TODO-023）。その場に
 * 置けない向きは飛ばし、他に無ければ今の向きを返す。
 *
 * `board` には自分を取り除いた盤面を渡す（自分のいる場所を塞がっていると
 * 見なさないため）。飛ばすのは、置けない向きで止まると赤く光るだけで、
 * 置ける向きまでタップし続けることになるため。
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

/** 盤に置かれているピース名を、盤に現れた順で返す。 */
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
 * 置いたときに、盤の外・穴・置き済みのマスへ接する辺の数を返す（TODO-059）。
 * ランダム探索の置き場所の重み付けに使う。`cellAt()` は盤外・穴とも `HOLE` を
 * 返すので、`null` 以外を「接している」とみなせば 3 つを区別せずに数えられる。
 * ピース自身の内側の辺（隣り合う自分のマス）は数えない。
 */
export function touchingEdges(board, cells, row, col) {
  const shape = new Set(cells.map(([dr, dc]) => `${dr},${dc}`));
  let count = 0;
  for (const [dr, dc] of cells) {
    for (const [ndr, ndc] of [[dr - 1, dc], [dr + 1, dc], [dr, dc - 1], [dr, dc + 1]]) {
      if (shape.has(`${ndr},${ndc}`)) continue;
      if (cellAt(board, row + ndr, col + ndc) !== null) count += 1;
    }
  }
  return count;
}

/**
 * `touchingEdges()` の数を抽選の重みにする（TODO-059）。隅や置いたピースの隣
 * ほど選ばれやすいよう、2 乗して差を広げる。接する辺が 0（盤の真ん中に
 * 離して置く手）でも重み 0 にしないよう +1 する（全部 0 だと抽選できず、
 * そういう置き方も人はときどきする）。
 */
function touchWeight(count) {
  return (count + 1) ** 2;
}

/**
 * 2 つの手のマスどうしの最短のマンハッタン距離（隣り合えば 1）。デモの
 * ランダムで、直前に置いた手からの近さを抽選の重みに掛ける（TODO-062）。
 */
export function moveDistance(a, b) {
  let min = Infinity;
  for (const [adr, adc] of a.shape) {
    const ar = a.row + adr;
    const ac = a.col + adc;
    for (const [bdr, bdc] of b.shape) {
      const distance = Math.abs(ar - (b.row + bdr)) + Math.abs(ac - (b.col + bdc));
      if (distance < min) min = distance;
    }
  }
  return min;
}

/**
 * `choices`（残りの全ピースの置ける手。ピースごとの手の配列の配列）から、
 * 空きマスごとに、そのマスを覆う手の数を数える。デモのランダムで
 * 「狭い所」（一番少ないマス）を選ぶため（TODO-061）。`tests.html` から
 * 確かめられるよう export する。
 */
export function countCellMoves(choices) {
  const counts = new Map();
  for (const moves of choices) {
    for (const move of moves) {
      for (const [dr, dc] of move.shape) {
        const key = `${move.row + dr},${move.col + dc}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
  }
  return counts;
}

/**
 * `choices`（`countCellMoves()` と同じ形）から、覆える手が 1 種類のピースに
 * しか無い空きマスを探し、そのピースの添字（`choices` での位置）とマスを返す。
 * 無ければ `null`。人は「この隙間に入るのはこれしか無い」と分かれば迷わず
 * それを入れるため（TODO-082）。該当するマスが複数あれば、覆える手が一番
 * 少ないマスを選ぶ（同数なら `random` で選ぶ）。`tests.html` から確かめられる
 * よう export する。
 *
 * `solveStepsRandom()` が渡す `choices` は控え（`failed`）を除いた手なので、
 * 別のピースをそこで試してだめだったから 1 種類に見える、というマスも当たる。
 * 人も試してだめだったピースは候補から外して考えるので、除いたまま数える。
 */
export function singlePieceCell(choices, random) {
  const cells = new Map(); // "row,col" → { pick, count }。pick は 2 種類目が出たら -1
  choices.forEach((moves, pick) => {
    for (const move of moves) {
      for (const [dr, dc] of move.shape) {
        const key = `${move.row + dr},${move.col + dc}`;
        const cell = cells.get(key);
        if (!cell) {
          cells.set(key, { pick, count: 1 });
        } else {
          if (cell.pick !== pick) cell.pick = -1;
          cell.count += 1;
        }
      }
    }
  });
  const counts = new Map();
  for (const [key, { pick, count }] of cells) {
    if (pick >= 0) counts.set(key, count);
  }
  if (counts.size === 0) return null;
  const cellKey = pickTightCell(counts, random);
  return { pick: cells.get(cellKey).pick, cellKey };
}

/** `move` が空きマス `cellKey`（`"row,col"`）を覆うか。 */
function moveCoversCell(move, cellKey) {
  return move.shape.some(([dr, dc]) => `${move.row + dr},${move.col + dc}` === cellKey);
}

/**
 * `counts`（`countCellMoves()` の戻り値か、同じ形の `"row,col"` → 数の Map）から、数が一番少ないマスを 1 つ選ぶ
 * （同数なら `random` で選ぶ）。`counts` は覆われたマスしか持たないので、数は
 * 必ず 1 以上。置ける手があるとき（`counts` が空でないとき）だけ呼ぶ。
 */
function pickTightCell(counts, random) {
  let min = Infinity;
  let keys = [];
  for (const [key, count] of counts) {
    if (count < min) {
      min = count;
      keys = [key];
    } else if (count === min) {
      keys.push(key);
    }
  }
  return keys[Math.floor(random() * keys.length)];
}

/** 重み付き抽選。`weights` は `items` と同じ長さ・並びで、`random` だけで決める。 */
function pickWeighted(items, weights, random) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let r = random() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** Fisher–Yates で並びを入れ替える（渡した配列をその場で入れ替えて返す）。 */
function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * 空の盤から深さ優先で解を探し、1 手ずつ返す（デモ用。TODO-040）。
 *
 * 画面を止めずに探す様子を見せるため、探索を generator にし、呼ぶ側が
 * フレームごとに好きな手数だけ `next()` する。一番若い空きマスを埋め、
 * 置いたら `canContinue(board)` で先へ進むかを決める。既定の `regionsFitPieces`
 * （5 の倍数でない空き領域が出たら捨てる）なら `tools/enumerate.mjs` と同じで、
 * 違うのは、始める前に 1 回だけピースの並びと各ピースの向きの並びを `random` で
 * 入れ替えることだけ（毎回違う試し方と解を見せるため）。`random` を外から
 * 受けるのは、テストでシード付きの乱数を渡して手順を固定するため。
 * `canContinue` を外から受けるのは、デモが全解のデータで「解ける／解なし」を
 * 調べ、ヒント表示を入にして解く人と同じ動きにするため（TODO-043。
 * `logic.js` は全解のデータを持たないので、判定ごと渡してもらう）。
 *
 * 返すのは `{ type: 'place', name, cells, row, col, ok }`・`{ type: 'remove', name }`・
 * `{ type: 'solved' }`。`ok` は置いたあとの `canContinue` の結果で、デモが HUD に
 * 出す（そのために判定を yield の前にしてあるが、探索の順と手は変わらない）。
 * 捨てる置き方も、試して戻す様子を見せるため place と remove の 2 手で返す。
 * solved のあとも `next()` すれば次の解を探し、全部探し終えたら終わる。
 *
 * `place` の `cells` は探索が持つ向きの配列そのもの（写しを作らない）。
 * 書き換えると以降の探索が狂うので、受け取った側は読むだけにする。
 *
 * 探索の盤はここに閉じた作業用の配列で、**その場で書き換える**。1 万手で
 * 50ms ほどの速さを保つため（毎手作り直すと割に合わない）。本編の盤面
 * （Undo の履歴が参照するもの）とは別物なので、「盤面は書き換えず作り直す」の
 * 決まりとはぶつからない。
 */
export function* solveSteps(spec, random, canContinue = regionsFitPieces) {
  const board = createBoard(spec);
  const { cols, grid } = board;
  const unused = shuffle(PIECES.map((piece) => piece.name), random);
  const shapes = new Map(PIECES.map(
    (piece) => [piece.name, shuffle(orientations(piece.cells), random)],
  ));

  function* search() {
    const target = grid.indexOf(null);
    if (target < 0) {
      yield { type: 'solved' };
      return;
    }
    const targetRow = Math.floor(target / cols);
    const targetCol = target % cols;
    for (let pick = 0; pick < unused.length; pick += 1) {
      const name = unused[pick];
      for (const shape of shapes.get(name)) {
        // 正規形は行優先なので、目標のマスを覆えるのは先頭のセルだけ（enumerate.mjs と同じ）。
        const row = targetRow - shape[0][0];
        const col = targetCol - shape[0][1];
        if (!canPlace(board, shape, row, col).ok) continue;

        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = name;
        unused.splice(pick, 1);
        const ok = canContinue(board);
        yield {
          type: 'place', name, cells: shape, row, col, ok,
        };

        if (ok) yield* search();

        unused.splice(pick, 0, name);
        for (const [dr, dc] of shape) grid[(row + dr) * cols + (col + dc)] = null;
        yield { type: 'remove', name };
      }
    }
  }

  yield* search();
}

/**
 * `solveSteps()` のランダム版（デモで探し方を選べるようにするため。TODO-057）。
 *
 * 速く解くためではなく、人が試行錯誤しながら置いていく様子を見せるため。
 * 5 マスの穴に残りのピースがちょうど合う手があれば必ずそれを置く
 * （`forcedPlacements()`）。次に、覆えるピースが 1 種類しか無い空きマスが
 * あれば、そのピースでそのマスを覆う手に絞る（`singlePieceCell()`。TODO-082。
 * 閉じた 5 マスでなくても、人は入るピースが 1 つしか無いと分かるため）。
 * どちらも無ければ、まず「狭い所」（残りの手で覆える数が一番少ない空きマス。
 * `countCellMoves()`）を探し、そこを覆える手を持つ
 * ピースを `DEMO.randomTightWeight` で選ばれやすくして抽選する（TODO-061。
 * 人は「この隙間に入るのはどれか」と考えてピースを選ぶため）。選んだピースが
 * 狭い所を覆えるなら、置き方はそこを覆う手だけに絞る。置き方は一様に選ばず、
 * `touchingEdges()` で数えた「盤の外・穴・置き済みのマスに接する辺の数」を
 * `touchWeight()` で重みにして抽選する（人はまず端や既に置いたものへ寄せて
 * 置くため）。さらに直前に置いた手（`stack` の最後）からの `moveDistance()` が
 * 近いほど重みを大きくする（TODO-062。人は盤の上を飛び回らず近くから埋めるため）。
 *
 * 置いた直後に `canContinue(board)` が偽（その先に解が無い盤面）でも
 * **その場では外さない**。置ける手が尽きたら、`canContinue(board)` が真になるまで
 * 最後に置いた手から 1 手ずつ外す（スタックが空になったら止める。
 * `canContinue` が常に偽を返す盤でも外し続けないため）。
 * 解の無い盤面の上で置いた手（すぐ外した手も含む）が `DEMO.randomDeadLimit` 手に
 * 達したときも、尽きるのを待たずに同じく戻る（TODO-081。広い空きが残ると
 * なかなか尽きず、気づくまでに百手以上重ねていたため）。ただし次の 3 つは、
 * 人も置いた瞬間に詰みだと気づくので、行き詰まりを待たずにその場で外す。
 * 既定の `regionsFitPieces` は 1 つ目と同じ判定なので、既定のままだと偽の手は
 * 必ずその場で外れる（行き詰まってから戻すのは、デモのように全解のデータで
 * 判定を渡したとき）。
 *
 * - 5 の倍数でない大きさの閉じた空き（必ず解なし。1〜4・7・12 マスなど。
 *   TODO-060・068）
 * - 5 マスの穴に合う残りのピースで埋めた手が `canContinue` を偽にしたとき
 *   （その穴はそのピースでしか埋まらないので、埋める前の盤面がすでに解なし。
 *   埋めた手と、その前に置いた手をまとめて外す。TODO-066）
 * - 残りのピースのどの置き方でも覆えない空きマスができたとき
 *   （`hasUncoverableCell()`。細い袋小路や、置き済みのピースと同じ形の 5 マスの
 *   閉じた空きなど。ピースは 1 種 1 つなので必ず解なし。TODO-067・077）
 *
 * 外した手は盤面ごとに `failed` に控え、選び直さない（同じ失敗を繰り返すと
 * 試行錯誤に見えないため）。盤面ごとにするのは、失敗は盤面によって変わり、
 * 戻った先の盤面でも前の失敗をまた試さないため。空の盤で全部だめになった
 * ときだけ、空の盤の控えを消して選び直す。
 *
 * 同じ深さ（盤に残るピースの数）で「詰まり」が続くと、数手まとめて外す
 * （TODO-063。人は同じ所で詰まり続けると大きく崩してやり直すため）。
 * 「詰まり」に数えるのは、置ける手が尽きるか `DEMO.randomDeadLimit` に達して
 * `ok` が真になるまで戻る **行き詰まりの一続きだけ**（上限で戻るのは、尽きる
 * 前に気づいた行き詰まりなので同じに数える。TODO-081）。置いた直後にその場で外す手（上の 3 つ。
 * TODO-060・066〜068・077）は、試行錯誤して詰まったのではなく置き方が明らかに
 * 間違っていただけなので数えない。一続きが終わるたびに、そのときの
 * `stack.length` を深さとして回数を数える。回数が `DEMO.randomCollapseAfter` に
 * 達したら、`DEMO.randomCollapseMoves` 手（`stack` にある分まで）を 1 手ずつ
 * `undoLast()` で `remove` として yield する。外した手は、1 手外しと同じく
 * それぞれ外した後の盤面の控えへ入れる（同じ崩し方を繰り返さないため）。
 * 崩したあとは、状況が変わるので、崩した後の深さ以上の回数を消して数え直す。
 *
 * 最初の solved で終わる（デモは解のたびに作り直すので、次の解は探さない）。
 *
 * 返す手、`random`・`canContinue` の受け方、盤をその場で書き換えることは
 * `solveSteps()` と同じ。シードで手順を固定するため、乱数は `random` しか使わない。
 * `remove` にも、外した後の盤面での `canContinue(board)` を `ok` として付ける
 * （デモの HUD に出す。外した直後に解けるとは限らないため）。
 */
export function* solveStepsRandom(spec, random, canContinue = regionsFitPieces) {
  const board = createBoard(spec);
  const { rows, cols, grid } = board;
  const shapes = new Map(PIECES.map((piece) => [piece.name, orientations(piece.cells)]));
  const unused = PIECES.map((piece) => piece.name);
  const stack = [];
  // ponytail: 控えに上限は無く、外した手の数だけ増える。デモは解のたびに
  // 作り直すので、最初の解まで千件ほど（TODO-059 の実測）。
  // 増えて困るなら、戻るときに深い盤面の控えを捨てる。
  const failedByBoard = new Map();
  const failedOf = (key) => {
    if (!failedByBoard.has(key)) failedByBoard.set(key, new Set());
    return failedByBoard.get(key);
  };
  const pickOne = (items) => items[Math.floor(random() * items.length)];
  const fill = (move, value) => {
    for (const [dr, dc] of move.shape) grid[(move.row + dr) * cols + (move.col + dc)] = value;
  };
  // 今の盤面が解につながるか（空の盤は真）と、解の無い盤面で続けて置いた
  // 手の数（TODO-081）。解のある盤面か空の盤に戻ったら 0 に戻す（空の盤で
  // 戻さないと、canContinue が常に偽の盤では以後毎手すぐ戻ってしまう）。
  let boardOk = true;
  let deadMoves = 0;
  // 最後に置いた手を外して盤面ごとの控えに足し、yield する形で返す（TODO-060）。
  const undoLast = () => {
    const last = stack.pop();
    fill(last, null);
    unused.push(last.name);
    failedOf(boardKey(board)).add(last.key);
    boardOk = canContinue(board);
    if (boardOk || stack.length === 0) deadMoves = 0;
    return { type: 'remove', name: last.name, ok: boardOk };
  };
  // canContinue が真になるか、戻る手が無くなるまで 1 手ずつ外す。
  function* undoUntilOk() {
    while (stack.length > 0) {
      const step = undoLast();
      yield step;
      if (step.ok) break;
    }
  }
  // 深さ（盤に残るピースの数）ごとに、その深さで行き詰まった回数を数える（TODO-063）。
  const collapseCounts = new Map();
  // 行き詰まりの一続きが終わるたびに呼ぶ。回数が閾値に達したら数手まとめて外す。
  function* maybeCollapse() {
    const depth = stack.length;
    const count = (collapseCounts.get(depth) || 0) + 1;
    collapseCounts.set(depth, count);
    if (count < DEMO.randomCollapseAfter) return;
    const moves = Math.min(DEMO.randomCollapseMoves, stack.length);
    for (let i = 0; i < moves; i += 1) {
      yield undoLast();
    }
    const newDepth = stack.length;
    for (const key of [...collapseCounts.keys()]) {
      if (key >= newDepth) collapseCounts.delete(key);
    }
  }

  while (true) {
    if (unused.length === 0) {
      yield { type: 'solved' };
      return;
    }
    const failed = failedOf(boardKey(board));
    const choices = [];
    for (const name of unused) {
      const moves = [];
      shapes.get(name).forEach((shape, turn) => {
        for (let row = 0; row < rows; row += 1) {
          for (let col = 0; col < cols; col += 1) {
            const key = `${name}:${turn}:${row}:${col}`;
            if (!failed.has(key) && canPlace(board, shape, row, col).ok) {
              moves.push({
                name, shape, row, col, key,
              });
            }
          }
        }
      });
      if (moves.length > 0) choices.push(moves);
    }

    if (choices.length === 0) {
      if (stack.length === 0) { // 空の盤で全部だめなら、控えを消して選び直す
        failed.clear();
        continue;
      }
      // 置ける手が尽きた。解のある盤面まで戻る。
      yield* undoUntilOk();
      yield* maybeCollapse();
      continue;
    }

    // 5 マスの穴に合うピースがあれば、抽選より先にそれで埋める（TODO-066）。
    // 手は `choices` から拾うので、鍵の組み立てと `failed` の除外は上の 1 か所で済む。
    const forcedFound = forcedPlacements(board, unused);
    const forced = choices.flat().filter((m) => forcedFound.some(
      (f) => f.name === m.name && f.row === m.row && f.col === m.col && sameShape(f.cells, m.shape),
    ));
    let move;
    if (forced.length > 0) {
      move = pickOne(forced);
    } else {
      let movesForName;
      const single = singlePieceCell(choices, random);
      if (single) {
        // 1 種類のピースしか入らないマスがあれば、そのピースでそこを覆う（TODO-082）。
        movesForName = choices[single.pick].filter((m) => moveCoversCell(m, single.cellKey));
      } else {
        // 「狭い所」（覆える手が一番少ない空きマス）を覆えるピースを選ばれやすくし、
        // 選んだら狭い所を覆う置き方に絞る（TODO-061）。
        const tightCell = pickTightCell(countCellMoves(choices), random);
        const covering = choices.map((moves) => moves.filter((m) => moveCoversCell(m, tightCell)));
        const pick = pickWeighted(
          choices.map((_, i) => i),
          covering.map((moves) => (moves.length > 0 ? DEMO.randomTightWeight : 1)),
          random,
        );
        movesForName = covering[pick].length > 0 ? covering[pick] : choices[pick];
      }
      // 重みは選んだピースの置き方の分だけ数える。直前に置いた手（stack の最後）
      // からの近さも掛け、近くから順に埋めていく（TODO-062）。最初の手
      // （スタックが空）なら距離の項は掛けない。
      const last = stack[stack.length - 1];
      const weights = movesForName.map((m) => {
        const touch = touchWeight(touchingEdges(board, m.shape, m.row, m.col));
        return last ? touch / (1 + moveDistance(m, last)) ** DEMO.randomNearPower : touch;
      });
      move = pickWeighted(movesForName, weights, random);
    }
    if (!boardOk) deadMoves += 1;
    fill(move, move.name);
    unused.splice(unused.indexOf(move.name), 1);
    const ok = canContinue(board);
    boardOk = ok;
    stack.push(move);
    yield {
      type: 'place', name: move.name, cells: move.shape, row: move.row, col: move.col, ok,
    };
    if (forced.length > 0 && !ok) {
      // 穴に合うピースはそれしか無いので、埋めて解なしなら埋める前の盤面が
      // すでに解なし。その手と、その前に置いた手をまとめて外す（TODO-066）。
      // その場外しは「詰まり」に数えない（TODO-063。下の 2 つも同じ）。
      yield undoLast();
      if (stack.length > 0) yield undoLast();
    } else if (!regionsFitPieces(board)) {
      // 5 の倍数でない閉じた空きは必ず解なしなので、その場で外す（TODO-060・068）。
      yield undoLast();
    } else if (hasUncoverableCell(board, unused)) {
      // 残りのどのピースでも覆えない空きマスがあれば必ず解なし。置き済みの
      // ピースと同じ形の 5 マスの空き（TODO-067）もここに入る（TODO-077）。
      yield undoLast();
    }
    if (deadMoves >= DEMO.randomDeadLimit) {
      // 解の無い盤面で手を重ねすぎた。行き詰まりと同じく戻り、詰まりに数える（TODO-081）。
      yield* undoUntilOk();
      yield* maybeCollapse();
    }
  }
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
 * 盤ごとに決め打ちで書かず、実際に当てはめて穴の位置が一致するものを残すのは、
 * 盤を足したときに書き足さずに済ませるため。
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
 * 解は、盤の形を保つ変換で写してもやはり解になる。見た目だけ違う同じ解を
 * 別々に数えないよう、**写した中で `boardKey()` が一番小さいもの**を代表とする。
 * X ピースの位置で決めるやり方は、盤ごとに条件を立て直すことになるので採らない。
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
 * 履歴の 1 件は文字列なので、いったん盤へ戻してから `canonicalBoard()` に通す。
 * `storage.js` でなくここに置くのは、Phaser に依存しない計算を `logic.js` に
 * 集める規約のため。
 * `spec` は `{ rows, cols }` を持つ盤の定義（`BOARDS[key]` をそのまま渡せる）。
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
