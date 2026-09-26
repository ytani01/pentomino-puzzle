/**
 * 全解のデータを読み込み、盤面と突き合わせる（TODO-022）。
 *
 * 遊んでいる間は探索せず、あらかじめ数え上げた解を引く。**探索しないので
 * 待たされない**。
 *
 * データは `tools/gen-solutions.mjs` が作る（`src/data/*.js`）。持つのは
 * **代表形だけ**で、回転・反転した見た目は読み込んだあとに `boardSymmetries()`
 * で展開する。6×10 なら 2339 件 → 9356 件で、文字列にして 1MB 弱。
 *
 * 照合は索引を作らずに線形になめる。6 ピース置いた盤面で 0.02ms なので、
 * 置くたびに全件なめても足りる。
 *
 * Phaser にも DOM にも触らない（`ensureSolutions()` の `registry` は
 * `get` / `set` を持つ入れ物なら何でもよい）。
 */

import { HOLE, SOLUTIONS_REGISTRY_PREFIX } from './config.js';
import {
  boardKey, boardSymmetries, createBoard, normalize, transformBoard,
} from './logic.js';

/**
 * ボードごとのデータの読み込み。**動的 import にする**のは、6×10 の 139KB を
 * そのボードを選ぶまで読まないため（タイトル画面と 8×8 では読まない）。
 *
 * パスを組み立てずに決め打ちで並べるのは、パスが文字列のまま見え、
 * 置き場所を変えたときに動かす前に気づけるため。
 */
const LOADERS = {
  '8x8': () => import('./data/8x8.js'),
  '6x10': () => import('./data/6x10.js'),
};

/** 読み込んだ表を `registry` に置くときのキー。ボードごとに分ける。 */
export function solutionsRegistryKey(key) {
  return `${SOLUTIONS_REGISTRY_PREFIX}${key}`;
}

/**
 * 代表形の並びから、盤面と突き合わせられる表を作る（純関数）。
 *
 * - `canonical` … 読み込んだ代表形そのまま。**添字 + 1 が解の番号**
 * - `keys` … 回転・反転まで展開した盤面の文字列。照合はこれをなめる
 * - `numbers` … 展開した文字列 → 番号。完成形が何番かを引くのに使う
 *
 * 変換を `boardSymmetries()` から取るのは、ボードの形を保つものだけに絞るため
 * （6×10 を 90° 回すと 10×6 になってボードに載らない）。対称な解は写しても
 * 同じ見た目になることがあるので、重なった分は捨てる。
 */
export function buildSolutions(spec, canonical) {
  const symmetries = boardSymmetries(createBoard(spec));
  const numbers = new Map();
  const keys = [];
  canonical.forEach((cells, index) => {
    const board = { rows: spec.rows, cols: spec.cols, grid: Array.from(cells) };
    for (const symmetry of symmetries) {
      const key = boardKey(transformBoard(board, symmetry));
      if (numbers.has(key)) continue;
      numbers.set(key, index + 1);
      keys.push(key);
    }
  });
  return {
    spec, canonical, keys, numbers,
  };
}

/**
 * 読み込んで `registry` へ置き、次からはそれを返す。
 *
 * モジュールではなく `registry` に覚えるのは、書き換わる状態をモジュールに
 * 持たせない決まりのため（ボードや色の選択と同じ）。2 つのシーンがほぼ同時に
 * 呼ぶと二度組み立てることがあるが、同じものができるので実害は無い。
 */
export async function ensureSolutions(registry, spec) {
  const key = solutionsRegistryKey(spec.key);
  const cached = registry.get(key);
  if (cached) return cached;
  const loaded = await LOADERS[spec.key]();
  const built = buildSolutions(spec, loaded.SOLUTIONS);
  registry.set(key, built);
  return built;
}

/**
 * 読み込み済みなら返し、無ければ `null`。クリアの画面のように**待たずに
 * その場で要る**ところで使う（本編を通ってきた時点で必ず読み込み済み）。
 */
export function cachedSolutions(registry, spec) {
  return registry.get(solutionsRegistryKey(spec.key)) || null;
}

/**
 * 「ボードに置いてあるピースと矛盾しないか」を判定する関数を作る。
 *
 * 置いてあるマスを先に集めるのは、解 1 件ごとに 60 マスをなめ直さないため。
 * 空きマスと穴は、解の側が何であってもよい。
 */
function matcher(board) {
  const placed = [];
  for (let index = 0; index < board.grid.length; index += 1) {
    const value = board.grid[index];
    if (value !== null && value !== HOLE) placed.push(index);
  }
  return (key) => placed.every((index) => key[index] === board.grid[index]);
}

/** 今の盤面から到達できる解を全部返す（展開済みの文字列）。 */
export function consistentSolutions(solutions, board) {
  return solutions.keys.filter(matcher(board));
}

/** 今の盤面から最後まで置けるか。1 件見つかった時点で打ち切る。 */
export function hasSolution(solutions, board) {
  return solutions.keys.some(matcher(board));
}

/**
 * 解の文字列から、1 つのピースの置き方（正規形と左上の位置）を取り出す。
 * 同じ名前の付いたマスを集めるだけで、形と位置がそのまま決まる。
 */
export function placementIn(cells, cols, name) {
  const found = [];
  for (let index = 0; index < cells.length; index += 1) {
    if (cells[index] === name) found.push([Math.floor(index / cols), index % cols]);
  }
  if (found.length === 0) return null;
  let row = Infinity;
  let col = Infinity;
  for (const [r, c] of found) {
    if (r < row) row = r;
    if (c < col) col = c;
  }
  return { name, cells: normalize(found), row, col };
}

/**
 * おまかせ 1 手ぶん。**条件に合う解から無作為に 1 つ選び**、一番若い空きマスを
 * 覆うピースを取り出す（TODO-022）。
 *
 * 解を無作為に選ぶので、同じ盤面でも出る手は毎回変わる（手を混ぜる仕掛けは
 * 要らない。TODO-017）。終ボードに候補が 1 つしか残っていなければ同じ手になるが、
 * それは他の手が無いということ。
 *
 * `random` は、テストで選び方を固定するための差し替え。
 *
 * `avoid` には**既に出した解の番号の集合**を渡す（TODO-016）。同じボードを何度も
 * 解くと毎回同じ解へ導かれないよう、まだ出していない解を優先する。渡さなければ
 * 全候補から選ぶ。
 *
 * **避けきれないときは避けずに選ぶ。** 置いてあるピースから既出の解にしか
 * 繋がらないことがあり、何も出さないより既出でも 1 手を出すほうが役に立つ。
 * 8×8 は全 65 解しか無いので、遊び込めば必ずここへ来る。
 *
 * 戻り値の `no` は選んだ解の番号。呼ぶ側が「この解は出した」と覚えるのに使う。
 */
export function autoFrom(solutions, board, random = Math.random, avoid = null) {
  const all = consistentSolutions(solutions, board);
  const target = board.grid.indexOf(null);
  if (all.length === 0 || target < 0) return { ok: false, placement: null, no: null };
  let candidates = all;
  if (avoid && avoid.size > 0) {
    const fresh = all.filter((key) => !avoid.has(solutions.numbers.get(key)));
    if (fresh.length > 0) candidates = fresh;
  }
  const key = candidates[Math.floor(random() * candidates.length)];
  return {
    ok: true,
    placement: placementIn(key, board.cols, key[target]),
    no: solutions.numbers.get(key),
  };
}

/** 完成した盤面（`boardKey()` の文字列）が何番の解か。データに無ければ `null`。 */
export function solutionNumber(solutions, cells) {
  return solutions.numbers.get(cells) || null;
}

/** 番号から代表形の文字列を引く。記録の画面が完成形を描くのに使う。 */
export function solutionCells(solutions, number) {
  return solutions.canonical[number - 1] || null;
}
