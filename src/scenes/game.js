/**
 * 本編。Phaser とのつなぎに徹し、置けるかどうかの判定は `logic.js`、
 * ヒントの求解は `solver.js` に任せる。
 *
 * 盤面（`this.board`）は模型で、画面に見えているのはピースの Container のほう。
 * 二重持ちに見えるが、盤面のほうは Undo の履歴や求解へそのまま渡せる形にしておき、
 * Container はドラッグ中の中途半端な位置も表せるようにしておきたいので分けてある。
 */

import {
  BOARD_SPEC, COLORS, FONT, INPUT, LAYOUT, PIECES, TEXT_COLORS, VERSION,
} from '../config.js';
import {
  canPlace, createBoard, flip, formatTime, isSolved, normalize, place, remove,
  rotateCw, sameShape, shapeSize,
} from '../logic.js';
import { hintPlacement } from '../solver.js';
import * as audio from '../audio.js';
import { createButton, createPanel } from '../ui.js';
import { TEX } from './boot.js';

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

    this.board = createBoard(BOARD_SPEC);
    this.history = [];
    this.elapsed = 0;
    this.usedHint = false;
    this.playing = true;
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

    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    // シーンを離れるときに持ち越しの押下状態を捨てる（次に来たとき掴んだままになる）。
    // `once` なのは、やり直しで `create()` を通るたびに登録が積み上がらないようにするため。
    this.events.once('shutdown', this.cancelPending, this);

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
    const panel = LAYOUT.boardPanel;
    createPanel(this, panel.x, panel.y, panel.width, panel.height).setDepth(DEPTH.board);
    const { x, y, cell } = LAYOUT.board;
    for (let row = 0; row < this.board.rows; row += 1) {
      for (let col = 0; col < this.board.cols; col += 1) {
        const playable = this.board.grid[row * this.board.cols + col] === null;
        this.add.image(x + col * cell, y + row * cell, playable ? TEX.boardCell : TEX.hole)
          .setOrigin(0)
          .setDepth(DEPTH.board);
      }
    }
  }

  drawTray() {
    const panel = LAYOUT.trayPanel;
    createPanel(this, panel.x, panel.y, panel.width, panel.height).setDepth(DEPTH.board);
  }

  /** 置ける場所に出す薄い影。ピース 1 個ぶんの 5 枚を作り置きして使い回す。 */
  createGhost() {
    this.ghost = this.add.container(0, 0).setDepth(DEPTH.ghost).setVisible(false);
    this.ghostTiles = [];
    for (let i = 0; i < 5; i += 1) {
      const tile = this.add.image(0, 0, TEX.ghost).setOrigin(0).setAlpha(0.28);
      this.ghost.add(tile);
      this.ghostTiles.push(tile);
    }
  }

  createPieces() {
    this.pieces = PIECES.map((definition, index) => {
      const piece = {
        name: definition.name,
        color: definition.color,
        cells: normalize(definition.cells),
        location: 'tray',
        row: 0,
        col: 0,
        slot: index,
        container: null,
        tiles: [],
      };
      piece.container = this.add.container(0, 0).setDepth(DEPTH.piece);
      for (let i = 0; i < piece.cells.length; i += 1) {
        const tile = this.add.image(0, 0, TEX.piece(piece.name)).setOrigin(0);
        tile.setInteractive({ useHandCursor: true });
        tile.on('pointerdown', (pointer) => this.onPiecePointerDown(piece, pointer));
        piece.container.add(tile);
        piece.tiles.push(tile);
      }
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
    const tray = LAYOUT.tray;
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

  createHud() {
    const hud = LAYOUT.hud;
    createPanel(this, hud.x, hud.y, hud.width, hud.height).setDepth(DEPTH.hud);
    const centerY = hud.y + hud.height / 2;

    this.timeText = this.add.text(hud.x + hud.padding, centerY, formatTime(0), {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    this.remainText = this.add.text(hud.x + hud.padding + 110, centerY, '', {
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
    const total = labels.length * hud.buttonWidth + (labels.length - 1) * hud.gap;
    const left = hud.x + hud.width - hud.padding - total;
    this.buttons = labels.map((label, index) => createButton(this, {
      x: left + hud.buttonWidth / 2 + index * (hud.buttonWidth + hud.gap),
      y: centerY,
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
    this.add.text(LAYOUT.width - 12, LAYOUT.height - 12, VERSION, {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(1, 1).setAlpha(0.6);
  }

  createMessage() {
    this.messageText = this.add.text(LAYOUT.message.x, LAYOUT.message.y, '', {
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
    const cfg = LAYOUT.confirm;
    const x = (LAYOUT.width - cfg.width) / 2;
    const y = (LAYOUT.height - cfg.height) / 2;

    this.confirmParts = [];

    const backdrop = this.add.rectangle(0, 0, LAYOUT.width, LAYOUT.height, 0x000000, 0.55)
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
    const cell = LAYOUT.board.cell;
    piece.cells.forEach(([row, col], index) => {
      piece.tiles[index].setPosition(col * cell, row * cell);
    });
  }

  /** 置かれている場所（盤かトレイか）から、Container の位置と拡大率を決める。 */
  pieceTransform(piece) {
    const cell = LAYOUT.board.cell;
    if (piece.location === 'board') {
      return {
        x: LAYOUT.board.x + piece.col * cell,
        y: LAYOUT.board.y + piece.row * cell,
        scale: 1,
      };
    }
    const tray = LAYOUT.tray;
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
      locked: false,
      consumed: false,
      timer: this.time.delayedCall(INPUT.longPressMs, () => this.onLongPress()),
    };
  }

  /** 長押しは反転。ここで掴み直しを禁じるのは、反転の後にドラッグへ移ると
   *  掴んでいたマスが別の場所へ動いてしまい、指と絵がずれるため。 */
  onLongPress() {
    const pending = this.pending;
    if (!pending || this.drag) return;
    pending.locked = true;
    pending.consumed = true;
    this.applyOrientation(pending.piece, normalize(flip(pending.piece.cells)), audio.flip);
  }

  onPointerMove(pointer) {
    if (this.drag) {
      this.updateDrag(pointer);
      return;
    }
    if (!this.pending || this.pending.locked) return;
    const moved = Phaser.Math.Distance.Between(
      this.pending.startX, this.pending.startY, pointer.x, pointer.y,
    );
    if (moved > INPUT.dragThreshold) this.startDrag(pointer);
  }

  onPointerUp(_pointer) {
    if (this.drag) {
      this.dropDrag();
      return;
    }
    const pending = this.pending;
    this.cancelPending();
    if (!pending || pending.consumed) return;
    this.applyOrientation(pending.piece, normalize(rotateCw(pending.piece.cells)), audio.rotate);
  }

  cancelPending() {
    if (this.pending && this.pending.timer) this.pending.timer.remove();
    this.pending = null;
  }

  startDrag(pointer) {
    const pending = this.pending;
    const piece = pending.piece;
    this.cancelPending();

    // 掴んだ点を拡大率ぶん割り戻して覚える。トレイの縮小表示から盤の大きさへ
    // 広がっても、指の下にあるマスが変わらないようにするため。
    const scale = piece.container.scaleX;
    const offsetX = (pending.startX - piece.container.x) / scale;
    let offsetY = (pending.startY - piece.container.y) / scale;
    // 指で隠れないよう、タッチ操作のときだけピースを盤のマス 1 個ぶん上へ
    // ずらす。マウスでは指がないのでずらさない（`pointer.wasTouch` で見分ける）。
    if (pointer.wasTouch) offsetY += LAYOUT.board.cell;

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
    const { x, y, cell } = LAYOUT.board;
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
    const cell = LAYOUT.board.cell;
    this.ghost.setPosition(LAYOUT.board.x + col * cell, LAYOUT.board.y + row * cell);
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

    const result = hintPlacement(this.board, names);
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
    this.usedHint = true;
    audio.hint();
    this.showMessage(`${name} を置いた`);
    this.refreshHud();
    this.checkSolved();
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
