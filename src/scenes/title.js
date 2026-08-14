/**
 * タイトル。遊び方の要点と、これまでの最短時間を出す。
 *
 * 音を出せる状態にする `audio.unlock()` はここのボタンで呼ぶ。
 * ブラウザは操作をきっかけにしないと音を鳴らさないので、
 * 最初に必ず通る場所で済ませておく。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, SCREEN, TEXT_COLORS, VERSION,
} from '../config.js';
import { formatTime } from '../logic.js';
import { loadBest } from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createPanel, stackTops } from '../ui.js';

/**
 * 上から順に積む部品。`height` は部品の高さ、`gap` は次の部品までの間隔で、
 * どちらも横画面での今までの見え方をそのまま写した値（TODO-011）。
 * 縦画面では画面が高くなるぶんだけ、この塊ごと下へずれる。
 */
const STACK = [
  { key: 'title', height: 52, gap: 8 },
  { key: 'subtitle', height: 28, gap: 38 },
  { key: 'howTo', height: 176, gap: 18 },
  { key: 'size', height: 40, gap: 18 },
  { key: 'best', height: 24, gap: 30 },
  { key: 'start', height: 56, gap: 40 },
  { key: 'keyHint', height: 18, gap: 0 },
];

/** 盤を選ぶボタン 1 個の大きさと、間隔。 */
const SIZE_BUTTON = { width: 120, height: 40, gap: 16 };

/**
 * 余りのうち上へ回す割合。横画面の 0.7 は今までどおりの位置になる値で、
 * 縦画面は余りが 3 倍以上に増えるため、同じ割合だと下だけが大きく空く。
 * 中身が少ない画面なので、縦では素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.7;

/** 遊び方。1 行目は盤で変わるので、盤の `label` と `note` から組み立てる。 */
function howToPlay(board) {
  return [
    `${board.label}（${board.note}）の 60 マスへ、12 種のピースをすべて置く。`,
    '',
    'ドラッグ … 置く / 動かす / 盤から外す',
    'タップ … 右へ 90° 回転',
    'ダブルタップ … 裏返す',
  ].join('\n');
}

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);

    const cx = SCREEN.width / 2;
    const tops = stackTops(STACK, SCREEN.height, STACK_BIAS);
    const indexOf = (key) => STACK.findIndex((row) => row.key === key);
    const topOf = (key) => tops[indexOf(key)];
    const centerOf = (key) => topOf(key) + STACK[indexOf(key)].height / 2;
    // 遊び方の枠は縦画面では画面幅に収まらないので、はみ出す前に詰める。
    const panelWidth = Math.min(620, SCREEN.width - SCREEN.margin * 2);

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
      lineSpacing: 6,
      // 枠を詰めた縦画面では 1 行目が入りきらないので、枠の内側で折り返す。
      wordWrap: { width: panelWidth - 32 },
    }).setOrigin(0.5);

    // 盤を選ぶボタン。選べるのはここだけで、遊んでいる最中は変えられない
    // （途中の盤面を捨てる確認を出さずに済ませるため。TODO-009）。
    const boards = Object.values(BOARDS);
    const total = boards.length * SIZE_BUTTON.width
      + (boards.length - 1) * SIZE_BUTTON.gap;
    this.boardButtons = boards.map((board, index) => {
      const button = createButton(this, {
        x: cx - total / 2 + SIZE_BUTTON.width / 2
          + index * (SIZE_BUTTON.width + SIZE_BUTTON.gap),
        y: centerOf('size'),
        width: SIZE_BUTTON.width,
        height: SIZE_BUTTON.height,
        label: board.label,
        onClick: () => this.selectBoard(board.key),
      });
      button.boardKey = board.key;
      return button;
    });

    this.bestText = this.add.text(cx, centerOf('best'), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
    }).setOrigin(0.5);

    this.refreshBoard();

    createButton(this, {
      x: cx,
      y: centerOf('start'),
      width: 220,
      height: 56,
      label: 'はじめる',
      fontSize: FONT.hud,
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Game');
      },
    });

    this.add.text(cx, centerOf('keyHint'), 'Space / Enter でも始められる', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5);

    this.input.keyboard.on('keydown-SPACE', this.start, this);
    this.input.keyboard.on('keydown-ENTER', this.start, this);

    this.add.text(SCREEN.width - 12, SCREEN.height - 12, VERSION, {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(1, 1).setAlpha(0.6);
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

  /** 選んでいる盤に合わせて、ボタン・遊び方・最短時間を出し直す。 */
  refreshBoard() {
    const board = BOARDS[this.boardKey];
    this.boardButtons.forEach((button) => button.setSelected(button.boardKey === this.boardKey));
    this.howToText.setText(howToPlay(board));
    const best = loadBest(this.boardKey);
    this.bestText.setText(best === null ? '記録なし' : `最短 ${formatTime(best)}`);
    this.bestText.setColor(best === null ? TEXT_COLORS.dim : TEXT_COLORS.accent);
  }

  start() {
    audio.unlock();
    audio.button();
    this.scene.start('Game');
  }
}
