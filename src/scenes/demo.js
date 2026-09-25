/**
 * デモ（TODO-040）。コンピューターがピースを置いたり外したりしながら
 * 解に至る様子を、本編と同じ盤とトレイで見せる。探し方はランダム
 * （既定。TODO-075）と深さ優先から HUD で選ぶ（TODO-050・TODO-057）。
 *
 * 盤・トレイ・ピースの描画を使い回すため `GameScene` を継承する。
 * `create()` は描画に要るものだけを組み、入力・ヒント・おまかせ・
 * 遊びかけの保存・クリアの判定は持たない。**`storage.js` は呼ばない**
 * （記録・遊びかけ・見つけた解に何も残さないため）。本編の `create()` を
 * 通らないので、遊びかけを控える shutdown の処理も登録されない。
 *
 * 探索は `logic.js` の `solveSteps()`（深さ優先）か `solveStepsRandom()`
 * （ランダム）の generator で、`update()` が速さに応じた間隔で 1 手ずつ進める
 * （ランダムは手ごとに間隔を揺らす。`pickWaitScale()`。TODO-059）。
 * 1 フレームに 1 手までなので画面は止まらない。
 * 置いたら全解のデータで「解ける／解なし」を調べる。深さ優先は解なしならすぐ
 * 外す。ランダムは置ける場所が無くなるまで置き続け、そこから「解ける」に
 * 戻るまで外す（TODO-059。人が行き詰まってから考え直す動きに近づける）。
 * ただし、5 の倍数でない大きさの閉じた空きができたときなど、置いた瞬間に
 * 詰みと分かるときはその場で外す（`solveStepsRandom()`。TODO-060・066〜068・077）。
 * 外す手が連なるときは、待たずに 1 フレームずつ続けて外す（`advance()` の
 * 先読み。TODO-060）。
 * 解を見つけたら `DEMO.pauseMs` だけ止まって次へ進み、タイトルへ戻るまで
 * 続ける（TODO-052）。次の解は空の盤から探し直し、置いては外す様子を毎回
 * はじめから見せる（TODO-054）。
 * ヒント表示を入にして解く人と同じ動きで、HUD にも本編のヒント表示と同じ
 * 文字を出す（TODO-043）。解につながる手だけを選ばないのは、試行錯誤に
 * 見えなくなるため。全解のデータが届くまでは探索を始めない。
 *
 * ランダム・`animate` の速さで置くときは、盤へ滑らせる前に、トレイでの今の
 * 向きから置く向きまで最短の回転・裏返しで回して見せる（`playTurns()`。
 * TODO-065）。人は向きを合わせてから置くため。最速と深さ優先は回さない。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, DEMO, DEMO_LAYOUTS, FONT, PALETTES,
  PALETTE_REGISTRY_KEY, TEXT_COLORS,
} from '../config.js';
import {
  createBoard, orientationSteps, parseDemoParams, solveSteps, solveStepsRandom,
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
    // 盤と色の組はタイトルで選んだもの（本編と同じ読み方）。URL で開いたときは
    // 盤と探し方を URL から取る（TODO-083）。registry には書かない（タイトルの
    // 選択を変えないため）。`scene.start()` のデータで渡さないのは、Phaser が
    // データ無しの `start()` では前回のデータを持ち越すため。
    const fromUrl = parseDemoParams(window.location.search);
    this.boardKey = fromUrl?.board ?? this.registry.get(BOARD_REGISTRY_KEY);
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
    this.strategy = fromUrl?.strategy ?? 'random';
    // 直前に置いた手が解につながるか。null は表示を空にする（解けたとき）。
    this.hintState = 'ok';
    this.speed = DEMO.defaultSpeed;
    this.tried = 0;
    this.solvedCount = 0;
    this.waited = 0;
    // 次の 1 手までの待ち時間に掛ける倍率。ランダムのときだけ 1 以外になる（TODO-059）。
    this.waitScale = 1;
    // 1 手先読みした generator の結果（TODO-060）。外す手が連なるときに
    // 待たせないため、手を仕上げた直後に読んでおく。
    this.peeked = null;
    // 置く前に向きを回して見せている間の予約（TODO-065）。`turning` は
    // 仕上げる手（`{ piece, value, animate }`）、`turnTimer` は次の段までの
    // delayedCall。`cancelTurn()` が使う。
    this.turning = null;
    this.turnTimer = null;

    this.drawBoard();
    this.drawTray();
    this.createPieces();
    this.pieceByName = new Map(this.pieces.map((piece) => [piece.name, piece]));
    // 指のカーソルを出さない。`createPieces()` がマスごとに付けている。
    for (const piece of this.pieces) piece.tiles.forEach((tile) => tile.disableInteractive());
    this.createHud();
    this.createMessage();
    createVersionText(this);
    this.refreshHud();
    // URL で直接開くとタイトルのボタンを通らないので、ここで音を使えるようにする
    // （TODO-083）。タイトルのボタンと同じ `pointerup`（タッチでは `touchstart` が
    // 操作として扱われないブラウザがあるため）。
    this.input.once('pointerup', () => audio.unlock());

    // シーンを離れたあとに届くことがある。Phaser はシーンを使い回すので、
    // 入り直したあとに前回の分が遅れて届くこともある。探索を始めたあとや
    // 別の盤の表なら捨てる（盤のピースと食い違うため）。
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
    // 進めるので、待ちを数えない（TODO-065）。数えると、回す時間（1〜3 段）が
    // 待ち時間を超えたときに、回し終わる前に次の `advance()` が走る。
    // `finishStep()` のあとから数えれば、回した時間は次の待ちに足される。
    if (this.turning) return;
    this.waited += delta;
    if (this.state !== 'running') {
      // 解のあとは空の盤から探し直す（TODO-054）。
      if (this.waited >= DEMO.pauseMs) this.startSearch();
      return;
    }
    // 遅れても何手もまとめて進めない。1 手ずつ見せるのが目的なので。
    if (this.waited < DEMO.speeds[this.speed].intervalMs * this.waitScale) return;
    this.waited = 0;
    this.advance();
  }

  /**
   * 次の 1 手までの待ち時間の倍率を、1 手ごとに 1 回だけ引く（TODO-059）。
   * `update()` で毎フレーム引き直すと、小さい値が出た時点で進んで平均が縮む。
   * 間隔でなく倍率で持つのは、途中で速さを変えてもすぐ効かせるため。
   * 揺らすのはランダムだけで、機械的な等間隔を崩すため。深さ優先は機械的で
   * よいので一定。最速（`intervalMs: 0`）は何を掛けても 0 で、毎フレーム進む。
   * 外す手が連なるとき（今の手も先読みした手も `remove`）は、これを呼ばずに
   * 0 にして続けて動かす（TODO-060）。`place → remove` はここで引いた値で待つ
   * （置いた手を画面に出すため）。
   */
  pickWaitScale(moveType) {
    if (this.strategy !== 'random') return 1;
    const jitter = 1 + (Math.random() * 2 - 1) * DEMO.randomJitter;
    return moveType === 'remove' ? DEMO.randomRemoveMultiplier * jitter : jitter;
  }

  /**
   * generator が尽きたら黙って空の盤から探し直す（解のたびに作り直すので
   * 尽きることはない。万一の備え）。先読み（`this.peeked`）が無ければ
   * ここで 1 手引く（初回や `startSearch()` 直後）。
   *
   * ランダムで `animate` の place は、盤へ滑らせる前に置く向きまで回して
   * 見せる（`playTurns()`。TODO-065）。回すものが無ければ（同じ向き、
   * 深さ優先、remove、最速）その場で仕上げる。
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
   * 向きを 1 段ずつ変えて見せる（TODO-065）。トレイの位置のまま描き直し、
   * 回転か裏返しかで音を分ける。最後の段まで進んだら `finishStep()` で
   * 盤へ滑らせる。
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
   * 回している途中なら、残りの段を飛ばして最後の向きで仕上げる
   * （宙ぶらりんのまま止めない。TODO-065）。速さ・探し方の切り替えと
   * 次の解へで呼ぶ。タイトルへ戻るときは `scene.time` ごと止まるので要らない。
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
      // 本編と同じく、解なしに変わった瞬間に鳴らす。深さ優先は解なしの手を
      // すぐ外すので置くたびに鳴る。ランダムは解なしのまま置き続けるので、
      // 「解ける」に戻るまでは 2 度目を鳴らさない（TODO-059）。
      if (animate && hintState === 'dead' && this.hintState !== 'dead') audio.invalid();
      this.hintState = hintState;
    } else {
      // 向きは最後に試したまま、自分のスロットへ戻す。
      piece.location = 'tray';
      if (animate) audio.lift();
      // ランダムの `ok` は外した後の盤面の `canContinue`（TODO-059）。深さ優先の
      // `remove` には `ok` が無く、外した先は必ず「解ける」盤面なので 'ok'。
      this.hintState = value.ok === false ? 'dead' : 'ok';
    }
    this.refreshPiece(piece);
    this.settlePiece(piece, animate);
    // ボタンは状態が変わったときだけ塗り直す（`onSolved()`・`startSearch()`）。
    // 毎手塗ると、値が同じでも Phaser が文字を描き直すため。
    this.refreshStatus();
    // 今の手も先読みした次の手も remove のときだけ待たせない（TODO-060）。
    // `place → remove` は `pickWaitScale('place')` の間隔で待つ（置いたピースが
    // 盤に届く前に `remove` 側の `killTweensOf()` で止められると、置いた手が
    // 画面にほぼ出ないため。`DEMO.speeds` の JSDoc を参照）。
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
    // 止まっている間は出したままにしたいので、時間で消える `showMessage()` は使わない。
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
    // 本編のヒント表示と同じ札（TODO-045）。本編の位置（`statusX`）では
    // 試した手と重なるので、1 段目の右端に寄せる。
    this.hintBadge = createHintBadge(
      this, hud.x + hud.width - hud.padding, hud.y + hud.rowHeight / 2, 1,
    ).setDepth(DEPTH.hud);

    const speedTips = { slow: 'ゆっくり', fast: '速い', fastest: '最速' };
    this.buttons = this.createHudButtons([
      // 本編と同じく一番左（TODO-076）。失うものが無いので確認を出さずに戻る。
      { icon: ICONS.title, tooltip: 'タイトルへ', onClick: () => this.goToTitle() },
      ...SPEEDS.map((speed) => ({
        icon: ICONS[speed], tooltip: speedTips[speed], onClick: () => this.selectSpeed(speed),
      })),
      { icon: ICONS.next, tooltip: '次の解を探す', onClick: () => this.searchNext() },
      { ...STRATEGIES[this.strategy], onClick: () => this.toggleStrategy() },
      { ...this.muteFace(audio.isMuted()), onClick: () => this.toggleMute() },
    ]);
    this.speedButtons = this.buttons.slice(1, 1 + SPEEDS.length);
    this.nextButton = this.buttons[4];
    this.strategyButton = this.buttons[5];
    this.muteButton = this.buttons[6];
  }

  refreshHud() {
    this.refreshStatus();
    this.speedButtons.forEach((button, index) => button.setSelected(SPEEDS[index] === this.speed));
    this.nextButton.setEnabled(this.state === 'solved');
  }

  /** 1 段目の文字だけ。1 手ごとに呼ぶ。 */
  refreshStatus() {
    this.statusText.setText(
      `試した手 ${this.tried.toLocaleString('en-US')}　見つけた解 ${this.solvedCount}`,
    );
    this.hintBadge.setState(this.hintState);
  }

  // ---- ボタンの働き ---------------------------------------------------

  selectSpeed(speed) {
    audio.button();
    // 回している途中の予約を残さない（TODO-065）。`startSearch()` を通らないので、ここで止める。
    this.cancelTurn();
    this.speed = speed;
    // 止まっている間は待ち時間を数え直さない（速さを変えるたびに延びるため）。
    if (this.state === 'running') this.waited = 0;
    this.refreshHud();
  }

  /**
   * 探し方を切り替えて空の盤から探し直す。途中から続けないのは、2 つの探し方で
   * 盤面の辿り方が違い、今の盤面を引き継げないため。全解のデータを待っている間は
   * 探し方だけ変え、届いたときに `startSearch()` が使う。
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
   * 盤のピースは滑らせずにトレイへ戻す。何枚も同時に滑らせると探索の 1 手と
   * 見分けがつかず、次の探索の最初の手とも重なるため。
   * 見つけた解の数は戻さない。解のたびに探し直すので、戻すと 0 か 1 にしかならない。
   * 回している途中の予約もここで仕上げる（`toggleStrategy()`・`searchNext()` の
   * 両方が通るため。TODO-065）。
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
    // 前の generator の先読みを持ち越さない（TODO-060）。
    this.peeked = null;
    this.messageText.setText('');
    this.refreshHud();
  }

  searchNext() {
    if (this.state !== 'solved') return;
    audio.button();
    this.startSearch();
  }

  /** URL で開いたときは、読み直してもタイトルが開くようにパラメータを消す（TODO-083）。 */
  goToTitle() {
    const url = new URL(window.location.href);
    url.searchParams.delete('demo');
    url.searchParams.delete('board');
    window.history.replaceState(null, '', url);
    super.goToTitle();
  }

  // ---- 本編から外すもの -----------------------------------------------

  /** デモのピースは押しても何も起きない。 */
  onPiecePointerDown() {}

  /** トレイの向きの印は出さない（タップで向きを変えられないため）。 */
  drawTurnMark() {}
}
