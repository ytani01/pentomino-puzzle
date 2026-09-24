/**
 * 盤面とピースの計算。Phaser にも DOM にも依存しない純関数だけを置く
 * （`tests.html` から確かめられるようにするため）。
 *
 * セルは `[行, 列]` の配列。ピースの形は「左上を原点へ寄せ、行優先で並べた」
 * 正規形で扱う。正規形にしておくと、向きの同一判定が配列の比較だけで済む。
 */

import { HOLE, PIECES, PIECE_SIZE } from './config.js';

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
 * 空き領域を上下左右の連結で分け、領域ごとのマスの添字を返す（見つけた順は行優先）。
 * 大きさだけ要る枝刈りと、形まで要る `forcedPlacements()` で塗り方を 1 つにするため。
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
 * 求解では「5 で割り切れない塊があれば置き方が無い」という枝刈りに使う。
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
 * 解ける盤面なら、その空きはそのピースで埋めるしかない（12 種の形はどれも違う）ので、
 * 埋めても解けるまま。1 つ埋めても他の空きは変わらないので、一度に全部返す。
 * 解の有無は見ない（形だけ）。同じピースが 2 つの空きに当たる盤面は解なしだが、
 * 1 つのピースを 2 回置く手は返さないよう、最初の 1 つだけにする。
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

/** 空き領域の大きさがすべて 5 の倍数か。`emptyRegionSizes()` の判定部分。 */
export function regionsFitPieces(board) {
  return emptyRegionSizes(board).every((size) => size % PIECE_SIZE === 0);
}

/**
 * 置いたときに、盤の外・穴・置き済みのマスへ接する辺の数を返す（TODO-059）。
 * ランダム探索の置き場所の重み付けに使う。`cellAt()` は盤外・穴とも
 * `HOLE`（`null` ではない値）を返すので、`null` 以外を「接している」とみなせば
 * 3 つを区別せずに数えられる。ピース自身の内側の辺（隣り合う自分のマス）は
 * 接しているとは数えない。
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
 * ほど選ばれやすくしたいので 2 乗して差を広げる。接する辺が 0（盤の真ん中に
 * 独立して置く手）でも重み 0 にはしないよう +1 する（重みが全部 0 だと
 * 抽選できないうえ、そういう置き方も人はときどきする）。
 */
function touchWeight(count) {
  return (count + 1) ** 2;
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

/** Fisher–Yates で並びを入れ替える（渡した配列をそのまま入れ替えて返す）。 */
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
 * 画面を止めずに探す様子を見せるため、探索を generator にして呼ぶ側が
 * フレームごとに好きな手数だけ `next()` する。探し方は一番若い空きマスを埋め、
 * 置いたら `canContinue(board)` で先へ進むかを決める。既定の `regionsFitPieces`
 * （5 の倍数でない空き領域が出たら捨てる）なら `tools/enumerate.mjs` と同じで、
 * 違うのは始める前に 1 回だけピースの並びと各ピースの向きの並びを `random` で
 * 入れ替えることだけ。毎回違う試し方と解を見せるため。`random` を外から
 * 受けるのは、テストでシード付きの乱数を渡して手順を固定するため。
 * `canContinue` を外から受けるのは、デモが全解のデータで「解ける／解なし」を
 * 調べ、ヒント表示を入にして解く人と同じ動きにするため（TODO-043。
 * `logic.js` は全解のデータを持たないので、判定ごと渡してもらう）。
 *
 * 返すのは `{ type: 'place', name, cells, row, col, ok }`・`{ type: 'remove', name }`・
 * `{ type: 'solved' }`。`ok` は置いたあとの `canContinue` の結果で、デモが HUD に
 * 出す。判定を yield の前にしてあるのはそのためで、探索の順と手は変わらない。
 * 捨てる置き方も place と remove の 2 手として返す（試して戻す様子を見せるため）。
 * solved のあとも `next()` すれば次の解を探し、全部探し終えたら終わる。
 *
 * `place` の `cells` は探索が持っている向きの配列そのもの（写しを作らない）。
 * 受け取った側で書き換えると以降の探索が狂うので、読むだけにする。
 *
 * 探索の盤はここに閉じた作業用の配列で、**その場で書き換える**。1 万手で
 * 50ms ほどの速さを保つため（毎手作り直すと割に合わない）。外へ渡すのは上の
 * 記述だけで、本編の盤面（Undo の履歴が参照するもの）とは別物なので、
 * 「盤面は書き換えず作り直す」の決まりとはぶつからない。
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
 * ピースは残りから `random` で一様に選ぶが、置き方は一様に選ばない。
 * `touchingEdges()` で数えた「盤の外・穴・置き済みのマスに接する辺の数」を
 * `touchWeight()` で重みにして抽選する（隅や、置いたピースの隣に置きやすく
 * なる。人はまず端や既に置いたものへ寄せて置くため）。
 *
 * 置いた直後に `canContinue(board)` が偽（そこから先は解が無い盤面）でも
 * **その場では外さない**（置ける手が尽きたら、`canContinue(board)` が真になるまで
 * 最後に置いた手から順に 1 手ずつ外す。スタックが空になったら諦めて止める。
 * `canContinue` が常に偽を返す盤でも無限に外し続けないため）。ただし、
 * 小さな閉じた空き（ピースより小さい。埋めようが無く必ず解無しになる）だけは
 * 置いた瞬間に気づいて外す（TODO-060）。人も置いた瞬間に気づくのはこの手の
 * 明らかな詰みだけで、7 や 12 マスのような大きい空きは今までどおり行き詰まって
 * から戻す。
 *
 * 外した手は、盤面ごとに `failed` に控えて選び直さない（同じ失敗を
 * 繰り返すと試行錯誤に見えないため）。盤面ごとにするのは、失敗は盤面によって
 * 変わるうえ、外して戻った先の盤面でも前の失敗をまた試さないため。
 * 空の盤で全部だめになったときだけ、空の盤の控えを消して選び直す。
 *
 * 最初の solved で終わる（`solveSteps()` と違い次の解は探さない。デモは解の
 * たびに作り直すため）。
 *
 * 返す手、`random`・`canContinue` の受け方、盤をその場で書き換えることは
 * `solveSteps()` と同じ。乱数は `random` しか使わない（シードで手順を固定するため）。
 * `remove` にも、外した後の盤面での `canContinue(board)` を `ok` として付ける
 * （デモの HUD 表示に使う。外した直後は必ず解けるとは限らないため）。
 */
export function* solveStepsRandom(spec, random, canContinue = regionsFitPieces) {
  const board = createBoard(spec);
  const { rows, cols, grid } = board;
  const shapes = new Map(PIECES.map((piece) => [piece.name, orientations(piece.cells)]));
  const unused = PIECES.map((piece) => piece.name);
  const stack = [];
  // ponytail: 控えに上限は無い。外した手の数だけ増える。デモの `hasSolution` でも
  // 行き詰まるが、解のたびに作り直すので最初の解まで千件ほど（TODO-059 の実測）。
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
  // 最後に置いた手を 1 つ外し、盤面ごとの控えに足して yield する形をそのまま返す（TODO-060）。
  const undoLast = () => {
    const last = stack.pop();
    fill(last, null);
    unused.push(last.name);
    failedOf(boardKey(board)).add(last.key);
    return { type: 'remove', name: last.name, ok: canContinue(board) };
  };

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
      if (stack.length === 0) { // 空の盤で全部だめだったとき。控えを消して選び直す
        failed.clear();
        continue;
      }
      // 置ける手が無くなった。canContinue が真になるまで、または戻る手が
      // 無くなるまで 1 手ずつ外す。
      while (stack.length > 0) {
        const step = undoLast();
        yield step;
        if (step.ok) break;
      }
      continue;
    }

    const movesForName = pickOne(choices);
    // 重みは選んだピースの置き方の分だけ数える（全ピース分は要らない）。
    const weights = movesForName.map((m) => touchWeight(touchingEdges(board, m.shape, m.row, m.col)));
    const move = pickWeighted(movesForName, weights, random);
    fill(move, move.name);
    unused.splice(unused.indexOf(move.name), 1);
    const ok = canContinue(board);
    stack.push(move);
    yield {
      type: 'place', name: move.name, cells: move.shape, row: move.row, col: move.col, ok,
    };
    // 小さな閉じた空き（ピースより小さい）は詰みが確定しているので、
    // 行き詰まりを待たずにその場で外す（TODO-060）。
    if (emptyRegionSizes(board).some((size) => size < PIECE_SIZE)) {
      yield undoLast();
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
