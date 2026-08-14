/**
 * 本編。Phaser とのつなぎに徹し、置けるかどうかの判定は `logic.js`、
 * ヒントの求解は `solver.js` に任せる。
 *
 * 盤面（`this.board`）は模型で、画面に見えているのはピースの Container のほう。
 * 二重持ちに見えるが、盤面のほうは Undo の履歴や求解へそのまま渡せる形にしておき、
 * Container はドラッグ中の中途半端な位置も表せるようにしておきたいので分けてある。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, HINT_RETRIES, INPUT, LAYOUTS,
  OUTLINE, PALETTES, PALETTE_REGISTRY_KEY, PIECES, TEXT_COLORS, VERSION,
} from '../config.js';
import {
  canPlace, createBoard, flip, formatTime, isSolved, normalize, outlineEdges, place,
  remove, rotateCw, sameShape, shapeSize,
} from '../logic.js';
import { hintPlacement } from '../solver.js';
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
    this.usedHint = false;
    // 直前に出したヒント。[一手戻す] → [ヒント] で同じ手を繰り返さないために
    // 覚えておく（TODO-017）。一手戻しても消さない。
    this.lastHint = null;
    this.playing = true;
    this.pending = null;
    this.pendingTap = null;
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

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    // シーンを離れるときに持ち越しの押下状態を捨てる（次に来たとき掴んだままになる）。
    // `once` なのは、やり直しで `create()` を通るたびに登録が積み上がらないようにするため。
    this.events.once('shutdown', this.cancelPending, this);
    this.events.once('shutdown', this.cancelPendingTap, this);

    this.refreshHud();
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
   * 上部のメニューバー。縦画面では横幅が足りず、時間の表示とボタン 5 個が
   * 1 段に並ばないので 2 段に折り返す（`this.layout.hud.rows`。TODO-011）。
   * 段の数だけで分かれるように書いてあるので、向きをここで見る必要はない。
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

    this.remainText = this.add.text(hud.x + hud.padding + 110, rowY(0), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    const labels = [
      '一手戻す', 'ヒント', 'やり直し', audio.isMuted() ? '音 OFF' : '音 ON', 'タイトルへ',
    ];
    const actions = [
      () => this.undo(),
      () => this.useHint(),
      () => this.restart(),
      () => this.toggleMute(),
      () => this.confirmToTitle(),
    ];
    // ボタンは最後の段に置く。1 段なら時間の表示と並ぶので右へ寄せ、
    // 2 段なら段まるごとをボタンが使うので中央へ置く。
    const total = labels.length * hud.buttonWidth + (labels.length - 1) * hud.gap;
    const left = hud.rows > 1
      ? hud.x + (hud.width - total) / 2
      : hud.x + hud.width - hud.padding - total;
    this.buttons = labels.map((label, index) => createButton(this, {
      x: left + hud.buttonWidth / 2 + index * (hud.buttonWidth + hud.gap),
      y: rowY(hud.rows - 1),
      width: hud.buttonWidth,
      height: hud.buttonHeight,
      label,
      fontSize: FONT.small,
      onClick: actions[index],
    }).setDepth(DEPTH.hud));
    this.undoButton = this.buttons[0];
    this.hintButton = this.buttons[1];
    this.muteButton = this.buttons[3];
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
      this.add.text(x + cfg.width / 2, y + 50, 'タイトルへ戻りますか？\n今の進み方は失われます', {
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
      label: '戻る',
      fontSize: FONT.small,
      onClick: () => this.goToTitle(),
    }).setDepth(DEPTH.confirm).setVisible(false));
    this.confirmParts.push(createButton(this, {
      x: left + cfg.buttonWidth + cfg.gap + cfg.buttonWidth / 2,
      y: buttonY,
      width: cfg.buttonWidth,
      height: cfg.buttonHeight,
      label: 'やめる',
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

  /** タップは既定で回転だが、`INPUT.doubleTapMs` 以内に同じピースへ 2 回目の
   *  タップが来たら反転に差し替える。1 回目の回転をその猶予ぶん遅らせて
   *  待つことで、反転の直前に絵が跳ねないようにしている。 */
  onPointerUp(pointer) {
    if (this.drag) {
      this.dropDrag();
      return;
    }
    const pending = this.pending;
    this.cancelPending();
    if (!pending || pending.consumed) return;
    const piece = pending.piece;

    const waiting = this.pendingTap;
    if (waiting && waiting.piece === piece) {
      const moved = Phaser.Math.Distance.Between(waiting.x, waiting.y, pointer.x, pointer.y);
      if (moved <= INPUT.dragThreshold) {
        waiting.timer.remove();
        this.pendingTap = null;
        this.applyOrientation(piece, normalize(flip(piece.cells)), audio.flip);
        return;
      }
    }

    if (this.pendingTap) this.pendingTap.timer.remove();
    this.pendingTap = {
      piece,
      x: pointer.x,
      y: pointer.y,
      timer: this.time.delayedCall(INPUT.doubleTapMs, () => {
        this.pendingTap = null;
        this.applyOrientation(piece, normalize(rotateCw(piece.cells)), audio.rotate);
      }),
    };
  }

  cancelPending() {
    this.pending = null;
  }

  /** 待機中の 1 回目のタップを、次のドラッグやシーン終了で捨てる。 */
  cancelPendingTap() {
    if (this.pendingTap) this.pendingTap.timer.remove();
    this.pendingTap = null;
  }

  startDrag(pointer) {
    const pending = this.pending;
    const piece = pending.piece;
    this.cancelPending();
    if (this.pendingTap && this.pendingTap.piece === piece) this.cancelPendingTap();

    // 掴んだ点を拡大率ぶん割り戻して覚える。トレイの縮小表示から盤の大きさへ
    // 広がっても、指の下にあるマスが変わらないようにするため。
    const scale = piece.container.scaleX;
    const offsetX = (pending.startX - piece.container.x) / scale;
    let offsetY = (pending.startY - piece.container.y) / scale;
    // 指で隠れないよう、タッチ操作のときだけピースを盤のマス 1 個ぶん上へ
    // ずらす。マウスでは指がないのでずらさない（`pointer.wasTouch` で見分ける）。
    if (pointer.wasTouch) offsetY += this.layout.board.cell;

    const snapshot = this.snapshot();
    if (piece.location === 'board') this.board = remove(this.board, piece.name);

    this.drag = { piece, offsetX, offsetY, snapshot };
    piece.container.setScale(1);
    piece.container.setDepth(DEPTH.dragging);
    audio.pick();
    this.updateDrag(pointer);
  }

  updateDrag(pointer) {
    const { piece, offsetX, offsetY } = this.drag;
    piece.container.setPosition(pointer.x - offsetX, pointer.y - offsetY);

    const spot = this.dropSpot();
    if (spot && canPlace(this.board, piece.cells, spot.row, spot.col).ok) {
      this.showGhost(piece, spot.row, spot.col);
    } else {
      this.ghost.setVisible(false);
    }
  }

  /**
   * ドラッグ中の Container の位置から、置こうとしている盤の升目を求める。
   * 「盤の上か」も指の位置ではなく Container で見る。タッチ中はピースを
   * 指より上へずらしてあるので、指の位置で見ると盤の下端で「ピースは
   * 盤の上に見えているのに指は盤の外」がずれて起きる。
   */
  dropSpot() {
    const { x, y, cell } = this.layout.board;
    const container = this.drag.piece.container;
    const overBoard = container.x >= x && container.x < x + this.board.cols * cell
      && container.y >= y && container.y < y + this.board.rows * cell;
    if (!overBoard) return null;
    return {
      row: Math.round((container.y - y) / cell),
      col: Math.round((container.x - x) / cell),
    };
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

  dropDrag() {
    const { piece, snapshot } = this.drag;
    const spot = this.dropSpot();
    this.ghost.setVisible(false);
    this.drag = null;

    if (spot) {
      const result = canPlace(this.board, piece.cells, spot.row, spot.col);
      if (result.ok) {
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
      audio.invalid();
      this.flashPiece(piece);
      this.showMessage(result.reason === 'overlap' ? 'そこは他のピースと重なる' : 'そこは盤からはみ出す');
      this.restoreState(snapshot, true);
      return;
    }

    // 盤の外で離した。盤に置いてあったものなら「外す」、もともとトレイなら元へ戻すだけ。
    if (snapshot.pieces[piece.slot].location === 'board') {
      this.history.push(snapshot);
      piece.location = 'tray';
      this.settlePiece(piece, true);
      audio.lift();
      this.refreshHud();
      return;
    }
    this.restoreState(snapshot, true);
  }

  /** 置き場所が決まったピースを、その場所へ収める（戻すときだけ滑らせる）。 */
  settlePiece(piece, animate) {
    const target = this.pieceTransform(piece);
    piece.container.setDepth(DEPTH.piece);
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
   * 回転・反転をまとめて受ける。盤に置いてあるピースはその場で向きを変えるので、
   * 自分を取り除いた盤で置けるかを確かめ、無理なら赤く光らせて元のままにする。
   */
  applyOrientation(piece, cells, sound) {
    if (!this.playing) return;
    if (sameShape(cells, piece.cells)) {
      // X のように、その操作では形が変わらないもの。音だけ返して知らせる。
      sound();
      return;
    }
    if (piece.location === 'board') {
      const snapshot = this.snapshot();
      const without = remove(this.board, piece.name);
      if (!canPlace(without, cells, piece.row, piece.col).ok) {
        audio.invalid();
        this.flashPiece(piece);
        this.showMessage('そこでは向きを変えられない');
        return;
      }
      this.history.push(snapshot);
      piece.cells = cells;
      this.board = place(without, piece.name, cells, piece.row, piece.col);
    } else {
      piece.cells = cells;
    }
    this.refreshPiece(piece);
    this.layoutPiece(piece);
    sound();
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

  // ---- ボタンの働き ---------------------------------------------------

  useHint() {
    const names = this.pieces.filter((piece) => piece.location === 'tray').map((p) => p.name);
    if (names.length === 0) return;

    const result = this.findHint(names);
    if (!result.ok) {
      audio.invalid();
      this.showMessage(result.reason === 'limit'
        ? '時間内に置き方を見つけられなかった'
        : 'この形からは完成できない');
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
    this.lastHint = result.placement;
    this.usedHint = true;
    audio.hint();
    this.showMessage(`${name} を置いた`);
    this.refreshHud();
    this.checkSolved();
  }

  /**
   * 直前と同じ手を避けたヒントを求める（TODO-017）。探索順を混ぜて引き直すが、
   * 終盤は違う手がそもそも無いことがあるので、`HINT_RETRIES` 回で諦めて
   * 同じ手を返す（何も出さないより、同じでも出したほうが役に立つ）。
   */
  findHint(names) {
    let result = hintPlacement(this.board, names, { shuffle: true });
    for (let retry = 0; retry < HINT_RETRIES; retry += 1) {
      if (!result.ok || !this.isLastHint(result.placement)) break;
      result = hintPlacement(this.board, names, { shuffle: true });
    }
    return result;
  }

  /** ピース・向き・位置がそろって一致したときだけ「同じ手」と見なす。 */
  isLastHint(placement) {
    const last = this.lastHint;
    if (!last || !placement) return false;
    return last.name === placement.name
      && last.row === placement.row
      && last.col === placement.col
      && sameShape(last.cells, placement.cells);
  }

  restart() {
    audio.button();
    this.scene.restart();
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
    this.hintButton.setEnabled(this.playing && left > 0);
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
    this.refreshHud();
    this.showMessage('完成');
    this.time.delayedCall(700, () => {
      this.scene.start('Clear', { ms: this.elapsed, usedHint: this.usedHint });
    });
  }
}
