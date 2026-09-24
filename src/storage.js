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
  PALETTE_STORAGE_KEY, PIECES,
} from './config.js';
import {
  canPlace, createBoard, normalize, orientations, place, sameShape,
} from './logic.js';
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
 * 最短時間を更新してよいか（TODO-020、TODO-024）。
 *
 * おまかせ・ヒント表示のどちらかに頼ったら「自力ではない」と見なし、
 * 最短時間には入れない。本編（`game.js`）とクリア表示（`clear.js`）から使う。
 *
 * **見るのは最短時間だけ**（TODO-024）。前は履歴と達成度も同じ判定で
 * 落としていたが、それだと解けた回そのものが残らず、あとから
 * 「どのパターンを解いたか」を辿れなかった。今は履歴と達成度には残し、
 * 履歴の側に「何に頼ったか」の印（`a` / `h`）を付けて見分ける。
 */
export function shouldRecordBest(usedAuto, usedHint) {
  return !usedAuto && !usedHint;
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
 * - `a` … おまかせを使った回なら `true`（TODO-024、TODO-028）
 * - `h` … ヒント表示を使った回なら `true`（TODO-024、TODO-028）
 *
 * **`a` / `h` は使ったときだけ持たせる**（偽なら鍵ごと省く）。自力で解いた回が
 * 記録の大半になるので、そちらを今までと同じ形のままにしておくと、TODO-024
 * より前に保存した件と見分ける必要がなくなる（印が無い＝自力）。
 *
 * 印の文字は TODO-028 で `h` / `c` から `a` / `h` へ付け替えた。**`h` の指す
 * ものが入れ替わる**（前はおまかせ、今はヒント表示）ので、`historyKey` の値も
 * 一緒に変えて、前の版が書いた件を読まないようにしてある。
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
 *
 * 通った件は組み立て直して返す。持っている鍵を `at` / `ms` / `no`（または
 * `cells`）と、真の `a` / `h` だけに絞るためで、知らない鍵や `a: 1` のような
 * 値がそのまま保存へ戻らないようにしてある（TODO-024）。
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
  )).slice(0, HISTORY_LIMIT).map((entry) => {
    // 番号を持つ件は番号で持つ（`cells` も付いていたら番号の側を採る。
    // `migrateHistory()` と同じ優先順）。
    const item = Number.isInteger(entry.no) && entry.no > 0
      ? { at: entry.at, ms: entry.ms, no: entry.no }
      : { at: entry.at, ms: entry.ms, cells: entry.cells };
    if (entry.a === true) item.a = true;
    if (entry.h === true) item.h = true;
    return item;
  });
}

/**
 * 古い形の件（`cells` を持つ）を番号へ読み替える（純関数。TODO-022）。
 *
 * 読み替えられなかった件（データに無い盤面。手で書き換えられたものなど）は
 * 捨てる。番号を既に持つ件はそのまま通す。`solutions` が無いときは何もしない
 * ので、データが届く前でも一覧の日時と時間だけは出せる。
 *
 * `cells` だけを番号へ差し替え、ほかの鍵（`a` / `h`）はそのまま持ち越す。
 * 古い件は印を持たないので何も付かないが、鍵を並べ直すと印を落としてしまう
 * ので、残す側を書き並べない形にしてある（TODO-024）。
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
    if (no === null) continue;
    const { cells, ...rest } = entry;
    migrated.push({ ...rest, no });
  }
  return migrated;
}

/**
 * その盤の履歴を新しい順に返す。読めない・壊れている・localStorage が
 * 使えないときは空の配列（記録が無いのと同じに見せる）。
 *
 * `solutions`（`solutions.js` の読み込み済みデータ）を渡すと、古い形の件を
 * 番号へ読み替えて返す。渡さなければ保存されている形のまま返す。
 * 同じ番号の件は、読むたびに成績が一番よい 1 件にまとめる（`dedupeHistory()`。TODO-072）。
 */
export function loadHistory(boardKey, solutions = null) {
  const board = boardOf(boardKey);
  try {
    const entries = sanitizeHistory(window.localStorage.getItem(board.historyKey), board);
    return dedupeHistory(migrateHistory(entries, solutions));
  } catch (error) {
    return [];
  }
}

/**
 * `entry` の成績が `other` より**よい**か（TODO-072）。同じなら偽。
 *
 * おまかせ・ヒント表示の印（`a` / `h`）が無い回を先に立て、印の有無が
 * 同じときだけ経過時間の短いほうをよいとする。印は「あるか無いか」だけを
 * 見て、`a` と `h` のどちらか・両方かは比べない（どれも「自力ではない」で、
 * 最短時間から外す判定 `shouldRecordBest()` と同じ区切り）。
 */
export function isBetterClear(entry, other) {
  const marked = (item) => item.a === true || item.h === true;
  if (marked(entry) !== marked(other)) return !marked(entry);
  return entry.ms < other.ms;
}

/**
 * 同じ番号の件を、成績が一番よい 1 件にまとめる（純関数。TODO-072）。
 *
 * TODO-072 より前は「最初に解いた回を残し、後の回は足さない」だったので
 * 同じ番号は 1 件のはずだが、手で書き換えたものや古い `cells` の件を番号へ
 * 読み替えたときに重なることがある。読むたびにここを通すので、画面と
 * 書き戻し（`recordClear()`・`removeHistory()` など）はまとめた形だけを見る。
 * 残した件は元の位置（新しい順）のまま。成績が同じなら新しいほうを残す。
 * 番号を持たない件（読み替える前の `cells`）はそのまま通す。
 */
export function dedupeHistory(entries) {
  const best = new Map();
  for (const entry of entries) {
    if (!Number.isInteger(entry.no)) continue;
    const kept = best.get(entry.no);
    if (kept === undefined || isBetterClear(entry, kept)) best.set(entry.no, entry);
  }
  return entries.filter((entry) => !Number.isInteger(entry.no) || best.get(entry.no) === entry);
}

/**
 * 完成した 1 回（`{ at, ms, no, a?, h? }`）を履歴へ反映し、どうなったかを返す
 * （TODO-072）。本編が完成を見つけるたびに呼ぶ（続けて作った解も同じ）。
 *
 * - `'new'` … その番号が履歴に無かったので、先頭へ足した
 * - `'improved'` … 履歴の件より成績がよい（`isBetterClear()`）ので、その件を
 *   外して今回の件を先頭へ足した（日時・経過時間・印が今回のものになる）
 * - `'kept'` … 履歴の件のほうがよいか同じなので、何も書かない
 *
 * 書き換えた件を先頭へ移すのは、履歴を日時の新しい順に保つため。
 * あふれた古い件は捨てる（`HISTORY_LIMIT`）。回転・反転しただけの解は同じ
 * 番号になるので、同じ解かどうかは番号を見るだけで足りる。
 * `solutions` は、**書き戻すときに古い `cells` の件を番号へ揃えるため**に渡す
 * （読み替えずに書き戻すと、いつまでも `cells` の件が残ってしまう）。
 * 保存に失敗しても結果は返す（その回の表示は出せる）。
 */
export function recordClear(boardKey, entry, solutions = null) {
  const board = boardOf(boardKey);
  const existing = loadHistory(boardKey, solutions);
  const found = existing.find((item) => item.no === entry.no);
  if (found && !isBetterClear(entry, found)) return 'kept';
  const list = [entry, ...existing.filter((item) => item !== found)];
  try {
    window.localStorage.setItem(board.historyKey, JSON.stringify(sanitizeHistory(list, board)));
  } catch (error) {
    // 保存できなくても、その回の表示は出せる。
  }
  return found ? 'improved' : 'new';
}

/** `recordClear()` の結果ごとに、HUD とクリア表示に出す文言（TODO-072）。 */
export const RECORD_STATUS = {
  new: '新しい解',
  improved: '記録を更新',
  kept: '記録済み',
};

/**
 * 完成した 1 回を記録へまとめて反映する（TODO-072）。本編が完成を見つける
 * たびに呼ぶ。`clear` は `{ at, ms, no, usedAuto, usedHint }` で、`no` は
 * 何番の解か（データが届く前に解き切ったときは `null`）。
 *
 * - 最短時間（`saveBest()`）は自力の回だけ（`shouldRecordBest()`。TODO-020）
 * - 履歴（`recordClear()`）と見つけた解（`addFound()`）は、頼った回も残し、
 *   履歴には何に頼ったかの印を付ける（TODO-024）
 * - 番号が無い、または `solutions` が無いときは、履歴にも見つけた解にも残せない
 *
 * 返り値は `{ best, updated, status }`。`best` / `updated` は `saveBest()` と同じ
 * （自力でない回は今の最短と `false`）。`status` は `recordClear()` の結果で、
 * 残せなかったときは `null`。
 */
export function recordCompletion(boardKey, clear, solutions = null) {
  const record = shouldRecordBest(clear.usedAuto, clear.usedHint)
    ? saveBest(boardKey, clear.ms)
    : { best: loadBest(boardKey), updated: false };
  if (clear.no === null || !solutions) return { ...record, status: null };
  const entry = { at: clear.at, ms: clear.ms, no: clear.no };
  if (clear.usedAuto) entry.a = true;
  if (clear.usedHint) entry.h = true;
  const status = recordClear(boardKey, entry, solutions);
  addFound(boardKey, clear.no, solutions.canonical.length);
  return { ...record, status };
}

/**
 * 履歴から 1 件だけ消して、保存後の配列を返す（TODO-031）。
 *
 * 消す件は**解の番号で指す**。履歴は同じ番号を 2 件持たない（書くのは
 * `recordClear()` だけで、読むたびに `dedupeHistory()` でまとめる）ので番号で 1 件に決まり、頁送りの何行目かのような**見た目の位置に依らない**。
 *
 * 番号を持たない古い形の件（`cells`）は、`solutions` を渡せば読み替えてから
 * 消せる。渡さなければ読み替えられない件はそのまま残る。
 */
export function removeHistory(boardKey, no, solutions = null) {
  const board = boardOf(boardKey);
  const next = loadHistory(boardKey, solutions).filter((entry) => entry.no !== no);
  try {
    window.localStorage.setItem(board.historyKey, JSON.stringify(next));
  } catch (error) {
    // 消せなくても、その場の一覧は消したあとの形で出せる。
  }
  return next;
}

/**
 * 履歴からチェックした複数件をまとめて消して、保存後の配列を返す（TODO-071）。
 *
 * 消す件は解の番号の配列で指す（`removeHistory()` と同じ考え方）。
 * `removeHistory()` を件数ぶん呼ぶのと結果は同じだが、保存を 1 回で済ませる。
 */
export function removeHistoryMany(boardKey, nos, solutions = null) {
  const board = boardOf(boardKey);
  const set = new Set(nos);
  const next = loadHistory(boardKey, solutions).filter((entry) => !set.has(entry.no));
  try {
    window.localStorage.setItem(board.historyKey, JSON.stringify(next));
  } catch (error) {
    // 消せなくても、その場の一覧は消したあとの形で出せる。
  }
  return next;
}

/**
 * 記録画面でチェックした回を消して、保存後の履歴を返す（TODO-071）。
 * 履歴・見つけた解（`found`）・おまかせの番号（`auto`）をまとめて扱う。
 *
 * - 一部だけ消したとき: 消した番号だけを `found` と `auto` からも外す
 *   （TODO-031 で 1 件ずつ消していたときと同じ）。一覧から消えたものが
 *   達成度やおまかせの側にだけ残る状態を作らないため
 * - その盤の記録が 1 件も残らないとき: `found` と `auto` を丸ごと消す。履歴（50 件まで）からあふれた番号や、履歴に
 *   無いおまかせの番号まで消さないと、一覧が空なのに達成度が 0 にならず、
 *   それを消す手段も画面に無くなるため
 */
export function removeRecords(boardKey, nos, solutions) {
  const next = removeHistoryMany(boardKey, nos, solutions);
  if (next.length === 0) {
    clearFound(boardKey);
    clearAuto(boardKey);
    return next;
  }
  const count = solutions.canonical.length;
  nos.forEach((no) => {
    removeFound(boardKey, no, count);
    removeAuto(boardKey, no, count);
  });
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

/**
 * 番号を 1 つだけ外して保存し、保存後の配列を返す（TODO-031）。
 * `foundKey`（達成度）と `autoKey`（おまかせで避ける番号）で同じ処理になるので、
 * 保存先だけを引数に取る形にしてある。
 */
function removeNumber(storeKey, no, count) {
  let existing;
  try {
    existing = sanitizeFound(window.localStorage.getItem(storeKey), count);
  } catch (error) {
    return [];
  }
  const next = existing.filter((entry) => entry !== no);
  try {
    window.localStorage.setItem(storeKey, JSON.stringify(next));
  } catch (error) {
    // 消せなくても、その場の達成度は消したあとの数で出せる。
  }
  return next;
}

/**
 * 見つけた解の番号を 1 つ外す（TODO-031）。記録の一部を消すときに
 * `removeRecords()` が呼ぶ。
 * 一覧から消えたのに達成度には残る、という辻褄の合わない状態を作らないため。
 */
export function removeFound(boardKey, no, count) {
  return removeNumber(boardOf(boardKey).foundKey, no, count);
}

/** その盤で見つけた解の番号を消す。履歴を消すときに一緒に呼ぶ。 */
export function clearFound(boardKey) {
  try {
    window.localStorage.removeItem(boardOf(boardKey).foundKey);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}

/**
 * おまかせで導いた解の番号（TODO-016）。`foundKey` とは**別に持つ**。
 *
 * おまかせが毎回同じ解へ導かないよう、一度導いた解を候補から外すのに使う。
 * 達成度の分子（`foundKey`）へ混ぜてはいけない——あちらは「65 解中 12 解」の
 * 12 で、おまかせを混ぜると数の意味が変わってしまう。
 *
 * 貯め方（番号の配列）は `foundKey` と同じなので、検証は `sanitizeFound()` を
 * そのまま使い回す。
 */

/** その盤でおまかせが導いた解の番号を昇順で返す。読めなければ空の配列。 */
export function loadAuto(boardKey, count) {
  try {
    return sanitizeFound(window.localStorage.getItem(boardOf(boardKey).autoKey), count);
  } catch (error) {
    return [];
  }
}

/** 番号を 1 つ足して保存し、保存後の配列を返す。既にあれば何もしない。 */
export function addAuto(boardKey, no, count) {
  const existing = loadAuto(boardKey, count);
  if (existing.includes(no)) return existing;
  const next = sanitizeFound([...existing, no], count);
  try {
    window.localStorage.setItem(boardOf(boardKey).autoKey, JSON.stringify(next));
  } catch (error) {
    // 保存できなくても、そのおまかせ自体は出せている。
  }
  return next;
}

/**
 * おまかせが導いた解の番号を 1 つ外す（TODO-031）。記録の一部を消すときに
 * `removeRecords()` が `removeFound()` と一緒に呼ぶ。記録を消した解を
 * 「前に出した」と避け続けないようにするため。
 */
export function removeAuto(boardKey, no, count) {
  return removeNumber(boardOf(boardKey).autoKey, no, count);
}

/** その盤でおまかせが導いた解の番号を消す。履歴を消すときに一緒に呼ぶ。 */
export function clearAuto(boardKey) {
  try {
    window.localStorage.removeItem(boardOf(boardKey).autoKey);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}

/**
 * 遊びかけの盤面（TODO-030）。盤ごとに 1 つだけ持ち、タイトルの `つづきから`
 * が読む。保存する形は次のとおり。
 *
 * - `ms` … そこまでの経過時間（ミリ秒）
 * - `usedAuto` / `usedHint` … おまかせ・ヒント表示に頼ったか。**続きで解いても
 *   自力扱いにしない**ために持ち越す（TODO-020 の判定を、中断で消せてしまうと
 *   最短時間の意味が無くなる）
 * - `pieces` … 12 種ぶんの `{ name, cells, location, row, col }`
 * - `solved` … そのプレーで完成させた解の番号の配列（TODO-072）。完成したあとも
 *   続けて遊べるので、どの解を作ったかを続きへ持ち越す
 *
 * **盤面（`board.grid`）そのものは持たない。** ピースの位置から組み直せるうえ、
 * 盤面まで別に持つと、手で書き換えられたときに 2 つの食い違いをどう扱うかを
 * 決めることになる。ピースだけなら `canPlace()` で置けるかを見るだけで済む。
 *
 * **一手戻す履歴は保存しない**（利用者と相談して決めた）。最大 60 手ぶんの
 * 盤面とピースの配置になり、保存する量も検証も一気に膨らむ。続きを始めた
 * 直後だけ戻せない、という不便さと引き換えにしてある。
 */

/**
 * localStorage から読んだ値を、そのまま使える形にする（純関数）。
 * 使えなければ `null`（記録が無いのと同じに見せる）。
 *
 * `sanitizeHistory()` と同じく、生の文字列でもパース済みの値でも受ける
 * （テストから組み立てた値を JSON へ直さずに渡せるようにするため）。
 *
 * **1 か所でも辻褄が合わなければ丸ごと捨てる。** 履歴は 1 件ずつ独立している
 * ので壊れた件だけ捨てられるが、こちらは 12 個で 1 つの盤面なので、一部だけ
 * 通すと**遊べない盤面**（同じ升へ 2 個、知らない向き）が出来てしまう。
 *
 * 見るのは次の 3 つ。
 *
 * - 12 種がそれぞれ 1 個ずつあること
 * - `cells` がそのピースの向きのどれかであること（`orientations()` と照合）
 * - 盤に置いてある分が、順に置いていって重ならないこと（`canPlace()`）
 *
 * 12 個とも盤に載った（完成した）盤面も通す。完成したあとも続けて遊び、
 * ピースを入れ替えて別の解を作れるようにしたため（TODO-072）。
 */
export function sanitizeProgress(value, board) {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
  if (typeof parsed.ms !== 'number' || !Number.isFinite(parsed.ms) || parsed.ms < 0) return null;
  if (!Array.isArray(parsed.pieces) || parsed.pieces.length !== PIECES.length) return null;

  const seen = new Set();
  const pieces = [];
  let filled = createBoard(board);
  for (const entry of parsed.pieces) {
    if (entry === null || typeof entry !== 'object') return null;
    const definition = PIECES.find((piece) => piece.name === entry.name);
    if (!definition || seen.has(entry.name)) return null;
    seen.add(entry.name);

    if (!Array.isArray(entry.cells) || entry.cells.length !== definition.cells.length) return null;
    const valid = entry.cells.every((cell) => (
      Array.isArray(cell) && cell.length === 2
      && Number.isInteger(cell[0]) && cell[0] >= 0
      && Number.isInteger(cell[1]) && cell[1] >= 0
    ));
    if (!valid) return null;
    const cells = normalize(entry.cells);
    if (!orientations(definition.cells).some((known) => sameShape(known, cells))) return null;

    if (entry.location === 'tray') {
      pieces.push({
        name: entry.name, cells, location: 'tray', row: 0, col: 0,
      });
      continue;
    }
    if (entry.location !== 'board') return null;
    if (!Number.isInteger(entry.row) || !Number.isInteger(entry.col)) return null;
    if (!canPlace(filled, cells, entry.row, entry.col).ok) return null;
    filled = place(filled, entry.name, cells, entry.row, entry.col);
    pieces.push({
      name: entry.name, cells, location: 'board', row: entry.row, col: entry.col,
    });
  }
  // そのプレーで完成させた解の番号（TODO-072）。TODO-072 より前に保存した
  // ものは持たないので空とみなす。解の総数はここでは分からないので、
  // 正の整数かどうかだけを見て、重なりは落とす。
  const solved = Array.isArray(parsed.solved)
    ? [...new Set(parsed.solved.filter((no) => Number.isInteger(no) && no > 0))]
    : [];

  return {
    ms: parsed.ms,
    usedAuto: parsed.usedAuto === true,
    usedHint: parsed.usedHint === true,
    pieces,
    solved,
  };
}

/** その盤の遊びかけを返す。無い・壊れている・読めないときは `null`。 */
export function loadProgress(boardKey) {
  const board = boardOf(boardKey);
  try {
    return sanitizeProgress(window.localStorage.getItem(board.progressKey), board);
  } catch (error) {
    return null;
  }
}

/**
 * 遊びかけを保存し、保存した形を返す。**使えない値なら保存せずに消す**
 * （古い遊びかけが残って、続きから始めたときに前の盤面が出るのを防ぐ）。
 */
export function saveProgress(boardKey, progress) {
  const board = boardOf(boardKey);
  const sane = sanitizeProgress(progress, board);
  if (sane === null) {
    clearProgress(boardKey);
    return null;
  }
  try {
    window.localStorage.setItem(board.progressKey, JSON.stringify(sane));
  } catch (error) {
    // 保存できなくても、その回は最後まで遊べる（続きから始められないだけ）。
  }
  return sane;
}

/** その盤の遊びかけを消す。やり直したときに呼ぶ。 */
export function clearProgress(boardKey) {
  try {
    window.localStorage.removeItem(boardOf(boardKey).progressKey);
  } catch (error) {
    // 消せなくても実害は無い。
  }
}
