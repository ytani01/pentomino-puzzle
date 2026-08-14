/**
 * 全解のデータを読み込み、盤面と突き合わせる（TODO-022）。
 *
 * 遊んでいる間の求解をやめて、あらかじめ数え上げておいた解を引くようにした
 * ものが、ここ。**探索が無くなったので、待たされることも「？？？」も無くなる**
 * （6×10 の詰みの盤面でヒントを押すと 2.8 秒画面が止まっていた）。
 *
 * データは `tools/gen-solutions.mjs` が作る（`src/data/*.js`）。持っているのは
 * **代表形だけ**で、回転・反転した見た目は読み込んだあとに `boardSymmetries()`
 * で展開する。6×10 なら 2339 件 → 9356 件で、文字列にして 1MB 弱。
 *
 * 照合は索引を作らずに線形になめる。6 ピース置いた盤面で 0.02ms なので、
 * 置くたびに全件なめても足りる。
 *
 * ここに置く計算は Phaser にも DOM にも触らない（`ensureSolutions()` が受け取る
 * `registry` は `get` / `set` を持つ入れ物というだけで、Phaser でなくてもよい）。
 */

import { HOLE, SOLUTIONS_REGISTRY_PREFIX } from './config.js';
import {
  boardKey, boardSymmetries, createBoard, normalize, transformBoard,
} from './logic.js';

/**
 * 盤ごとのデータの読み込み。**動的 import にしてある**のは、6×10 の 139KB を
 * その盤を選んだときまで読まないため（タイトル画面と 8×8 では読まない）。
 *
 * 読み込む先を変数ではなく決め打ちで並べてあるのは、パスが文字列として
 * そのまま見えるようにするため（組み立てたパスだと、置き場所を変えたときに
 * 動かしてみるまで気づけない）。
 */
const LOADERS = {
  '8x8': () => import('./data/8x8.js'),
  '6x10': () => import('./data/6x10.js'),
};

/** 読み込んだ表を `registry` に置くときのキー。盤ごとに分ける。 */
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
 * 展開に使う変換を `boardSymmetries()` から取るのは、盤の形を保つものだけに
 * 絞るため（6×10 を 90° 回すと 10×6 になって盤に載らない）。解そのものが
 * 対称で、写しても同じ見た目になることがあるので、重なった分は捨てる。
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
 * 覚えておく先をモジュールのトップレベルではなく `registry` にしてあるのは、
 * 書き換わる状態をモジュールへ持たせない決まりのため（盤や色の選択と同じ扱い）。
 * 2 つのシーンがほぼ同時に呼ぶと二度組み立てることがあるが、出来上がるものは
 * 同じなので実害は無い。
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
 * 既に読み込んであれば返し、無ければ `null`。
 * クリアの画面のように、**待たずにその場で要る**ところから使う
 * （本編を通ってきた時点で必ず読み込み済みなので、待つ意味が無い）。
 */
export function cachedSolutions(registry, spec) {
  return registry.get(solutionsRegistryKey(spec.key)) || null;
}

/**
 * 「盤に置いてあるピースと矛盾しないか」を判定する関数を作る。
 *
 * 調べる場所（置いてあるマス）を先に集めておくのは、解 1 件ごとに 60 マスを
 * なめ直さずに済ませるため。空きマスと穴は解の側が何であってもよい。
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
 * ヒント 1 手ぶん。**条件に合う解から無作為に 1 つ選び**、一番若い空きマスを
 * 覆うピースを取り出す（TODO-022）。
 *
 * どのピースを置くかを「一番若い空きマス」で決めるのは今までどおり。選んだ解が
 * 毎回違えば、そこから決まる手も自然に変わるので、探索順を混ぜて引き直していた
 * 仕掛け（TODO-017 の `shuffle` と `HINT_RETRIES`）は要らなくなった。
 * 終盤に候補が 1 つしか残っていなければ同じ手になるが、それはそもそも
 * 他の手が無いということ。
 *
 * `random` はテストから決まった選び方を作るための差し替え。
 */
export function hintFrom(solutions, board, random = Math.random) {
  const candidates = consistentSolutions(solutions, board);
  const target = board.grid.indexOf(null);
  if (candidates.length === 0 || target < 0) return { ok: false, placement: null };
  const key = candidates[Math.floor(random() * candidates.length)];
  return { ok: true, placement: placementIn(key, board.cols, key[target]) };
}

/** 完成した盤面（`boardKey()` の文字列）が何番の解か。データに無ければ `null`。 */
export function solutionNumber(solutions, cells) {
  return solutions.numbers.get(cells) || null;
}

/** 逆に、番号から代表形の文字列を引く。記録の画面が完成形を描くのに使う。 */
export function solutionCells(solutions, number) {
  return solutions.canonical[number - 1] || null;
}
