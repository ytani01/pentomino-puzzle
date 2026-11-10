// 変更前の 3 か所の計算（ui.js drawMiniBoard / icons.js paletteIcon / boot.js makeNeonTile）と
// logic.js の fillColor() が、全 PALETTES × 全ピースで一致するかを突き合わせる。
// 使い方: node archives/agents/TODO-119/check-fill.mjs
import { NEON, PALETTES, PIECES, PIECE_BY_NAME } from '../../../src/config.js';
import { darken, fillColor, pieceColor } from '../../../src/logic.js';

let n = 0;
for (const [key, palette] of Object.entries(PALETTES)) {
  for (const piece of PIECES) {
    const color = pieceColor(palette, piece);
    const old = palette.neon ? darken(color, NEON.fillDarken) : color; // ui.js・icons.js の旧式
    if (fillColor(palette, color) !== old) throw new Error(`${key}/${piece.name}`);
    if (palette.neon && fillColor(palette, color) !== darken(color, NEON.fillDarken)) throw new Error(`boot ${key}/${piece.name}`);
    if (PIECE_BY_NAME.get(piece.name) !== PIECES.find((p) => p.name === piece.name)) throw new Error(`map ${piece.name}`);
    n += 1;
  }
  console.log(key, palette.neon ? 'neon' : palette.glass ? 'glass' : 'plain');
}
console.log('ok', n);
