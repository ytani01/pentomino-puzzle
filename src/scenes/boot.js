/**
 * マス目テクスチャの生成。
 *
 * 画像ファイルを持たない方針なので、絵は起動時に Graphics API で描いて
 * テクスチャに焼く。1 マスぶんを 1 枚にしておけば、ピースは同じテクスチャを
 * 並べるだけで組め、向きが変わっても描き直さずに済む。
 */

import {
  BOARD_REGISTRY_KEY, COLORS, DEFAULT_BOARD_KEY, GLASS, LAYOUTS, PALETTES,
  PALETTE_REGISTRY_KEY, PIECES, TILE,
} from '../config.js';
import { loadPalette } from '../storage.js';

/**
 * テクスチャ名。`game.js` から文字列を書かずに参照できるようにまとめておく。
 *
 * 名前にマスの大きさを含めるのは、盤によってマスの大きさが違うため
 * （TODO-009）。焼き直しではなく別の名前で持つことで、盤を選び直しても
 * 貼り直すだけで済む。大きさが同じなら同じ名前になり、自然に共用される。
 *
 * 色の組も同じ理由で名前に入れる（TODO-015）。**単色の組ではピース名を
 * `mono` に潰して 1 枚に減らす**が、`game.js` は今までどおり名前ごとに
 * 引けばよく、どの組を選んでいるかを気にせずに済む。
 */
export const TEX = {
  piece: (palette, name, cell) => `cell-${palette.key}-${palette.mono === null ? name : 'mono'}-${cell}`,
  boardCell: (cell) => `board-cell-${cell}`,
  hole: (cell) => `board-hole-${cell}`,
  ghost: (cell) => `cell-ghost-${cell}`,
};

/** ピース 1 種を、選んでいる色の組ではどの色で描くか。 */
export function pieceColor(palette, piece) {
  return palette.mono === null ? piece.color : palette.mono;
}

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
    // 選べる盤ぶんと色の組ぶんをまとめて焼く。タイトルで選び直したときに
    // 焼く時間を待たせないため（1 枚は数十 px 四方で、全部でも 30 枚ほど）。
    for (const layout of Object.values(LAYOUTS)) {
      this.makeBoardTiles(layout.board.cell);
      for (const palette of Object.values(PALETTES)) {
        this.makePieceTiles(palette, layout.board.cell);
      }
    }
    this.registry.set(BOARD_REGISTRY_KEY, DEFAULT_BOARD_KEY);
    // 前に選んだ色の組は覚えてある（盤と違い、遊ぶたびに選び直すものではない）。
    this.registry.set(PALETTE_REGISTRY_KEY, loadPalette());
    this.scene.start('Title');
  }

  /** 盤の地（マス・穴）と、置ける場所に出す影。色の組に依らない。 */
  makeBoardTiles(size) {
    this.makeTile(TEX.boardCell(size), size, COLORS.boardCell, false);
    this.makeTile(TEX.hole(size), size, COLORS.hole, false);
    this.makeTile(TEX.ghost(size), size, COLORS.ghost, true);
  }

  /** 1 つの色の組で使うピースのマス。単色なら 12 種で 1 枚に落ちる。 */
  makePieceTiles(palette, size) {
    for (const piece of PIECES) {
      const key = TEX.piece(palette, piece.name, size);
      if (palette.glass) this.makeGlassTile(key, size, pieceColor(palette, piece));
      else this.makeTile(key, size, pieceColor(palette, piece), true);
    }
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

  /**
   * ガラスふうの 1 マス（TODO-015）。半透明の地に、内側の明るい縁と
   * 斜めの光の筋を重ねる。帯を割合で持つのは、盤（64px）とトレイ（20px）で
   * 同じ見え方にするため。
   *
   * 筋を角で切らずに矩形へ収めるのは、Graphics の塗りに切り抜きが無いため。
   * 対角に沿った帯をマスの外まで伸ばし、`generateTexture` の大きさで
   * はみ出した分を落としている。
   */
  makeGlassTile(key, size, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, GLASS.fillAlpha);
    g.fillRect(0, 0, size, size);

    for (const streak of GLASS.streaks) {
      g.fillStyle(TILE.highlight, streak.alpha);
      // 対角に垂直な帯を、左上の角から `from`〜`to` の位置に置く。
      g.fillPoints([
        { x: 0, y: streak.from * 2 * size },
        { x: streak.from * 2 * size, y: 0 },
        { x: streak.to * 2 * size, y: 0 },
        { x: 0, y: streak.to * 2 * size },
      ], true);
    }

    const inset = GLASS.innerInset;
    g.lineStyle(GLASS.innerWidth, TILE.highlight, GLASS.innerAlpha);
    g.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
    g.lineStyle(TILE.border, GLASS.gridColor, GLASS.gridAlpha);
    g.strokeRect(TILE.border / 2, TILE.border / 2, size - TILE.border, size - TILE.border);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
