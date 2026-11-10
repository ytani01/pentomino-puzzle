// 使い方: node dump-config.mjs > out.json
// LAYOUTS・DEMO_LAYOUTS・TEXT_COLORS を JSON にして、変更前後の一致を diff で見る。
import { LAYOUTS, DEMO_LAYOUTS, TEXT_COLORS } from '../../../src/config.js';
console.log(JSON.stringify({ LAYOUTS, DEMO_LAYOUTS, TEXT_COLORS }, null, 1));
