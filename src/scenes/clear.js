/**
 * クリア表示と記録の更新。
 *
 * 記録の更新はここでだけ行う。本編（`game.js`）は完成を検知して
 * 経過時間を渡すところまでを受け持ち、保存の成否には関わらない。
 */

import { COLORS, FONT, LAYOUT, TEXT_COLORS } from '../config.js';
import { formatTime } from '../logic.js';
import { saveBest } from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createPanel } from '../ui.js';

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('Clear');
  }

  init(data) {
    this.elapsed = data && typeof data.ms === 'number' ? data.ms : 0;
    this.usedHint = !!(data && data.usedHint);
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    const record = saveBest(this.elapsed);
    audio.fanfare();

    this.add.text(LAYOUT.width / 2, 150, 'COMPLETE', {
      fontFamily: FONT.family,
      fontSize: `${FONT.title}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createPanel(this, LAYOUT.width / 2 - 220, 220, 440, 170);

    this.add.text(LAYOUT.width / 2, 268, formatTime(this.elapsed), {
      fontFamily: FONT.family,
      fontSize: '46px',
      color: TEXT_COLORS.normal,
    }).setOrigin(0.5);

    const bestLine = record.updated ? '自己最短を更新' : `最短 ${formatTime(record.best)}`;
    this.add.text(LAYOUT.width / 2, 326, bestLine, {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: record.updated ? TEXT_COLORS.accent : TEXT_COLORS.dim,
    }).setOrigin(0.5);

    // ヒントを使ったかどうかは、記録の扱いを変えるほどではないが伝えておく。
    if (this.usedHint) {
      this.add.text(LAYOUT.width / 2, 360, 'ヒントを使った', {
        fontFamily: FONT.family,
        fontSize: `${FONT.small}px`,
        color: TEXT_COLORS.dim,
      }).setOrigin(0.5);
    }

    createButton(this, {
      x: LAYOUT.width / 2 - 120,
      y: 456,
      width: 200,
      height: 52,
      label: 'もう一度',
      fontSize: FONT.hud,
      onClick: () => {
        audio.button();
        this.scene.start('Game');
      },
    });
    createButton(this, {
      x: LAYOUT.width / 2 + 120,
      y: 456,
      width: 200,
      height: 52,
      label: 'タイトルへ',
      fontSize: FONT.hud,
      onClick: () => {
        audio.button();
        this.scene.start('Title');
      },
    });
  }
}
