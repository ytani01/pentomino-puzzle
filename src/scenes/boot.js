/**
 * マス目テクスチャの生成。
 *
 * 画像ファイルを持たない方針なので、絵は起動時に Graphics API で描いて
 * テクスチャに焼く。1 マスぶんを 1 枚にしておけば、ピースは同じテクスチャを
 * 並べるだけで組め、向きが変わっても描き直さずに済む。
 */

import { COLORS, LAYOUT, PIECES, TILE } from '../config.js';

/** テクスチャ名。`game.js` から文字列を書かずに参照できるようにまとめておく。 */
export const TEX = {
  piece: (name) => `cell-${name}`,
  boardCell: 'board-cell',
  hole: 'board-hole',
  ghost: 'cell-ghost',
};

/**
 * 縁取り用に色を暗くする。マスの縁と、ピースの外周（`game.js`）が使う派生色。
 * テクスチャを作る側に置いてあるのは、マスの縁と外周で同じ作り方を保つため。
 */
export function darken(color, factor) {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    const size = LAYOUT.board.cell;
    for (const piece of PIECES) {
      this.makeTile(TEX.piece(piece.name), size, piece.color, true);
    }
    this.makeTile(TEX.boardCell, size, COLORS.boardCell, false);
    this.makeTile(TEX.hole, size, COLORS.hole, false);
    this.makeTile(TEX.ghost, size, COLORS.ghost, true);
    this.scene.start('Title');
  }

  /**
   * 1 マスぶんのテクスチャを焼く。
   * 立体感は「上と左を明るく、下と右を暗く」の 2 本の帯だけで出している
   * （細かい描き込みより、縮小してトレイに並べたときの見え方を優先した）。
   */
  makeTile(key, size, color, beveled) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillRect(0, 0, size, size);
    if (beveled) {
      g.fillStyle(TILE.highlight, TILE.highlightAlpha);
      g.fillRect(0, 0, size, TILE.bevel);
      g.fillRect(0, 0, TILE.bevel, size);
      g.fillStyle(TILE.shadow, TILE.shadowAlpha);
      g.fillRect(0, size - TILE.bevel, size, TILE.bevel);
      g.fillRect(size - TILE.bevel, 0, TILE.bevel, size);
    }
    const edge = beveled ? darken(color, TILE.edgeDarken) : COLORS.boardCellEdge;
    g.lineStyle(TILE.border, edge, 1);
    g.strokeRect(TILE.border / 2, TILE.border / 2, size - TILE.border, size - TILE.border);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
