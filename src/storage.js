/**
 * クリア記録（最短時間と、クリアした回の履歴）の保存。
 *
 * localStorage は締め出されていることがある（プライベートウィンドウ、
 * サードパーティ Cookie の制限など）。読み書きに失敗しても遊べるように、
 * ここで例外を握りつぶし、呼ぶ側には「記録が無い」ように見せる。
 *
 * 記録は盤ごとに分けて持つ（保存先は `BOARDS[key].storageKey`。TODO-009）。
 */

import {
  BOARDS, DEFAULT_BOARD_KEY, DEFAULT_PALETTE_KEY, HISTORY_LIMIT, PALETTES,
  PALETTE_STORAGE_KEY,
} from './config.js';
import { solutionNumber } from './solutions.js';

/** 盤のキーから盤の定義を引く。知らない盤なら既定の盤として扱う。 */
function boardOf(boardKey) {
  return BOARDS[boardKey] || BOARDS[DEFAULT_BOARD_KEY];
}

/** 盤のキーから保存先を引く。知らない盤なら既定の盤の記録として扱う。 */
function keyOf(boardKey) {
  return boardOf(boardKey).storageKey;
}

/** 記録が無い、または読めなければ `null`。 */
export function loadBest(boardKey) {
  try {
    const raw = window.localStorage.getItem(keyOf(boardKey));
    if (raw === null) return null;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch (error) {
    return null;
  }
}

/**
 * 今回の時間で記録を更新する。
 * 戻り値は `{ best, updated }` で、`updated` が真なら記録を更新した。
 * 保存に失敗しても `best` は返すので、その回のクリア表示は正しく出せる。
 */
export function saveBest(boardKey, ms) {
  const previous = loadBest(boardKey);
  if (previous !== null && previous <= ms) return { best: previous, updated: false };
  try {
    window.localStorage.setItem(keyOf(boardKey), String(Math.round(ms)));
  } catch (error) {
    // 保存できなくても、その回の結果は表示できる。
  }
  return { best: ms, updated: true };
}

/**
 * 選んでいるピースの色の組（TODO-015）。読めなければ既定の組を返す。
 *
 * 盤の選択（`registry` に持つだけで、起動のたびに既定へ戻る）と違って
 * 覚えておくのは、見た目の好みは遊ぶたびに選び直すものではないため。
 * 知らないキーが入っていたら既定へ落とす（古い版で保存したものや、
 * 手で書き換えられたものを弾く）。
 */
export function loadPalette() {
  try {
    const key = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return PALETTES[key] ? key : DEFAULT_PALETTE_KEY;
  } catch (error) {
    return DEFAULT_PALETTE_KEY;
  }
}

/** 選んだ色の組を覚える。保存できなくても、その回の見た目は変わる。 */
export function savePalette(key) {
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, key);
  } catch (error) {
    // 覚えられなくても遊べる。次の起動で既定へ戻るだけ。
  }
}

/**
 * 記録に残してよいか（TODO-020）。
 *
 * ヒント・詰み表示のどちらかに頼ったら「自力ではない」と見なし、
 * 最短時間・履歴のどちらにも残さない。`clear.js` から使う。
 */
export function shouldRecord(usedHint, usedCheck) {
  return !usedHint && !usedCheck;
}

/** 記録を消す。タイトルからの操作用。 */
export function clearBest(boardKey) {
  try {
    window.localStorage.removeItem(keyOf(boardKey));
  } catch (error) {
    // 消せなくても実害は無い。
  }
}

/**
 * クリア記録の履歴（TODO-008）。1 件は次の形で、新しい順に並べて持つ。
 *
 * - `at` … クリアした時刻（エポックミリ秒）
 * - `ms` … その回の所要時間（ミリ秒）
 * - `no` … 何番の解か（代表形の番号。1 から数える。TODO-022）
 *
 * **60 マスぶんの文字列（`cells`）を持つのはやめた**（TODO-022）。全解を
 * データで持つようになったので、番号さえあれば完成形を引き直せる。回転・反転
 * しただけの解は同じ番号になるので、重複の判定も番号を見るだけで済む
 * （TODO-021 の `canonicalCellsKey()` はここでは要らなくなった）。
 *
 * ただし **TODO-022 より前に保存した件は `cells` を持っている**。読むときに
 * 番号へ読み替えるので捨てずに済む（`migrateHistory()`）。盤の縦横は保存先の
 * キー（`BOARDS[key].historyKey`）で決まるので、1 件には持たせない。
 */

/**
 * localStorage から読んだ値を、正しい件だけの配列にする（純関数）。
 *
 * `loadHistory()` の中に埋めず別に export しているのは、**localStorage を
 * 触らずに `tests.html` から検証できるようにするため**。壊れた値を書き込んで
 * 読み直す、といった手順を踏まずに済む。
 *
 * `value` は localStorage から読んだ生の文字列を渡す。既にパース済みの値
 * （配列など）をそのまま渡してもよい（テストから組み立てた配列を、JSON へ
 * 直してから渡し直さずに済ませるため）。`board` は `BOARDS[key]` の形で、
 * `rows` / `cols` から古い `cells` の正しい長さを出す。
 *
 * 手で書き換えられた値や、古い版・別の盤が書いた値が混ざりうるので、
 * 1 件ずつ検証して**壊れた件は黙って捨てる**（例外にしない。`loadPalette()`
 * が知らないキーを既定へ落とすのと同じ考え方）。番号を持つ件と、古い `cells`
 * を持つ件の**どちらも通す**——読み替えは解のデータが要るので、ここではしない。
 */
export function sanitizeHistory(value, board) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return [];   // 途中で切れた・別物が入っている。
    }
  }
  if (!Array.isArray(parsed)) return [];
  const length = board.rows * board.cols;
  return parsed.filter((entry) => (
    entry !== null && typeof entry === 'object'
    && typeof entry.at === 'number' && Number.isFinite(entry.at) && entry.at > 0
    && typeof entry.ms === 'number' && Number.isFinite(entry.ms) && entry.ms > 0
    && ((Number.isInteger(entry.no) && entry.no > 0)
      || (typeof entry.cells === 'string' && entry.cells.length === length))
  )).slice(0, HISTORY_LIMIT);
}

/**
 * 古い形の件（`cells` を持つ）を番号へ読み替える（純関数。TODO-022）。
 *
 * 読み替えられなかった件（データに無い盤面。手で書き換えられたものなど）は
 * 捨てる。番号を既に持つ件はそのまま通す。`solutions` が無いときは何もしない
 * ので、データが届く前でも一覧の日時と時間だけは出せる。
 */
export function migrateHistory(entries, solutions) {
  if (!solutions) return entries;
  const migrated = [];
  for (const entry of entries) {
    if (Number.isInteger(entry.no) && entry.no > 0) {
      migrated.push(entry);
      continue;
    }
    const no = solutionNumber(solutions, entry.cells);
    if (no !== null) migrated.push({ at: entry.at, ms: entry.ms, no });
  }
  return migrated;
}

/**
 * その盤の履歴を新しい順に返す。読めない・壊れている・localStorage が
 * 使えないときは空の配列（記録が無いのと同じに見せる）。
 *
 * `solutions`（`solutions.js` の読み込み済みデータ）を渡すと、古い形の件を
 * 番号へ読み替えて返す。渡さなければ保存されている形のまま返す。
 */
export function loadHistory(boardKey, solutions = null) {
  const board = boardOf(boardKey);
  try {
    const entries = sanitizeHistory(window.localStorage.getItem(board.historyKey), board);
    return migrateHistory(entries, solutions);
  } catch (error) {
    return [];
  }
}

/**
 * 1 件（`{ at, ms, no }`）を先頭へ足して保存し、保存後の配列を返す。
 *
 * あふれた古い件は捨てる（`HISTORY_LIMIT`）。保存に失敗しても配列は返すので、
 * その回の一覧は正しく出せる（`saveBest()` と同じ方針）。
 *
 * 同じ番号の解が既にあれば足さない（TODO-021）。記録の意味は「どのパターンを
 * クリアしたか」で、時間で順位付けはしないため、既にある件を書き換えることも
 * しない。回転・反転しただけの解は同じ番号になるので、番号を見るだけで足りる。
 *
 * `solutions` を渡すのは、**書き戻すときに古い形の件も番号へ揃えるため**
 * （読み替えずに書き戻すと、いつまでも `cells` の件が残ってしまう）。
 */
export function addHistory(boardKey, entry, solutions = null) {
  const board = boardOf(boardKey);
  const existing = loadHistory(boardKey, solutions);
  if (existing.some((item) => item.no === entry.no)) return existing;
  const next = sanitizeHistory([entry, ...existing], board);
  try {
    window.localStorage.setItem(board.historyKey, JSON.stringify(next));
  } catch (error) {
    // 保存できなくても、その回の一覧は表示できる。
  }
  return next;
}

/** その盤の履歴を消す。最短時間（`clearBest()`）とは別に消せる。 */
export function clearHistory(boardKey) {
  try {
    window.localStorage.removeItem(boardOf(boardKey).historyKey);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}

/**
 * 見つけた解の番号（TODO-022）。履歴（`HISTORY_LIMIT` = 50 件）とは**別に、
 * 番号だけを全部貯める**。達成度（8×8 なら「65 解中 12 解」）を出すため。
 *
 * 履歴の異なり数で代用しないのは、6×10 の全 2339 解に対して 50 で頭打ちに
 * なってしまうため。番号は 4 桁までなので、2339 件すべて貯めても 12KB ほどで、
 * 履歴 1 件（60 マスぶんの文字列）を 50 件持つのと大差ない。
 */

/**
 * localStorage から読んだ値を、正しい番号だけの昇順の配列にする（純関数）。
 * `count` はその盤の解の総数で、はみ出した番号は捨てる（データを作り直して
 * 数が変わったときや、手で書き換えられたものを弾く）。
 */
export function sanitizeFound(value, count) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set();
  for (const no of parsed) {
    if (Number.isInteger(no) && no > 0 && no <= count) seen.add(no);
  }
  return [...seen].sort((a, b) => a - b);
}

/** その盤で見つけた解の番号を昇順で返す。読めなければ空の配列。 */
export function loadFound(boardKey, count) {
  try {
    return sanitizeFound(window.localStorage.getItem(boardOf(boardKey).foundKey), count);
  } catch (error) {
    return [];
  }
}

/** 番号を 1 つ足して保存し、保存後の配列を返す。既にあれば何もしない。 */
export function addFound(boardKey, no, count) {
  const existing = loadFound(boardKey, count);
  if (existing.includes(no)) return existing;
  const next = sanitizeFound([...existing, no], count);
  try {
    window.localStorage.setItem(boardOf(boardKey).foundKey, JSON.stringify(next));
  } catch (error) {
    // 保存できなくても、その回のクリアは表示できる。
  }
  return next;
}

/** その盤で見つけた解の番号を消す。履歴を消すときに一緒に呼ぶ。 */
export function clearFound(boardKey) {
  try {
    window.localStorage.removeItem(boardOf(boardKey).foundKey);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}
