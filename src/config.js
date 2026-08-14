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
  { name: 'F', color: 0xda3e3e, cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
  { name: 'I', color: 0xe09e5c, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { name: 'L', color: 0xdada3e, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]] },
  { name: 'N', color: 0x9ee05c, cells: [[0, 1], [1, 1], [2, 0], [2, 1], [3, 0]] },
  { name: 'P', color: 0x3eda3e, cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]] },
  { name: 'T', color: 0x5ce09e, cells: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },
  { name: 'U', color: 0x3edada, cells: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]] },
  { name: 'V', color: 0x5c9ee0, cells: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { name: 'W', color: 0x3e3eda, cells: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2]] },
  { name: 'X', color: 0x9e5ce0, cells: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]] },
  { name: 'Y', color: 0xda3eda, cells: [[0, 1], [1, 0], [1, 1], [2, 1], [3, 1]] },
  { name: 'Z', color: 0xe05c9e, cells: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
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
  board: { x: 24, y: 84, cell: 64 },
  boardPanel: { x: 14, y: 74, width: 532, height: 532 },
  tray: { x: 560, y: 84, width: 366, height: 500, cols: 3, rows: 4, cell: 20 },
  trayPanel: { x: 550, y: 74, width: 386, height: 520 },
  message: { x: 480, y: 612 },
  confirm: {
    width: 360, height: 170, buttonWidth: 120, buttonHeight: 40, gap: 16,
  },
};

/**
 * マス目テクスチャの描き方。ピースの色ごとに 1 枚を `boot.js` が作る。
 *
 * `edgeDarken` を強くしすぎない（＝あまり暗くしない）のは、ピースの内側の
 * 格子より外周の縁取り（`OUTLINE`）を目立たせ、5 マスが 1 個の塊に
 * 見えるようにするため（TODO-007）。
 */
export const TILE = {
  border: 2,
  bevel: 4,
  highlight: 0xffffff,
  highlightAlpha: 0.18,
  shadow: 0x000000,
  shadowAlpha: 0.3,
  edgeDarken: 0.68,
};

/**
 * ピースの外周の縁取りと落ち影。色だけでは 12 種を見分けきれないため、
 * シルエットの輪郭を手がかりとして足す（TODO-007）。
 *
 * 縁は**シルエットの内側へ寄せて**引く。外へはみ出させると隣のピースに
 * かぶるうえ、盤の地の上では輪郭が太って見えるため。半透明ではなく
 * 「自分の色を暗くした不透明」にしてあるのは、Phaser が線分を 1 本ずつ
 * 描くので、角で重なった所だけ半透明が二重になって濃く出てしまうため。
 *
 * 落ち影は盤の地に落ちる分だけで、ピースどうしが接した所には出ない
 * （描画順が一定しないため、隣の上へ落とすと出たり出なかったりする）。
 *
 * **見え方を変えたいときはこの 3 つを触る**（`game.js` の `drawPieceEdges()`
 * が読む。他の場所に散らばっていない）:
 *
 * - `OUTLINE.width` … 外周の太さ。盤の 1 マス（`LAYOUT.board.cell` = 64）の
 *   座標系での値で、トレイでは `LAYOUT.tray.cell / LAYOUT.board.cell`
 *   = 20/64 に縮む。**トレイでの実測**は 6→1.9px、4→1.25px、
 *   3→0.94px（消えかける）、2→0.6px（まだらになる）。盤での落ち着きを
 *   取って 2 にしてあるが、トレイまで輪郭を確かにしたいなら 4
 * - `OUTLINE.darken` … 外周の暗さ。自分の色に掛ける係数で、小さいほど暗い。
 *   0.2 まで下げるとほぼ黒になり、隣り合う同系色は分けやすくなるが、
 *   暗い地に接した所でピースが痩せて見える
 * - `TILE.edgeDarken` … ピース**内側**の格子の濃さ。外周より弱くしておく
 *   （外周と同じ濃さにすると 5 マスが 1 個の塊に見えなくなる）。
 *   0.78 まで上げるとマス目感が消えたので 0.68 にしてある
 */
export const OUTLINE = {
  width: 2,
  darken: 0.3,
  shadowOffset: 5,
  shadowColor: 0x000000,
  shadowAlpha: 0.3,
};

/** 操作の判定に使う時間と距離。タップ・ダブルタップ・ドラッグを見分ける。 */
export const INPUT = {
  doubleTapMs: 320,
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
