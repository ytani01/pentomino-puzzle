/**
 * デモ（TODO-040）。コンピューターが探索でピースを置いたり外したり
 * しながら解に至る様子を、本編と同じ盤とトレイの上で見せる。探し方は
 * 深さ優先（既定）と幅優先から HUD で選ぶ（TODO-050）。
 *
 * 盤・トレイ・ピースの描画は本編（`GameScene`）をそのまま使い回したいので
 * 継承する。`create()` は上書きして描画に要るものだけを組み、入力・ヒント・
 * おまかせ・遊びかけの保存・クリアの判定は持たない。**`storage.js` は呼ばない**
 * （記録・遊びかけ・見つけた解に何も残さないため）。本編の `create()` を
 * 通らないので、遊びかけを控える shutdown の処理も登録されない。
 *
 * 探索は `logic.js` の `solveSteps()`（深さ優先）か `solveStepsBreadth()`
 * （幅優先）の generator で、`update()` が速さに
 * 応じた間隔で 1 手ずつ進める。1 フレームに 1 手までなので画面は止まらない。
 * 置いたら全解のデータで「解ける／解なし」を調べ、解なしならすぐ外す。
 * 解を見つけたら `DEMO.pauseMs` だけ止まって次の解へ、出し切ったら同じだけ
 * 止まって空の盤から探し直す。タイトルへ戻るまで止まらない（TODO-052）。
 * ヒント表示を入にして解く人と同じ動きで、HUD にも本編のヒント表示と同じ
 * 文字を出す（TODO-043）。解につながる手だけを選んで置かないのは、それだと
 * 試行錯誤に見えなくなるため。全解のデータが届くまでは探索を始めない。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, DEMO, DEMO_LAYOUTS, FONT, PALETTES,
  PALETTE_REGISTRY_KEY, TEXT_COLORS,
} from '../config.js';
import { createBoard, solveSteps, solveStepsBreadth } from '../logic.js';
import { ensureSolutions, hasSolution } from '../solutions.js';
import * as audio from '../audio.js';
import { createHintBadge, createPanel, createVersionText } from '../ui.js';
import { ICONS } from '../icons.js';
import GameScene, { DEPTH } from './game.js';

/** 速さの並び。HUD のボタンの前半 3 つと同じ順。 */
const SPEEDS = ['slow', 'fast', 'fastest'];

/** 探し方ごとの generator とボタンの見た目。ボタンは今の探し方を見せる（音のボタンと同じ）。 */
const STRATEGIES = {
  depth: { solve: solveSteps, icon: ICONS.depthFirst, tooltip: '探し方: 深さ優先' },
  breadth: { solve: solveStepsBreadth, icon: ICONS.breadthFirst, tooltip: '探し方: 幅優先' },
};

export default class DemoScene extends GameScene {
  constructor() {
    super('Demo');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    // 盤と色の組はタイトルで選んだもの（本編と同じ読み方）。
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.spec = BOARDS[this.boardKey];
    // ボタンが本編より 1 つ多い分だけ HUD が違う。盤とトレイは本編と同じ（TODO-050）。
    this.layout = DEMO_LAYOUTS[this.boardKey];
    this.palette = PALETTES[this.registry.get(PALETTE_REGISTRY_KEY)];
    // `drawBoard()` が穴の位置を見るためだけに持つ。探索の盤は generator の中にある。
    this.board = createBoard(this.spec);

    // 'loading'（全解のデータを待っている）・'running'（探している）・
    // 'solved'（解を見つけて止まっている）・'done'（出し切って止まっている）
    this.state = 'loading';
    this.steps = null;
    this.solutions = null;
    this.strategy = 'depth';
    // 直前に置いた手が解につながるか。null は表示を空にする（解けたとき）。
    this.hintState = 'ok';
    this.speed = DEMO.defaultSpeed;
    this.tried = 0;
    this.solvedCount = 0;
    this.waited = 0;

    this.drawBoard();
    this.drawTray();
    this.createPieces();
    this.pieceByName = new Map(this.pieces.map((piece) => [piece.name, piece]));
    // 押せる見た目（指のカーソル）を出さない。`createPieces()` がマスごとに付けている。
    for (const piece of this.pieces) piece.tiles.forEach((tile) => tile.disableInteractive());
    this.createHud();
    this.createMessage();
    createVersionText(this);
    this.refreshHud();

    // シーンを離れたあとに届くことがあるので、生きているかを確かめてから使う。
    // Phaser はシーンを使い回すので、入り直したあとに前回の分が遅れて届くことも
    // ある。探索を始めたあと・別の盤の表なら捨てる（盤のピースと食い違うため）。
    ensureSolutions(this.registry, this.spec).then((solutions) => {
      if (!this.scene.isActive() || this.state !== 'loading') return;
      if (solutions.spec.key !== this.spec.key) return;
      this.solutions = solutions;
      this.startSearch();
    });
  }

  update(_time, delta) {
    if (this.state === 'loading') return;
    this.waited += delta;
    if (this.state !== 'running') {
      if (this.waited >= DEMO.pauseMs) this.resume();
      return;
    }
    // 追いつくために何手もまとめて進めない。1 手ずつ見せるのが目的なので。
    if (this.waited < DEMO.speeds[this.speed].intervalMs) return;
    this.waited = 0;
    this.advance();
  }

  /**
   * generator を 1 手進め、動いたピースを今の位置へ移す。解を見つけたか
   * 出し切ったらそこで止める。滑らせて音を鳴らすのは `animate` の速さだけ。
   */
  advance() {
    const { value, done } = this.steps.next();
    if (done) {
      this.finish();
      return;
    }
    if (value.type === 'solved') {
      this.onSolved();
      return;
    }
    const { animate } = DEMO.speeds[this.speed];
    const piece = this.pieceByName.get(value.name);
    if (value.type === 'place') {
      // 幅優先が次の盤面へ移るための置き直しは、試した手に数えない。
      if (!value.replay) this.tried += 1;
      piece.cells = value.cells;
      piece.location = 'board';
      piece.row = value.row;
      piece.col = value.col;
      if (animate) audio.drop();
      const hintState = value.ok ? 'ok' : 'dead';
      // 本編と同じく、解なしに変わった瞬間に鳴らす。解なしの手はすぐ外して
      // 「解ける」に戻るので、解なしの手を置くたびに鳴る（本編でヒント表示を
      // 入にして解なしの手を置いたときと同じ）。
      if (animate && hintState === 'dead' && this.hintState !== 'dead') audio.invalid();
      this.hintState = hintState;
    } else {
      // 向きは最後に試したまま、自分のスロットへ戻す。
      piece.location = 'tray';
      if (animate) audio.lift();
      // 外した先は、探索が「解ける」と見て潜った盤面（空の盤も解ける）。
      this.hintState = 'ok';
    }
    this.refreshPiece(piece);
    this.settlePiece(piece, animate);
    // ボタンは状態が変わったときだけ（`onSolved()`・`finish()`）。毎手
    // 塗り直すと、値が同じでも Phaser が文字を描き直してしまうため。
    this.refreshStatus();
  }

  onSolved() {
    this.state = 'solved';
    this.solvedCount += 1;
    // 本編がトレイの残り 0 で消すのに合わせる。
    this.hintState = null;
    audio.fanfare();
    // `showMessage()` は時間が経つと消えるので使わず、同じ文字を直接書く。
    // 止まっている間は出したままにする。
    this.messageText.setText(`解けた！ ${this.tried.toLocaleString('en-US')} 手目`);
    this.refreshHud();
  }

  finish() {
    this.state = 'done';
    this.messageText.setText('すべての解を探し終えた');
    this.refreshHud();
  }

  // ---- 画面の組み立て -------------------------------------------------

  /**
   * 本編と同じ枠とボタンの並び（`createHudButtons()`）。1 段目の文字には
   * 本編の時間と残りの代わりに、試した手と見つけた解の数を出す。
   */
  createHud() {
    const hud = this.layout.hud;
    createPanel(this, hud.x, hud.y, hud.width, hud.height).setDepth(DEPTH.hud);
    this.statusText = this.add.text(hud.x + hud.padding, hud.y + hud.rowHeight / 2, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0, 0.5).setDepth(DEPTH.hud);
    // 本編のヒント表示と同じ札（TODO-045）。本編の位置（`statusX`）には
    // 試した手がかかるので、1 段目の右端に寄せる。
    this.hintBadge = createHintBadge(
      this, hud.x + hud.width - hud.padding, hud.y + hud.rowHeight / 2, 1,
    ).setDepth(DEPTH.hud);

    const speedTips = { slow: 'ゆっくり', fast: '速い', fastest: '最速' };
    this.buttons = this.createHudButtons([
      ...SPEEDS.map((speed) => ({
        icon: ICONS[speed], tooltip: speedTips[speed], onClick: () => this.selectSpeed(speed),
      })),
      { icon: ICONS.next, tooltip: '次の解を探す', onClick: () => this.searchNext() },
      { ...STRATEGIES[this.strategy], onClick: () => this.toggleStrategy() },
      { ...this.muteFace(audio.isMuted()), onClick: () => this.toggleMute() },
      // 失うものが無いので確認を出さずに戻る。
      { icon: ICONS.title, tooltip: 'タイトルへ', onClick: () => this.goToTitle() },
    ]);
    this.speedButtons = this.buttons.slice(0, SPEEDS.length);
    this.nextButton = this.buttons[3];
    this.strategyButton = this.buttons[4];
    this.muteButton = this.buttons[5];
  }

  refreshHud() {
    this.refreshStatus();
    this.speedButtons.forEach((button, index) => button.setSelected(SPEEDS[index] === this.speed));
    this.nextButton.setEnabled(this.state === 'solved');
  }

  /** 1 段目の文字だけ。探索が進むたびに毎フレーム呼ぶ。 */
  refreshStatus() {
    this.statusText.setText(
      `試した手 ${this.tried.toLocaleString('en-US')}　見つけた解 ${this.solvedCount}`,
    );
    this.hintBadge.setState(this.hintState);
  }

  // ---- ボタンの働き ---------------------------------------------------

  selectSpeed(speed) {
    audio.button();
    this.speed = speed;
    // 止まっている間は待ち時間を数え直さない（速さを変えるたびに延びるため）。
    if (this.state === 'running') this.waited = 0;
    this.refreshHud();
  }

  /**
   * 探し方を切り替えて空の盤から探し直す。途中から続けないのは、2 つの
   * 探し方で盤面の辿り方が違い、今の盤面を引き継げないため。全解のデータを
   * 待っている間は探し方だけ変え、届いたときに `startSearch()` が使う。
   */
  toggleStrategy() {
    audio.button();
    this.strategy = this.strategy === 'depth' ? 'breadth' : 'depth';
    const face = STRATEGIES[this.strategy];
    this.strategyButton.setIcon(face.icon).setTooltip(face.tooltip);
    if (this.solutions) this.startSearch();
  }

  /**
   * 探し直すときは、盤のピースを滑らせずにトレイへ戻す。何枚も同時に滑らせると
   * 探索の 1 手と見分けがつかず、次の探索の最初の手とも重なるため。
   */
  startSearch() {
    for (const piece of this.pieces) {
      if (piece.location !== 'board') continue;
      piece.location = 'tray';
      this.refreshPiece(piece);
      this.settlePiece(piece, false);
    }
    const { solutions } = this;
    this.steps = STRATEGIES[this.strategy].solve(
      this.spec, Math.random, (board) => hasSolution(solutions, board),
    );
    this.state = 'running';
    this.tried = 0;
    this.solvedCount = 0;
    this.hintState = 'ok';
    this.waited = 0;
    this.messageText.setText('');
    this.refreshHud();
  }

  searchNext() {
    if (this.state !== 'solved') return;
    audio.button();
    this.resume();
  }

  /**
   * 止まっていたところから進める。出し切ったあとは generator に続きが
   * 無いので、空の盤から探し直してタイトルへ戻るまで止めない（TODO-052）。
   */
  resume() {
    if (this.state === 'done') {
      this.startSearch();
      return;
    }
    this.state = 'running';
    this.waited = 0;
    this.messageText.setText('');
    this.refreshHud();
  }

  // ---- 本編から外すもの -----------------------------------------------

  /** デモのピースは押しても何も起きない。 */
  onPiecePointerDown() {}

  /** トレイの向きの印は出さない（タップで向きを変えられないため）。 */
  drawTurnMark() {}
}
