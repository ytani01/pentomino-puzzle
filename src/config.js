/**
 * 盤面・ピース・色・レイアウトの定数。
 *
 * 数値と色をここへ集約するのは、盤の座標系を全ファイルが共有しているため。
 * マスの大きさを 1 か所直せば、盤・トレイ・テクスチャの生成がまとめて追従する。
 */

/**
 * 盤の仕様。穴を「中央 2×2」と直接書かずに矩形で持つのは、
 * `logic.js` の `boardCells()` を盤の形に依存させないため。
 */
export const BOARD_SPEC = {
  rows: 8,
  cols: 8,
  hole: { row: 3, col: 3, rows: 2, cols: 2 },
};

/** 盤のマスのうち、ピースを置ける数。ペントミノ 12 種 × 5 マスと一致する。 */
export const PLAYABLE_CELLS = 60;

/**
 * ペントミノ 12 種。`cells` は `[行, 列]` の配列で、左上を原点に寄せた形。
 *
 * 色は暗い地の上で 12 色を見分けるために、色相をほぼ等間隔に取ってある
 * （隣り合うピースが同系色にならないよう、並び順は名前順のまま）。
 */
export const PIECES = [
  { name: 'F', color: 0xe05c5c, cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { name: 'I', color: 0xe0913c, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { name: 'L', color: 0xd8c246, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  { name: 'N', color: 0x9bd14a, cells: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]] },
  { name: 'P', color: 0x4cbf6a, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { name: 'T', color: 0x3fbfa8, cells: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
  { name: 'U', color: 0x45a8e0, cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { name: 'V', color: 0x5a78e0, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { name: 'W', color: 0x8c6be0, cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
  { name: 'X', color: 0xc060d0, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
  { name: 'Y', color: 0xe060a0, cells: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]] },
  { name: 'Z', color: 0xa8846a, cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
];

/** ピース 1 個のマス数。`logic.js` / `solver.js` の枝刈りが参照する。 */
export const PIECE_SIZE = 5;

/** 盤のマスの状態。空きは `null` で表す。 */
export const HOLE = '#';

/** 画面の色。CSS 側（`index.html`）が持つのは画面の地の色だけ。 */
export const COLORS = {
  background: 0x181b26,
  panel: 0x212636,
  panelEdge: 0x333b52,
  boardCell: 0x2b3145,
  boardCellEdge: 0x3c445e,
  hole: 0x101219,
  ghost: 0xffffff,
  danger: 0xff5555,
  text: 0xe8ecf4,
  textDim: 0x8d97b0,
  accent: 0x6fd3f2,
  buttonFace: 0x2f3750,
  buttonFaceHover: 0x3c4666,
  buttonFaceDown: 0x252c41,
  buttonEdge: 0x4a5578,
  buttonTextDisabled: 0x5b6480,
};

/** テキストの色は Phaser の指定が文字列なので、`COLORS` から作り直しておく。 */
export const TEXT_COLORS = {
  normal: '#e8ecf4',
  dim: '#8d97b0',
  accent: '#6fd3f2',
  danger: '#ff5555',
  disabled: '#5b6480',
};

export const FONT = {
  family: 'system-ui, "Helvetica Neue", Arial, sans-serif',
  title: 52,
  heading: 28,
  body: 18,
  hud: 20,
  small: 15,
};

/**
 * 画面の配置。内部解像度は固定で、実際の表示は `Scale.FIT` が拡大縮小する。
 * 盤を左、未使用ピースのトレイを右に置く。
 */
export const LAYOUT = {
  width: 960,
  height: 640,
  hud: { x: 16, y: 10, width: 928, height: 52, padding: 24, gap: 10, buttonWidth: 104, buttonHeight: 40 },
  board: { x: 24, y: 84, cell: 56 },
  boardPanel: { x: 14, y: 74, width: 468, height: 468 },
  tray: { x: 500, y: 84, width: 426, height: 500, cols: 3, rows: 4, cell: 22 },
  trayPanel: { x: 490, y: 74, width: 446, height: 520 },
  message: { x: 480, y: 612 },
};

/** マス目テクスチャの描き方。ピースの色ごとに 1 枚を `boot.js` が作る。 */
export const TILE = {
  border: 2,
  bevel: 4,
  highlight: 0xffffff,
  highlightAlpha: 0.18,
  shadow: 0x000000,
  shadowAlpha: 0.3,
  edgeDarken: 0.55,
};

/** 操作の判定に使う時間と距離。タップ・長押し・ドラッグを 1 つの押下から見分ける。 */
export const INPUT = {
  longPressMs: 420,
  dragThreshold: 8,
  invalidFlashMs: 260,
  returnTweenMs: 180,
  messageMs: 2600,
};

/**
 * ヒント用の求解の打ち切り上限（配置を試した回数）。
 *
 * 実測では、空の盤面が 11,315 回、最悪が「1 個だけ置いた詰みの盤面」の
 * 448,217 回（置き方 1568 通りを総当たりした最大値。2 個置くと 92,375 回まで下がる）。
 * 上限をその倍に取ってあるので、遊べる盤面はすべて解けるか詰みかを言い切れる。
 * それでも上限を残すのは、盤の形やピースを変えたときに画面が固まらないようにするため。
 */
export const SOLVER_LIMIT = 1000000;

/** クリア記録（最短時間）の保存先。 */
export const STORAGE_KEY = 'pentomino-puzzle/best-ms';

/**
 * 表示用のバージョン。タグを打って GitHub Pages へ公開するとき、
 * CI がこの行の `'dev'` をタグ名へ書き換える（`.github/workflows/pages.yml`）。
 * ローカルで直接開いたときは書き換わらないので `dev` のまま出る。
 */
export const VERSION = 'dev';
