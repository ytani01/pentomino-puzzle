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
 *
 * `historyKey`（クリア記録の履歴。TODO-008）・`foundKey`（自力で見つけた解の
 * 番号。TODO-022）・`autoKey`（おまかせで出した解の番号。TODO-016）・
 * `progressKey`（遊びかけの盤面。TODO-030）は
 * **どれも接尾辞を付けて揃えてある**。引き継ぐ古い記録がそもそも無いので、
 * `storageKey` の不揃いを新しいキーにまで持ち込む理由が無い。
 *
 * `progressKey` を盤ごとに分けてあるのは、8×8 を遊びかけたまま 6×10 を
 * 始めても、どちらの続きも残るようにするため（TODO-030）。
 *
 * `historyKey` に `v2` が入っているのは、TODO-028 で履歴の印の文字を
 * `h` / `c` から `a` / `h` へ付け替えたため。`h` の指すものが入れ替わる
 * （前はおまかせ、今はヒント表示）ので、前の版が書いた件を読むと印の意味が
 * ずれる。キーを変えて読まないようにしてある（前の記録は残るが使われない）。
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
    historyKey: 'pentomino-puzzle/history/v2/8x8',
    foundKey: 'pentomino-puzzle/found/8x8',
    autoKey: 'pentomino-puzzle/auto/8x8',
    progressKey: 'pentomino-puzzle/progress/8x8',
  },
  '6x10': {
    key: '6x10',
    label: '6×10',
    note: '穴なし',
    rows: 6,
    cols: 10,
    hole: null,
    storageKey: 'pentomino-puzzle/best-ms/6x10',
    historyKey: 'pentomino-puzzle/history/v2/6x10',
    foundKey: 'pentomino-puzzle/found/6x10',
    autoKey: 'pentomino-puzzle/auto/6x10',
    progressKey: 'pentomino-puzzle/progress/6x10',
  },
};

/**
 * 盤 1 つぶんに残すクリア記録の件数（TODO-008）。あふれたら古いものから捨てる。
 *
 * 上限を置くのは、一覧として何百件も並ぶと目当ての回を探せないため。
 * 50 件なら遊んだぶんをあらかた辿れる。
 *
 * TODO-022 で 1 件が盤面 60 マスぶんの文字列から解の番号だけになったので、
 * 容量の心配は無くなった（それでも上限を残すのは、上に書いた一覧としての
 * 見やすさのため）。**「全部で何解を見つけたか」はこの 50 件では数えない**。
 * 番号だけを別に貯めてあり（`foundKey`）、達成度はそちらで出す。
 */
export const HISTORY_LIMIT = 50;

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

/** ピース 1 個のマス数。`logic.js` と `tools/enumerate.mjs` の枝刈りが参照する。 */
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
 * - `colors` … 色を分ける組で、`PIECES[].color` の代わりに使うピース名ごとの色。
 *   `null` なら `PIECES[].color`（TODO-039）
 * - `glass` … マスをガラスふうに焼くか（`boot.js` の `makeTile`）
 * - `neon` … ネオンふうに焼き、外周を光らせて明滅させるか（`NEON`。TODO-039）
 * - `outlineDarken` / `outlineWidth` … 外周の縁取りの暗さと太さ。
 *   **単色のほうを暗く太くしてある**のは、同じ色どうしが接したときに外周だけが
 *   境目になるため（12 色なら色の違いも境目の手がかりになる）
 */
export const PALETTES = {
  glass: {
    key: 'glass',
    label: 'ガラス',
    mono: 0x7cc4e8,
    colors: null,
    glass: true,
    neon: false,
    outlineDarken: 0.2,
    outlineWidth: 3,
  },
  colorful: {
    key: 'colorful',
    label: '12 色',
    mono: null,
    colors: null,
    glass: false,
    neon: false,
    outlineDarken: 0.3,
    outlineWidth: 2,
  },
  // 蛍光色は `PIECES[].color` と同じく色相をほぼ等間隔に取り、並びも揃えてある。
  // 12 色の組より彩度と明るさを上げたのは、暗く沈めたマスの上で外周だけが
  // 光って見えるようにするため。`outlineDarken` が 1 なのは、外周が発光の
  // 芯そのもので、暗くすると光って見えなくなるため。
  neon: {
    key: 'neon',
    label: 'ネオン',
    mono: null,
    colors: {
      F: 0xff3b3b, I: 0xff9a1f, L: 0xfff53d, N: 0xaaff2a,
      P: 0x39ff14, T: 0x2bffb0, U: 0x1ff2ff, V: 0x3aa0ff,
      W: 0x6b6bff, X: 0xb44dff, Y: 0xff3df5, Z: 0xff2d95,
    },
    glass: false,
    neon: true,
    outlineDarken: 1,
    outlineWidth: 3,
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
  ghost: 0xffffff,
  danger: 0xff5555,
  success: 0x3fbf6e,
  text: 0xe8ecf4,
  textDim: 0x8d97b0,
  accent: 0x6fd3f2,
  buttonFace: 0x2f3750,
  buttonFaceHover: 0x3c4666,
  buttonFaceDown: 0x252c41,
  buttonEdge: 0x4a5578,
  buttonTextDisabled: 0x5b6480,
};

/**
 * 確認ダイアログやクリア表示の下に敷き、後ろの画面を暗くする幕。
 * 本編・記録・クリア表示の 3 か所で同じ見え方にするため、ここに 1 つだけ置く（TODO-072）。
 */
export const BACKDROP = { color: 0x000000, alpha: 0.55 };

/** テキストの色は Phaser の指定が文字列なので、`COLORS` から作り直しておく。 */
export const TEXT_COLORS = {
  normal: '#e8ecf4',
  dim: '#8d97b0',
  accent: '#6fd3f2',
  danger: '#ff5555',
  disabled: '#5b6480',
};

/**
 * 文字の大きさ。**内部解像度の座標系**なので、`Scale.FIT` が縮めたぶんだけ
 * 実際は小さく出る（TODO-026）。
 *
 * 横画面の内部解像度は 960×640 で、スマホの横画面はこれより横長なので高さで
 * 頭打ちになる。一番厳しい 568×320 では 0.5 倍、よくある 844×390 でも 0.61 倍
 * なので、**ここの値のおよそ 6 割が実寸**だと思って決める。`small` を 15 に
 * していた頃は実寸 9px ほどで、スマホでは読めなかった。
 */
export const FONT = {
  family: 'system-ui, "Helvetica Neue", Arial, sans-serif',
  title: 68,
  heading: 36,
  body: 24,
  hud: 26,
  small: 20,
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
const HUD_ROW = 56;        // HUD 1 段ぶんの高さ
const HUD_PAD = 20;        // HUD の枠と、その中身の間
const HUD_GAP = 8;         // ボタンどうしの間
const HUD_BUTTONS = 6;     // HUD に並ぶボタンの数（`createHudButtons()` に渡す数と合わせる）
const DEMO_HUD_BUTTONS = 7; // デモの HUD のボタンの数。探し方の切り替えの分だけ多い（TODO-050）
const HUD_BUTTON_MAX = 130; // ボタン 1 個の幅。場所が足りなければここから詰める
const HUD_BUTTON_HEIGHT = 44;
const HUD_REMAIN_X = 140;  // 段の中身の左端から見た「残り n」の位置
const HUD_STATUS_X = 250;  // 同じく、解の有無（TODO-013）の位置
const MESSAGE_BAND = 40;   // 画面の下端に空ける、メッセージ 1 行ぶんの帯
const TRAY_SLOT_PAD = 6;   // トレイの 1 スロットで、ピースの周りに空ける分
                           // 12 から詰めた。指を動かす距離を縮めたく、間が狭くても掴みやすさは落ちない（TODO-053）
const TRAY_CELL_MAX = 20;  // トレイのマスの上限。TODO-006 で掴みやすさを見て決めた値で、
                           // これより大きくしても掴みやすさは変わらず場所を食うだけ

/**
 * トレイのスロットを、盤に近い棚から詰めて並べる（TODO-053）。
 *
 * 等分のスロットをやめたのは、トレイの枠が広いほどピースどうしが離れ、
 * 盤まで指を動かす距離が延びるため。スロットの一辺はピースの長い辺で決める。
 * 回しても長い辺は変わらないので、どの向きにしてもはみ出さない。
 * 大きい順に並べるのは、棚の奥行き（その棚で一番大きいスロット）を無駄にしないため。
 *
 * 返す座標は、沿う向き `along` を 0〜`length`、奥行き `depth` を盤の側の端から
 * 測ったもの。画面の座標へは `makeLayout()` が盤の位置が決まってから直す。
 */
function packTray(length) {
  const longSides = PIECES.map(({ cells }) => 1 + Math.max(
    ...cells.map(([r]) => r), ...cells.map(([, c]) => c)));
  let cell = TRAY_CELL_MAX;
  while (Math.max(...longSides) * cell + TRAY_SLOT_PAD > length) cell -= 1;

  const order = longSides.map((_, i) => i)
    .sort((a, b) => longSides[b] - longSides[a]);  // 安定ソートなので同じ大きさは PIECES の順
  const shelves = [];
  let shelf = null;
  for (const i of order) {
    const size = longSides[i] * cell + TRAY_SLOT_PAD;
    if (!shelf || shelf.used + size > length) {
      shelf = { used: 0, depth: 0, items: [] };
      shelves.push(shelf);
    }
    shelf.items.push({ i, size, along: shelf.used });
    shelf.used += size;
    shelf.depth = Math.max(shelf.depth, size);
  }

  const slots = [];
  let depth = 0;
  for (const { used, depth: shelfDepth, items } of shelves) {
    // 沿う向きはトレイの中央へ、奥行きは棚の中で中央へ寄せる
    const offset = (length - used) / 2;
    for (const { i, size, along } of items) {
      slots[i] = { along: offset + along + size / 2, depth: depth + shelfDepth / 2, size };
    }
    depth += shelfDepth;
  }
  return { cell, slots, depth };
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
 * - 横画面（盤が左・トレイが右）… トレイは高さいっぱいなので、スロットを
 *   縦に詰めて棚にし、棚の幅の合計を盤の取り分から差し引く
 * - 縦画面（盤が上・トレイが下）… トレイは幅いっぱいなので、スロットを
 *   横に詰めて棚にし、棚の高さの合計を盤の取り分から差し引く
 *
 * スロットは `packTray()` が詰めて並べ、盤の側の端から置く（TODO-053）。
 */
export function makeLayout({ portrait, board, buttons = HUD_BUTTONS }) {
  const { width, height } = screenSize(portrait);

  // 縦画面は横幅が狭く、ボタン 6 個が 1 段に並ばないので 2 段に折り返す
  // （TODO-013 でボタンが 6 個になり、幅を詰めても 1 段には収まらなくなった）。
  // デモの 7 個（TODO-050）も 2 段に収め、盤とトレイを本編と同じ位置に保つ。
  const buttonsPerRow = portrait ? Math.ceil(buttons / 2) : buttons;
  const buttonRows = Math.ceil(buttons / buttonsPerRow);
  // 文字（時間・残り・解の有無）とボタンは段を分ける。横画面は同じ段に並べて
  // いたが、TODO-026 で文字を大きくするとボタン 1 個が 85 では収まらなくなった。
  const hudRows = buttonRows + 1;
  const hudWidth = width - MARGIN * 2;
  const buttonsLeft = 0;
  // 幅は上限から詰める。横画面の 6 個は 104 では文字とぶつかるので 85 まで縮む。
  const buttonWidth = Math.min(HUD_BUTTON_MAX, Math.floor(
    ((hudWidth - HUD_PAD - buttonsLeft) - HUD_GAP * (buttonsPerRow - 1)) / buttonsPerRow,
  ));
  const hud = {
    x: MARGIN,
    y: HUD_TOP,
    width: hudWidth,
    height: HUD_ROW * hudRows,
    rows: hudRows,
    rowHeight: HUD_ROW,
    padding: HUD_PAD,
    gap: HUD_GAP,
    buttonWidth,
    buttonHeight: HUD_BUTTON_HEIGHT,
    buttonsPerRow,
    // ボタンが始まる段。文字の段が 1 段あるので、今はどちらの向きでも 1。
    // 文字と同じ段（0）に並べていたのは TODO-026 より前（上の `hudRows`）。
    firstButtonRow: hudRows - buttonRows,
    remainX: HUD_REMAIN_X,
    statusX: HUD_STATUS_X,
  };

  // HUD の下からメッセージの帯の上までが、盤とトレイで分け合う範囲。
  const top = hud.y + hud.height + GAP;
  const bottom = height - MESSAGE_BAND;

  // トレイに要る奥行き（棚の合計）だけを盤の取り分から引く。
  const trayLength = portrait
    ? width - MARGIN * 2 - PANEL_PAD * 2
    : (bottom - top) - PANEL_PAD * 2;
  const tray = packTray(trayLength);
  let boardBoxWidth;
  let boardBoxHeight;
  if (portrait) {
    boardBoxWidth = width - MARGIN * 2;
    boardBoxHeight = (bottom - top) - GAP - (tray.depth + PANEL_PAD * 2);
  } else {
    boardBoxWidth = (width - MARGIN * 2) - GAP - (tray.depth + PANEL_PAD * 2);
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

  // トレイの枠は残りを全部使う（棚の奥行きの合計よりは必ず広い）。
  // スロットは枠の盤側の端から詰めるので、余りは盤から遠い側に出る。
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

  const trayInner = {
    x: trayPanel.x + PANEL_PAD,
    y: trayPanel.y + PANEL_PAD,
    width: trayPanel.width - PANEL_PAD * 2,
    height: trayPanel.height - PANEL_PAD * 2,
  };
  // PIECES と同じ順。`piece.slot` がそのまま添字になる
  const slots = tray.slots.map(({ along, depth, size }) => (portrait
    ? { x: trayInner.x + along, y: trayInner.y + depth, size }
    : { x: trayInner.x + depth, y: trayInner.y + along, size }));

  return {
    width,
    height,
    portrait,
    // タイトルとクリアの画面が、枠を画面幅いっぱいに広げすぎないために読む。
    margin: MARGIN,
    hud,
    board: { x: boardPanel.x + PANEL_PAD, y: boardPanel.y + PANEL_PAD, cell },
    boardPanel,
    tray: { ...trayInner, cell: tray.cell, slots },
    trayPanel,
    message: { x: width / 2, y: height - MESSAGE_BAND / 2 },
    confirm: {
      width: 460, height: 200, buttonWidth: 150, buttonHeight: 48, gap: 20,
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
 * デモの配置（TODO-050）。HUD のボタンが本編より 1 つ多いので別に作る。
 * 本編の `LAYOUTS` を触らずに済ませ、本編の見た目を変えないため。
 * ボタンの段数は本編と同じなので、盤とトレイの位置・マスの大きさは本編と同じになる。
 */
export const DEMO_LAYOUTS = Object.fromEntries(
  Object.values(BOARDS).map((board) => [
    board.key, makeLayout({ portrait: PORTRAIT, board, buttons: DEMO_HUD_BUTTONS }),
  ]),
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
 * 8×8 の中央の穴に置く、透明アクリルふうの板（TODO-051）。
 *
 * 穴を暗く塗ると「マスが欠けている」ように見えるだけなので、動かせない
 * 1 枚の板が嵌まっていると見せる。下の枠（パネル）の地がほぼそのまま
 * 透けるよう、塗りはごく薄くする（`fillAlpha`）。板らしさは外周の縁、
 * 内側の明るい縁、右下の厚みの影、斜めの光の筋で出す。筋の位置は
 * `GLASS.streaks` と同じく、板の対角に対する割合。
 */
export const ACRYLIC = {
  fill: 0xdfefff,
  fillAlpha: 0.07,
  edge: 0xdfefff,
  edgeAlpha: 0.55,
  edgeWidth: 2,
  innerInset: 5,
  innerAlpha: 0.25,
  innerWidth: 1,
  thickness: 3,
  thicknessAlpha: 0.35,
  streaks: [
    { from: 0.3, to: 0.48, alpha: 0.12 },
    { from: 0.56, to: 0.62, alpha: 0.08 },
  ],
};

/**
 * ネオンふうの見え方（`PALETTES.neon`。TODO-039）。
 *
 * マスは自分の色を暗く沈めて塗り（`fillDarken`）、光らせるのは外周だけにする。
 * マスごとに光らせると 5 マスが 1 個の塊に見えなくなるため（`TILE.edgeDarken`
 * と同じ理由）。内側の格子は自分の色を薄く引くだけ（`gridAlpha`）。
 *
 * `glow` は外周の芯（`PALETTES.neon.outlineWidth`）の内側へ重ねる、太くて薄い線。
 * 太さは `OUTLINE.width` と同じく盤の 1 マスの座標系での値で、トレイでは縮む。
 * 芯と同じく内側へ寄せるので、隣のピースにはかぶらない。角で重なった所が
 * 濃く出るが、光のにじみとしてはそのほうが自然なので揃えていない。
 *
 * `blink` は `glow` の明滅。芯は明滅させない（形が読みにくくならないように）。
 * 12 個を同じ調子で明滅させるのは、ばらばらだと盤全体がちらついて見えるため。
 */
export const NEON = {
  fillDarken: 0.2,
  gridAlpha: 0.3,
  // 濃さは明滅の振れ幅でもある。0.16 / 0.32 では暗い時と明るい時の差が
  // 静止画でほとんど見分けられなかった（TODO-039 の撮影）。
  glow: [
    { width: 18, alpha: 0.28 },
    { width: 10, alpha: 0.5 },
  ],
  blink: { minAlpha: 0.2, durationMs: 1200 },
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

/**
 * トレイのピースに重ねる、次のタップで何が起きるかの印（TODO-025）。
 *
 * 値は盤のマス 1 個ぶんを 1 とした割合。ピースは盤のマスの座標系で描き、
 * トレイでは Container の拡大率（`LAYOUT.tray.cell / LAYOUT.board.cell`）が
 * 掛かるので、**画面に出る大きさはトレイのマス 1 個ぶんに対する割合**になる
 * （線の太さも同じように縮むので、太さもここでは割合で持つ）。
 *
 * ピースの色が濃くても薄くても読めるよう、白い線の下に暗い縁取りを敷く。
 */
export const TURN_MARK = {
  radius: 0.70,        // 回転の円弧の半径
  headSize: 0.30,      // 矢じりの大きさ
  arrowLength: 0.85,   // 左右反転の矢印の、中心から先までの長さ
  width: 0.16,         // 線の太さ
  color: 0xffffff,
  alpha: 0.95,
  edgeColor: 0x000000,
  edgeAlpha: 0.6,
  edgeWidth: 0.38,     // 縁取りの太さ（本線より太く、下に敷く）
};

/**
 * 操作の判定に使う時間と距離。タップとドラッグ、置く動きと戻す振りを見分ける。
 *
 * ダブルタップ（反転）は TODO-023 で無くした。1 回目のタップをその猶予ぶん
 * 遅らせて待つ必要があり、向きを変えるたびに待たされていたため。
 *
 * - `snapRange` … 離した升目に置けないとき、周りを何升まで探すか。
 *   吸い付く範囲でもあるので、大きくすると狙っていない所へ置かれる
 * - `swipeSpeed` / `swipeWindowMs` … トレイへ戻す振りと見なす速さ（px/ms）と、
 *   その速さを測る区間。位置を合わせて置くときは指が止まってから離れるので、
 *   速さが残っていれば「置く気は無い」と見てよい。座標はゲームの中のもの
 *   （横画面で 960×640）で、実際の画面の大きさには依らない
 * - `wheelDebounceMs` … ドラッグ中にホイールで向きを変えるとき、1 段
 *   進めてから次を受け付けるまでの間（TODO-069）。トラックパッドは 1 回の
 *   操作で何十もイベントが来るので、間を空けないと何段も進んでしまう。
 *   値は仮で、画面で見て決める
 */
export const INPUT = {
  dragThreshold: 8,
  snapRange: 1,
  swipeSpeed: 0.5,
  swipeWindowMs: 100,
  invalidFlashMs: 260,
  returnTweenMs: 180,
  messageMs: 2600,
  wheelDebounceMs: 150,
};

/**
 * HUD のボタンのアイコン（`src/icons.js`。TODO-042）。
 *
 * - `size` … アイコンを収める正方形の一辺。ボタンの高さ（44）から上下に
 *   余白が残る大きさ。`Scale.FIT` で 0.5 倍まで縮むので、線は太めにしてある
 * - `lineWidth` … 線の太さ
 */
export const ICON = {
  size: 28,
  lineWidth: 3,
};

/**
 * タイトルの盤・色の選択肢に描く図（`src/icons.js`。TODO-046）。
 *
 * - `boardCell` / `boardGap` … 盤の図の 1 マスと、マスの間の隙間。8 マスで
 *   ボタンの高さ（46）に余白が残る大きさ
 * - `domino` … 色の見本の小片（2×1）の 1 マス
 * - `dominoGap` … 小片どうしの間
 * - `dominoStagger` … 小片を 1 つおきに上下へずらす量。一列に揃えると
 *   帯に見えて、別々の小片に見えにくいため
 * - `pieces` … 見本に使うピース。12 色の並びから色相が離れたものを選んである
 */
export const CHOICE_ICON = {
  boardCell: 4.8,
  boardGap: 1,
  domino: 13,
  dominoGap: 10,
  dominoStagger: 4,
  pieces: ['F', 'P', 'V'],
};

/**
 * HUD のボタンの説明（ツールチップ。TODO-042）。
 *
 * - `hoverDelayMs` … マウスを載せてから出すまで。横切っただけで出さないため
 * - `touchMs` … タッチで押したときに出しておく時間。タッチにはホバーが無いので、
 *   押した動作と一緒に短く出して消す
 * - `padX` / `padY` … 文字と枠の間
 * - `gap` … ボタンの下端と説明の上端の間
 * - 文字の大きさは `FONT.small`
 */
export const TOOLTIP = {
  hoverDelayMs: 400,
  touchMs: 1200,
  padX: 10,
  padY: 6,
  gap: 6,
};

/**
 * ヒント表示の「解ける／解なし」の札（`createHintBadge()`。TODO-045）の寸法。
 *
 * 幅は文字（`FONT.hud`）に合わせて実行時に決めるので、ここに置くのは
 * 固定の高さと余白だけ。`height` は HUD 1 段（`HUD_ROW` = 56）に収まる値。
 */
export const HINT_BADGE = {
  height: 40,
  padX: 16,
  radius: 8,
};

/**
 * デモ（TODO-040）の速さ 3 段階。**どの速さでも置く・外すが目で追える**ように
 * してある。デモは動きを見せるのが目的で、解に至るまで時間がかかってもよい
 * （利用者と決めたこと）。深さ優先は TODO-043 で置くたびに全解のデータで
 * 「解なし」を外すようにしたので、最初の解までの置くは 30〜70 ほど（8×8・6×10
 * とも。シード 7 通りの実測）になり、速いでも 30 秒以内で解に至る
 * （TODO-040 の 5 の倍数だけを見る探索では 1〜1.5 万で、速いで 1〜2 時間かかった）。
 * ランダムは TODO-059 で「解なし」でもすぐには外さなくなったので、この手数は
 * 当てはまらない（手数は測らず、置ける場所が無くなるまで置く形にしてある）。
 *
 * - `intervalMs` … 1 手ごとに空ける時間。0 なら 1 フレームに 1 手
 * - `animate` … 置く・外すを Tween（`INPUT.returnTweenMs` = 180ms）で滑らせ、
 *   音も鳴らすか。**間隔を Tween より長くしてある**のは、枝刈りで捨てる手が
 *   「置いてすぐ外す」になり、短いと滑り切る前に次の Tween に止められるため。
 *   最速は間隔が 1 フレームしか無いので滑らせない
 * - `pauseMs` … 解を見つけた・出し切ったあと、次へ進むまで止まる時間。
 *   タイトルへ戻るまで見続けられるように、止まったままにはしない（TODO-052）
 * - `randomJitter` … ランダムの探し方だけ、1 手ごとの待ち時間に掛ける揺らぎの
 *   幅（TODO-059）。`intervalMs × (1 ± randomJitter)` の範囲で 1 手ごとに引き直す。
 *   一定間隔だと機械的に見えるための揺らぎ。値は仮で、画面で見て決める
 * - `randomRemoveMultiplier` … ランダムで 1 手外したあとの待ち時間に掛ける
 *   倍率（TODO-059）。外す（考え直す）ところは、置くところより間を空けた方が
 *   人の試行錯誤に見えるため、揺らぎとは別に長めにする。ただし、外す手が
 *   連なるとき（次も外す手のとき）は待たずに続けて動かすので掛からない
 *   （`demo.js` の `advance()`。TODO-060）
 * - `randomNearPower` … ランダムで置き方を抽選するとき、直前に置いた手からの
 *   距離（`logic.js` の `moveDistance()`）で重みを弱める強さ（TODO-062）。
 *   重みに `1 / (1 + distance) ** randomNearPower` を掛け、近いほど選ばれやすく
 *   する（人は盤の上を飛び回らず近くから順に埋めるため）。値は仮で、
 *   画面で見て決める
 * - `randomTightWeight` … ランダムでピースを抽選するとき、置ける手が一番少ない
 *   マス（「狭い所」）を覆える手を持つピースに掛ける重み（狭い所を覆えない
 *   ピースは 1）。人は「この隙間に入るのはどれか」と考えて選ぶため（TODO-061）。
 *   値は仮で、画面で見て決める
 * - `randomCollapseAfter` … ランダムで、盤に残るピースの数（深さ）が同じところへ
 *   「詰まり」（置ける手が尽きて戻る行き詰まりの一続き）で何回戻ったら、1 手ずつ
 *   でなく数手まとめて外すか（TODO-063）。置いた直後にその場で外す手
 *   （TODO-060・066〜068）は詰まりに数えない。人は同じ所で詰まり続けると
 *   「やり直そう」と大きく崩すため。値は仮で、画面で見て決める
 * - `randomCollapseMoves` … まとめて崩すとき、何手まで外すか（スタックにある分
 *   まで。TODO-063）。値は仮で、画面で見て決める
 * - `randomTurnStepMs` … ランダムで置く前に、トレイでの今の向きから置く向きまで
 *   1 段（90° 回転かその場の裏返し）ごとに空ける時間（`logic.js` の
 *   `orientationSteps()`。TODO-065）。人は手に取ってから向きを合わせて置くので、
 *   その動きを見せる。最速（`animate: false`）では回さない。値は仮で、
 *   画面で見て決める
 */
export const DEMO = {
  speeds: {
    slow: { intervalMs: 400, animate: true },
    fast: { intervalMs: 200, animate: true },
    fastest: { intervalMs: 0, animate: false },
  },
  defaultSpeed: 'fast',
  pauseMs: 10000,
  randomJitter: 0.5,
  randomRemoveMultiplier: 2,
  randomNearPower: 2,
  randomTightWeight: 4,
  randomCollapseAfter: 5,
  randomCollapseMoves: 3,
  randomTurnStepMs: 150,
};

/**
 * 解のデータ（`src/data/*.js`）を読み込んだあと、`game.registry` へ置くときの
 * キーの前置き。実際のキーは `solutions.js` の `solutionsRegistryKey()` が作る。
 *
 * 求解の打ち切り上限（`SOLVER_LIMIT` / `SOLVE_CHECK_LIMIT`）と、ヒントの
 * 引き直し回数（`HINT_RETRIES`）は TODO-022 で消えた。全解をあらかじめ
 * 持つようにしたので、探索そのものが遊ぶ側から無くなり、打ち切る対象も
 * 「時間内に見つけられなかった」という言い方も要らなくなった。
 */
export const SOLUTIONS_REGISTRY_PREFIX = 'solutions/';

/**
 * 表示用のバージョン。タグを打って GitHub Pages へ公開するとき、
 * CI がこの行の `'dev'` をタグ名へ書き換える（`.github/workflows/pages.yml`）。
 * ローカルで直接開いたときは書き換わらないので `dev` のまま出る。
 */
export const VERSION = 'dev';
