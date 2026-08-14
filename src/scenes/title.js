/**
 * タイトル。遊び方の要点と、これまでの最短時間を出す。
 *
 * 音を出せる状態にする `audio.unlock()` はここのボタンで呼ぶ。
 * ブラウザは操作をきっかけにしないと音を鳴らさないので、
 * 最初に必ず通る場所で済ませておく。
 */

import { COLORS, FONT, LAYOUT, TEXT_COLORS, VERSION } from '../config.js';
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
  { key: 'howTo', height: 176, gap: 20 },
  { key: 'best', height: 24, gap: 36 },
  { key: 'start', height: 56, gap: 55 },
  { key: 'keyHint', height: 18, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。横画面の 0.7 は今までどおりの位置になる値で、
 * 縦画面は余りが 3 倍以上に増えるため、同じ割合だと下だけが大きく空く。
 * 中身が少ない画面なので、縦では素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = LAYOUT.portrait ? 0.5 : 0.7;

const HOW_TO_PLAY = [
  '8×8 の中央 2×2 は穴。残る 60 マスへ 12 種のピースをすべて置く。',
  '',
  'ドラッグ … 置く / 動かす / 盤から外す',
  'タップ … 右へ 90° 回転',
  'ダブルタップ … 裏返す',
];

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    const cx = LAYOUT.width / 2;
    const tops = stackTops(STACK, LAYOUT.height, STACK_BIAS);
    const indexOf = (key) => STACK.findIndex((row) => row.key === key);
    const topOf = (key) => tops[indexOf(key)];
    const centerOf = (key) => topOf(key) + STACK[indexOf(key)].height / 2;
    // 遊び方の枠は縦画面では画面幅に収まらないので、はみ出す前に詰める。
    const panelWidth = Math.min(620, LAYOUT.width - LAYOUT.margin * 2);

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
    this.add.text(cx, centerOf('howTo'), HOW_TO_PLAY.join('\n'), {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
      align: 'center',
      lineSpacing: 6,
      // 枠を詰めた縦画面では 1 行目が入りきらないので、枠の内側で折り返す。
      wordWrap: { width: panelWidth - 32 },
    }).setOrigin(0.5);

    const best = loadBest();
    this.add.text(cx, centerOf('best'), best === null ? '記録なし' : `最短 ${formatTime(best)}`, {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: best === null ? TEXT_COLORS.dim : TEXT_COLORS.accent,
    }).setOrigin(0.5);

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

    this.add.text(LAYOUT.width - 12, LAYOUT.height - 12, VERSION, {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(1, 1).setAlpha(0.6);
  }

  start() {
    audio.unlock();
    audio.button();
    this.scene.start('Game');
  }
}
