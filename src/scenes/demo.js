/**
 * デモ（TODO-040）。コンピューターが探索でピースを置いたり外したり
 * しながら解に至る様子を、本編と同じ盤とトレイの上で見せる。探し方は
 * ランダム（既定。TODO-075）と深さ優先から HUD で選ぶ（TODO-050・TODO-057）。
 *
 * 盤・トレイ・ピースの描画は本編（`GameScene`）をそのまま使い回したいので
 * 継承する。`create()` は上書きして描画に要るものだけを組み、入力・ヒント・
 * おまかせ・遊びかけの保存・クリアの判定は持たない。**`storage.js` は呼ばない**
 * （記録・遊びかけ・見つけた解に何も残さないため）。本編の `create()` を
 * 通らないので、遊びかけを控える shutdown の処理も登録されない。
 *
 * 探索は `logic.js` の `solveSteps()`（深さ優先）か `solveStepsRandom()`
 * （ランダム）の generator で、`update()` が速さに応じた間隔で 1 手ずつ進める
 * （ランダムは手ごとに間隔を揺らす。`pickWaitScale()`。TODO-059）。
 * 1 フレームに 1 手までなので画面は止まらない。
 * 置いたら全解のデータで「解ける／解なし」を調べる。深さ優先は解なしならすぐ
 * 外すが、ランダムは外さずに置き続け、置ける場所が無くなって初めて
 * 「解ける」に戻るまで戻す（TODO-059。人が行き詰まってから考え直すのに近づける）。
 * ただし、5 の倍数でない大きさの閉じた空きができたときなど、置いた瞬間に詰みと
 * 分かるときは、行き詰まりを待たずにその場で外す（`logic.js` の
 * `solveStepsRandom()`。TODO-060・066〜068）。外す手が連なる
 * ときは、待たずに 1 フレームずつ続けて戻す（`advance()` の先読み。TODO-060）。
 * 解を見つけたら `DEMO.pauseMs` だけ止まって次へ進む。タイトルへ戻るまで
 * 止まらない（TODO-052）。次の解は盤を片づけて空の盤から探し直し、置いては
 * 外す様子を毎回はじめから見せる（TODO-054）。
 * ヒント表示を入にして解く人と同じ動きで、HUD にも本編のヒント表示と同じ
 * 文字を出す（TODO-043）。解につながる手だけを選んで置かないのは、それだと
 * 試行錯誤に見えなくなるため。全解のデータが届くまでは探索を始めない。
 *
 * ランダム・`animate` の速さで置くときは、盤へ滑らせる前にトレイでの今の
 * 向きから置く向きまで、最短の回転・裏返しで回して見せる（`playTurns()`。
 * TODO-065）。人は手に取って向きを合わせてから置くため。最速と深さ優先は
 * 回さない。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, DEMO, DEMO_LAYOUTS, FONT, PALETTES,
  PALETTE_REGISTRY_KEY, TEXT_COLORS,
} from '../config.js';
import {
  createBoard, orientationSteps, solveSteps, solveStepsRandom,
} from '../logic.js';
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
  random: { solve: solveStepsRandom, icon: ICONS.random, tooltip: '探し方: ランダム' },
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
    // 'solved'（解を見つけて止まっている）
    this.state = 'loading';
    this.steps = null;
    this.solutions = null;
    this.strategy = 'random';
    // 直前に置いた手が解につながるか。null は表示を空にする（解けたとき）。
    this.hintState = 'ok';
    this.speed = DEMO.defaultSpeed;
    this.tried = 0;
    this.solvedCount = 0;
    this.waited = 0;
    // 次の 1 手までの待ち時間に掛ける倍率。ランダムのときだけ 1 以外になる（TODO-059）。
    this.waitScale = 1;
    // 1 手先読みした generator の結果（TODO-060）。外す手が連なるときだけ
    // 待たせないため、置いた／外した直後に先読みして持っておく。
    this.peeked = null;
    // ランダムで置く前に向きを回して見せている間の予約（TODO-065）。
    // `turning` は今仕上げるべき手（`{ piece, value, animate }`）、`turnTimer` は
    // 次の段まで待つ delayedCall。速さ・探し方の切り替え、次の解へ、で
    // 押されたときに `cancelTurn()` から使う。
    this.turning = null;
    this.turnTimer = null;

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
    // 回している間（`this.turning`）は `playTurns()` の delayedCall が段を
    // 進めるので、ここでは待ちを数えない（TODO-065）。数えたままだと、回す時間
    // （1〜3 段）が前の手の待ち時間を超えたときに、回し終わる前に次の
    // `advance()` が走ってしまう（レビューの要修正 1）。回し終えて
    // `finishStep()` してから数え始めれば、回した時間は自然に次の待ちへ足される。
    if (this.turning) return;
    this.waited += delta;
    if (this.state !== 'running') {
      // 解のあとは空の盤から探し直す（TODO-054）。
      if (this.waited >= DEMO.pauseMs) this.startSearch();
      return;
    }
    // 追いつくために何手もまとめて進めない。1 手ずつ見せるのが目的なので。
    if (this.waited < DEMO.speeds[this.speed].intervalMs * this.waitScale) return;
    this.waited = 0;
    this.advance();
  }

  /**
   * 次の 1 手までの待ち時間の倍率を、1 手ごとに 1 回だけ引く（TODO-059）。
   * `update()` で毎フレーム引き直すと、早く下回った値で進んでしまい平均が縮む。
   * 間隔そのものでなく倍率で持つのは、途中で速さを変えてもすぐ効くようにするため。
   * ランダムのときだけ揺らして機械的な等間隔を崩す。深さ優先は一定
   * （もともと機械的な動きでよいものなので）。最速（`intervalMs: 0`）は
   * 何を掛けても 0 なので、毎フレーム進む今の動きのまま。
   * 外す手が連なるとき（今の手も次に先読みした手も `remove`）は、
   * `advance()` がこれを呼ばずに 0 にする。連なりを待たずに続けて動かすため
   * （TODO-060）。`place → remove` はここで引いた値で待つ（置いた手を画面に出すため）。
   */
  pickWaitScale(moveType) {
    if (this.strategy !== 'random') return 1;
    const jitter = 1 + (Math.random() * 2 - 1) * DEMO.randomJitter;
    return moveType === 'remove' ? DEMO.randomRemoveMultiplier * jitter : jitter;
  }

  /**
   * generator を 1 手進め、動いたピースを今の位置へ移す。解を見つけたら
   * そこで止める。generator が尽きたら黙って空の盤から探し直す（どちらの
   * 探し方もデモでは解のたびに作り直すので、尽きるところまで来ない。万一の備え）。
   * 先読み（`this.peeked`）があればそれを使い、無ければここで 1 手引く
   * （初回や `startSearch()` 直後）。
   *
   * ランダムで `animate` の place は、盤へ滑らせる前にトレイでの今の向きから
   * 置く向きまで回して見せる（`playTurns()`。TODO-065）。回すものが無ければ
   * （同じ向き、深さ優先、remove、最速）今までどおりその場で仕上げる。
   */
  advance() {
    const { value, done } = this.peeked ?? this.steps.next();
    this.peeked = null;
    if (done) {
      this.startSearch();
      return;
    }
    if (value.type === 'solved') {
      this.onSolved();
      return;
    }
    const { animate } = DEMO.speeds[this.speed];
    const piece = this.pieceByName.get(value.name);
    if (value.type === 'place' && animate && this.strategy === 'random') {
      const steps = orientationSteps(piece.cells, value.cells);
      if (steps.length > 0) {
        this.playTurns(piece, steps, 0, value, animate);
        return;
      }
    }
    this.finishStep(value, animate, piece);
  }

  /**
   * 向きを 1 段ずつ変えて見せる（TODO-065）。トレイの位置のまま
   * `refreshPiece()` で描き直し、回転か裏返しかで音を分ける。最後の段まで
   * 進んだら `finishStep()` で今までどおり盤へ滑らせる。
   */
  playTurns(piece, steps, index, value, animate) {
    const step = steps[index];
    piece.cells = step.cells;
    this.refreshPiece(piece);
    if (step.kind === 'rotate') audio.rotate();
    else audio.flip();
    this.turning = { piece, value, animate };
    this.turnTimer = this.time.delayedCall(DEMO.randomTurnStepMs, () => {
      this.turnTimer = null;
      if (index + 1 < steps.length) {
        this.playTurns(piece, steps, index + 1, value, animate);
      } else {
        this.turning = null;
        this.finishStep(value, animate, piece);
      }
    });
  }

  /**
   * 予約が残っているなら、その場で仕上げてから止める（TODO-065）。速さ・
   * 探し方の切り替え、次の解へ、で押されたときに呼ぶ。タイトルへ戻る
   * （シーンの切り替え）は `scene.time` ごと止まるので、ここを通らなくてよい。
   * 残りの段を飛ばして最終の向きへ直接進める（宙ぶらりんのまま止めない）。
   */
  cancelTurn() {
    if (!this.turnTimer) return;
    this.turnTimer.remove(false);
    this.turnTimer = null;
    const { piece, value, animate } = this.turning;
    this.turning = null;
    piece.cells = value.cells;
    this.finishStep(value, animate, piece);
  }

  /** 手を仕上げる。滑らせて音を鳴らすのは `animate` の速さだけ。 */
  finishStep(value, animate, piece) {
    if (value.type === 'place') {
      this.tried += 1;
      piece.cells = value.cells;
      piece.location = 'board';
      piece.row = value.row;
      piece.col = value.col;
      if (animate) audio.drop();
      const hintState = value.ok ? 'ok' : 'dead';
      // 本編と同じく、解なしに変わった瞬間に鳴らす（本編でヒント表示を入に
      // して解なしの手を置いたときと同じ）。深さ優先は解なしの手をすぐ外して
      // 「解ける」に戻るので置くたびに鳴る。ランダムは解なしのまま置き続けるので、
      // 一度鳴ったら、戻って「解ける」に戻るまでは鳴らない（TODO-059）。
      if (animate && hintState === 'dead' && this.hintState !== 'dead') audio.invalid();
      this.hintState = hintState;
    } else {
      // 向きは最後に試したまま、自分のスロットへ戻す。
      piece.location = 'tray';
      if (animate) audio.lift();
      // ランダムは外した後の盤面の `canContinue` を運ぶ（TODO-059）。深さ優先の
      // `remove` には `ok` が無く、外した先は必ず「解ける」に潜った盤面なので 'ok'。
      this.hintState = value.ok === false ? 'dead' : 'ok';
    }
    this.refreshPiece(piece);
    this.settlePiece(piece, animate);
    // ボタンは状態が変わったときだけ（`onSolved()`・`startSearch()`）。毎手
    // 塗り直すと、値が同じでも Phaser が文字を描き直してしまうため。
    this.refreshStatus();
    // 次の手を先読みし、今の手も次の手も remove（外す手が連なる）ときだけ
    // 待たせない（TODO-060）。`place → remove` は今までどおり
    // `pickWaitScale('place')` の間隔で待つ（置いたピースが Tween で盤に
    // 届く前に `remove` 側の `killTweensOf()` に止められると、置いた手が
    // 画面にほぼ出ないため。`DEMO.speeds` の JSDoc の設計を保つ）。
    this.peeked = this.steps.next();
    const nextIsRemove = !this.peeked.done && this.peeked.value.type === 'remove';
    const skipWait = value.type === 'remove' && nextIsRemove;
    this.waitScale = skipWait ? 0 : this.pickWaitScale(value.type);
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
    // 回している途中の予約を残さない（TODO-065）。`startSearch()` を呼ばない
    // ここだけは明示して止める。
    this.cancelTurn();
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
    this.strategy = this.strategy === 'depth' ? 'random' : 'depth';
    const face = STRATEGIES[this.strategy];
    this.strategyButton.setIcon(face.icon).setTooltip(face.tooltip);
    // 見つけた解の数は探し方ごとに数え直す。
    this.solvedCount = 0;
    if (this.solutions) this.startSearch();
  }

  /**
   * 探し直すときは、盤のピースを滑らせずにトレイへ戻す。何枚も同時に滑らせると
   * 探索の 1 手と見分けがつかず、次の探索の最初の手とも重なるため。
   * 見つけた解の数は戻さない。解のたびに探し直すので、戻すと 0 か 1 にしかならない。
   * 回している途中の予約も、ここで仕上げてから止める（`toggleStrategy()`・
   * `searchNext()` の両方がここを通るため。TODO-065）。
   */
  startSearch() {
    this.cancelTurn();
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
    this.hintState = 'ok';
    this.waited = 0;
    this.waitScale = 1;
    // 前の generator の先読みを持ち越さない（探し方の切り替え・解のあとの
    // 探し直しでは新しい generator の最初の手から読むため。TODO-060）。
    this.peeked = null;
    this.messageText.setText('');
    this.refreshHud();
  }

  searchNext() {
    if (this.state !== 'solved') return;
    audio.button();
    this.startSearch();
  }

  // ---- 本編から外すもの -----------------------------------------------

  /** デモのピースは押しても何も起きない。 */
  onPiecePointerDown() {}

  /** トレイの向きの印は出さない（タップで向きを変えられないため）。 */
  drawTurnMark() {}
}
