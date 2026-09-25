// 公開するコピーの読み込みに版を付ける（公開のワークフローで使う。TODO-096）。
//
//   node tools/stamp-version.mjs <公開するディレクトリ> <版>
//
// GitHub Pages は `cache-control: max-age=600` を返すので、URL が版ごとに
// 変わらないと、公開から 10 分はリロードしても古い JS が使われる。
// `index.html` の `src/main.js` と、`src/` の中の相対 import（静的・動的の両方）の
// 後ろに `?v=<版>` を付け、版ごとに別の URL にする。手元のコードは変えない。
//
// 付け漏れは静かに古い版を混ぜるので、置換のあとに `?v=` の無い相対の `.js` が
// 残っていたら失敗する（`VERSION` の置換と同じ考え方）。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, version] = process.argv.slice(2);
if (!dir || !version) {
  console.error('usage: node tools/stamp-version.mjs <dir> <version>');
  process.exit(2);
}
const query = `?v=${encodeURIComponent(version)}`;

// `from './x.js'`・`import('./x.js')`・`<script src="src/main.js">` の 3 通り。
const PATTERNS = [
  /(\bfrom\s*')(\.{1,2}\/[^']+?\.js)(')/g,
  /(\bimport\(\s*')(\.{1,2}\/[^']+?\.js)(')/g,
  /(<script\b[^>]*\bsrc=")(src\/[^"]+?\.js)(")/g,
];

function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const full = join(path, entry.name);
    if (entry.isDirectory()) return files(full);
    return /\.(js|html)$/.test(entry.name) ? [full] : [];
  });
}

const leftovers = [];
let count = 0;
for (const file of files(dir)) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const pattern of PATTERNS) {
    after = after.replace(pattern, (_, head, spec, tail) => {
      count += 1;
      return `${head}${spec}${query}${tail}`;
    });
  }
  if (after !== before) writeFileSync(file, after);
  // 置換の形から外れた書き方（二重引用符の import など）を拾う。
  for (const line of after.split('\n')) {
    // テンプレートリテラルの動的 import は置換できないので、それも拾う。
    if (/['"](\.{1,2}\/|src\/)[^'"]+\.js['"]/.test(line) || /\bimport\(\s*`/.test(line)) {
      leftovers.push(`${file}: ${line.trim()}`);
    }
  }
}

if (leftovers.length > 0) {
  console.error('::error::版を付けられなかった読み込みがある');
  for (const line of leftovers) console.error(line);
  process.exit(1);
}
if (count === 0) {
  console.error('::error::版を付けた読み込みが 1 つも無い');
  process.exit(1);
}
console.log(`${count} か所に ${query} を付けた`);
