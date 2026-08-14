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
import { createButton, createPanel } from '../ui.js';

const HOW_TO_PLAY = [
  '8×8 の中央 2×2 は穴。残る 60 マスへ 12 種のピースをすべて置く。',
  '',
  'ドラッグ … 置く / 動かす / 盤から外す',
  'タップ … 右へ 90° 回転',
  '長押し … 裏返す',
];

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.text(LAYOUT.width / 2, 116, 'PENTOMINO', {
      fontFamily: FONT.family,
      fontSize: `${FONT.title}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0.5);
    this.add.text(LAYOUT.width / 2, 164, 'PUZZLE', {
      fontFamily: FONT.family,
      fontSize: `${FONT.heading}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createPanel(this, LAYOUT.width / 2 - 310, 216, 620, 176);
    this.add.text(LAYOUT.width / 2, 304, HOW_TO_PLAY.join('\n'), {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.dim,
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    const best = loadBest();
    this.add.text(LAYOUT.width / 2, 424, best === null ? '記録なし' : `最短 ${formatTime(best)}`, {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: best === null ? TEXT_COLORS.dim : TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createButton(this, {
      x: LAYOUT.width / 2,
      y: 500,
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

    this.add.text(LAYOUT.width / 2, 592, 'Space / Enter でも始められる', {
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
