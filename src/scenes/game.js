/**
 * 本編。Phaser とのつなぎに徹し、置けるかどうかの判定は `logic.js`、
 * おまかせと解の有無は `solutions.js`（全解のデータ）に任せる。
 *
 * 盤面（`this.board`）は模型で、画面に見えているのはピースの Container。
 * 二重持ちなのは、盤面を Undo の履歴や全解のデータとの照合へそのまま渡せる形に保ちつつ、
 * Container ではドラッグ中の中途半端な位置も表したいため。
 */

import {
  BACKDROP, BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, INPUT, LAYOUTS, NEON,
  OUTLINE, PALETTES, PALETTE_REGISTRY_KEY, PIECES, TEXT_COLORS, TURN_MARK,
} from '../config.js';
import {
  boardKey, canPlace, createBoard, flip, forcedPlacements, formatTime, isSolved,
  nextPlaceableTurn, nextTurn, prevTurn,
  normalize, outlineEdges, place, remove, rotateCw, sameShape, shapeSize, snapSpot, turnOrder,
  turnPivot,
} from '../logic.js';
import {
  autoFrom, ensureSolutions, hasSolution, solutionNumber,
} from '../solutions.js';
import {
  addAuto, clearProgress, loadAuto, loadFound, loadProgress, recordCompletion, RECORD_STATUS,
  saveProgress,
} from '../storage.js';
import * as audio from '../audio.js';
import {
  createButton, createHintBadge, createPanel, createTitleBar, createTooltip, createVersionText,
  drawAcrylic,
} from '../ui.js';
import { ICONS } from '../icons.js';
import { darken, pieceColor, TEX } from './boot.js';

/** 重なりの順。ボタンの説明（TODO-042）は HUD の下へはみ出して盤やピースに
 *  重なるので、HUD より上・確認ダイアログより下に置く。 */
export const DEPTH = {
  board: 0, ghost: 5, piece: 10, traySlot: 15, dragging: 20, hud: 30, tooltip: 35, confirm: 40,
};

export default class GameScene extends Phaser.Scene {
  /** キーを受け取るのは、デモ（`DemoScene`。TODO-040）が描画を使い回すため。 */
  constructor(key = 'Game') {
    super(key);
  }

  /**
   * `resume` が真なら、保存してある遊びかけから始める（TODO-030）。渡すのは
   * タイトルの `つづきから` だけ。Game を始める呼び出しは、どれも引数を明示する
   * （`はじめる`・`scene.restart()`・クリアの「もう一度」）。Phaser は引数を
   * 省くと前回の値を渡し直すので、省くと続きから始まってしまう。
   *
   * `progress` を渡すと、保存してある遊びかけではなくその盤面から始める
   * （記録画面の「この回を続ける」。TODO-073）。localStorage が使えない
   * ときも、その回の完成形から始められるようにするため。
   */
  init(data) {
    this.startProgress = (data && data.progress) || null;
    this.resuming = !!(data && data.resume) || this.startProgress !== null;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    // 盤はタイトルで選ぶ（TODO-009。記録画面の「この回を続ける」も始める前に
    // 書き換える。TODO-073）。どちらも本編の外で書くので、ここで 1 回読めば
    // シーンが生きている間は変わらない。
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.spec = BOARDS[this.boardKey];
    this.layout = LAYOUTS[this.boardKey];
    // 色の組もタイトルでだけ選べる（TODO-015）。
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
    // このプレーで完成させた解の番号（TODO-072）。遊びかけと一緒に保存する。
    this.solvedNumbers = [];

    this.drawBoard();
    this.drawTray();
    this.createGhost();
    this.createPieces();
    this.createTraySlots();
    this.createHud();
    this.createMessage();
    this.createConfirmDialog();
    createVersionText(this);

    // 全解のデータ（TODO-022）。6×10 は 139KB あるので動的 import で読む。
    // 届くまで [おまかせ] と [ヒント表示] は押せない（`refreshHud()` が見る）。
    // シーンを離れたあとに届くことがあるので、生きているかを確かめてから使う。
    this.solutions = null;
    // おまかせで避ける解の番号（TODO-016）。自力で見つけた解（達成度の分子）と
    // おまかせで導いた解を合わせたもの。**読むのはここ 1 回だけ**で、あとは
    // おまかせを押すたびに足していく。
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
    // ドラッグ中に向きを変える入力（TODO-069）。右クリック・ホイール・
    // 2 本目の指のタップは、当たり判定に関わらず画面のどこでも受けたいので、
    // シーン全体で聞く。2 本目の指を受ける設定（`input.activePointers`）と
    // 右クリックのメニューを出さない設定（`input.disableContextMenu`）は
    // `main.js` の起動設定にある（ゲーム全体に効く値なので、シーンへ入るたびに
    // 呼ぶとポインタが積み上がる）。
    this.input.on('pointerdown', this.onScenePointerDown, this);
    this.input.on('wheel', this.onWheel, this);
    // シーンを離れるときに押下状態を捨てる（残すと次に来たとき掴んだままになる）。
    // あわせて、その時点の経過時間まで含めて遊びかけを控える（TODO-030）。
    // 盤が変わったときにも控えているが、置いてから長く考えて中断すると、
    // 考えていた時間が落ちるため。
    // `once` なのは、やり直しで `create()` を通るたびに登録が積み上がらないようにするため。
    this.events.once('shutdown', this.onShutdown, this);

    // 遊びかけの読み込みは、部品を組んでから（`refreshPiece()` などが要る）。
    if (this.resuming) this.applyProgress(this.startProgress || loadProgress(this.spec.key));
    this.refreshHud();
    // ここから先の `refreshHud()` は、盤が変わったときに呼ばれる。
    // 組み立ての最中に控えると、何も置いていない盤面で保存済みの遊びかけを
    // 消してしまう（`はじめる` を押し間違えただけで消えるのは困る）。
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
        // 穴のマスは描かず、下の枠の地をアクリルの板越しに見せる（TODO-051）。
        if (this.board.grid[row * this.board.cols + col] !== null) continue;
        this.add.image(x + col * cell, y + row * cell, TEX.boardCell(cell))
          .setOrigin(0)
          .setDepth(DEPTH.board);
      }
    }
    const { hole } = this.spec;
    if (hole) {
      drawAcrylic(this.add.graphics().setDepth(DEPTH.board),
                  x + hole.col * cell, y + hole.row * cell, hole.cols * cell, hole.rows * cell);
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
        // 向きの巡りの起点（TODO-025）。定義の向きから巡ると、どのピースも
        // 表を回り切ってから裏返しになる。`cells` は回すたびに変わるので別に持つ。
        origin: normalize(definition.cells),
        location: 'tray',
        row: 0,
        col: 0,
        slot: index,
        container: null,
        tiles: [],
      };
      piece.container = this.add.container(0, 0).setDepth(DEPTH.piece);
      // 落ち影はマスの下、外周の縁取りはマスの上。Container 内の順が
      // 重なりの順なので、マスを挟むように前後へ入れる。
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
      // ネオンの光のにじみ（TODO-039）。芯（`outline`）の下に敷く。
      // 他の色の組では作らない（`drawPieceEdges()` は無いものとして扱う）。
      piece.glow = null;
      if (this.palette.neon) {
        piece.glow = this.add.graphics();
        piece.container.add(piece.glow);
      }
      piece.outline = this.add.graphics();
      piece.container.add(piece.outline);
      // 次のタップで何が起きるかの印（TODO-025）。ピースの絵に重ねるので一番上へ。
      piece.turnMark = this.add.graphics();
      piece.container.add(piece.turnMark);
      this.refreshPiece(piece);
      this.layoutPiece(piece);
      return piece;
    });
    // にじみの明滅（TODO-039）。シーンの Tween なので、シーンを離れれば止まる。
    if (this.palette.neon) {
      this.tweens.add({
        targets: this.pieces.map((piece) => piece.glow),
        alpha: NEON.blink.minAlpha,
        duration: NEON.blink.durationMs,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  /**
   * トレイのスロット全体を当たり判定にする。ピースの絵は 11px 幅にもなり
   * （`I` の縦向きなど）、指で押すには狭すぎるため、スロット全体を覆う透明な
   * 矩形で受ける。スロットはピースの長い辺に合わせた正方形で、詰めて並べて
   * あるので隣と重ならない（`packTray()`。TODO-053）。
   * `piece.slot` は変わらないので、矩形とピースの対応は固定でよい。
   */
  createTraySlots() {
    this.pieces.forEach((piece) => {
      const { x, y, size } = this.layout.tray.slots[piece.slot];
      const hit = this.add.rectangle(x, y, size, size, 0x000000, 0)
        .setDepth(DEPTH.traySlot)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', (pointer) => {
        if (piece.location !== 'tray') return;
        this.onPiecePointerDown(piece, pointer);
      });
    });
  }

  /**
   * 上部のメニューバー。時間の表示とボタンは段を分け、ボタンは入りきらなければ
   * 折り返す（`this.layout.hud`。TODO-011、TODO-013、TODO-076）。
   * 何個ずつ何段目からかは `config.js` の配置が決めるので、ここでは画面の向きを見ない。
   */
  createHud() {
    const hud = this.layout.hud;
    // HUD の「タイトルへ」と同じく確認を出す（TODO-089）。
    createTitleBar(this, this.layout.title.y, () => this.confirmToTitle()).setDepth(DEPTH.hud);
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

    // 解の有無（TODO-013）。切のうちは隠しておく。色付きの札で目立たせる（TODO-045）。
    this.hintBadge = createHintBadge(this, hud.x + hud.padding + hud.statusX, rowY(0), 0)
      .setDepth(DEPTH.hud);

    // 完成した解が新しいか記録済みか（TODO-072）。解の有無の札と同じ位置だが、
    // 札は完成しているときは出ず、こちらは完成しているときだけ出す
    // （`refreshHud()` が消す）ので重ならない。
    this.recordText = this.add.text(hud.x + hud.padding + hud.statusX, rowY(0), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);

    // タイトルへは画面を離れるボタンなので、他と分けて一番左に置く（TODO-076）。
    // 続く 3 つが「解くのを助けるもの」、残りが「遊び方を変えるもの」。
    this.buttons = this.createHudButtons([
      { icon: ICONS.title, tooltip: 'タイトルへ', onClick: () => this.confirmToTitle() },
      { icon: ICONS.undo, tooltip: '一手戻す', onClick: () => this.undo() },
      { icon: ICONS.auto, tooltip: 'おまかせ', onClick: () => this.useAuto() },
      { icon: ICONS.hint, tooltip: 'ヒント表示', onClick: () => this.toggleHint() },
      { icon: ICONS.restart, tooltip: 'やり直し', onClick: () => this.restart() },
      { ...this.muteFace(audio.isMuted()), onClick: () => this.toggleMute() },
    ]);
    this.undoButton = this.buttons[1];
    this.autoButton = this.buttons[2];
    this.hintButton = this.buttons[3];
    this.muteButton = this.buttons[5];
  }

  /**
   * HUD のボタンを並べる。デモ（TODO-040）も同じ並びで置くので分けてある。
   * ボタンはアイコンで、説明はホバー／タップで出す（TODO-042）。説明の枠は
   * シーンに 1 つ要り、本編とデモの両方が通るのはここだけなので、ここで作る。
   *
   * @param {{icon: Function, tooltip: string, onClick: Function}[]} items
   */
  createHudButtons(items) {
    this.tooltip = createTooltip(this).setDepth(DEPTH.tooltip);
    const hud = this.layout.hud;
    const rowY = (row) => hud.y + hud.rowHeight * (row + 0.5);
    // ボタンだけの段は中央へ、時間の表示と同じ段なら右へ寄せる。今は必ず段が
    // 分かれる（`config.js` の `firstButtonRow`）ので、中央だけを通る。
    const perRow = hud.buttonsPerRow;
    const centered = hud.firstButtonRow > 0;
    return items.map((item, index) => {
      const row = Math.floor(index / perRow);
      const count = Math.min(perRow, items.length - row * perRow);
      const total = count * hud.buttonWidth + (count - 1) * hud.gap;
      const left = centered
        ? hud.x + (hud.width - total) / 2
        : hud.x + hud.width - hud.padding - total;
      return createButton(this, {
        x: left + hud.buttonWidth / 2 + (index % perRow) * (hud.buttonWidth + hud.gap),
        y: rowY(hud.firstButtonRow + row),
        width: hud.buttonWidth,
        height: hud.buttonHeight,
        icon: item.icon,
        tooltip: item.tooltip,
        onClick: item.onClick,
      }).setDepth(DEPTH.hud);
    });
  }

  createMessage() {
    this.messageText = this.add.text(this.layout.message.x, this.layout.message.y, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5).setDepth(DEPTH.hud);
  }

  /**
   * タイトルへ戻る前の確認。ブラウザの `confirm()` は使わない（CLAUDE.md）ので、
   * Canvas 内に組む。背景の帯に画面全体を覆う当たり判定を持たせ、開いている間は
   * ピースやほかのボタンへクリックが抜けないようにする（Phaser の入力は既定で
   * 最前面の対象だけに配る `topOnly` なので、これで足りる）。
   */
  createConfirmDialog() {
    const cfg = this.layout.confirm;
    const x = (this.layout.width - cfg.width) / 2;
    const y = (this.layout.height - cfg.height) / 2;

    this.confirmParts = [];

    const backdrop = this.add.rectangle(0, 0, this.layout.width, this.layout.height,
                                        BACKDROP.color, BACKDROP.alpha)
      .setOrigin(0).setDepth(DEPTH.confirm).setInteractive().setVisible(false);
    this.confirmParts.push(backdrop);

    this.confirmParts.push(
      createPanel(this, x, y, cfg.width, cfg.height).setDepth(DEPTH.confirm).setVisible(false),
    );

    this.confirmParts.push(
      // 途中の盤面は残るので（TODO-030）、失われるとは言わない。
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
   * 定義の向きを起点にすると「回転が続いて、裏返しが 1 回」に揃うので、
   * 回転か裏返しかを見分ければ足りる（上下反転は並びに出てこない）。
   *
   * V のように回転でも裏返しでも同じ向きになる遷移があるので、回転で
   * 説明できるものは回転とする。X は向きが 1 通りなので null（印を出さない）。
   */
  turnMarkKind(piece) {
    const next = nextTurn(piece.cells, piece.origin);
    if (sameShape(next, piece.cells)) return null;
    if (sameShape(next, rotateCw(piece.cells))) return 'rotate';
    return 'flip';
  }

  /**
   * 印を置くマスの中心。外接矩形の真ん中は U のように空いていることが
   * あるので、そこへ一番近い**埋まっているマス**を選ぶ（印がピースから
   * 外れて浮かないように）。
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
   * 印は**トレイにいるピースだけ**に出す（TODO-025）。盤の上では置けない
   * 向きを飛ばすので、次に何が来るかが盤の埋まり方で変わってしまう。
   * 掴んでいる間も出さない（拡大率が変わって大きさが合わなくなるうえ、
   * 運んでいる最中は要らない）。
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
   * 盤の 1 マス（`this.layout.board.cell`）の座標系で描けば、トレイでの縮小は
   * Container の拡大率が効くので描き分けが要らない。
   * 縁は線の太さの半分だけ内側へ寄せる。外へはみ出すと隣のピースにかぶり、
   * どちらの輪郭か分からなくなるため。
   *
   * ネオンのにじみ（`piece.glow`。TODO-039）も、太い線を内側へ寄せて重ねる。
   * 内側へ寄せた線は凹の角で端どうしが届かず、線の太さ四方が欠ける。芯の
   * 細さでは見えないが、にじみの太さでは見えるので、にじみだけその正方形を
   * 埋める（他の色の組の見た目を変えないため）。
   */
  drawPieceEdges(piece) {
    const cell = this.layout.board.cell;
    const has = new Set(piece.cells.map(([row, col]) => `${row},${col}`));
    const edges = outlineEdges(piece.cells);
    // 凹の角 = 格子点を囲む 4 マスのうち 3 つが埋まっている所。空いた 1 マスが
    // 上下・左右のどちら側かも持つ。
    const concaveCorners = [];
    if (piece.glow) {
      const size = shapeSize(piece.cells);
      for (let row = 0; row <= size.rows; row += 1) {
        for (let col = 0; col <= size.cols; col += 1) {
          const around = [[-1, -1], [-1, 0], [0, -1], [0, 0]]
            .filter(([dr, dc]) => !has.has(`${row + dr},${col + dc}`));
          if (around.length !== 1) continue;
          const [[dr, dc]] = around;
          concaveCorners.push([row, col, dr === -1, dc === -1]);
        }
      }
    }
    const stroke = (graphics, width, color, alpha, fillCorners = false) => {
      const inset = width / 2;
      if (fillCorners) {
        graphics.fillStyle(color, alpha);
        for (const [row, col, missingUp, missingLeft] of concaveCorners) {
          // 欠けるのは、空いたマスと対角にあるマスの、角に接した所。
          graphics.fillRect(col * cell - (missingLeft ? 0 : width),
                            row * cell - (missingUp ? 0 : width), width, width);
        }
      }
      graphics.lineStyle(width, color, alpha);
      for (const [r1, c1, r2, c2] of edges) {
        // 内側は、辺に接するマスがある側。
        const horizontal = r1 === r2;
        const dr = horizontal && has.has(`${r1},${c1}`) ? inset : -inset;
        const dc = !horizontal && has.has(`${r1},${c1}`) ? inset : -inset;
        const x = horizontal ? 0 : dc;
        const y = horizontal ? dr : 0;
        graphics.lineBetween(c1 * cell + x, r1 * cell + y,
                             c2 * cell + x, r2 * cell + y);
      }
    };

    piece.shadow.clear();
    piece.shadow.fillStyle(OUTLINE.shadowColor, OUTLINE.shadowAlpha);
    for (const [row, col] of piece.cells) {
      piece.shadow.fillRect(col * cell + OUTLINE.shadowOffset,
                            row * cell + OUTLINE.shadowOffset, cell, cell);
    }

    piece.outline.clear();
    stroke(piece.outline, this.palette.outlineWidth,
           darken(piece.color, this.palette.outlineDarken), 1);

    if (piece.glow) {
      piece.glow.clear();
      for (const layer of NEON.glow) stroke(piece.glow, layer.width, piece.color, layer.alpha, true);
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
    const { x: centerX, y: centerY } = tray.slots[piece.slot];
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
    // 右クリックはドラッグ中の向きの変更にだけ使うので、ここでは受けない（TODO-069）。
    if (!this.playing || this.drag || this.pending || pointer.rightButtonDown()) return;
    audio.unlock();
    this.pending = {
      piece,
      pointer,
      startX: pointer.x,
      startY: pointer.y,
      consumed: false,
    };
  }

  onPointerMove(pointer) {
    if (this.drag) {
      // ドラッグを始めたポインタだけを見る。2 本目の指（向きの変更に使う）が
      // 動いても、運んでいるピースを動かさない（TODO-069）。
      if (pointer.id !== this.drag.pointer.id) return;
      this.updateDrag(pointer);
      return;
    }
    // ドラッグを始める前も、押したポインタだけを見る。見ないと、2 本目の指が
    // わずかに動いただけで、そちらでドラッグが始まる（TODO-069）。
    if (!this.pending || pointer.id !== this.pending.pointer.id) return;
    const moved = Phaser.Math.Distance.Between(
      this.pending.startX, this.pending.startY, pointer.x, pointer.y,
    );
    if (moved > INPUT.dragThreshold) this.startDrag(pointer);
  }

  /** タップは待たずにその場で次の向きへ進める（TODO-023）。ダブルタップの
   *  反転が無いので、2 回目を待たなくてよい。 */
  onPointerUp(pointer) {
    // 右ボタンはドラッグ中の向きの変更（`onScenePointerDown()`）にだけ使うので、
    // 離しても何もしない。マウスは同じポインタ ID を使い回すので、ボタンで
    // 見分ける（TODO-069）。
    if (pointer.button === 2) return;
    if (this.drag) {
      // 2 本目の指を離してもドラッグは終わらない（TODO-069）。
      if (pointer.id !== this.drag.pointer.id) return;
      this.dropDrag(pointer);
      return;
    }
    // 押したポインタ以外が離れても、タップにしない（TODO-069）。
    if (!this.pending || pointer.id !== this.pending.pointer.id) return;
    const pending = this.pending;
    this.cancelPending();
    if (pending.consumed) return;
    this.turnPiece(pending.piece);
  }

  /**
   * ドラッグ中に向きを変える入力（TODO-069）。右クリックはボタンで、2 本目の
   * 指はドラッグ中のポインタと ID が違うことで見分ける（マウスの左クリックは
   * 常に同じ ID なので、二重に反応しない）。
   */
  onScenePointerDown(pointer) {
    if (!this.drag) return;
    if (pointer.rightButtonDown()) {
      this.turnDrag(1);
      return;
    }
    if (pointer.wasTouch && pointer.id !== this.drag.pointer.id) this.turnDrag(1);
  }

  /**
   * ドラッグ中のホイールで向きを変える（TODO-069）。下が次、上が 1 つ前。
   * トラックパッドは 1 回の操作で何十もイベントが来るので、一定時間は無視する。
   */
  onWheel(pointer, gameObjects, deltaX, deltaY) {
    if (!this.drag || deltaY === 0) return;
    const now = this.time.now;
    if (now - this.drag.lastWheelAt < INPUT.wheelDebounceMs) return;
    this.drag.lastWheelAt = now;
    this.turnDrag(deltaY > 0 ? 1 : -1);
  }

  /**
   * ドラッグ中に向きを 1 段変える（TODO-069）。盤から外れているので
   * `nextPlaceableTurn()` は使わず、タップの巡り方（`nextTurn()` /
   * `prevTurn()`）をそのまま使う。回す軸は**つかんでいるマス**で、指の位置
   * ではない。タッチでは `this.drag.offsetX/Y` に指からずらした 1 マスぶん
   * （`touchShiftX/Y`）が乗っているので、回す前に除き、回したあとで足し戻す
   * （ずらしぶんごと回すと、指の位置を軸に回ってしまう）。
   * 回したあとも、つかんだマスが画面上の同じ位置に残るよう、つかんだ点を
   * 新しい向きの座標系へ写し直す（`turnPivot()`）。X のように向きが 1 通り
   * しかないピースは、タップ（`turnPiece()`）と同じく音だけ返す。
   */
  turnDrag(direction) {
    const { piece, touchShiftX, touchShiftY } = this.drag;
    const next = direction > 0
      ? nextTurn(piece.cells, piece.origin)
      : prevTurn(piece.cells, piece.origin);
    if (sameShape(next, piece.cells)) {
      audio.rotate();
      return;
    }
    const cell = this.layout.board.cell;
    const point = [
      (this.drag.offsetY - touchShiftY) / cell,
      (this.drag.offsetX - touchShiftX) / cell,
    ];
    const [row, col] = turnPivot(piece.cells, next, point);
    const flipped = sameShape(next, normalize(flip(piece.cells)));
    piece.cells = next;
    this.drag.offsetX = col * cell + touchShiftX;
    this.drag.offsetY = row * cell + touchShiftY;
    this.refreshPiece(piece);
    piece.container.setPosition(
      this.drag.pointer.x - this.drag.offsetX, this.drag.pointer.y - this.drag.offsetY,
    );
    if (flipped) audio.flip();
    else audio.rotate();
    this.refreshDragGhost();
  }

  cancelPending() {
    this.pending = null;
  }

  startDrag(pointer) {
    const pending = this.pending;
    const piece = pending.piece;
    this.cancelPending();

    // 掴んだ点を拡大率で割り戻して覚える。トレイの縮小表示から盤の大きさへ
    // 広がっても、指の下のマスが変わらないようにするため。
    const scale = piece.container.scaleX;
    const offsetX = (pending.startX - piece.container.x) / scale;
    const offsetY = (pending.startY - piece.container.y) / scale;
    // 指で隠れないよう、タッチのときだけピースを盤のマス 1 個ぶんずらす。
    // 縦画面では指の上、横画面では指の左（TODO-023）。画面の長い側へ
    // 逃がすので、盤の端でも指を画面の外へ出さずに済む。
    // マウスではずらさない（`pointer.wasTouch` で見分ける）。
    // ずらしたぶん（`touchShiftX/Y`）は別に持つ。`turnDrag()` が回す軸は
    // 指の位置でなくつかんでいるマスなので、回す前にこのぶんを除く（TODO-069）。
    let touchShiftX = 0;
    let touchShiftY = 0;
    if (pointer.wasTouch) {
      if (this.layout.portrait) touchShiftY = this.layout.board.cell;
      else touchShiftX = this.layout.board.cell;
    }

    const snapshot = this.snapshot();
    if (piece.location === 'board') this.board = remove(this.board, piece.name);

    // `pointer` を控えるのは、向きを変える入力（TODO-069）が別のポインタ
    // （右クリックや 2 本目の指）から来たとき、運んでいる指の今の位置へ
    // 収め直すため。Phaser はポインタごとに同じオブジェクトを使い回すので、
    // この参照から最新の座標が読める。
    this.drag = {
      piece,
      offsetX: offsetX + touchShiftX,
      offsetY: offsetY + touchShiftY,
      touchShiftX,
      touchShiftY,
      snapshot,
      trail: [],
      pointer,
      lastWheelAt: -Infinity,
    };
    this.drawTurnMark(piece);   // 掴んでいる間は印を消す
    piece.container.setScale(1);
    piece.container.setDepth(DEPTH.dragging);
    audio.pick();
    this.updateDrag(pointer);
  }

  updateDrag(pointer) {
    const { piece, offsetX, offsetY, trail } = this.drag;
    piece.container.setPosition(pointer.x - offsetX, pointer.y - offsetY);

    // 離すときの速さを測るため、直近 `swipeWindowMs` ぶんの通り道を残す
    // （TODO-023）。先頭がその区間の始まりになるよう、古いものから捨てる。
    trail.push({ x: pointer.x, y: pointer.y, time: this.time.now });
    while (trail.length > 2 && this.time.now - trail[1].time > INPUT.swipeWindowMs) {
      trail.shift();
    }

    this.refreshDragGhost();
  }

  /** 今のドラッグの位置と向きに合わせて影を出し直す（`updateDrag()` と `turnDrag()` で使う）。 */
  refreshDragGhost() {
    const spot = this.dropSpot();
    if (spot) this.showGhost(this.drag.piece, spot.row, spot.col);
    else this.ghost.setVisible(false);
  }

  /**
   * ドラッグ中の Container の位置から、一番近い升目を求める。盤の外に
   * あたる値もそのまま返す（近くまで来ているかは `nearBoard()` が見る）。
   *
   * 指の位置でなく Container で見る。タッチ中はピースを指からずらしてあるので、
   * 指で見ると「ピースは盤の上に見えているのに指は盤の外」ということが起きる。
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
   * その升目が盤の近くにあるか。吸い付く範囲（`INPUT.snapRange`）だけ
   * 盤の外まで含める。それ以上広げないのは、トレイへ運ぶ途中のピースが
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
   * 置くときは位置を合わせるので、指が止まってから離れる。速さが残っていれば
   * 置く気は無いと見て、盤の上で離してもトレイへ戻す。
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
    // 斜めに流れただけのものを拾わないよう、トレイへ向かう成分が主でなければ見送る。
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
      this.refreshHud(true);
      this.checkSolved();
      return;
    }

    // 盤から離れた所で離した、または振って戻した。盤に置いてあったものは
    // 「外す」、トレイにあったものは元へ戻すだけ。
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
    // 盤とトレイのどちらへ収まるかで、向きの印を出すかが変わる。
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
   * タップ 1 つで次の向きへ進める（TODO-019）。盤の上では、その場に置けない
   * 向きを飛ばす（TODO-023）。`turnOrder()` の並びは 90° 回転と裏返しが
   * 混ざるので、どちらになったかを見て音を選ぶ。
   */
  turnPiece(piece) {
    if (!this.playing) return;
    const onBoard = piece.location === 'board';
    // 盤の上では、自分で今の場所を塞いでいると見なさないよう自分を除く。
    const without = onBoard ? remove(this.board, piece.name) : null;
    const next = onBoard
      ? nextPlaceableTurn(without, piece.cells, piece.row, piece.col, piece.origin)
      : nextTurn(piece.cells, piece.origin);

    if (sameShape(next, piece.cells)) {
      // どの向きも置けないときは、断ったことを知らせる。X のように向きが
      // 1 通りしかないピースは、音だけ返す（タップが届いたことは伝える）。
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
   * 参照をそのまま持っても後から書き換わらない。
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

  /**
   * 同じ場所へ置き直した手は、戻しても盤が変わらず、押したのに何も起きない
   * ように見える。そこで盤が変わるまで続けて戻す。
   * 戻したあとは形の決まった空きを埋めない（`refreshHud()` の `fill`）ので、
   * 戻した盤面がまた埋まって元に戻ることは無い（TODO-072）。
   */
  undo() {
    if (this.history.length === 0) return;
    audio.undo();
    const before = boardKey(this.board);
    do {
      this.restoreState(this.history.pop(), true);
    } while (this.history.length > 0 && boardKey(this.board) === before);
  }

  // ---- 遊びかけの保存（TODO-030）---------------------------------------

  /**
   * 遊びかけを控える。盤が変わったとき（`refreshHud()`）と、シーンを
   * 離れるときに呼ぶ。
   *
   * 1 個も置いていないときは控えずに消す。残しても `つづきから` が
   * 「はじめから」と同じになるだけで、押せるボタンが増えたぶん紛らわしい。
   * `playing` が偽のとき（クリア表示を出している間・やり直しで捨てたあと）は
   * 何もしない。完成した盤面は `checkSolved()` が `playing` を偽にする前に
   * 控える（TODO-072）。
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
      solved: this.solvedNumbers,
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
   * （最初から遊ぶことになる）。
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
    this.solvedNumbers = progress.solved;
    this.timeText.setText(formatTime(this.elapsed));
  }

  // ---- ボタンの働き ---------------------------------------------------

  /**
   * おまかせを 1 手置く。全解のデータから条件に合う解を無作為に選ぶだけなので、
   * 待たせることも、時間切れで見つけられないことも無い（TODO-022）。
   *
   * 既に出した解（自力で見つけた解と、おまかせで導いた解）は候補から外すので、
   * 同じ盤を何度解いても毎回同じ解へは導かれない（TODO-016）。
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

    const { name } = result.placement;
    this.history.push(this.snapshot());
    this.slideIn(result.placement);
    this.usedAuto = true;
    // 導いた解を覚えて、次からはそれも避ける（TODO-016）。おまかせに頼った
    // 回は達成度（`addFound`）に入らないので、別に貯める。
    if (result.no !== null && result.no !== undefined) {
      this.avoidNumbers.add(result.no);
      addAuto(this.spec.key, result.no, this.solutions.canonical.length);
    }
    audio.auto();
    this.showMessage(`${name} を置いた`);
    this.refreshHud(true);
    this.checkSolved();
  }

  // ---- 解の有無を教えるモード（TODO-013）-------------------------------

  /**
   * 入／切を切り替える。ラベルは変えず、選んである状態（`setSelected`）で見せる。
   * 「音 ON／音 OFF」のように文字で出すと、今どちらなのかを読み違えやすいため。
   */
  toggleHint() {
    audio.button();
    this.hinting = !this.hinting;
    this.hintButton.setSelected(this.hinting);
    if (this.hinting) {
      // 一度でも入にしたら、答えに頼った回とする（TODO-020）。
      this.usedHint = true;
      // 入にした時点で、形の決まった空きを埋める（TODO-044）。
      this.refreshHud(true);
      return;
    }
    this.hintState = null;
    this.hintBadge.setState(null);
  }

  /**
   * 残りのピースで最後まで置けるかを出す。全解のデータを線形になめるだけで
   * 0.1ms もかからないので、**盤が変わったその場で調べる**（TODO-022）。
   */
  runHint() {
    if (!this.hinting) return;
    const left = this.pieces.filter((piece) => piece.location === 'tray').length;
    if (left === 0 || !this.solutions) {
      this.hintState = null;
      this.hintBadge.setState(null);
      return;
    }
    const state = hasSolution(this.solutions, this.board) ? 'ok' : 'dead';

    // 音は詰みに変わった瞬間だけ。置くたびに鳴ると邪魔になる。
    if (state === 'dead' && this.hintState !== 'dead') audio.invalid();
    this.hintState = state;
    this.hintBadge.setState(state);
  }

  /**
   * 同じ盤を最初から。遊びかけは捨てる（TODO-030）。
   *
   * `playing` を先に偽にするのは、シーンを離れるときの控え（`onShutdown()`）に、
   * 捨てた盤面を書き戻させないため。`restart()` に引数を渡すのは、`init()` が
   * 前の `resume` を受け取って続きから始め直さないようにするため。
   */
  restart() {
    audio.button();
    this.playing = false;
    clearProgress(this.spec.key);
    this.scene.restart({ resume: false });
  }

  /**
   * 音のボタンのアイコンと説明。本編とデモの組み立てと `toggleMute()` の
   * 3 か所で使うので、ここに 1 つだけ置く。
   */
  muteFace(muted) {
    return muted
      ? { icon: ICONS.soundOff, tooltip: '音 OFF' }
      : { icon: ICONS.soundOn, tooltip: '音 ON' };
  }

  toggleMute() {
    const muted = audio.toggleMuted();
    const face = this.muteFace(muted);
    this.muteButton.setIcon(face.icon).setTooltip(face.tooltip);
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

  /** トレイから盤へ滑らせて置く。おまかせと自動で埋める手（TODO-044）が使う。 */
  slideIn({ name, cells, row, col }) {
    const piece = this.pieces.find((entry) => entry.name === name);
    piece.cells = cells;
    piece.location = 'board';
    piece.row = row;
    piece.col = col;
    this.board = place(this.board, name, cells, row, col);
    this.refreshPiece(piece);
    this.settlePiece(piece, true);
  }

  /**
   * ヒント表示が入で解ける盤面なら、残りのピースと同じ形の切り離された空きを埋める
   * （TODO-044）。その空きはそのピースで埋めるしかないので、手で置かせる意味が無い。
   *
   * 履歴は積まない。そうすると「一手戻す」1 回で、直前の手と自動で埋めた手が
   * まとめて戻る。`usedAuto` は立てない（ヒント表示を入にした時点で
   * `usedHint` が立っている）。埋めたら真を返す。
   */
  fillForced() {
    if (!this.playing || !this.hinting || !this.solutions) return false;
    if (!hasSolution(this.solutions, this.board)) return false;
    const names = this.pieces.filter((piece) => piece.location === 'tray').map((piece) => piece.name);
    const placements = forcedPlacements(this.board, names);
    if (placements.length === 0) return false;
    for (const placement of placements) this.slideIn(placement);
    audio.auto();
    this.showMessage(`${placements.map((entry) => entry.name).join('・')} を置いた`);
    return true;
  }

  /**
   * 盤が変わるところ（置く・外す・向きを変える・戻す・おまかせ・ヒント表示を入にする）は
   * どれもここを通るので、形の決まった空きを埋める（TODO-044）・解の有無を調べ直す・
   * 遊びかけを控える処理を、ここにまとめてある。埋めるのを先にするのは、残りの数・
   * ボタン・解の有無・控えを、埋めたあとの盤面で出すため。
   *
   * 埋めるのは `fill` が真のとき、つまりピースを置いたとき（手で置く・おまかせ）と
   * ヒント表示を入にしたときだけ。外す・戻す・向きを変えるときは埋めない。
   * 外した穴はそのピースの形なので、埋めると外す前の盤へすぐ戻り、完成した盤から
   * ピースを外して入れ替えられなくなるため（TODO-072）。
   */
  refreshHud(fill = false) {
    const filled = fill && this.fillForced();
    const left = this.pieces.filter((piece) => piece.location === 'tray').length;
    this.remainText.setText(`残り ${left}`);
    // 完成した解の知らせ（TODO-072）は、盤が完成でなくなるまで出しておく。
    // 完成した盤からできるのは外す手だけなので、残りが出たら消せば足りる。
    if (left > 0) this.recordText.setText('');
    this.undoButton.setEnabled(this.playing && this.history.length > 0);
    // 全解のデータが届くまでは、おまかせもヒント表示も出せない（TODO-022）。
    this.autoButton.setEnabled(this.playing && left > 0 && this.solutions !== null);
    this.hintButton.setEnabled(this.solutions !== null);
    this.runHint();
    if (this.ready) this.persist(); // TODO-030
    // 最後の 1 個を埋めたら、そのままクリア。
    if (filled) this.checkSolved();
  }

  showMessage(text) {
    this.messageText.setText(text);
    if (this.messageTimer) this.messageTimer.remove();
    this.messageTimer = this.time.delayedCall(INPUT.messageMs, () => {
      this.messageText.setText('');
      this.messageTimer = null;
    });
  }

  /**
   * 完成を見つけたら、時計を止めて記録を更新し、本編の上にクリア表示を重ねる
   * （TODO-072）。画面を移らないのは、完成したあともピースを入れ替えて
   * 別の解を作れるようにするため。本編は `pause()` で止める（時計・入力・
   * Tween が止まる）。「続ける」で `continuePlay()` が動かす。
   *
   * `playing` を偽にする前に遊びかけを控える。`persist()` は `playing` が
   * 偽だと何もしないので、先に控えないと完成した盤面と解の一覧が残らない。
   */
  checkSolved() {
    // 自動で埋めて `refreshHud()` が先にクリアへ進めたあと、呼んだ側
    // （`dropDrag()`・`useAuto()`）がもう一度呼ぶので、二重に数えない。
    if (!this.playing) return;
    if (!isSolved(this.board)) return;
    // 何番の解か（TODO-022）。データが届く前に解き切ったときは `null`（記録に残せない）。
    const no = this.solutions ? solutionNumber(this.solutions, boardKey(this.board)) : null;
    const result = this.recordSolved(no);
    if (no !== null && !this.solvedNumbers.includes(no)) this.solvedNumbers.push(no);
    this.persist();
    this.playing = false;
    this.refreshHud();
    this.showRecordStatus(no, result.status);
    this.showMessage('完成');
    this.time.delayedCall(700, () => {
      this.scene.pause();
      this.scene.launch('Clear', {
        ms: this.elapsed,
        usedAuto: this.usedAuto,
        usedHint: this.usedHint,
        no,
        total: this.solutions ? this.solutions.canonical.length : null,
        best: result.best,
        bestUpdated: result.updated,
        status: result.status,
      });
    });
  }

  /**
   * 完成した回を記録へ反映する（TODO-072）。続けて作った解も反映するので、
   * クリア表示ではなく完成を見つけるここに置く。経過時間は最初からの累計のまま。
   *
   * 最短時間はおまかせを使っていない回だけ（TODO-020・TODO-088）。履歴と見つけた解は頼った回も残し、
   * 印を付ける（TODO-024）。履歴に足すか・上書きするか・何もしないかは
   * `recordClear()` が決める。番号が無ければ履歴にも見つけた解にも残せない。
   */
  recordSolved(no) {
    const result = recordCompletion(this.spec.key, {
      at: Date.now(), ms: this.elapsed, no, usedAuto: this.usedAuto, usedHint: this.usedHint,
    }, this.solutions);
    // 続けて遊ぶと `create()` を通らないので、おまかせで避ける番号にもここで足す（TODO-016）。
    if (no !== null) this.avoidNumbers.add(no);
    return result;
  }

  /** HUD に、完成した解が新しいか記録済みかを出す（TODO-072）。 */
  showRecordStatus(no, status) {
    if (status === null) return;
    this.recordText.setText(`${RECORD_STATUS[status]}（${no} 番）`)
      .setColor(status === 'kept' ? TEXT_COLORS.dim : TEXT_COLORS.accent);
  }

  /**
   * クリア表示の「続ける」から呼ばれる（TODO-072）。盤は完成した並びのまま、
   * 時計を動かして遊べるようにする。同じ盤を二度完成と見なさないよう、
   * `checkSolved()` は呼ばない（次に置いたときに呼ばれる）。
   * HUD の知らせは盤が変わるまで残すので、`refreshHud()` は通さず
   * ボタンの状態だけ戻す。
   */
  continuePlay() {
    this.scene.resume();
    this.playing = true;
    this.undoButton.setEnabled(this.history.length > 0);
  }
}
