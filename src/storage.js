/**
 * クリア記録（最短時間）の保存。
 *
 * localStorage は締め出されていることがある（プライベートウィンドウ、
 * サードパーティ Cookie の制限など）。読み書きに失敗しても遊べるように、
 * ここで例外を握りつぶし、呼ぶ側には「記録が無い」ように見せる。
 *
 * 記録は盤ごとに分けて持つ（保存先は `BOARDS[key].storageKey`。TODO-009）。
 */

import {
  BOARDS, DEFAULT_BOARD_KEY, DEFAULT_PALETTE_KEY, PALETTES, PALETTE_STORAGE_KEY,
} from './config.js';

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

/** 記録を消す。タイトルからの操作用。 */
export function clearBest(boardKey) {
  try {
    window.localStorage.removeItem(keyOf(boardKey));
  } catch (error) {
    // 消せなくても実害は無い。
  }
}
