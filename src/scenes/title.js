/**
 * タイトル。遊び方の要点と、これまでの最短時間を出す。
 *
 * 音を出せる状態にする `audio.unlock()` はここのボタンで呼ぶ。
 * ブラウザは操作をきっかけにしないと音を鳴らさないので、
 * 最初に必ず通る場所で済ませておく。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, PALETTES, PALETTE_REGISTRY_KEY,
  SCREEN, TEXT_COLORS, VERSION,
} from '../config.js';
import { formatTime } from '../logic.js';
import { loadBest, savePalette } from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createChoiceRow, createPanel, stackTops } from '../ui.js';

/**
 * 上から順に積む部品。`height` は部品の高さ、`gap` は次の部品までの間隔で、
 * どちらも横画面での見え方を写した値（TODO-011）。縦画面では画面が高くなる
 * ぶんだけ、この塊ごと下へずれる。
 *
 * 記録の画面へ行く行（`records`）を足したぶん（TODO-008）、横画面では
 * 640 に収まらなくなるので、間隔を詰めてある。TODO-026 で文字を大きくして
 * さらに苦しくなったので、**合わせて 628 で下端に 12 ほどしか余らない**。
 * ここへ行を足すときは、まず間隔から削ること。
 */
const STACK = [
  { key: 'title', height: 68, gap: 6 },
  { key: 'subtitle', height: 36, gap: 24 },
  { key: 'howTo', height: 186, gap: 8 },
  { key: 'size', height: 48, gap: 6 },
  { key: 'palette', height: 48, gap: 10 },
  { key: 'best', height: 30, gap: 12 },
  { key: 'start', height: 58, gap: 6 },
  { key: 'keyHint', height: 24, gap: 10 },
  { key: 'records', height: 48, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。横画面の 0.7 は今までどおりの位置になる値で、
 * 縦画面は余りが 3 倍以上に増えるため、同じ割合だと下だけが大きく空く。
 * 中身が少ない画面なので、縦では素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.7;

/**
 * 遊び方。1 行目は盤で変わるので、盤の `label` と `note` から組み立てる。
 *
 * 1 文目を 2 行に割ってあるのは、TODO-026 で文字を大きくすると枠に収まらず、
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

    // 盤と色の組を選ぶ 2 行。どちらも選べるのはここだけで、遊んでいる最中は
    // 変えられない（途中の盤面を捨てる確認を出さずに済ませるため。TODO-009）。
    // 盤と色の 2 行を同じ形にしてあるのは、どちらも「今どれが選ばれているか」を
    // 同じ見え方で示すため（TODO-015）。
    this.boardButtons = createChoiceRow(this, cx, centerOf('size'), '盤',
                                        Object.values(BOARDS),
                                        (choice) => this.selectBoard(choice.key));
    this.paletteButtons = createChoiceRow(this, cx, centerOf('palette'), '色',
                                          Object.values(PALETTES),
                                          (choice) => this.selectPalette(choice.key));

    this.bestText = this.add.text(cx, centerOf('best'), '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
    }).setOrigin(0.5);

    this.refreshBoard();
    this.refreshPalette();

    createButton(this, {
      x: cx,
      y: centerOf('start'),
      width: 260,
      height: 58,
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

    // 記録の一覧（TODO-008）。盤はあちらでも切り替えられるので、ここで
    // 選んでいる盤に関わらず 1 つのボタンから入れる。
    createButton(this, {
      x: cx,
      y: centerOf('records'),
      width: 190,
      height: 48,
      label: '記録',
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Records');
      },
    });

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

  /** 選んでいる色の組をボタンへ反映する。見本はゲーム本編で見せる。 */
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
  }

  start() {
    audio.unlock();
    audio.button();
    this.scene.start('Game');
  }
}
