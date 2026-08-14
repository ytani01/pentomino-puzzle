/**
 * マス目テクスチャの生成。
 *
 * 画像ファイルを持たない方針なので、絵は起動時に Graphics API で描いて
 * テクスチャに焼く。1 マスぶんを 1 枚にしておけば、ピースは同じテクスチャを
 * 並べるだけで組め、向きが変わっても描き直さずに済む。
 */

import {
  BOARD_REGISTRY_KEY, COLORS, DEFAULT_BOARD_KEY, LAYOUTS, PIECES, TILE,
} from '../config.js';

/**
 * テクスチャ名。`game.js` から文字列を書かずに参照できるようにまとめておく。
 *
 * 名前にマスの大きさを含めるのは、盤によってマスの大きさが違うため
 * （TODO-009）。焼き直しではなく別の名前で持つことで、盤を選び直しても
 * 貼り直すだけで済む。大きさが同じなら同じ名前になり、自然に共用される。
 */
export const TEX = {
  piece: (name, cell) => `cell-${name}-${cell}`,
  boardCell: (cell) => `board-cell-${cell}`,
  hole: (cell) => `board-hole-${cell}`,
  ghost: (cell) => `cell-ghost-${cell}`,
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
    // 選べる盤ぶんをまとめて焼く。タイトルで選び直したときに焼く時間を
    // 待たせないため（12 種 + 3 枚を 2 通り作っても、1 枚は数十 px 四方）。
    for (const layout of Object.values(LAYOUTS)) {
      this.makeTileSet(layout.board.cell);
    }
    this.registry.set(BOARD_REGISTRY_KEY, DEFAULT_BOARD_KEY);
    this.scene.start('Title');
  }

  /** 1 つの盤で使う 1 組（ピース 12 種と、盤のマス・穴・影）を焼く。 */
  makeTileSet(size) {
    for (const piece of PIECES) {
      this.makeTile(TEX.piece(piece.name, size), size, piece.color, true);
    }
    this.makeTile(TEX.boardCell(size), size, COLORS.boardCell, false);
    this.makeTile(TEX.hole(size), size, COLORS.hole, false);
    this.makeTile(TEX.ghost(size), size, COLORS.ghost, true);
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
