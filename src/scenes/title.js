/**
 * タイトル。遊び方の要点と、これまでの最短時間を出す。
 *
 * `audio.unlock()` はここのボタンで呼ぶ。ブラウザは操作をきっかけにしないと
 * 音を鳴らさないので、最初に必ず通る場所で済ませておく。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, PALETTES, PALETTE_REGISTRY_KEY,
  SCREEN, TEXT_COLORS,
} from '../config.js';
import { formatTime } from '../logic.js';
import { loadBest, loadProgress, savePalette } from '../storage.js';
import * as audio from '../audio.js';
import {
  createButton, createChoiceRow, createPanel, createTooltip, createVersionText, stackTops,
} from '../ui.js';
import { boardIcon, paletteIcon } from '../icons.js';

/**
 * 上から順に積む部品。`height` は部品の高さ、`gap` は次の部品までの間隔で、
 * どちらも横画面での見え方を写した値（TODO-011）。縦画面では画面が高くなる
 * ぶんだけ、この塊ごと下へずれる。
 *
 * 横画面（高さ 640）に収めるため間隔を詰めてあり、**合わせて 632 で下端に
 * 8 ほどしか余らない**（TODO-008・TODO-026・TODO-076）。
 * ここへ行を足すときは、まず間隔から削ること。
 */
const STACK = [
  { key: 'title', height: 68, gap: 6 },
  { key: 'subtitle', height: 36, gap: 14 },
  { key: 'howTo', height: 186, gap: 8 },
  { key: 'size', height: 48, gap: 6 },
  { key: 'palette', height: 48, gap: 10 },
  { key: 'best', height: 30, gap: 12 },
  { key: 'start', height: 64, gap: 6 },
  { key: 'keyHint', height: 24, gap: 10 },
  { key: 'records', height: 56, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。縦画面は余りが 3 倍以上に増え、横画面と同じ 0.7 だと
 * 下だけが大きく空く。中身が少ない画面なので、縦では中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.7;

/**
 * `はじめる` と `つづきから` の 1 個ぶん（TODO-030）。2 個を横に並べても
 * 縦画面（内部解像度 640）の左右の余白に収まる大きさにしてある。
 */
const START = { width: 224, height: 64, gap: 20 };

/**
 * `記録` と `デモ`（TODO-040）の 1 個ぶん。行を足すと横画面の縦が足りない
 * （`STACK` の説明）ので、`はじめる` の行と同じく 2 個を横に並べる。
 */
const SUB = { width: 160, height: 56, gap: 20 };

/**
 * 遊び方。1 行目は盤で変わるので、盤の `label` と `note` から組み立てる。
 *
 * 1 文目を 2 行に割るのは、文字を大きくした（TODO-026）ため枠に収まらず、
 * `wordWrap` に任せると盤によって折り返す場所が変わるため（8×8 と 6×10 で
 * 但し書きの長さが違う）。切れ目を決め打ちにして、どちらの盤でも同じ形に出す。
 */
function howToPlay(board) {
  return [
    `${board.label}（${board.note}）の 60 マスへ、`,
    '12 種のピースをすべて置く。',
    '',
    'ドラッグ … 置く / 動かす',
    'タップ … 次の向きへ（回転と裏返しを順に巡る）',
    '盤から外す … 盤の外で離す / トレイの方へ振る',
  ].join('\n');
}

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
    const panelWidth = Math.min(720, SCREEN.width - SCREEN.margin * 2);

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

    createPanel(this, cx - panelWidth / 2, topOf('howTo'),
                panelWidth, STACK[indexOf('howTo')].height);
    this.howToText = this.add.text(cx, centerOf('howTo'), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
      align: 'center',
      lineSpacing: 4,
      // 枠を詰めた縦画面では 1 行目が入りきらないので、枠の内側で折り返す。
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
                                        (choice) => this.selectBoard(choice.key));
    this.paletteButtons = createChoiceRow(this, cx, centerOf('palette'), '色', paletteChoices,
                                          (choice) => this.selectPalette(choice.key));

    this.bestText = this.add.text(cx, centerOf('best'), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
    }).setOrigin(0.5);

    // `はじめる` と `つづきから` は同じ行に並べる（TODO-030）。行を足すと
    // 横画面（内部解像度 640）の縦が足りなくなる（`STACK` の説明）。
    const startStep = (START.width + START.gap) / 2;
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
      x: cx + startStep,
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

    // 盤・色・最短時間・`つづきから` を、選んでいる盤に合わせて出す。
    // ボタンを作ったあとに呼ぶ（`refreshBoard()` が `つづきから` を触るため）。
    this.refreshBoard();
    this.refreshPalette();

    this.add.text(cx, centerOf('keyHint'), 'Space / Enter でも始められる', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5);

    // 記録の一覧（TODO-008）。盤はあちらでも切り替えられるので、ここで
    // 選んでいる盤に関わらず 1 つのボタンから入れる。
    const subStep = (SUB.width + SUB.gap) / 2;
    createButton(this, {
      x: cx - subStep,
      y: centerOf('records'),
      width: SUB.width,
      height: SUB.height,
      label: '記録',
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Records');
      },
    });
    // デモ（TODO-040）。盤と色の組は本編と同じく registry から読む。
    createButton(this, {
      x: cx + subStep,
      y: centerOf('records'),
      width: SUB.width,
      height: SUB.height,
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

  /** 選んでいる色の組をボタンへ反映する。 */
  refreshPalette() {
    this.paletteButtons.forEach((button) => button.setSelected(button.choiceKey === this.paletteKey));
  }

  /** 選んでいる盤に合わせて、ボタン・遊び方・最短時間を出し直す。 */
  refreshBoard() {
    const board = BOARDS[this.boardKey];
    this.boardButtons.forEach((button) => button.setSelected(button.choiceKey === this.boardKey));
    this.howToText.setText(howToPlay(board));
    const best = loadBest(this.boardKey);
    this.bestText.setText(best === null ? '記録なし' : `最短 ${formatTime(best)}`);
    this.bestText.setColor(best === null ? TEXT_COLORS.dim : TEXT_COLORS.accent);
    // 遊びかけは盤ごとに分かれているので、盤を選び直すたびに見直す（TODO-030）。
    this.resumeButton.setEnabled(loadProgress(this.boardKey) !== null);
  }

  start() {
    audio.unlock();
    audio.button();
    // 引数を明示する。省くと Phaser は前回 `init()` へ渡した値（`つづきから` の
    // `resume`、記録画面の `progress`）を使い回し、まっさらに始まらない（TODO-073）。
    this.scene.start('Game', { resume: false });
  }
}
