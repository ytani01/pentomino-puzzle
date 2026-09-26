/**
 * マス目テクスチャの生成。
 *
 * 画像ファイルを持たない方針なので、起動時に Graphics API で描いてテクスチャに
 * 焼く。1 マスを 1 枚にしておけば、ピースは同じテクスチャを並べるだけで組め、
 * 向きが変わっても描き直さずに済む。
 */

import {
  BOARD_GLASS, BOARD_REGISTRY_KEY, COLORS, DEFAULT_BOARD_KEY, DEMO_LAYOUTS, GLASS, LAYOUTS, NEON, PALETTES,
  PALETTE_REGISTRY_KEY, PIECES, TILE,
} from '../config.js';
import { parseDemoParams } from '../logic.js';
import { loadPalette } from '../storage.js';

/**
 * テクスチャ名。`game.js` から文字列を書かずに参照できるようにまとめておく。
 *
 * 盤によってマスの大きさが違うので、名前に大きさを含める（TODO-009）。別の名前で
 * 持てば、盤を選び直しても焼き直さず貼り直すだけで済む。大きさが同じなら同じ
 * 名前になり、そのまま共用される。
 *
 * 色の組も同じ理由で名前に入れる（TODO-015）。**単色の組ではピース名を
 * `mono` に潰して 1 枚に減らす**が、`game.js` はピース名ごとに引けばよく、
 * どの組を選んでいるかを気にせずに済む。
 */
export const TEX = {
  piece: (palette, name, cell) => `cell-${palette.key}-${palette.mono === null ? name : 'mono'}-${cell}`,
  boardCell: (cell) => `board-cell-${cell}`,
  ghost: (cell) => `cell-ghost-${cell}`,
};

/** ピース 1 種を、選んでいる色の組ではどの色で描くか。 */
export function pieceColor(palette, piece) {
  if (palette.mono !== null) return palette.mono;
  return palette.colors === null ? piece.color : palette.colors[piece.name];
}

/**
 * 縁取り用に色を暗くする。マスの縁と、ピースの外周（`game.js`）が使う。
 * ここに置くのは、マスの縁と外周で同じ作り方を保つため。
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
    // 選べる盤と色の組のぶんをまとめて焼く。タイトルで選び直したときに
    // 待たせないため（1 枚は数十 px 四方で、全部でも 30 枚ほど）。
    // デモは横画面でマスが本編より小さいので、その大きさも焼く（TODO-089）。
    // 遊んでいる途中で端末を回すと向きが変わるので、縦・横の両方を焼く（TODO-095）。
    // 同じ大きさを二度焼くとキーがぶつかるので、Set で重ねない。
    const cells = new Set(
      [LAYOUTS, DEMO_LAYOUTS].flatMap((byOrientation) => Object.values(byOrientation))
        .flatMap((byBoard) => Object.values(byBoard)).map((layout) => layout.board.cell),
    );
    for (const cell of cells) {
      this.makeBoardTiles(cell);
      for (const palette of Object.values(PALETTES)) this.makePieceTiles(palette, cell);
    }
    this.registry.set(BOARD_REGISTRY_KEY, DEFAULT_BOARD_KEY);
    // 色の組は前に選んだものを使う（盤と違い、遊ぶたびに選び直すものではない）。
    this.registry.set(PALETTE_REGISTRY_KEY, loadPalette());
    // URL でデモを指定されたら、タイトルを飛ばす（TODO-083）。
    this.scene.start(parseDemoParams(window.location.search) ? 'Demo' : 'Title');
  }

  /**
   * 盤の地（マス）と、置ける場所に出す影。色の組に依らない。
   * 地はガラス面に見せる（TODO-094）。ガラスの組のピースと同じ描き方を、
   * 控えめな値（`BOARD_GLASS`）で使う。
   */
  makeBoardTiles(size) {
    this.makeGlassTile(TEX.boardCell(size), size, COLORS.boardCell, BOARD_GLASS);
    this.makeTile(TEX.ghost(size), size, COLORS.ghost);
  }

  /** 1 つの色の組で使うピースのマス。単色なら 12 種で 1 枚に落ちる。 */
  makePieceTiles(palette, size) {
    for (const piece of PIECES) {
      const key = TEX.piece(palette, piece.name, size);
      if (palette.glass) this.makeGlassTile(key, size, pieceColor(palette, piece));
      else if (palette.neon) this.makeNeonTile(key, size, pieceColor(palette, piece));
      else this.makeTile(key, size, pieceColor(palette, piece));
    }
  }

  /**
   * 1 マスぶんのテクスチャを焼く。
   * 立体感は「上と左を明るく、下と右を暗く」の帯だけで出す
   * （細かい描き込みより、縮小してトレイに並べたときの見え方を優先した）。
   */
  makeTile(key, size, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1);
    g.fillRect(0, 0, size, size);
    g.fillStyle(TILE.highlight, TILE.highlightAlpha);
    g.fillRect(0, 0, size, TILE.bevel);
    g.fillRect(0, 0, TILE.bevel, size);
    g.fillStyle(TILE.shadow, TILE.shadowAlpha);
    g.fillRect(0, size - TILE.bevel, size, TILE.bevel);
    g.fillRect(size - TILE.bevel, 0, TILE.bevel, size);
    g.lineStyle(TILE.border, darken(color, TILE.edgeDarken), 1);
    g.strokeRect(TILE.border / 2, TILE.border / 2, size - TILE.border, size - TILE.border);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  /**
   * ガラスふうの 1 マス（TODO-015）。半透明の地に、内側の明るい縁と
   * 斜めの光の筋を重ねる。帯を割合で持つのは、盤（64px）とトレイ（20px）で
   * 同じ見え方にするため。
   *
   * Graphics の塗りには切り抜きが無いので、対角に沿った帯をマスの外まで伸ばし、
   * はみ出した分は `generateTexture` の大きさで落とす。
   *
   * `spec` を差し替えられるのは、盤の空きマス（`BOARD_GLASS`。TODO-094）も
   * 同じ描き方で焼くため。
   */
  makeGlassTile(key, size, color, spec = GLASS) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, spec.fillAlpha);
    g.fillRect(0, 0, size, size);

    for (const streak of spec.streaks) {
      g.fillStyle(TILE.highlight, streak.alpha);
      // 対角に垂直な帯を、左上の角から `from`〜`to` の位置に置く。
      g.fillPoints([
        { x: 0, y: streak.from * 2 * size },
        { x: streak.from * 2 * size, y: 0 },
        { x: streak.to * 2 * size, y: 0 },
        { x: 0, y: streak.to * 2 * size },
      ], true);
    }

    const inset = spec.innerInset;
    g.lineStyle(spec.innerWidth, TILE.highlight, spec.innerAlpha);
    g.strokeRect(inset, inset, size - inset * 2, size - inset * 2);
    g.lineStyle(TILE.border, spec.gridColor, spec.gridAlpha);
    g.strokeRect(TILE.border / 2, TILE.border / 2, size - TILE.border, size - TILE.border);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  /**
   * ネオンふうの 1 マス（TODO-039）。暗く沈めた地に、自分の色の薄い格子だけ。
   * 光るのは外周（`game.js` の `drawPieceEdges()`）で、マスの側には描かない。
   */
  makeNeonTile(key, size, color) {
    if (this.textures.exists(key)) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(darken(color, NEON.fillDarken), 1);
    g.fillRect(0, 0, size, size);
    g.lineStyle(TILE.border, color, NEON.gridAlpha);
    g.strokeRect(TILE.border / 2, TILE.border / 2, size - TILE.border, size - TILE.border);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
