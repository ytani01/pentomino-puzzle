/**
 * `src/data/*.js`（盤ごとの全解）を作る（TODO-022）。**開発時に手で走らせる。**
 *
 *   node tools/gen-solutions.mjs           … 作り直して書き出す
 *   node tools/gen-solutions.mjs --check   … 作り直して、今あるものと突き合わせる
 *
 * `--check` は `.github/workflows/pages.yml` が公開の前に走らせる。データと
 * コードがずれたまま公開すると、間違ったヒントを静かに出すことになるため
 * （`VERSION` のプレースホルダを検査しているのと同じ考え方）。
 * 6×10 の数え上げに 2 分半かかるが、タグを押したときだけなので構わない。
 *
 * 依存は増やさない。Node の標準機能だけで動く（`npm install` は要らない）。
 */

import './window-shim.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BOARDS } from '../src/config.js';
import { canonicalSolutions } from './enumerate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src', 'data');

/** 1 つの盤ぶんのファイルの中身を組み立てる。並びも文言もここだけで決まる。 */
function render(spec, result) {
  const lines = result.canonical.map((cells) => `  '${cells}',`).join('\n');
  return `/**
 * ${spec.label}（${spec.note}）の全解（TODO-022）。
 *
 * **手で書き換えない。** \`tools/gen-solutions.mjs\` が作る。作り直したものと
 * 食い違っていないかは、公開のときに \`.github/workflows/pages.yml\` が調べる。
 *
 * 1 行が 1 つの代表形で、\`logic.js\` の \`boardKey()\` の出力そのまま
 * （穴は \`#\`、あとはピース名。行優先の ${spec.rows * spec.cols} 文字）。
 * 回転・反転で重なる解は 1 つにまとめてある（全 ${result.all} 解 → ${result.canonical.length} 件）。
 *
 * 並びは**文字列の昇順**で、**この順番（1 から数える）がそのまま解の番号**。
 * 記録の保存に使うので、作り直しても番号がずれないようにここで固定する。
 */
export const SOLUTIONS = [
${lines}
];
`;
}

const check = process.argv.includes('--check');
let differs = false;

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const spec of Object.values(BOARDS)) {
  const started = Date.now();
  const result = canonicalSolutions(spec);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const file = path.join(OUT_DIR, `${spec.key}.js`);
  const rendered = render(spec, result);
  const shown = path.relative(ROOT, file);

  process.stdout.write(
    `${spec.label}: 全 ${result.all} 解、代表形 ${result.canonical.length} 件（${seconds} 秒）\n`,
  );

  if (!check) {
    fs.writeFileSync(file, rendered);
    process.stdout.write(`  → ${shown} へ書き出した\n`);
    continue;
  }

  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === rendered) {
    process.stdout.write(`  → ${shown} と一致した\n`);
  } else {
    differs = true;
    process.stderr.write(
      current === null
        ? `  → ${shown} が無い\n`
        : `  → ${shown} と食い違う（作り直したものと中身が違う）\n`,
    );
  }
}

if (check && differs) {
  process.stderr.write(
    'データがコードと合っていない。`node tools/gen-solutions.mjs` で作り直して commit すること\n',
  );
  process.exit(1);
}
