/**
 * HUD のボタンのアイコン（TODO-042）と、タイトルの盤・色の選択肢の図（TODO-046）。
 *
 * Unicode の記号や絵文字は OS やフォントで形が変わり、色の組とも合わないので、
 * Graphics API の線画で描く。どれも `(graphics, color) => void` で、
 * `createButton()`（`ui.js`）がボタンの中央を原点にして呼ぶ。色はボタンの状態
 * （通常・押せない・選んである）で変わるので、呼ぶ側から受け取る。
 *
 * 一手戻すとやり直しはどちらも曲がった矢印で似やすいので、一手戻すは左へ折り返す
 * U 字、やり直しは閉じかけた円にして見分けられるようにする。
 */

import { CHOICE_ICON, GLASS, ICON, NEON, PIECES, TILE } from './config.js';
import { boardCells, outlineEdges, shapeSize } from './logic.js';
import { darken, pieceColor } from './scenes/boot.js';

const U = ICON.size / 2;

/** 先端を `(x, y)` に置き、向き `angle` へ尖った三角。 */
function arrowHead(g, x, y, angle, length) {
  const back = angle + Math.PI;
  const side = Math.PI / 2;
  const bx = x + Math.cos(back) * length;
  const by = y + Math.sin(back) * length;
  const half = length * 0.7;
  g.fillTriangle(
    x, y,
    bx + Math.cos(angle + side) * half, by + Math.sin(angle + side) * half,
    bx + Math.cos(angle - side) * half, by + Math.sin(angle - side) * half,
  );
}

/** 探し方のアイコンの節と線。節の大きさを揃え、木は枝分かれ、ランダムは交差する一筆書きで見分ける（節は 6 個と 5 個）。 */
const NODE_RADIUS = 0.22;
const TREE_NODES = [[0, -0.7], [-0.45, 0], [0.45, 0], [-0.75, 0.7], [-0.15, 0.7], [0.45, 0.7]];
const TREE_EDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]];
const SCATTER_NODES = [[0.7, 0.65], [-0.4, -0.7], [-0.6, 0.65], [0.6, -0.35], [0.1, 0.7]];
const SCATTER_EDGES = [[0, 1], [1, 2], [2, 3], [3, 4]];

function graph(g, color, nodes, edges) {
  begin(g, color);
  for (const [a, b] of edges) {
    g.lineBetween(nodes[a][0] * U, nodes[a][1] * U, nodes[b][0] * U, nodes[b][1] * U);
  }
  for (const [x, y] of nodes) g.fillCircle(x * U, y * U, NODE_RADIUS * U);
}

function begin(g, color, width = ICON.lineWidth) {
  g.lineStyle(width, color, 1);
  g.fillStyle(color, 1);
}

/** スピーカーの本体。音の ON / OFF で共通。 */
function speaker(g) {
  g.fillPoints([
    { x: -0.9 * U, y: -0.3 * U }, { x: -0.5 * U, y: -0.3 * U },
    { x: -0.05 * U, y: -0.75 * U }, { x: -0.05 * U, y: 0.75 * U },
    { x: -0.5 * U, y: 0.3 * U }, { x: -0.9 * U, y: 0.3 * U },
  ], true);
}

/** 右向きの三角を `count` 個並べる。デモの速さの段階を個数で見せる。 */
function triangles(count) {
  return (g, color) => {
    begin(g, color);
    const width = 0.6 * U;
    const left = (-count * width) / 2;
    for (let i = 0; i < count; i += 1) {
      const x = left + i * width;
      g.fillTriangle(x, -0.6 * U, x, 0.6 * U, x + width, 0);
    }
  };
}

export const ICONS = {
  /** 一手戻す: 左へ折り返す U 字の矢印。 */
  undo(g, color) {
    begin(g, color);
    g.beginPath();
    g.moveTo(-0.5 * U, -0.35 * U);
    g.lineTo(0.2 * U, -0.35 * U);
    g.arc(0.2 * U, 0.15 * U, 0.5 * U, -Math.PI / 2, Math.PI / 2, false);
    g.lineTo(-0.5 * U, 0.65 * U);
    g.strokePath();
    arrowHead(g, -0.95 * U, -0.35 * U, Math.PI, 0.5 * U);
  },

  /** おまかせ: 魔法の杖と星のきらめき。 */
  auto(g, color) {
    begin(g, color, ICON.lineWidth + 1);
    g.lineBetween(-0.85 * U, 0.85 * U, 0.1 * U, -0.1 * U);
    const cx = 0.4 * U;
    const cy = -0.4 * U;
    const r = 0.55 * U;
    const k = 0.14 * U;
    g.fillPoints([
      { x: cx, y: cy - r }, { x: cx + k, y: cy - k }, { x: cx + r, y: cy },
      { x: cx + k, y: cy + k }, { x: cx, y: cy + r }, { x: cx - k, y: cy + k },
      { x: cx - r, y: cy }, { x: cx - k, y: cy - k },
    ], true);
    g.fillCircle(-0.45 * U, -0.6 * U, 0.14 * U);
    g.fillCircle(0.75 * U, 0.45 * U, 0.14 * U);
  },

  /** ヒント表示: 電球。 */
  hint(g, color) {
    begin(g, color);
    g.strokeCircle(0, -0.3 * U, 0.5 * U);
    g.lineBetween(-0.25 * U, 0.13 * U, -0.25 * U, 0.5 * U);
    g.lineBetween(0.25 * U, 0.13 * U, 0.25 * U, 0.5 * U);
    g.lineBetween(-0.3 * U, 0.5 * U, 0.3 * U, 0.5 * U);
    g.lineBetween(-0.2 * U, 0.8 * U, 0.2 * U, 0.8 * U);
  },

  /** やり直し: 閉じかけた円の矢印（上に切れ目）。 */
  restart(g, color) {
    begin(g, color);
    const r = 0.62 * U;
    const start = -Math.PI / 3;
    const end = (4 * Math.PI) / 3;
    g.beginPath();
    g.arc(0, 0.05 * U, r, start, end, false);
    g.strokePath();
    // 時計回りに進んだ先へ尖らせる。円の接線は角度 + 90°。
    const tipAngle = end + Math.PI / 2;
    const len = 0.5 * U;
    const ex = Math.cos(end) * r;
    const ey = 0.05 * U + Math.sin(end) * r;
    arrowHead(g, ex + Math.cos(tipAngle) * len * 0.6, ey + Math.sin(tipAngle) * len * 0.6,
      tipAngle, len);
  },

  /** 音 ON: スピーカーと音の波。 */
  soundOn(g, color) {
    begin(g, color);
    speaker(g);
    [0.45, 0.85].forEach((r) => {
      g.beginPath();
      g.arc(-0.05 * U, 0, r * U, -Math.PI / 4, Math.PI / 4, false);
      g.strokePath();
    });
  },

  /** 音 OFF: スピーカーと ×。 */
  soundOff(g, color) {
    begin(g, color);
    speaker(g);
    const cx = 0.5 * U;
    const h = 0.3 * U;
    g.lineBetween(cx - h, -h, cx + h, h);
    g.lineBetween(cx - h, h, cx + h, -h);
  },

  /** タイトルへ: 家。 */
  title(g, color) {
    begin(g, color);
    g.beginPath();
    g.moveTo(-0.9 * U, 0);
    g.lineTo(0, -0.85 * U);
    g.lineTo(0.9 * U, 0);
    g.strokePath();
    g.strokeRect(-0.6 * U, -0.05 * U, 1.2 * U, 0.85 * U);
    g.fillRect(-0.18 * U, 0.35 * U, 0.36 * U, 0.45 * U);
  },

  /** デモの速さ。三角の数が速さの段階。 */
  slow: triangles(1),
  fast: triangles(2),
  fastest: triangles(3),

  /** 次の解を探す: 虫眼鏡。速さの三角と取り違えないよう、形の系統を変えてある。 */
  next(g, color) {
    begin(g, color);
    g.strokeCircle(-0.2 * U, -0.2 * U, 0.5 * U);
    g.lineStyle(ICON.lineWidth + 1, color, 1);
    g.lineBetween(0.15 * U, 0.15 * U, 0.85 * U, 0.85 * U);
  },

  /**
   * デモの探し方（TODO-050・TODO-057・TODO-075）。深さ優先は根から枝分かれする
   * 木（決まった順で枝をたどる）、ランダムは散らした節を行き当たりばったりに
   * 結んだもの（線が交差しながら一筆でつながる。TODO-078）。並べたとき、整った
   * 枝分かれと絡まった線で対になるようにする。
   */
  depthFirst(g, color) {
    graph(g, color, TREE_NODES, TREE_EDGES);
  },

  /** チェックボックスの印（TODO-071）。 */
  check(g, color) {
    begin(g, color, ICON.lineWidth + 1);
    g.beginPath();
    g.moveTo(-0.5 * U, 0.05 * U);
    g.lineTo(-0.15 * U, 0.45 * U);
    g.lineTo(0.55 * U, -0.45 * U);
    g.strokePath();
  },

  /** 消す: ゴミ箱（TODO-071）。 */
  trash(g, color) {
    begin(g, color);
    g.strokeRect(-0.4 * U, -0.35 * U, 0.8 * U, 0.85 * U);
    g.lineBetween(-0.55 * U, -0.35 * U, 0.55 * U, -0.35 * U);
    g.lineBetween(-0.18 * U, -0.35 * U, -0.18 * U, -0.6 * U);
    g.lineBetween(0.18 * U, -0.35 * U, 0.18 * U, -0.6 * U);
    g.lineBetween(-0.18 * U, -0.6 * U, 0.18 * U, -0.6 * U);
    g.lineBetween(-0.16 * U, -0.1 * U, -0.16 * U, 0.35 * U);
    g.lineBetween(0.16 * U, -0.1 * U, 0.16 * U, 0.35 * U);
  },

  /** 前の頁へ: 左向きの三角（TODO-071）。 */
  prevPage(g, color) {
    begin(g, color);
    g.fillTriangle(0.35 * U, -0.5 * U, 0.35 * U, 0.5 * U, -0.35 * U, 0);
  },

  /** 次の頁へ: 右向きの三角（TODO-071）。 */
  nextPage(g, color) {
    begin(g, color);
    g.fillTriangle(-0.35 * U, -0.5 * U, -0.35 * U, 0.5 * U, 0.35 * U, 0);
  },

  random(g, color) {
    graph(g, color, SCATTER_NODES, SCATTER_EDGES);
  },
};

/**
 * タイトルで選ぶ盤の形（TODO-046）。「8×8」の文字より、穴のある正方形と横長の
 * 長方形を見せたほうが一目で分かる。マスは選択の状態で変わる色（`color`）で塗り、
 * 選んだ盤が文字と同じく強調色になるようにする。
 */
export function boardIcon(board) {
  const { boardCell: cell, boardGap: gap } = CHOICE_ICON;
  const cells = boardCells(board);
  return (g, color) => {
    g.fillStyle(color, 1);
    for (const [row, col] of cells) {
      g.fillRect((col - board.cols / 2) * cell + gap / 2, (row - board.rows / 2) * cell + gap / 2,
                 cell - gap, cell - gap);
    }
  };
}

/**
 * タイトルで選ぶ色の組の見本（TODO-046）。ピース F・W・X を並べて描く（TODO-087）。
 * 塗り・マスの区切り・外周の色と太さは、盤のマス目（`boot.js`）とピースの
 * 外周（`game.js`）に揃える。外周は本編と同じく線の太さの半分だけ内側へ寄せる。
 * 12 色の立体感、ガラスの光の筋は、この大きさでは潰れるので描かない。
 *
 * ネオンのにじみは、本編（`game.js` の `drawPieceEdges()`）と同じ描き方で
 * 外周の内側へ重ねる（TODO-092）。太さは `NEON.glow` を見本の 1 マスとの比
 * （`CHOICE_ICON.glowScale`）で縮める。明滅はしない（1 枚絵の見本なので）。
 *
 * マス目テクスチャを縮めて貼らないのは、蛍光の組の光る縁が細くなって暗く沈むため。
 * 見本の色は組ごとに決まっているので、選択の状態の `color` は使わない（選んだことは
 * 枠の強調色で分かる）。
 */
export function paletteIcon(palette) {
  const {
    pieceCell: cell, pieceGap: gap, pieces, glowScale,
  } = CHOICE_ICON;
  const size = cell * 3;
  const half = palette.outlineWidth / 2;
  return (g) => {
    pieces.forEach((name, i) => {
      const piece = PIECES.find((p) => p.name === name);
      const color = pieceColor(palette, piece);
      const left = (i - (pieces.length - 1) / 2) * (size + gap) - size / 2;
      const top = -size / 2;
      const has = (row, col) => piece.cells.some(([r, c]) => r === row && c === col);
      g.fillStyle(palette.neon ? darken(color, NEON.fillDarken) : color,
                  palette.glass ? GLASS.fillAlpha : 1);
      for (const [row, col] of piece.cells) g.fillRect(left + col * cell, top + row * cell, cell, cell);

      // ネオンのにじみ。凹の角の欠け（`drawPieceEdges()` と同じ理由）を、
      // 芯より先に埋めておく。
      if (palette.neon) {
        const shape = shapeSize(piece.cells);
        const edges = outlineEdges(piece.cells);
        const concaveCorners = [];
        for (let row = 0; row <= shape.rows; row += 1) {
          for (let col = 0; col <= shape.cols; col += 1) {
            const around = [[-1, -1], [-1, 0], [0, -1], [0, 0]]
              .filter(([dr, dc]) => !has(row + dr, col + dc));
            if (around.length !== 1) continue;
            const [[dr, dc]] = around;
            concaveCorners.push([row, col, dr === -1, dc === -1]);
          }
        }
        for (const layer of NEON.glow) {
          const width = layer.width * glowScale;
          const inset = width / 2;
          g.fillStyle(color, layer.alpha);
          for (const [row, col, missingUp, missingLeft] of concaveCorners) {
            g.fillRect(left + col * cell - (missingLeft ? 0 : width),
                      top + row * cell - (missingUp ? 0 : width), width, width);
          }
          g.lineStyle(width, color, layer.alpha);
          for (const [r1, c1, r2, c2] of edges) {
            const horizontal = r1 === r2;
            const dr = horizontal && has(r1, c1) ? inset : -inset;
            const dc = !horizontal && has(r1, c1) ? inset : -inset;
            const x = horizontal ? 0 : dc;
            const y = horizontal ? dr : 0;
            g.lineBetween(left + c1 * cell + x, top + r1 * cell + y,
                          left + c2 * cell + x, top + r2 * cell + y);
          }
        }
      }

      if (palette.glass) g.lineStyle(TILE.border, GLASS.gridColor, GLASS.gridAlpha);
      else if (palette.neon) g.lineStyle(TILE.border, color, NEON.gridAlpha);
      else g.lineStyle(TILE.border, darken(color, TILE.edgeDarken), 1);
      // マスの区切りは、右と下が同じピースの辺だけ（外周は次で引く）。
      for (const [row, col] of piece.cells) {
        const x = left + col * cell;
        const y = top + row * cell;
        if (has(row, col + 1)) g.lineBetween(x + cell, y, x + cell, y + cell);
        if (has(row + 1, col)) g.lineBetween(x, y + cell, x + cell, y + cell);
      }

      g.lineStyle(palette.outlineWidth, darken(color, palette.outlineDarken), 1);
      for (const [row, col] of piece.cells) {
        const x = left + col * cell;
        const y = top + row * cell;
        if (!has(row - 1, col)) g.lineBetween(x, y + half, x + cell, y + half);
        if (!has(row + 1, col)) g.lineBetween(x, y + cell - half, x + cell, y + cell - half);
        if (!has(row, col - 1)) g.lineBetween(x + half, y, x + half, y + cell);
        if (!has(row, col + 1)) g.lineBetween(x + cell - half, y, x + cell - half, y + cell);
      }
    });
  };
}
