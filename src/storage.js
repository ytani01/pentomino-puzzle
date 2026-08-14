/**
 * クリア記録（最短時間）の保存。
 *
 * localStorage は締め出されていることがある（プライベートウィンドウ、
 * サードパーティ Cookie の制限など）。読み書きに失敗しても遊べるように、
 * ここで例外を握りつぶし、呼ぶ側には「記録が無い」ように見せる。
 */

import { STORAGE_KEY } from './config.js';

/** 記録が無い、または読めなければ `null`。 */
export function loadBest() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
export function saveBest(ms) {
  const previous = loadBest();
  if (previous !== null && previous <= ms) return { best: previous, updated: false };
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.round(ms)));
  } catch (error) {
    // 保存できなくても、その回の結果は表示できる。
  }
  return { best: ms, updated: true };
}

/** 記録を消す。タイトルからの操作用。 */
export function clearBest() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}
