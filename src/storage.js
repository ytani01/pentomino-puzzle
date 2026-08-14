/**
 * クリア記録（最短時間）の保存。
 *
 * localStorage は締め出されていることがある（プライベートウィンドウ、
 * サードパーティ Cookie の制限など）。読み書きに失敗しても遊べるように、
 * ここで例外を握りつぶし、呼ぶ側には「記録が無い」ように見せる。
 *
 * 記録は盤ごとに分けて持つ（保存先は `BOARDS[key].storageKey`。TODO-009）。
 */

import { BOARDS, DEFAULT_BOARD_KEY } from './config.js';

/** 盤のキーから保存先を引く。知らない盤なら既定の盤の記録として扱う。 */
function keyOf(boardKey) {
  return (BOARDS[boardKey] || BOARDS[DEFAULT_BOARD_KEY]).storageKey;
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

/** 記録を消す。タイトルからの操作用。 */
export function clearBest(boardKey) {
  try {
    window.localStorage.removeItem(keyOf(boardKey));
  } catch (error) {
    // 消せなくても実害は無い。
  }
}
