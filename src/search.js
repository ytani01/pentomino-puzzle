/**
 * デモ（とタイトルの動くボード）のための探索。深さ優先の `solveSteps()` と、
 * 人の探し方に似せたランダムの `solveStepsRandom()`、その抽選の重みの計算を置く。
 *
 * 本編の判定（`logic.js`）と分けて読めるよう、本編が使わないこの探索を別の
 * ファイルにした。`logic.js` が `search.js` を読み込む形にはしない（循環を避ける）。
 * `tests.html` から確かめられるよう、Phaser にも DOM にも依存しない純関数だけを置く。
 */

import { DEMO, PIECES } from './config.js';
import {
  boardKey, canPlace, cellAt, createBoard, forcedPlacements, hasUncoverableCell,
  orientations, regionsFitPieces, sameShape,
} from './logic.js';

/**
 * 置いたときに、ボードの外・穴・置き済みのマスへ接する辺の数を返す（TODO-059）。
 * ランダム探索の置き場所の重み付けに使う。`cellAt()` はボードの外・穴とも `HOLE` を
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
 * ほど選ばれやすいよう、2 乗して差を広げる。接する辺が 0（ボードの真ん中に
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
 * 手が覆うマスを `"row,col"` の並びで返す。マスごとに数を数えたり、狭い所を
 * 覆うかを見たりする 3 か所（`countCellMoves()`・`singlePieceCell()`・
 * `moveCoversCell()`）で、マスの鍵の作り方を揃えるため。
 */
function moveCellKeys(move) {
  return move.shape.map(([dr, dc]) => `${move.row + dr},${move.col + dc}`);
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
      for (const key of moveCellKeys(move)) {
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
      for (const key of moveCellKeys(move)) {
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
  return moveCellKeys(move).includes(cellKey);
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
 * 空のボードから深さ優先で解を探し、1 手ずつ返す（デモ用。TODO-040）。
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
 * 探索のボードはここに閉じた作業用の配列で、**その場で書き換える**。1 万手で
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
 * `solveStepsRandom()` の今の盤面で、残りのピース（`unused`）ごとに置ける手を集める。
 * 置ける手の無いピースは入れない。控え（`failed`）にある手は除く。
 *
 * 探索の状態（スタックや行き詰まりの数）に触らない部分を外に出し、
 * `solveStepsRandom()` 本体を状態の出し入れだけで読めるようにするため。
 * 手の `key`（`名前:向き:行:列`）は控えに入れる鍵で、ここでしか組み立てない。
 */
function placeableMoves(board, shapes, unused, failed) {
  const { rows, cols } = board;
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
  return choices;
}

/**
 * `solveStepsRandom()` で次に置く手を選ぶ。選ぶ順は、詰めて置く手（5 マスの穴に
 * 合うピース。TODO-066）→ 1 種類のピースしか入らないマス（TODO-082）→
 * 狭い所（TODO-061）で、最後に置き方を重みで抽選する（TODO-059・062）。
 * 理由はそれぞれ `solveStepsRandom()` の説明にある。
 *
 * `placeableMoves()` と同じく、探索の状態に触らない部分を外に出したもの。
 * **`random` を呼ぶ順番と回数は、出す前と同じに保つ**（同じ種から同じ手順を
 * 出すため。テストとデモの再現がこれに頼る）。`last` は直前に置いた手で、
 * 最初の手なら `undefined`。`forced` は詰めて置く手を選んだか（置いて解なしなら
 * 前の手もまとめて外すのに使う）。
 */
function chooseMove(board, choices, unused, last, random) {
  // 手は `choices` から拾うので、鍵の組み立てと `failed` の除外は `placeableMoves()` の 1 か所で済む。
  const forcedFound = forcedPlacements(board, unused);
  const forced = choices.flat().filter((m) => forcedFound.some(
    (f) => f.name === m.name && f.row === m.row && f.col === m.col && sameShape(f.cells, m.shape),
  ));
  if (forced.length > 0) {
    return { move: forced[Math.floor(random() * forced.length)], forced: true };
  }
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
  // 重みは選んだピースの置き方の分だけ数える。直前に置いた手からの近さも掛け、
  // 近くから順に埋めていく（TODO-062）。最初の手なら距離の項は掛けない。
  const weights = movesForName.map((m) => {
    const touch = touchWeight(touchingEdges(board, m.shape, m.row, m.col));
    return last ? touch / (1 + moveDistance(m, last)) ** DEMO.randomNearPower : touch;
  });
  return { move: pickWeighted(movesForName, weights, random), forced: false };
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
 * `touchingEdges()` で数えた「ボードの外・穴・置き済みのマスに接する辺の数」を
 * `touchWeight()` で重みにして抽選する（人はまず端や既に置いたものへ寄せて
 * 置くため）。さらに直前に置いた手（`stack` の最後）からの `moveDistance()` が
 * 近いほど重みを大きくする（TODO-062。人はボードの上を飛び回らず近くから埋めるため）。
 *
 * 置いた直後に `canContinue(board)` が偽（その先に解が無い盤面）でも
 * **その場では外さない**。置ける手が尽きたら、`canContinue(board)` が真になるまで
 * 最後に置いた手から 1 手ずつ外す（スタックが空になったら止める。
 * `canContinue` が常に偽を返すボードでも外し続けないため）。
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
 * 戻った先の盤面でも前の失敗をまた試さないため。空のボードで全部だめになった
 * ときだけ、空のボードの控えを消して選び直す。
 *
 * 同じ深さ（ボードに残るピースの数）で「詰まり」が続くと、数手まとめて外す
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
 * 返す手、`random`・`canContinue` の受け方、ボードをその場で書き換えることは
 * `solveSteps()` と同じ。シードで手順を固定するため、乱数は `random` しか使わない。
 * `remove` にも、外した後の盤面での `canContinue(board)` を `ok` として付ける
 * （デモの HUD に出す。外した直後に解けるとは限らないため）。
 */
export function* solveStepsRandom(spec, random, canContinue = regionsFitPieces) {
  const board = createBoard(spec);
  const { cols, grid } = board;
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
  const fill = (move, value) => {
    for (const [dr, dc] of move.shape) grid[(move.row + dr) * cols + (move.col + dc)] = value;
  };
  // 今の盤面が解につながるか（空のボードは真）と、解の無い盤面で続けて置いた
  // 手の数（TODO-081）。解のある盤面か空のボードに戻ったら 0 に戻す（空のボードで
  // 戻さないと、canContinue が常に偽のボードでは以後毎手すぐ戻ってしまう）。
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
  // 深さ（ボードに残るピースの数）ごとに、その深さで行き詰まった回数を数える（TODO-063）。
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
    const choices = placeableMoves(board, shapes, unused, failed);

    if (choices.length === 0) {
      if (stack.length === 0) { // 空のボードで全部だめなら、控えを消して選び直す
        failed.clear();
        continue;
      }
      // 置ける手が尽きた。解のある盤面まで戻る。
      yield* undoUntilOk();
      yield* maybeCollapse();
      continue;
    }

    const { move, forced } = chooseMove(board, choices, unused, stack[stack.length - 1], random);
    if (!boardOk) deadMoves += 1;
    fill(move, move.name);
    unused.splice(unused.indexOf(move.name), 1);
    const ok = canContinue(board);
    boardOk = ok;
    stack.push(move);
    yield {
      type: 'place', name: move.name, cells: move.shape, row: move.row, col: move.col, ok,
    };
    if (forced && !ok) {
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
