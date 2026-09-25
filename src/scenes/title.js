/**
 * タイトル。遊び方の要点と、これまでの最短時間を出す。
 *
 * 題字の下（横画面では遊び方の枠の左）で、デモと同じランダムな探索を小さな盤で
 * 動かす（TODO-087）。
 * 飾りなので押しても何も起きず、音も鳴らさない。見せる盤は選んでいる盤。
 *
 * `audio.unlock()` はここのボタンで呼ぶ。ブラウザは操作をきっかけにしないと
 * 音を鳴らさないので、最初に必ず通る場所で済ませておく。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, PALETTES, PALETTE_REGISTRY_KEY,
  SCREEN, TEXT_COLORS, TITLE_DEMO,
} from '../config.js';
import {
  createBoard, formatTime, place, remove, solveStepsRandom,
} from '../logic.js';
import { ensureSolutions, hasSolution } from '../solutions.js';
import { loadBest, loadProgress, savePalette } from '../storage.js';
import * as audio from '../audio.js';
import {
  CHOICE_ICON_HEIGHT, createButton, createChoiceRow, createPanel, createTooltip,
  createVersionText, drawMiniBoard, HOW_TO_OPERATE, stackTops,
} from '../ui.js';
import { boardIcon, paletteIcon } from '../icons.js';

/** 盤・色の行の高さ。ボタンの上下に 1 ずつ空ける（高くする前の 46 のボタンと 48 の行と同じ）。 */
const CHOICE_ROW = CHOICE_ICON_HEIGHT + 2;

/**
 * 上から順に積む部品。`height` は部品の高さ、`gap` は次の部品までの間隔。
 * 縦画面では画面が高くなるぶんだけ、この塊ごと下へずれる（TODO-011）。
 *
 * `はじめる`・`つづきから`・`記録` を 1 行にまとめ（`start`）、`デモ` は
 * ここに含めず画面の右下へ固定で置く（TODO-092）。
 *
 * 横画面（高さ 640）は、動く盤を遊び方の枠の左に並べ（`PREVIEW`）、
 * 盤・色のボタンを高くした（TODO-087）ぶん間隔を詰めてあり、**合わせて 572 で
 * 下端に 68 ほど余る**（TODO-008・TODO-026・TODO-076・TODO-092）。
 * ここへ行を足すときは、まず間隔から削ること。縦画面は余りが大きいので、
 * 動く盤を題字の下に 1 行として置き、間隔も広げてある。
 */
const STACK = SCREEN.portrait ? [
  { key: 'title', height: 68, gap: 6 },
  { key: 'subtitle', height: 36, gap: 16 },
  { key: 'preview', height: 240, gap: 16 },
  { key: 'howTo', height: 186, gap: 12 },
  { key: 'size', height: CHOICE_ROW, gap: 10 },
  { key: 'palette', height: CHOICE_ROW, gap: 14 },
  { key: 'best', height: 30, gap: 12 },
  { key: 'start', height: 64, gap: 8 },
  { key: 'keyHint', height: 24, gap: 0 },
] : [
  { key: 'title', height: 68, gap: 4 },
  { key: 'subtitle', height: 36, gap: 8 },
  { key: 'howTo', height: 186, gap: 6 },
  { key: 'size', height: CHOICE_ROW, gap: 6 },
  { key: 'palette', height: CHOICE_ROW, gap: 8 },
  { key: 'best', height: 30, gap: 6 },
  { key: 'start', height: 64, gap: 6 },
  { key: 'keyHint', height: 24, gap: 0 },
];

/**
 * 動く盤を描く場所（TODO-087）。縦画面は `STACK` の `preview` の行に幅
 * `width` で置く。横画面は縦が足りないので遊び方の枠の左に置き、枠の幅を
 * そのぶん詰める（高さは枠と同じ）。マスは盤ごとに、この中へ収まる大きさ
 * （`drawMiniBoard()`）。
 */
const PREVIEW = { width: SCREEN.portrait ? 400 : 200, gap: 16 };

/**
 * 余りのうち上へ回す割合。縦画面は余りが 3 倍以上に増え、横画面と同じ 0.7 だと
 * 下だけが大きく空く。中身が少ない画面なので、縦では中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.7;

/**
 * `はじめる`・`つづきから`・`記録` の 1 個ぶん（TODO-030・TODO-092）。
 * 3 個を横に並べても縦画面（内部解像度 640）の左右の余白に収まる大きさに
 * してある（一番長い「つづきから」の 5 文字が `FONT.hud` で収まる幅）。
 */
const START = { width: 190, height: 64, gap: 14 };

/**
 * `デモ` は右下に固定で置く（TODO-092）。他の操作ボタンより一段控えめな
 * 大きさにし、右下のバージョン表示（`createVersionText()`）の上に重ねずに置く。
 */
const DEMO_BUTTON = {
  width: 120, height: 44, marginRight: 14, marginBottom: 46,
};

/**
 * 遊び方。盤を選び直しても変わらない文言（TODO-092）。操作の 3 行は本編の
 * 下端と同じものを使う（TODO-094）。
 */
const HOW_TO_PLAY_TEXT = [
  '12 種のピースを盤にすき間なく敷き詰めるパズル。',
  '',
  ...HOW_TO_OPERATE,
].join('\n');

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.paletteKey = this.registry.get(PALETTE_REGISTRY_KEY);

    const cx = SCREEN.width / 2;
    const tops = stackTops(STACK, SCREEN.height, STACK_BIAS);
    const indexOf = (key) => STACK.findIndex((row) => row.key === key);
    const topOf = (key) => tops[indexOf(key)];
    const centerOf = (key) => topOf(key) + STACK[indexOf(key)].height / 2;
    // 遊び方の枠は縦画面では画面幅に収まらないので、はみ出す前に詰める。
    // 横画面は左に動く盤を並べるので、そのぶん詰めて 2 つを中央に寄せる。
    const panelWidth = SCREEN.portrait
      ? Math.min(720, SCREEN.width - SCREEN.margin * 2)
      : Math.min(720, SCREEN.width - SCREEN.margin * 2 - PREVIEW.width - PREVIEW.gap);
    const panelX = SCREEN.portrait
      ? cx - panelWidth / 2
      : cx + (PREVIEW.width + PREVIEW.gap - panelWidth) / 2;
    this.previewBox = SCREEN.portrait
      ? { x: cx - PREVIEW.width / 2, y: topOf('preview'), width: PREVIEW.width,
          height: STACK[indexOf('preview')].height }
      : { x: panelX - PREVIEW.gap - PREVIEW.width, y: topOf('howTo'), width: PREVIEW.width,
          height: STACK[indexOf('howTo')].height };
    this.previewGraphics = this.add.graphics();
    // シーンに入り直すと前回のタイマーは Phaser が捨てている。触らないよう空にする。
    this.previewTimer = null;

    this.add.text(cx, centerOf('title'), 'PENTOMINO', {
      fontFamily: FONT.family,
      fontSize: `${FONT.title}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0.5);
    this.add.text(cx, centerOf('subtitle'), 'PUZZLE', {
      fontFamily: FONT.family,
      fontSize: `${FONT.heading}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createPanel(this, panelX, topOf('howTo'), panelWidth, STACK[indexOf('howTo')].height);
    this.add.text(panelX + panelWidth / 2, centerOf('howTo'), HOW_TO_PLAY_TEXT, {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
      align: 'center',
      lineSpacing: 4,
      // 枠を詰めた縦画面では折り返すことがあるので、枠の内側で折り返す。
      wordWrap: { width: panelWidth - 32 },
    }).setOrigin(0.5);

    // 盤と色の組を選ぶ 2 行。選べるのはここだけで、遊んでいる最中は変えられない
    // （途中の盤面を捨てる確認を出さずに済ませるため。TODO-009）。2 行を同じ形に
    // して、どれを選んでいるかを同じ見え方で示す（TODO-015）。
    // 選択肢は文字でなく図で見せ、名前は説明に回す（TODO-046）。
    const boardChoices = Object.values(BOARDS).map((board) => ({
      ...board, icon: boardIcon(board), tooltip: `${board.label}（${board.note}）`,
    }));
    const paletteChoices = Object.values(PALETTES).map((palette) => ({
      ...palette, icon: paletteIcon(palette), tooltip: palette.label,
    }));
    this.boardButtons = createChoiceRow(this, cx, centerOf('size'), '盤', boardChoices,
                                        (choice) => this.selectBoard(choice.key),
                                        CHOICE_ICON_HEIGHT);
    this.paletteButtons = createChoiceRow(this, cx, centerOf('palette'), '色', paletteChoices,
                                          (choice) => this.selectPalette(choice.key),
                                          CHOICE_ICON_HEIGHT);

    this.bestText = this.add.text(cx, centerOf('best'), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
    }).setOrigin(0.5);

    // `はじめる`・`つづきから`・`記録` は同じ行に並べる（TODO-030・TODO-092）。
    const startStep = START.width + START.gap;
    createButton(this, {
      x: cx - startStep,
      y: centerOf('start'),
      width: START.width,
      height: START.height,
      label: 'はじめる',
      fontSize: FONT.hud,
      onClick: () => this.start(),
    });
    // 遊びかけが無い盤では押せなくする（記録の画面の `消す` と同じ見せ方）。
    // 隠さないのは、盤を選び直すとボタンが出たり消えたりして行が動くため。
    this.resumeButton = createButton(this, {
      x: cx,
      y: centerOf('start'),
      width: START.width,
      height: START.height,
      label: 'つづきから',
      fontSize: FONT.hud,
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Game', { resume: true });
      },
    });
    // 記録の一覧（TODO-008）。盤はあちらでも切り替えられるので、ここで
    // 選んでいる盤に関わらず 1 つのボタンから入れる。
    createButton(this, {
      x: cx + startStep,
      y: centerOf('start'),
      width: START.width,
      height: START.height,
      label: '記録',
      fontSize: FONT.hud,
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Records');
      },
    });

    // 盤・色・最短時間・`つづきから` を、選んでいる盤に合わせて出す。
    // ボタンを作ったあとに呼ぶ（`refreshBoard()` が `つづきから` を触るため）。
    this.refreshBoard();
    this.refreshPalette();

    this.add.text(cx, centerOf('keyHint'), 'Space / Enter でも始められる', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5);

    // デモ（TODO-040・TODO-092）。盤と色の組は本編と同じく registry から読む。
    // 右下に固定で置き、バージョン表示（`createVersionText()`）より上に置く。
    createButton(this, {
      x: SCREEN.width - DEMO_BUTTON.marginRight - DEMO_BUTTON.width / 2,
      y: SCREEN.height - DEMO_BUTTON.marginBottom - DEMO_BUTTON.height / 2,
      width: DEMO_BUTTON.width,
      height: DEMO_BUTTON.height,
      label: 'デモ',
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Demo');
      },
    });

    this.input.keyboard.on('keydown-SPACE', this.start, this);
    this.input.keyboard.on('keydown-ENTER', this.start, this);

    createVersionText(this);
    // 盤・色の説明。最後に作り、ほかの部品より手前に出す。
    this.tooltip = createTooltip(this);
  }

  /** 盤を選び直す。選んだ盤は `registry` に置き、他のシーンがそこから読む。 */
  selectBoard(key) {
    if (key === this.boardKey) return;
    audio.unlock();
    audio.button();
    this.boardKey = key;
    this.registry.set(BOARD_REGISTRY_KEY, key);
    this.refreshBoard();
  }

  /**
   * 色の組を選び直す（TODO-015）。盤と違って localStorage にも覚えさせる
   * （見た目の好みは、遊ぶたびに選び直すものではないため）。
   */
  selectPalette(key) {
    if (key === this.paletteKey) return;
    audio.unlock();
    audio.button();
    this.paletteKey = key;
    this.registry.set(PALETTE_REGISTRY_KEY, key);
    savePalette(key);
    this.refreshPalette();
  }

  /** 選んでいる色の組をボタンと動く盤へ反映する。 */
  refreshPalette() {
    this.paletteButtons.forEach((button) => button.setSelected(button.choiceKey === this.paletteKey));
    this.drawPreview();
  }

  /** 選んでいる盤に合わせて、ボタン・最短時間を出し直す（遊び方は盤で変わらない）。 */
  refreshBoard() {
    this.boardButtons.forEach((button) => button.setSelected(button.choiceKey === this.boardKey));
    const best = loadBest(this.boardKey);
    this.bestText.setText(best === null ? '記録なし' : `最短 ${formatTime(best)}`);
    this.bestText.setColor(best === null ? TEXT_COLORS.dim : TEXT_COLORS.accent);
    // 遊びかけは盤ごとに分かれているので、盤を選び直すたびに見直す（TODO-030）。
    this.resumeButton.setEnabled(loadProgress(this.boardKey) !== null);
    this.startPreview();
  }

  // ---- 動く盤（TODO-087） ---------------------------------------------

  /**
   * 選んでいる盤で、空の盤から探索を始め直す。探し方はデモのランダム
   * （`solveStepsRandom()`）で、全解のデータが届いてから動かす（デモと同じく
   * 「解ける／解なし」をデータで調べるため）。届くまでは空の盤を出しておく。
   *
   * データは盤を選び直したあとや、シーンを離れたあとに届くことがある。
   * 呼ぶたびに `previewToken` を作り直し、最後に頼んだ分だけを使う
   * （古い分で動かすと、盤の形と探索の盤面が食い違う）。
   */
  startPreview() {
    const token = {};
    this.previewToken = token;
    this.previewTimer?.remove(false);
    this.previewTimer = null;
    const spec = BOARDS[this.boardKey];
    this.previewBoard = createBoard(spec);
    this.drawPreview();
    ensureSolutions(this.registry, spec).then((solutions) => {
      if (!this.scene.isActive() || token !== this.previewToken) return;
      this.previewSteps = solveStepsRandom(
        spec, Math.random, (board) => hasSolution(solutions, board),
      );
      this.previewTimer = this.time.addEvent({
        delay: TITLE_DEMO.intervalMs, loop: true, callback: this.stepPreview, callbackScope: this,
      });
    });
  }

  /**
   * 1 手進める。盤面は generator の中にあるので、置いた・外したピースを
   * こちらの盤面（`previewBoard`）へ写して描き直す。解けたら少し止めて、
   * 空の盤から探し直す（デモと同じ。TODO-054）。
   */
  stepPreview() {
    const { value, done } = this.previewSteps.next();
    if (done || value.type === 'solved') {
      this.previewTimer.remove(false);
      this.previewTimer = this.time.delayedCall(TITLE_DEMO.pauseMs, () => this.startPreview());
      return;
    }
    this.previewBoard = value.type === 'place'
      ? place(this.previewBoard, value.name, value.cells, value.row, value.col)
      : remove(this.previewBoard, value.name);
    this.drawPreview();
  }

  drawPreview() {
    this.previewGraphics.clear();
    drawMiniBoard(this.previewGraphics, BOARDS[this.boardKey], this.previewBoard.grid,
                  PALETTES[this.paletteKey], this.previewBox);
  }

  start() {
    audio.unlock();
    audio.button();
    // 引数を明示する。省くと Phaser は前回 `init()` へ渡した値（`つづきから` の
    // `resume`、記録画面の `progress`）を使い回し、まっさらに始まらない（TODO-073）。
    this.scene.start('Game', { resume: false });
  }
}
