/**
 * 盤面・ピース・色・レイアウトの定数。
 *
 * 数値と色をここへ集約するのは、盤の座標系を全ファイルが共有しているため。
 * マスの大きさを 1 か所直せば、盤・トレイ・テクスチャの生成がまとめて追従する。
 */

/**
 * 選べる盤。穴を「中央 2×2」と直接書かずに矩形で持つのは、`logic.js` の
 * `boardCells()` を盤の形に依存させないため。穴の無い盤は `hole: null` で表す。
 *
 * どちらも置けるマスは 60 で、ペントミノ 12 種がちょうど収まる（TODO-009）。
 * `note` はタイトルの遊び方に出す但し書きで、盤を足したときに文面を
 * 書き換えずに済むよう盤の側へ持たせてある。
 *
 * `storageKey` を盤ごとに分けてあるのは、難しさの違う盤の最短時間を同じ記録に
 * 混ぜないため。8×8 だけ接尾辞が無いのは、盤が 1 つだった頃の記録を
 * そのまま引き継ぐため。
 */
export const BOARDS = {
  '8x8': {
    key: '8x8',
    label: '8×8',
    note: '中央 2×2 は穴',
    rows: 8,
    cols: 8,
    hole: { row: 3, col: 3, rows: 2, cols: 2 },
    storageKey: 'pentomino-puzzle/best-ms',
  },
  '6x10': {
    key: '6x10',
    label: '6×10',
    note: '穴なし',
    rows: 6,
    cols: 10,
    hole: null,
    storageKey: 'pentomino-puzzle/best-ms/6x10',
  },
};

/** 起動したときに選ばれている盤。 */
export const DEFAULT_BOARD_KEY = '8x8';

/**
 * 選んだ盤を覚えておく `game.registry` のキー。シーンをまたいで残る場所へ
 * 1 つだけ置き、タイトルが書いて他のシーンが読む（TODO-009）。
 *
 * `scene.start()` の引数で回さないのは、タイトル↔本編↔クリアの行き来が
 * 6 通りあり、どこかで渡し漏れると黙って既定の盤に戻ってしまうため。
 */
export const BOARD_REGISTRY_KEY = 'board';

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

/**
 * ピースの色の組（TODO-015）。
 *
 * TODO-007 でピースへ外周の縁取りを付けたので、**塊の見分けに色を使わなくても
 * 済むようになった**。そこで 12 個とも同じ色の「ガラス」を既定にし、
 * 今までどおり 12 色に塗り分ける組も選べるようにしてある。
 *
 * - `mono` … 単色なら 12 種で共通に使う色、色を分けるなら `null`
 *   （`PIECES[].color` を使う）。テクスチャを 1 枚に減らせるかの判断も兼ねる
 * - `glass` … マスをガラスふうに焼くか（`boot.js` の `makeTile`）
 * - `outlineDarken` / `outlineWidth` … 外周の縁取りの暗さと太さ。
 *   **単色のほうを暗く太くしてある**のは、同じ色どうしが接したときに外周だけが
 *   境目になるため（12 色なら色の違いも境目の手がかりになる）
 */
export const PALETTES = {
  glass: {
    key: 'glass',
    label: 'ガラス',
    mono: 0x7cc4e8,
    glass: true,
    outlineDarken: 0.2,
    outlineWidth: 3,
  },
  colorful: {
    key: 'colorful',
    label: '12 色',
    mono: null,
    glass: false,
    outlineDarken: 0.3,
    outlineWidth: 2,
  },
};

/** 一度も選んでいないときの色の組。 */
export const DEFAULT_PALETTE_KEY = 'glass';

/** 選んだ色の組を覚えておく `game.registry` のキー（`BOARD_REGISTRY_KEY` と同じ扱い）。 */
export const PALETTE_REGISTRY_KEY = 'palette';

/** 選んだ色の組の保存先。盤ごとの記録（`BOARDS[key].storageKey`）とは別に 1 つだけ持つ。 */
export const PALETTE_STORAGE_KEY = 'pentomino-puzzle/palette';

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
 * 画面の配置を組み立てるための寸法。すべて内部解像度の座標系。
 *
 * ここにある数だけが「手で決めた値」で、枠やマスの大きさは `makeLayout()` が
 * これらから計算する。見た目を詰めるときはこの表を触る。
 */
const MARGIN = 14;         // 画面の縁と枠の間
const PANEL_PAD = 10;      // 枠と、その中身の間
const GAP = 12;            // 枠どうしの間
const HUD_TOP = 10;        // 画面の上端と HUD の間
const HUD_ROW = 52;        // HUD 1 段ぶんの高さ
const MESSAGE_BAND = 34;   // 画面の下端に空ける、メッセージ 1 行ぶんの帯
const TRAY_SPAN = 5;       // ペントミノは縦横どちらにも最大 5 マス（`I` の向き次第）
const TRAY_SLOT_PAD = 12;  // トレイの 1 スロットで、ピースの周りに空ける分
const TRAY_CELL_MAX = 20;  // トレイのマスの上限。TODO-006 で掴みやすさを見て決めた値で、
                           // これより大きくしても掴みやすさは変わらず場所を食うだけ

/** トレイの 1 スロットの一辺から、そこへ収まるマスの大きさを出す。 */
function trayCellFor(slot) {
  return Math.min(TRAY_CELL_MAX, Math.floor((slot - TRAY_SLOT_PAD) / TRAY_SPAN));
}

/** 逆に、マスの大きさから 1 スロットに要る一辺を出す。 */
function traySlotFor(cell) {
  return cell * TRAY_SPAN + TRAY_SLOT_PAD;
}

/**
 * 内部解像度。実際の表示は `Scale.FIT` が拡大縮小する。
 *
 * 縦の 640×1136 は 16:9。今のスマホは縦画面がこれより細長い（375×667 と
 * 320×568 はちょうど 16:9、390×844 と 412×915 はさらに細長い）ので、
 * 3:2 の 640×960 にすると `Scale.FIT` が上下に大きな余白を作ってしまう。
 */
function screenSize(portrait) {
  return { width: portrait ? 640 : 960, height: portrait ? 1136 : 640 };
}

/**
 * 画面の配置を作る。
 *
 * 固定値 1 組ではなく関数にしてあるのは、盤の大きさ（8×8 と 6×10）と画面の
 * 向き（横と縦）の組み合わせが 4 通りあり、手で並べた数値では食い違いを
 * 防げないため（TODO-011）。マスの大きさも 64 固定をやめ、盤に使える幅と
 * 高さの小さいほうから決める。
 *
 * 場所の取り合いは**トレイを先に決めて、余りを全部盤に回す**。トレイは
 * ピースが掴めるだけあればよく、大きく見せたいのは盤のほうだから。
 *
 * - 横画面（盤が左・トレイが右）… トレイは高さいっぱいなので、1 スロットの
 *   **高さ**から一辺を決め、必要な幅を盤の取り分から差し引く
 * - 縦画面（盤が上・トレイが下）… トレイは幅いっぱいなので、1 スロットの
 *   **幅**から一辺を決め、必要な高さを盤の取り分から差し引く
 */
export function makeLayout({ portrait, board }) {
  const { width, height } = screenSize(portrait);

  // 縦画面は横幅が狭く、ボタン 5 個と時間の表示が 1 段に並ばないので 2 段にする。
  const hudRows = portrait ? 2 : 1;
  const hud = {
    x: MARGIN,
    y: HUD_TOP,
    width: width - MARGIN * 2,
    height: HUD_ROW * hudRows,
    rows: hudRows,
    rowHeight: HUD_ROW,
    padding: 24,
    gap: 10,
    buttonWidth: 104,
    buttonHeight: 40,
  };

  // HUD の下からメッセージの帯の上までが、盤とトレイで分け合う範囲。
  const top = hud.y + hud.height + GAP;
  const bottom = height - MESSAGE_BAND;

  // 12 個をどう並べるかは、縦横それぞれで盤に残る場所が一番広くなる形。
  // 縦画面を 6 列 2 段にすると 1 スロットが横に狭まり、`I` の 5 マスを
  // 収めるためにトレイのマスが 17 まで縮む（4 列 3 段なら 20 のまま）。
  const tray = portrait ? { cols: 4, rows: 3 } : { cols: 3, rows: 4 };
  let boardBoxWidth;
  let boardBoxHeight;
  if (portrait) {
    tray.cell = trayCellFor((width - MARGIN * 2 - PANEL_PAD * 2) / tray.cols);
    boardBoxWidth = width - MARGIN * 2;
    boardBoxHeight = (bottom - top) - GAP
      - (traySlotFor(tray.cell) * tray.rows + PANEL_PAD * 2);
  } else {
    tray.cell = trayCellFor(((bottom - top) - PANEL_PAD * 2) / tray.rows);
    boardBoxWidth = (width - MARGIN * 2) - GAP
      - (traySlotFor(tray.cell) * tray.cols + PANEL_PAD * 2);
    boardBoxHeight = bottom - top;
  }

  const cell = Math.min(
    Math.floor((boardBoxWidth - PANEL_PAD * 2) / board.cols),
    Math.floor((boardBoxHeight - PANEL_PAD * 2) / board.rows),
  );
  const boardPanel = {
    width: board.cols * cell + PANEL_PAD * 2,
    height: board.rows * cell + PANEL_PAD * 2,
  };
  // 交わる向き（横画面なら上下、縦画面なら左右）には中央へ寄せる。盤が
  // 幅で頭打ちになったとき（6×10 の横画面など）に片側へ偏らないようにするため。
  boardPanel.x = portrait
    ? Math.round((width - boardPanel.width) / 2)
    : MARGIN;
  boardPanel.y = portrait
    ? top
    : top + Math.round(((bottom - top) - boardPanel.height) / 2);

  // トレイの枠は残りを全部使う（`traySlotFor` で見積もった分よりは必ず広い）。
  const trayPanel = portrait
    ? {
      x: MARGIN,
      y: boardPanel.y + boardPanel.height + GAP,
      width: width - MARGIN * 2,
      height: 0,
    }
    : {
      x: MARGIN + boardPanel.width + GAP,
      y: top,
      width: 0,
      height: bottom - top,
    };
  trayPanel.height = portrait ? bottom - trayPanel.y : trayPanel.height;
  trayPanel.width = portrait ? trayPanel.width : width - MARGIN - trayPanel.x;

  return {
    width,
    height,
    portrait,
    // タイトルとクリアの画面が、枠を画面幅いっぱいに広げすぎないために読む。
    margin: MARGIN,
    hud,
    board: { x: boardPanel.x + PANEL_PAD, y: boardPanel.y + PANEL_PAD, cell },
    boardPanel,
    tray: {
      x: trayPanel.x + PANEL_PAD,
      y: trayPanel.y + PANEL_PAD,
      width: trayPanel.width - PANEL_PAD * 2,
      height: trayPanel.height - PANEL_PAD * 2,
      cols: tray.cols,
      rows: tray.rows,
      cell: tray.cell,
    },
    trayPanel,
    message: { x: width / 2, y: height - MESSAGE_BAND / 2 },
    confirm: {
      width: 360, height: 170, buttonWidth: 120, buttonHeight: 40, gap: 16,
    },
  };
}

/**
 * 画面の向き。**起動時に 1 回だけ見て、以後は変えない**（TODO-011）。
 *
 * 遊んでいる最中に端末を回しても組み直さず、`Scale.FIT` が縮めるに任せる。
 * 組み直すには盤面・ピースの位置・経過時間・Undo の履歴を持ち越して Game
 * シーンを作り直す必要があり、持ち越しの取りこぼしがバグになりやすいため。
 */
const PORTRAIT = window.innerHeight > window.innerWidth;

/**
 * 盤に依らない画面の寸法。Phaser の設定（`main.js`）と、盤を持たない
 * タイトル・クリアの画面が読む。
 */
export const SCREEN = { portrait: PORTRAIT, margin: MARGIN, ...screenSize(PORTRAIT) };

/**
 * 盤ごとの配置。**選べる盤ぶんを起動時にまとめて作る**（TODO-009）。
 *
 * 選び直すたびに作り直すのをやめたのは、書き換わる状態をモジュールへ
 * 持たせないため。中身は画面の向きと盤の大きさだけで決まるので、
 * 先に作っても選んだあとに作っても同じものになる。
 */
export const LAYOUTS = Object.fromEntries(
  Object.values(BOARDS).map((board) => [board.key, makeLayout({ portrait: PORTRAIT, board })]),
);

/**
 * マス目テクスチャの描き方。ピースの色ごとに 1 枚を `boot.js` が作る。
 *
 * `edgeDarken` を強くしすぎない（＝あまり暗くしない）のは、ピースの内側の
 * 格子より外周の縁取り（`OUTLINE`）を目立たせ、5 マスが 1 個の塊に
 * 見えるようにするため（TODO-007）。
 */
export const TILE = {
  border: 1,
  bevel: 4,
  highlight: 0xffffff,
  highlightAlpha: 0.18,
  shadow: 0x000000,
  shadowAlpha: 0.3,
  edgeDarken: 0.0,
};

/**
 * ガラスふうのマスの描き方（`PALETTES.glass`。TODO-015）。
 *
 * 画像を持ち込まずにガラスらしさを出すため、**地を半透明にして盤のマスを
 * 透かし**、その上へ内側の明るい縁と斜めの光の筋を重ねる。帯の位置は
 * マスの一辺に対する割合で持つ（盤で 64px、トレイで 20px と大きさが違うため）。
 *
 * 半透明の度合い（`fillAlpha`）は、**ゴースト（`COLORS.ghost` を alpha 0.28 で
 * 出す）と紛れない**ことが下限を決めている。薄くするほどガラスらしくなるが、
 * 置いてあるピースと「ここへ置ける」の影が見分けにくくなる。
 */
export const GLASS = {
  fillAlpha: 0.62,
  innerInset: 2.5,
  innerAlpha: 0.3,
  innerWidth: 1,
  // マスの区切り。12 色の組（`TILE.edgeDarken` で黒）より薄くしてあるのは、
  // **単色では外周の縁取りだけが塊の境目になる**ため。区切りが同じ濃さだと
  // 5 マスが 1 個に見えず、盤が一面のタイル貼りに見えてしまう。
  gridColor: 0x000000,
  gridAlpha: 0.22,
  // 斜めの光の筋。`[開始, 終了]` は左上の角から右下へ向かう対角上の位置で、
  // 一辺に対する割合。太い筋と細い筋の 2 本にすると、1 本より硝子板らしくなる。
  streaks: [
    { from: 0.42, to: 0.72, alpha: 0.16 },
    { from: 0.86, to: 0.98, alpha: 0.1 },
  ],
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
 * - `OUTLINE.width` … 外周の太さ。盤の 1 マス（`LAYOUT.board.cell`。横画面の
 *   8×8 で 64）の座標系での値で、トレイでは `LAYOUT.tray.cell /
 *   LAYOUT.board.cell` = 20/64 に縮む。**トレイでの実測**は 6→1.9px、4→1.25px、
 *   3→0.94px（消えかける）、2→0.6px（まだらになる）。盤での落ち着きを
 *   取って 2 にしてあるが、トレイまで輪郭を確かにしたいなら 4
 * - `PALETTES[key].outlineDarken` … 外周の暗さ。自分の色に掛ける係数で、
 *   小さいほど暗い。0.2 まで下げるとほぼ黒になり、隣り合う同系色は分けやすく
 *   なるが、暗い地に接した所でピースが痩せて見える。**色の組ごとに違う**ので
 *   `OUTLINE` ではなく `PALETTES` の側にある（TODO-015）
 * - `TILE.edgeDarken` … ピース**内側**の格子の濃さ。外周より弱くしておく
 *   （外周と同じ濃さにすると 5 マスが 1 個の塊に見えなくなる）。
 *   0.78 まで上げるとマス目感が消えたので 0.68 にしてある
 */
export const OUTLINE = {
  width: 2,
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
 * 実測は盤ごとに、空の盤面と「1 個だけ置いた盤面すべて」で取ってある
 * （後者は置き方を総当たりして、試行回数の最大値を拾ったもの）。
 *
 * - 8×8（中央 2×2 が穴）… 空の盤面 11,315 回、最悪 448,217 回
 *   （置き方 1568 通りの最大値。2 個置くと 92,375 回まで下がる）
 * - 6×10（穴なし）… 空の盤面 110,111 回、最悪 3,611,522 回
 *   （置き方 2056 通りの最大値。`I` を横向きで 4 行 3 列へ置いた詰みの盤面。TODO-009）
 *
 * かかる時間は 1 回あたりおよそ 1.2 マイクロ秒で、6×10 の最悪は **4.2 秒**
 * （8×8 の最悪は 0.5 秒）。求解は同期で回すので、その間は画面が止まる。
 * 詰みの盤面でヒントを押したときだけなので今は待たせているが、待たせ方は
 * TODO-013（置くたびに解の有無を出すモード）で決める。
 *
 * 上限は重いほうの盤（6×10）の最悪のおよそ倍に取ってあるので、遊べる盤面は
 * すべて解けるか詰みかを言い切れる。それでも上限を残すのは、盤の形やピースを
 * 変えたときに画面が固まらないようにするため。
 */
export const SOLVER_LIMIT = 8000000;

/**
 * 表示用のバージョン。タグを打って GitHub Pages へ公開するとき、
 * CI がこの行の `'dev'` をタグ名へ書き換える（`.github/workflows/pages.yml`）。
 * ローカルで直接開いたときは書き換わらないので `dev` のまま出る。
 */
export const VERSION = 'dev';
