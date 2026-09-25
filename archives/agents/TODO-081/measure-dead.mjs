import '/home/ytani/work/pentomino-puzzle/tools/window-shim.mjs';
import { BOARDS } from '/home/ytani/work/pentomino-puzzle/src/config.js';
import { solveStepsRandom } from '/home/ytani/work/pentomino-puzzle/src/logic.js';
import { ensureSolutions, hasSolution } from '/home/ytani/work/pentomino-puzzle/src/solutions.js';
for (const key of ['8x8', '6x10']) {
  const spec = BOARDS[key];
  const sol = await ensureSolutions(new Map(), spec);
  const rows = [];
  for (let run = 0; run < 20; run++) {
    let places = 0, deadPlaces = 0, goodToDead = 0, lastOk = true, maxDead = 0, deadRun = 0;
    for (const s of solveStepsRandom(spec, Math.random, (b) => hasSolution(sol, b))) {
      if (s.type === 'place') {
        places++;
        if (!lastOk) { deadPlaces++; deadRun++; maxDead = Math.max(maxDead, deadRun); }
        else if (!s.ok) { goodToDead++; deadRun = 0; }
        lastOk = s.ok;
      } else if (s.type === 'remove') { lastOk = s.ok; if (s.ok) deadRun = 0; }
      else break;
    }
    rows.push({ places, goodToDead, deadPlaces, maxDead });
  }
  rows.sort((a, b) => a.places - b.places);
  const med = (k) => rows.map((r) => r[k]).sort((a, b) => a - b)[10];
  console.log(key, 'median places', med('places'), 'wrong moves', med('goodToDead'),
    'placed on dead board', med('deadPlaces'), 'max run', med('maxDead'),
    'worst places', rows.at(-1).places, 'worst deadPlaces', rows.at(-1).deadPlaces);
}
