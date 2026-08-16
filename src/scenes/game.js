/**
 * 本編。Phaser とのつなぎに徹し、置けるかどうかの判定は `logic.js`、
 * おまかせと解の有無は `solutions.js`（全解のデータ）に任せる。
 *
 * 盤面（`this.board`）は模型で、画面に見えているのはピースの Container のほう。
 * 二重持ちに見えるが、盤面のほうは Undo の履歴や求解へそのまま渡せる形にしておき、
 * Container はドラッグ中の中途半端な位置も表せるようにしておきたいので分けてある。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, INPUT, LAYOUTS,
  OUTLINE, PALETTES, PALETTE_REGISTRY_KEY, PIECES, TEXT_COLORS, TURN_MARK, VERSION,
} from '../config.js';
import {
  boardKey, canPlace, createBoard, flip, formatTime, isSolved,
  nextPlaceableTurn, nextTurn,
  normalize, outlineEdges, place, remove, rotateCw, sameShape, shapeSize, snapSpot, turnOrder,
} from '../logic.js';
import {
  autoFrom, ensureSolutions, hasSolution, solutionNumber,
} from '../solutions.js';
import {
  addAuto, clearProgress, loadAuto, loadFound, loadProgress, saveProgress,
} from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createPanel } from '../ui.js';
import { darken, pieceColor, TEX } from './boot.js';

/** 重なりの順。盤の上にピース、トレイの当たり判定はその上、ドラッグ中の
 *  ピースはさらに上、確認ダイアログが最前面。 */
const DEPTH = {
  board: 0, ghost: 5, piece: 10, traySlot: 15, dragging: 20, hud: 30, confirm: 40,
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  /**
   * `resume` が真なら、保存してある遊びかけから始める（TODO-030）。
   * タイトルの `つづきから` だけが渡す。`scene.restart()`（やり直し）は
   * 引数を明示して渡し直すので、続きから始め直してしまうことは無い。
   */
  init(data) {
    this.resuming = !!(data && data.resume);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    // 盤はタイトルで選ぶ（TODO-009）。選び直せるのはタイトルだけなので、
    // ここで 1 回読めば、このシーンが生きている間は変わらない。
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.spec = BOARDS[this.boardKey];
    this.layout = LAYOUTS[this.boardKey];
    // 色の組も同じく、タイトルでだけ選べる（TODO-015）。
    this.palette = PALETTES[this.registry.get(PALETTE_REGISTRY_KEY)];

    this.board = createBoard(this.spec);
    this.history = [];
    this.elapsed = 0;
    this.usedAuto = false;
    // 解の有無を教えるモード（TODO-013）。既定は切。`usedHint` はおまかせと
    // 同じく「答えに頼った」印で、クリアの画面まで持ち回る。
    this.hinting = false;
    this.usedHint = false;
    this.hintState = null;
    this.playing = true;
    // 遊びかけを控えてよいか（TODO-030）。組み立てが済むまでは控えない。
    this.ready = false;
    this.pending = null;
    this.drag = null;
    this.messageTimer = null;

    this.drawBoard();
    this.drawTray();
    this.createGhost();
    this.createPieces();
    this.createTraySlots();
    this.createHud();
    this.createMessage();
    this.createConfirmDialog();
    this.createVersionText();

    // 全解のデータ（TODO-022）。6×10 は 139KB あるので動的 import で読む。
    // 届くまで [おまかせ] と [ヒント表示] は押せない（`refreshHud()` が見る）。
    // シーンを離れたあとに届くことがあるので、生きているかを確かめてから使う。
    this.solutions = null;
    // おまかせで避ける解の番号（TODO-016）。自力で見つけた解（達成度の分子）と、
    // 今までおまかせで導いた解を合わせたもの。**読むのはここ 1 回だけ**で、
    // あとはおまかせを押すたびにこの集合へ足していく。
    this.avoidNumbers = new Set();
    ensureSolutions(this.registry, this.spec).then((solutions) => {
      if (!this.scene.isActive()) return;
      this.solutions = solutions;
      const total = solutions.canonical.length;
      this.avoidNumbers = new Set([
        ...loadFound(this.spec.key, total),
        ...loadAuto(this.spec.key, total),
      ]);
      this.refreshHud();
    });

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    // シーンを離れるときに持ち越しの押下状態を捨てる（次に来たとき掴んだままになる）。
    // ついでに、そのときの経過時間まで含めて遊びかけを控える（TODO-030）。
    // 盤が変わったときにも控えているが、置いてから何分も考えて中断すると、
    // その考えていた時間が落ちてしまうため。
    // `once` なのは、やり直しで `create()` を通るたびに登録が積み上がらないようにするため。
    this.events.once('shutdown', this.onShutdown, this);

    // 遊びかけの読み込みは、部品を組んでから（`refreshPiece()` などが要る）。
    if (this.resuming) this.applyProgress(loadProgress(this.spec.key));
    this.refreshHud();
    // ここから先の `refreshHud()` は、盤が変わったところから呼ばれる。
    // 組み立ての最中に控えると、まだ何も置いていない状態で保存してある
    // 遊びかけを消してしまう（`はじめる` を押し間違えただけで消えるのは困る）。
    this.ready = true;
  }

  // Phaser が渡す第 1 引数（時刻）は使わない。経過時間は delta を足して数える。
  update(_time, delta) {
    if (!this.playing) return;
    this.elapsed += delta;
    this.timeText.setText(formatTime(this.elapsed));
  }

  // ---- 画面の組み立て -------------------------------------------------

  drawBoard() {
    const panel = this.layout.boardPanel;
    createPanel(this, panel.x, panel.y, panel.width, panel.height).setDepth(DEPTH.board);
    const { x, y, cell } = this.layout.board;
    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.cols; col += 1) {
        const playable = this.board.grid[row * this.board.cols + col] === null;
        this.add.image(x + col * cell, y + row * cell,
                       playable ? TEX.boardCell(cell) : TEX.hole(cell))
          .setOrigin(0)
          .setDepth(DEPTH.board);
      }
    }
  }

  drawTray() {
    const panel = this.layout.trayPanel;
    createPanel(this, panel.x, panel.y, panel.width, panel.height).setDepth(DEPTH.board);
  }

  /** 置ける場所に出す薄い影。ピース 1 個ぶんの 5 枚を作り置きして使い回す。 */
  createGhost() {
    this.ghost = this.add.container(0, 0).setDepth(DEPTH.ghost).setVisible(false);
    this.ghostTiles = [];
    for (let i = 0; i < 5; i += 1) {
      const tile = this.add.image(0, 0, TEX.ghost(this.layout.board.cell))
        .setOrigin(0).setAlpha(0.28);
      this.ghost.add(tile);
      this.ghostTiles.push(tile);
    }
  }

  createPieces() {
    this.pieces = PIECES.map((definition, index) => {
      const piece = {
        name: definition.name,
        color: pieceColor(this.palette, definition),
        cells: normalize(definition.cells),
        // 向きの巡りの起点（TODO-025）。定義の向きから巡り始めると、どの
        // ピースも表を回り切ってから裏返しになる。`cells` は回すたびに
        // 変わるので、起点は別に持っておく。
        origin: normalize(definition.cells),
        location: 'tray',
        row: 0,
        col: 0,
        slot: index,
        container: null,
        tiles: [],
      };
      piece.container = this.add.container(0, 0).setDepth(DEPTH.piece);
      // 落ち影はマスの下、外周の縁取りはマスの上。Container 内の並び順が
      // そのまま重なりの順になるので、マスを挟むように前後へ入れる。
      piece.shadow = this.add.graphics();
      piece.container.add(piece.shadow);
      for (let i = 0; i < piece.cells.length; i += 1) {
        const tile = this.add.image(0, 0,
                                    TEX.piece(this.palette, piece.name, this.layout.board.cell))
          .setOrigin(0);
        tile.setInteractive({ useHandCursor: true });
        tile.on('pointerdown', (pointer) => this.onPiecePointerDown(piece, pointer));
        piece.container.add(tile);
        piece.tiles.push(tile);
      }
      piece.outline = this.add.graphics();
      piece.container.add(piece.outline);
      // 次のタップで何が起きるかの印（TODO-025）。ピースの絵に重ねるので、
      // Container の一番上へ入れる。
      piece.turnMark = this.add.graphics();
      piece.container.add(piece.turnMark);
      this.refreshPiece(piece);
      this.layoutPiece(piece);
      return piece;
    });
  }

  /**
   * トレイのスロット全体を当たり判定にする。ピースの絵は 11px 幅の細い形にも
   * なりうるが（`I` の縦向きなど）、指のタップ目標としては狭すぎるため、
   * スロット全体を覆う透明な矩形で受ける。`piece.slot` は作られてから
   * 変わらないので、矩形とピースは 1 対 1 のまま固定でよい。
   */
  createTraySlots() {
    const tray = this.layout.tray;
    const slotWidth = tray.width / tray.cols;
    const slotHeight = tray.height / tray.rows;
    this.pieces.forEach((piece) => {
      const centerX = tray.x + (piece.slot % tray.cols) * slotWidth + slotWidth / 2;
      const centerY = tray.y + Math.floor(piece.slot / tray.cols) * slotHeight + slotHeight / 2;
      const hit = this.add.rectangle(centerX, centerY, slotWidth, slotHeight, 0x000000, 0)
        .setDepth(DEPTH.traySlot)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (pointer) => {
        if (piece.location !== 'tray') return;
        this.onPiecePointerDown(piece, pointer);
      });
    });
  }

  /**
   * 上部のメニューバー。縦画面では横幅が足りず、時間の表示とボタン 6 個が
   * 1 段に並ばないので折り返す（`this.layout.hud`。TODO-011、TODO-013）。
   * 何個ずつ何段目からかは配置（`config.js`）が決めるので、向きをここで見る
   * 必要はない。
   */
  createHud() {
    const hud = this.layout.hud;
    createPanel(this, hud.x, hud.y, hud.width, hud.height).setDepth(DEPTH.hud);
    const rowY = (row) => hud.y + hud.rowHeight * (row + 0.5);

    this.timeText = this.add.text(hud.x + hud.padding, rowY(0), formatTime(0), {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    this.remainText = this.add.text(hud.x + hud.padding + hud.remainX, rowY(0), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    // 解の有無（TODO-013）。切のうちは空にしておくので、モードを使わなければ
    // 今までどおりの見た目のまま。横画面では同じ段にボタンが続くので小さめ。
    this.hintText = this.add.text(hud.x + hud.padding + hud.statusX, rowY(0), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    // 前半 3 つが「解くのを助けるもの」、後半 3 つが「遊び方を変えるもの」。
    // 縦画面ではこの 3 つずつがそのまま 1 段になる。
    const labels = [
      '一手戻す', 'おまかせ', 'ヒント表示',
      'やり直し', audio.isMuted() ? '音 OFF' : '音 ON', 'タイトルへ',
    ];
    const actions = [
      () => this.undo(),
      () => this.useAuto(),
      () => this.toggleHint(),
      () => this.restart(),
      () => this.toggleMute(),
      () => this.confirmToTitle(),
    ];
    // ボタンだけの段は中央へ、時間の表示と分け合う段（横画面の 1 段目）は右へ寄せる。
    const perRow = hud.buttonsPerRow;
    const centered = hud.firstButtonRow > 0;
    this.buttons = labels.map((label, index) => {
      const row = Math.floor(index / perRow);
      const count = Math.min(perRow, labels.length - row * perRow);
      const total = count * hud.buttonWidth + (count - 1) * hud.gap;
      const left = centered
        ? hud.x + (hud.width - total) / 2
        : hud.x + hud.width - hud.padding - total;
      return createButton(this, {
        x: left + hud.buttonWidth / 2 + (index % perRow) * (hud.buttonWidth + hud.gap),
        y: rowY(hud.firstButtonRow + row),
        width: hud.buttonWidth,
        height: hud.buttonHeight,
        label,
        fontSize: FONT.small,
        onClick: actions[index],
      }).setDepth(DEPTH.hud);
    });
    this.undoButton = this.buttons[0];
    this.autoButton = this.buttons[1];
    this.hintButton = this.buttons[2];
    this.muteButton = this.buttons[4];
  }

  createVersionText() {
    this.add.text(this.layout.width - 12, this.layout.height - 12, VERSION, {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(1, 1).setAlpha(0.6);
  }

  createMessage() {
    this.messageText = this.add.text(this.layout.message.x, this.layout.message.y, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5).setDepth(DEPTH.hud);
  }

  /**
   * タイトルへ戻る前の確認。ブラウザの `confirm()` は使わない方針（CLAUDE.md）
   * なので、Canvas 内に自前で組む。背景の帯は画面全体を覆う当たり判定を持たせて、
   * 開いている間はピースやほかのボタンへクリックが抜けないようにする
   * （Phaser の入力は既定で最前面の対象だけに配る `topOnly` なので、これで足りる）。
   */
  createConfirmDialog() {
    const cfg = this.layout.confirm;
    const x = (this.layout.width - cfg.width) / 2;
    const y = (this.layout.height - cfg.height) / 2;

    this.confirmParts = [];

    const backdrop = this.add.rectangle(0, 0, this.layout.width, this.layout.height, 0x000000, 0.55)
      .setOrigin(0).setDepth(DEPTH.confirm).setInteractive().setVisible(false);
    this.confirmParts.push(backdrop);

    this.confirmParts.push(
      createPanel(this, x, y, cfg.width, cfg.height).setDepth(DEPTH.confirm).setVisible(false),
    );

    this.confirmParts.push(
      // 途中の盤面は残るようになったので（TODO-030）、失われるとは言わない。
      this.add.text(x + cfg.width / 2, y + 50,
                    'タイトルへ戻りますか？\n途中の盤面は残るので、\n「つづきから」で再開できます', {
        fontFamily: FONT.family,
        fontSize: `${FONT.body}px`,
        color: TEXT_COLORS.normal,
        align: 'center',
      }).setOrigin(0.5).setDepth(DEPTH.confirm).setVisible(false),
    );

    const buttonY = y + cfg.height - 40;
    const totalWidth = cfg.buttonWidth * 2 + cfg.gap;
    const left = x + (cfg.width - totalWidth) / 2;
    this.confirmParts.push(createButton(this, {
      x: left + cfg.buttonWidth / 2,
      y: buttonY,
      width: cfg.buttonWidth,
      height: cfg.buttonHeight,
      label: 'はい',
      fontSize: FONT.small,
      onClick: () => this.goToTitle(),
    }).setDepth(DEPTH.confirm).setVisible(false));
    this.confirmParts.push(createButton(this, {
      x: left + cfg.buttonWidth + cfg.gap + cfg.buttonWidth / 2,
      y: buttonY,
      width: cfg.buttonWidth,
      height: cfg.buttonHeight,
      label: 'いいえ',
      fontSize: FONT.small,
      onClick: () => this.hideConfirm(),
    }).setDepth(DEPTH.confirm).setVisible(false));
  }

  // ---- ピースの見た目 -------------------------------------------------

  /** 今の向きに合わせて 5 枚のマスを並べ直す。枚数は変わらないので作り直さない。 */
  refreshPiece(piece) {
    const cell = this.layout.board.cell;
    piece.cells.forEach(([row, col], index) => {
      piece.tiles[index].setPosition(col * cell, row * cell);
    });
    this.drawPieceEdges(piece);
    this.drawTurnMark(piece);
  }

  // ---- 次のタップで何が起きるかの印（TODO-025）-------------------------

  /**
   * 次のタップでこのピースがどう変わるかを返す。`turnOrder()` の並びは
   * 定義の向きを起点にすると「回転が続いて、その場の裏返しが 1 回」に揃うので、
   * 見分けるのは回転か裏返しかの 2 つで足りる（上下反転は並びに出てこない）。
   *
   * V のように回転でも裏返しでも同じ向きになる遷移があるので、回転で
   * 説明できるものは回転として扱う。X は向きが 1 通りなので null（印を出さない）。
   */
  turnMarkKind(piece) {
    const next = nextTurn(piece.cells, piece.origin);
    if (sameShape(next, piece.cells)) return null;
    if (sameShape(next, rotateCw(piece.cells))) return 'rotate';
    return 'flip';
  }

  /**
   * 印を置くマスの中心。外接矩形の真ん中は U や X のように空いていることが
   * あるので、そこへ一番近い**埋まっているマス**を選ぶ。印がピースから
   * 外れて浮くのを避けるため。
   */
  turnMarkCenter(piece) {
    const cell = this.layout.board.cell;
    const size = shapeSize(piece.cells);
    let best = piece.cells[0];
    let bestDistance = Infinity;
    for (const [row, col] of piece.cells) {
      const dx = col + 0.5 - size.cols / 2;
      const dy = row + 0.5 - size.rows / 2;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = [row, col];
      }
    }
    return { x: (best[1] + 0.5) * cell, y: (best[0] + 0.5) * cell };
  }

  /**
   * 印を引き直す。**トレイにいるピースだけ**に出す（TODO-025）。盤の上では
   * 置けない向きを飛ばすので、次に何が来るかが盤の埋まり方で変わってしまう。
   * 掴んでいる間も出さない（拡大率が変わって大きさが合わなくなるうえ、
   * 運んでいる最中に向きの話は要らない）。
   */
  drawTurnMark(piece) {
    const g = piece.turnMark;
    g.clear();
    const dragging = this.drag && this.drag.piece === piece;
    if (!this.playing || piece.location !== 'tray' || dragging) return;
    const kind = this.turnMarkKind(piece);
    if (kind === null) return;

    const center = this.turnMarkCenter(piece);
    const cell = this.layout.board.cell;
    // 暗い縁取りを先に太く敷き、その上へ白い本線を重ねる。
    for (const pass of [
      { color: TURN_MARK.edgeColor, alpha: TURN_MARK.edgeAlpha, width: TURN_MARK.edgeWidth },
      { color: TURN_MARK.color, alpha: TURN_MARK.alpha, width: TURN_MARK.width },
    ]) {
      g.lineStyle(pass.width * cell, pass.color, pass.alpha);
      if (kind === 'rotate') this.strokeRotateMark(g, center);
      else this.strokeFlipMark(g, center);
    }
  }

  /** 矢じり。`angle` は進む向きで、そこから開いた 2 本の線で描く。 */
  strokeArrowHead(g, x, y, angle) {
    const size = TURN_MARK.headSize * this.layout.board.cell;
    const spread = Phaser.Math.DegToRad(150);
    for (const sign of [1, -1]) {
      const a = angle + spread * sign;
      g.lineBetween(x, y, x + Math.cos(a) * size, y + Math.sin(a) * size);
    }
  }

  /** 回転の印。時計回りの円弧に、進む先を指す矢じりを付ける。 */
  strokeRotateMark(g, center) {
    const radius = TURN_MARK.radius * this.layout.board.cell;
    const from = Phaser.Math.DegToRad(-130);
    const to = Phaser.Math.DegToRad(110);
    g.beginPath();
    g.arc(center.x, center.y, radius, from, to, false);
    g.strokePath();
    // 角度が増える向き（画面では時計回り）の接線は、その角度の 90° 先。
    this.strokeArrowHead(g, center.x + Math.cos(to) * radius,
                         center.y + Math.sin(to) * radius, to + Math.PI / 2);
  }

  /** 左右反転の印。左右に開いた両向きの矢印。 */
  strokeFlipMark(g, center) {
    const length = TURN_MARK.arrowLength * this.layout.board.cell;
    g.lineBetween(center.x - length, center.y, center.x + length, center.y);
    this.strokeArrowHead(g, center.x + length, center.y, 0);
    this.strokeArrowHead(g, center.x - length, center.y, Math.PI);
  }

  /**
   * シルエットの外周の縁取りと落ち影を引き直す。向きが変わるたびに呼ぶ。
   *
   * 盤の 1 マス（`this.layout.board.cell`）の座標系で描いておけば、トレイでの
   * 縮小は Container の拡大率がそのまま効くので、描き分けが要らない。
   * 縁は線の太さの半分だけ内側へ寄せる。外へはみ出すと隣のピースにかぶり、
   * どちらの輪郭か分からなくなるため。
   */
  drawPieceEdges(piece) {
    const cell = this.layout.board.cell;
    const width = this.palette.outlineWidth;
    const inset = width / 2;
    const has = new Set(piece.cells.map(([row, col]) => `${row},${col}`));

    piece.shadow.clear();
    piece.shadow.fillStyle(OUTLINE.shadowColor, OUTLINE.shadowAlpha);
    for (const [row, col] of piece.cells) {
      piece.shadow.fillRect(col * cell + OUTLINE.shadowOffset,
                            row * cell + OUTLINE.shadowOffset, cell, cell);
    }

    piece.outline.clear();
    piece.outline.lineStyle(width, darken(piece.color, this.palette.outlineDarken), 1);
    for (const [r1, c1, r2, c2] of outlineEdges(piece.cells)) {
      // 内側がどちら側かは、辺に接するマスが在るほうを見れば決まる。
      const horizontal = r1 === r2;
      const dr = horizontal && has.has(`${r1},${c1}`) ? inset : -inset;
      const dc = !horizontal && has.has(`${r1},${c1}`) ? inset : -inset;
      const x = horizontal ? 0 : dc;
      const y = horizontal ? dr : 0;
      piece.outline.lineBetween(c1 * cell + x, r1 * cell + y,
                                c2 * cell + x, r2 * cell + y);
    }
  }

  /** 置かれている場所（盤かトレイか）から、Container の位置と拡大率を決める。 */
  pieceTransform(piece) {
    const cell = this.layout.board.cell;
    if (piece.location === 'board') {
      return {
        x: this.layout.board.x + piece.col * cell,
        y: this.layout.board.y + piece.row * cell,
        scale: 1,
      };
    }
    const tray = this.layout.tray;
    const slotWidth = tray.width / tray.cols;
    const slotHeight = tray.height / tray.rows;
    const centerX = tray.x + (piece.slot % tray.cols) * slotWidth + slotWidth / 2;
    const centerY = tray.y + Math.floor(piece.slot / tray.cols) * slotHeight + slotHeight / 2;
    const size = shapeSize(piece.cells);
    const scale = tray.cell / cell;
    return {
      x: centerX - (size.cols * tray.cell) / 2,
      y: centerY - (size.rows * tray.cell) / 2,
      scale,
    };
  }

  layoutPiece(piece) {
    const t = this.pieceTransform(piece);
    piece.container.setPosition(t.x, t.y);
    piece.container.setScale(t.scale);
    piece.container.setDepth(DEPTH.piece);
  }

  /** 置けないことを知らせる赤い点滅。音と合わせて 1 回だけ。 */
  flashPiece(piece) {
    for (const tile of piece.tiles) tile.setTintFill(COLORS.danger);
    this.time.delayedCall(INPUT.invalidFlashMs, () => {
      for (const tile of piece.tiles) tile.clearTint();
    });
  }

  // ---- 入力 -----------------------------------------------------------

  onPiecePointerDown(piece, pointer) {
    if (!this.playing || this.drag || this.pending) return;
    audio.unlock();
    this.pending = {
      piece,
      startX: pointer.x,
      startY: pointer.y,
      consumed: false,
    };
  }

  onPointerMove(pointer) {
    if (this.drag) {
      this.updateDrag(pointer);
      return;
    }
    if (!this.pending) return;
    const moved = Phaser.Math.Distance.Between(
      this.pending.startX, this.pending.startY, pointer.x, pointer.y,
    );
    if (moved > INPUT.dragThreshold) this.startDrag(pointer);
  }

  /** タップは待たずにその場で次の向きへ進める（TODO-023）。ダブルタップの
   *  反転を無くしたので、2 回目を待つ猶予が要らなくなった。 */
  onPointerUp(pointer) {
    if (this.drag) {
      this.dropDrag(pointer);
      return;
    }
    const pending = this.pending;
    this.cancelPending();
    if (!pending || pending.consumed) return;
    this.turnPiece(pending.piece);
  }

  cancelPending() {
    this.pending = null;
  }

  startDrag(pointer) {
    const pending = this.pending;
    const piece = pending.piece;
    this.cancelPending();

    // 掴んだ点を拡大率ぶん割り戻して覚える。トレイの縮小表示から盤の大きさへ
    // 広がっても、指の下にあるマスが変わらないようにするため。
    const scale = piece.container.scaleX;
    let offsetX = (pending.startX - piece.container.x) / scale;
    let offsetY = (pending.startY - piece.container.y) / scale;
    // 指で隠れないよう、タッチ操作のときだけピースを盤のマス 1 個ぶんずらす。
    // 縦画面では指の上、横画面では指の左（TODO-023）。画面の長い側へ
    // 逃がすので、盤の端でも指を画面の外へ出さずに済む。
    // マウスでは指がないのでずらさない（`pointer.wasTouch` で見分ける）。
    if (pointer.wasTouch) {
      if (this.layout.portrait) offsetY += this.layout.board.cell;
      else offsetX += this.layout.board.cell;
    }

    const snapshot = this.snapshot();
    if (piece.location === 'board') this.board = remove(this.board, piece.name);

    this.drag = { piece, offsetX, offsetY, snapshot, trail: [] };
    this.drawTurnMark(piece);   // 掴んでいる間は印を消す
    piece.container.setScale(1);
    piece.container.setDepth(DEPTH.dragging);
    audio.pick();
    this.updateDrag(pointer);
  }

  updateDrag(pointer) {
    const { piece, offsetX, offsetY, trail } = this.drag;
    piece.container.setPosition(pointer.x - offsetX, pointer.y - offsetY);

    // 離すときの速さを測るために、直近 `swipeWindowMs` ぶんの通り道を残す
    // （TODO-023）。先頭がその区間の始まりになるよう、古いものから捨てる。
    trail.push({ x: pointer.x, y: pointer.y, time: this.time.now });
    while (trail.length > 2 && this.time.now - trail[1].time > INPUT.swipeWindowMs) {
      trail.shift();
    }

    const spot = this.dropSpot();
    if (spot) this.showGhost(piece, spot.row, spot.col);
    else this.ghost.setVisible(false);
  }

  /**
   * ドラッグ中の Container の位置から、一番近い升目を求める。盤の外に
   * あたる値もそのまま返す（近くまで来ているかは `nearBoard()` が見る）。
   *
   * 指の位置ではなく Container で見る。タッチ中はピースを指からずらして
   * あるので、指で見ると「ピースは盤の上に見えているのに指は盤の外」がずれて起きる。
   */
  nearestSpot() {
    const { x, y, cell } = this.layout.board;
    const container = this.drag.piece.container;
    return {
      row: Math.round((container.y - y) / cell),
      col: Math.round((container.x - x) / cell),
    };
  }

  /**
   * その升目が盤の近くにあるか。吸い付く範囲ぶん（`INPUT.snapRange`）だけ
   * 盤の外まで含める。そこまでに限るのは、トレイへ運ぶ途中のピースが
   * 盤の縁へ吸い寄せられないようにするため。
   */
  nearBoard(spot) {
    const margin = INPUT.snapRange;
    return spot.row >= -margin && spot.col >= -margin
      && spot.row < this.board.rows + margin && spot.col < this.board.cols + margin;
  }

  /**
   * 実際に置く升目。一番近い升目に置けなくても周りを探すので、
   * 多少ずれても置ける（TODO-023）。どこにも置けなければ null。
   */
  dropSpot() {
    const spot = this.nearestSpot();
    if (!this.nearBoard(spot)) return null;
    return snapSpot(this.board, this.drag.piece.cells, spot.row, spot.col, INPUT.snapRange);
  }

  /**
   * 離す直前の動きが、トレイの方向への振りだったか（TODO-023）。
   * 置くときは位置を合わせるので指が止まってから離れる。速さが残っていれば
   * 「置く気は無い」と見てよいので、盤の上で離してもトレイへ戻せる。
   * トレイは縦画面では盤の下、横画面では盤の右にある。
   */
  swipedToTray(pointer) {
    const trail = this.drag.trail;
    if (trail.length === 0) return false;
    const from = trail[0];
    const elapsed = this.time.now - from.time;
    if (elapsed <= 0) return false;
    const dx = pointer.x - from.x;
    const dy = pointer.y - from.y;
    const toward = this.layout.portrait ? dy : dx;
    const across = this.layout.portrait ? dx : dy;
    // 斜めに流れただけのものを拾わないよう、トレイの側が主でなければ見送る。
    if (toward <= Math.abs(across)) return false;
    return toward / elapsed >= INPUT.swipeSpeed;
  }

  showGhost(piece, row, col) {
    const cell = this.layout.board.cell;
    this.ghost.setPosition(this.layout.board.x + col * cell, this.layout.board.y + row * cell);
    piece.cells.forEach(([dr, dc], index) => {
      const tile = this.ghostTiles[index];
      tile.setPosition(dc * cell, dr * cell);
      tile.setTint(piece.color);
    });
    this.ghost.setVisible(true);
  }

  dropDrag(pointer) {
    const { piece, snapshot } = this.drag;
    const nearest = this.nearestSpot();
    const spot = this.dropSpot();
    // 振って離したときは、置ける場所にいても戻す（TODO-023）。
    const swiped = this.swipedToTray(pointer);
    this.ghost.setVisible(false);
    this.drag = null;

    if (spot && !swiped) {
      this.history.push(snapshot);
      piece.location = 'board';
      piece.row = spot.row;
      piece.col = spot.col;
      this.board = place(this.board, piece.name, piece.cells, spot.row, spot.col);
      this.settlePiece(piece, false);
      audio.drop();
      this.refreshHud();
      this.checkSolved();
      return;
    }

    // 盤から離れた所で離した、または振って戻した。盤に置いてあったものなら
    // 「外す」、もともとトレイのものは元へ戻すだけ。
    if (swiped || !this.nearBoard(nearest)) {
      if (snapshot.pieces[piece.slot].location === 'board') {
        this.history.push(snapshot);
        piece.location = 'tray';
        this.settlePiece(piece, true);
        audio.lift();
        this.refreshHud();
        return;
      }
      this.restoreState(snapshot, true);
      return;
    }

    // 盤の上だが、周りを探しても置ける所が無かった。
    const result = canPlace(this.board, piece.cells, nearest.row, nearest.col);
    audio.invalid();
    this.flashPiece(piece);
    this.showMessage(result.reason === 'overlap' ? 'そこは他のピースと重なる' : 'そこは盤からはみ出す');
    this.restoreState(snapshot, true);
  }

  /** 置き場所が決まったピースを、その場所へ収める（戻すときだけ滑らせる）。 */
  settlePiece(piece, animate) {
    const target = this.pieceTransform(piece);
    piece.container.setDepth(DEPTH.piece);
    // 盤とトレイのどちらへ収まるかで、向きの印を出すかどうかが変わる。
    this.drawTurnMark(piece);
    // 前の移動が残っていると行き先を取り合うので、先に止める。
    this.tweens.killTweensOf(piece.container);
    if (!animate) {
      piece.container.setPosition(target.x, target.y);
      piece.container.setScale(target.scale);
      return;
    }
    this.tweens.add({
      targets: piece.container,
      x: target.x,
      y: target.y,
      scaleX: target.scale,
      scaleY: target.scale,
      duration: INPUT.returnTweenMs,
      ease: 'Quad.easeOut',
    });
  }

  // ---- 向きの変更 -----------------------------------------------------

  /**
   * タップ 1 つで次の向きへ進める（TODO-019）。盤に置いたままなら、その場に
   * 置けない向きは飛ばす（TODO-023）。`turnOrder()` の並びは 90° 回転と
   * その場の裏返しが混ざるので、どちらの動きになったかを見て音を選ぶ。
   */
  turnPiece(piece) {
    if (!this.playing) return;
    const onBoard = piece.location === 'board';
    // 盤の上では、今いる場所を自分で塞いでいると見なさないよう自分を除く。
    const without = onBoard ? remove(this.board, piece.name) : null;
    const next = onBoard
      ? nextPlaceableTurn(without, piece.cells, piece.row, piece.col, piece.origin)
      : nextTurn(piece.cells, piece.origin);

    if (sameShape(next, piece.cells)) {
      // どの向きも置けなかったときは、断っていることを知らせる。X のように
      // 向きが 1 通りしかないピースは、音だけ返す（タップは届いている）。
      if (onBoard && turnOrder(piece.cells, piece.origin).length > 1) {
        audio.invalid();
        this.flashPiece(piece);
        this.showMessage('そこでは向きを変えられない');
        return;
      }
      audio.rotate();
      return;
    }

    const flipped = sameShape(next, normalize(flip(piece.cells)));
    if (onBoard) {
      this.history.push(this.snapshot());
      this.board = place(without, piece.name, next, piece.row, piece.col);
    }
    piece.cells = next;
    this.refreshPiece(piece);
    this.layoutPiece(piece);
    if (flipped) audio.flip();
    else audio.rotate();
    this.refreshHud();
  }

  // ---- 履歴 -----------------------------------------------------------

  /**
   * 今の状態を控える。盤面は `logic.js` が毎回作り直して返すので、
   * 参照をそのまま持っておけば後から書き換わる心配が無い。
   */
  snapshot() {
    return {
      board: this.board,
      pieces: this.pieces.map((piece) => ({
        cells: piece.cells,
        location: piece.location,
        row: piece.row,
        col: piece.col,
      })),
    };
  }

  restoreState(snapshot, animate = false) {
    this.board = snapshot.board;
    this.pieces.forEach((piece, index) => {
      const saved = snapshot.pieces[index];
      const changed = piece.cells !== saved.cells;
      piece.cells = saved.cells;
      piece.location = saved.location;
      piece.row = saved.row;
      piece.col = saved.col;
      if (changed) this.refreshPiece(piece);
      this.settlePiece(piece, animate);
    });
    this.refreshHud();
  }

  undo() {
    if (this.history.length === 0) return;
    audio.undo();
    this.restoreState(this.history.pop(), true);
  }

  // ---- 遊びかけの保存（TODO-030）---------------------------------------

  /**
   * 今の状態を控える。盤が変わるところ（`refreshHud()`）と、シーンを
   * 離れるときに呼ぶ。
   *
   * 1 個も置いていないときは控えずに消す。何も進んでいない状態を残しても
   * `つづきから` が「はじめから」と同じ意味になるだけで、押せるボタンが
   * 増えたぶん紛らわしい。解き終えたあと（`playing` が偽）は
   * `checkSolved()` が消したものを書き戻さないよう、何もしない。
   */
  persist() {
    if (!this.playing) return;
    if (this.pieces.every((piece) => piece.location === 'tray')) {
      clearProgress(this.spec.key);
      return;
    }
    saveProgress(this.spec.key, {
      ms: this.elapsed,
      usedAuto: this.usedAuto,
      usedHint: this.usedHint,
      pieces: this.pieces.map((piece) => ({
        name: piece.name,
        cells: piece.cells,
        location: piece.location,
        row: piece.row,
        col: piece.col,
      })),
    });
  }

  onShutdown() {
    this.cancelPending();
    this.persist();
  }

  /**
   * 保存してある遊びかけを画面へ写す（TODO-030）。読めなければ何もしない
   * （そのまま最初から遊べる状態になる）。
   *
   * 盤面は `storage.js` が検証済みのピースの位置から組み直す。おまかせ・
   * ヒント表示の印も持ち越すので、続きで解き切っても自力扱いにはならない。
   * 一手戻す履歴は保存していないので、続きを始めた直後は戻せない。
   */
  applyProgress(progress) {
    if (!progress) return;
    const saved = new Map(progress.pieces.map((piece) => [piece.name, piece]));
    this.board = createBoard(this.spec);
    this.pieces.forEach((piece) => {
      const item = saved.get(piece.name);
      if (!item) return;
      piece.cells = item.cells;
      piece.location = item.location;
      piece.row = item.row;
      piece.col = item.col;
      if (item.location === 'board') {
        this.board = place(this.board, piece.name, piece.cells, piece.row, piece.col);
      }
      this.refreshPiece(piece);
      this.layoutPiece(piece);
    });
    this.elapsed = progress.ms;
    this.usedAuto = progress.usedAuto;
    this.usedHint = progress.usedHint;
    this.timeText.setText(formatTime(this.elapsed));
  }

  // ---- ボタンの働き ---------------------------------------------------

  /**
   * おまかせを 1 手ぶん置く。全解のデータから条件に合う解を無作為に選ぶだけなので、
   * 待たされることも「時間内に見つけられなかった」も無い（TODO-022）。
   *
   * 既に出した解（自力で見つけた解と、今までおまかせで導いた解）は候補から外す
   * ので、同じ盤を何度も解いても毎回同じ解へは導かれない（TODO-016）。
   */
  useAuto() {
    const left = this.pieces.filter((piece) => piece.location === 'tray').length;
    if (left === 0 || !this.solutions) return;

    const result = autoFrom(this.solutions, this.board, Math.random, this.avoidNumbers);
    if (!result.ok) {
      audio.invalid();
      this.showMessage('この形からは完成できない');
      return;
    }

    const { name, cells, row, col } = result.placement;
    const piece = this.pieces.find((entry) => entry.name === name);
    this.history.push(this.snapshot());
    piece.cells = cells;
    piece.location = 'board';
    piece.row = row;
    piece.col = col;
    this.board = place(this.board, name, cells, row, col);
    this.refreshPiece(piece);
    this.settlePiece(piece, true);
    this.usedAuto = true;
    // 導いた解を覚えて、次からはそれも避ける（TODO-016）。おまかせを頼りに
    // 解いた回は達成度（`addFound`）には入らないので、こちらで別に貯める。
    if (result.no !== null && result.no !== undefined) {
      this.avoidNumbers.add(result.no);
      addAuto(this.spec.key, result.no, this.solutions.canonical.length);
    }
    audio.auto();
    this.showMessage(`${name} を置いた`);
    this.refreshHud();
    this.checkSolved();
  }

  // ---- 解の有無を教えるモード（TODO-013）-------------------------------

  /**
   * 入／切を切り替える。ラベルは変えず、選んである状態（`setSelected`）で出す
   * ──「音 ON／音 OFF」のように文字で持つと、切のときに何の入／切なのかは
   * 分かっても、今どちらなのかを読み違えやすいため。
   */
  toggleHint() {
    audio.button();
    this.hinting = !this.hinting;
    this.hintButton.setSelected(this.hinting);
    if (this.hinting) {
      // 一度でも入にしたら、答えに頼ったものとして扱う（TODO-020 へ渡す）。
      this.usedHint = true;
      this.runHint();
      return;
    }
    this.hintState = null;
    this.hintText.setText('');
  }

  /**
   * 残りのピースで最後まで置けるかを出す。全解のデータを線形になめるだけで
   * 0.1ms もかからないので、**盤が変わったその場で調べる**（TODO-022）。
   *
   * 前は上限まで探索して 0.3 秒近く画面が止まっていたため、置いたピースが
   * 収まる動きを邪魔しないよう `SOLVE_CHECK_DELAY` だけ待ってから回していた。
   * 上限で打ち切ったときに「詰み」と言い切れず「？？？」と出していたのも、
   * データがあれば必ず言い切れるので消えた。
   */
  runHint() {
    if (!this.hinting) return;
    const left = this.pieces.filter((piece) => piece.location === 'tray').length;
    if (left === 0 || !this.solutions) {
      this.hintState = null;
      this.hintText.setText('');
      return;
    }
    const state = hasSolution(this.solutions, this.board) ? 'ok' : 'dead';

    // 音は詰みに変わった瞬間だけ。毎回鳴らすと置くたびに鳴って邪魔になる。
    if (state === 'dead' && this.hintState !== 'dead') audio.invalid();
    this.hintState = state;

    const text = { ok: '解ける', dead: '解なし' };
    const color = { ok: TEXT_COLORS.dim, dead: TEXT_COLORS.danger };
    this.hintText.setText(text[state]).setColor(color[state]);
  }

  /**
   * 同じ盤を最初から。遊びかけは捨てる（TODO-030）。
   *
   * `playing` を先に偽にしておくのは、シーンを離れるときの控え
   * （`onShutdown()`）に、今まさに捨てた盤面を書き戻させないため。
   * `restart()` に引数を渡すのは、`init()` が前の `resume` を受け取って
   * 続きから始め直さないようにするため。
   */
  restart() {
    audio.button();
    this.playing = false;
    clearProgress(this.spec.key);
    this.scene.restart({ resume: false });
  }

  toggleMute() {
    const muted = audio.toggleMuted();
    this.muteButton.setLabel(muted ? '音 OFF' : '音 ON');
    if (!muted) audio.button();
  }

  confirmToTitle() {
    audio.button();
    this.confirmParts.forEach((part) => part.setVisible(true));
  }

  hideConfirm() {
    audio.button();
    this.confirmParts.forEach((part) => part.setVisible(false));
  }

  goToTitle() {
    audio.button();
    this.scene.start('Title');
  }

  // ---- 進行 -----------------------------------------------------------

  refreshHud() {
    const left = this.pieces.filter((piece) => piece.location === 'tray').length;
    this.remainText.setText(`残り ${left}`);
    this.undoButton.setEnabled(this.playing && this.history.length > 0);
    // 全解のデータが届くまでは、おまかせもヒント表示も出せない（TODO-022）。
    this.autoButton.setEnabled(this.playing && left > 0 && this.solutions !== null);
    this.hintButton.setEnabled(this.solutions !== null);
    // 盤が変わるところは置く・外す・向きを変える・戻す・おまかせのどれも
    // ここを通るので、解の有無を調べ直す入口をここ 1 つにまとめてある。
    this.runHint();
    // 遊びかけを控える入口も同じ理由でここ（TODO-030）。
    if (this.ready) this.persist();
  }

  showMessage(text) {
    this.messageText.setText(text);
    if (this.messageTimer) this.messageTimer.remove();
    this.messageTimer = this.time.delayedCall(INPUT.messageMs, () => {
      this.messageText.setText('');
      this.messageTimer = null;
    });
  }

  checkSolved() {
    if (!isSolved(this.board)) return;
    this.playing = false;
    // 解き切った盤面に続きは無いので、遊びかけは捨てる（TODO-030）。
    // `playing` を偽にしたあとなので、`persist()` が書き戻すことはない。
    clearProgress(this.spec.key);
    this.refreshHud();
    this.showMessage('完成');
    this.time.delayedCall(700, () => {
      this.scene.start('Clear', {
        ms: this.elapsed,
        usedAuto: this.usedAuto,
        usedHint: this.usedHint,
        // 何番の解かを渡す（TODO-022）。記録に残すかどうかを決めるのは
        // `clear.js` なので、ここは番号を引くところまで。データが届く前に
        // 解き切ることもありうるので、そのときは `null` を渡す。
        no: this.solutions ? solutionNumber(this.solutions, boardKey(this.board)) : null,
      });
    });
  }
}
