// 使い方: node archives/agents/TODO-072/mutate-fix.mjs <一時ディレクトリ>
// TODO-072 修正で足したテスト（recordCompletion 3 件・recordClear の 50 件）を、壊した storage.js で走らせる。
import { cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
const REPO = '/home/ytani/work/pentomino-puzzle';
const TMP = process.argv[2];
const store = new Map();
globalThis.window = { innerWidth: 960, innerHeight: 640, localStorage: {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } };
const src = readFileSync(`${REPO}/src/storage.js`, 'utf8');
const mutations = {
  none: [],
  '最短を頼った回でも更新': [['const record = shouldRecordBest(clear.usedAuto, clear.usedHint)', 'const record = true']],
  'addFound を呼ばない': [['  addFound(boardKey, clear.no, solutions.canonical.length);\n  return { ...record, status };', '  return { ...record, status };']],
  '印を付けない': [['  if (clear.usedAuto) entry.a = true;\n  if (clear.usedHint) entry.h = true;\n  const status', '  const status']],
  '番号の無い回も残す': [["if (clear.no === null || !solutions) return", "if (!solutions) return"]],
  'recordClear が 50 件で切らない': [['JSON.stringify(sanitizeHistory(list, board))', 'JSON.stringify(list)']],
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
let n = 0;
for (const [name, edits] of Object.entries(mutations)) {
  let text = src;
  for (const [o, r] of edits) { if (!text.includes(o)) throw new Error(`no match: ${name}`); text = text.replace(o, r); }
  const dir = `${TMP}/m${n++}`;
  cpSync(`${REPO}/src`, `${dir}/src`, { recursive: true });
  writeFileSync(`${dir}/src/storage.js`, text);
  const s = await import(`${dir}/src/storage.js`);
  const { BOARDS, HISTORY_LIMIT } = await import(`${dir}/src/config.js`);
  const spec = BOARDS['8x8'];
  const solutions = { canonical: new Array(65), numbers: new Map() };
  const tests = {
    self: () => { store.clear(); store.set(spec.storageKey, '12345');
      const r = s.recordCompletion(spec.key, { at: 1000, ms: 100, no: 3, usedAuto: false, usedHint: false }, solutions);
      return eq(r, { best: 100, updated: true, status: 'new' }) && s.loadBest(spec.key) === 100
        && eq(s.loadHistory(spec.key, solutions), [{ at: 1000, ms: 100, no: 3 }]) && eq(s.loadFound(spec.key, 65), [3]); },
    helped: () => { store.clear(); store.set(spec.storageKey, '12345');
      const r = s.recordCompletion(spec.key, { at: 1000, ms: 100, no: 3, usedAuto: true, usedHint: true }, solutions);
      return eq(r, { best: 12345, updated: false, status: 'new' }) && s.loadBest(spec.key) === 12345
        && eq(s.loadHistory(spec.key, solutions), [{ at: 1000, ms: 100, no: 3, a: true, h: true }]) && eq(s.loadFound(spec.key, 65), [3]); },
    noNumber: () => { store.clear();
      const r = s.recordCompletion(spec.key, { at: 1000, ms: 100, no: null, usedAuto: true, usedHint: false }, solutions);
      return r.status === null && eq(s.loadHistory(spec.key, solutions), []) && eq(s.loadFound(spec.key, 65), []); },
    limit: () => { store.clear();
      for (let i = 0; i < HISTORY_LIMIT + 1; i += 1) s.recordClear(spec.key, { at: 1000 + i, ms: 100, no: i + 1 }, solutions);
      const raw = JSON.parse(store.get(spec.historyKey));
      return raw.length === HISTORY_LIMIT && !raw.some((e) => e.at === 1000); },
  };
  const failed = Object.entries(tests).filter(([, fn]) => { try { return !fn(); } catch { return true; } }).map(([k]) => k);
  console.log(`${name}: 落ちた ${failed.length} 件 ${JSON.stringify(failed)}`);
}
rmSync(TMP, { recursive: true, force: true });
