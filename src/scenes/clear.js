/**
 * クリア表示。本編（`game.js`）の上に重ねて出す（TODO-072）。
 *
 * 本編は止めたまま下に残る。「続ける」で本編へ戻り、完成した並びのまま
 * 遊び続けられる。記録の更新は本編が完成を見つけたときに済ませてある
 * （続けて作った解も記録するため。`GameScene.recordSolved()`）ので、
 * ここは渡された結果を出すだけ。
 */

import {
  BACKDROP, BOARDS, BOARD_REGISTRY_KEY, FONT, SCREEN, TEXT_COLORS,
} from '../config.js';
import { formatTime } from '../logic.js';
import { clearProgress, RECORD_STATUS, shouldRecordBest } from '../storage.js';
import * as audio from '../audio.js';
import {
  createButton, createPanel, stackTops,
} from '../ui.js';

/**
 * 上から順に積む部品。横画面での今までの見え方を写した値で、縦画面では
 * この塊ごと下へずれる（TODO-011）。枠の中の 3 行は枠の上端からの差で置く。
 */
const STACK = [
  { key: 'title', height: 68, gap: 36 },
  { key: 'panel', height: 262, gap: 34 },
  { key: 'buttons', height: 64, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。横画面の 0.44 は今までどおりの位置になる値で、
 * 縦画面は余りが増えるぶん下だけが空くので、素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.44;

/**
 * 枠の上端から見た、中の 5 行の中心。`number`（何番の解か。TODO-022）と
 * `status`（新しい解か記録済みか。TODO-072）を足したぶん枠を高くしてある
 * （`STACK` の `panel`）。TODO-026 で文字を大きくしたので、行の間もそのぶん広げてある。
 */
const PANEL_ROWS = {
  time: 56, number: 108, status: 146, best: 186, help: 226,
};

/** 経過時間だけは他より大きく出す（この画面の主役なので）。 */
const TIME_FONT = 58;

/**
 * 下端に並べるボタン。4 つ（TODO-032、TODO-072 で「続ける」を足した）なので、
 * 一番狭い縦画面の幅 640 から左右の余白を引いた 612 に収まる大きさにしてある。
 */
const BUTTONS = { width: 140, height: 64, gap: 12 };

/**
 * COMPLETE・情報の枠・ボタンをまとめて載せる外枠の、中身との間の余白（TODO-072）。
 * 本編の上に重ねるので、幕だけでは後ろの HUD やピースが文字の後ろに透けて見える。
 * 塗りつぶした外枠 1 つに収め、後ろの部品と重ならないようにする。
 * 横は縦画面（幅 640）でボタン 4 つ（596）が収まるよう、画面の余白の内側で詰める。
 */
const FRAME_PAD = { x: 24, y: 24 };

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('Clear');
  }

  /** 本編（`GameScene.checkSolved()`）が記録を更新した結果を受け取る。 */
  init(data) {
    this.elapsed = data && typeof data.ms === 'number' ? data.ms : 0;
    this.usedAuto = !!(data && data.usedAuto);
    this.usedHint = !!(data && data.usedHint);
    // 何番の解か（代表形の番号。TODO-022）と解の総数。データが届く前に
    // 解き切ったときは null で、番号の行を出さない。
    this.no = data && Number.isInteger(data.no) && data.no > 0 ? data.no : null;
    this.total = data && Number.isInteger(data.total) ? data.total : null;
    this.best = data && typeof data.best === 'number' ? data.best : null;
    this.bestUpdated = !!(data && data.bestUpdated);
    this.status = data && RECORD_STATUS[data.status] ? data.status : null;
  }

  create() {
    const board = BOARDS[this.registry.get(BOARD_REGISTRY_KEY)];
    const selfSolved = shouldRecordBest(this.usedAuto, this.usedHint);
    audio.fanfare();

    // 下の本編を暗くする幕。本編は止めてあり入力を受けないので、当たり判定は要らない。
    // 版の表示は本編のものが見えている。
    this.add.rectangle(0, 0, SCREEN.width, SCREEN.height, BACKDROP.color, BACKDROP.alpha)
      .setOrigin(0);

    const cx = SCREEN.width / 2;
    const [titleTop, panelTop, buttonTop] = stackTops(STACK, SCREEN.height, STACK_BIAS);
    const panelWidth = Math.min(560, SCREEN.width - SCREEN.margin * 2);

    const buttonsWidth = BUTTONS.width * 4 + BUTTONS.gap * 3;
    const frameWidth = Math.min(Math.max(panelWidth, buttonsWidth) + FRAME_PAD.x * 2,
                                SCREEN.width - SCREEN.margin * 2);
    const frameTop = titleTop - FRAME_PAD.y;
    createPanel(this, cx - frameWidth / 2, frameTop, frameWidth,
                buttonTop + STACK[2].height + FRAME_PAD.y - frameTop);

    this.add.text(cx, titleTop + STACK[0].height / 2, 'COMPLETE', {
      fontFamily: FONT.family,
      fontSize: `${FONT.title}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createPanel(this, cx - panelWidth / 2, panelTop, panelWidth, STACK[1].height);

    this.add.text(cx, panelTop + PANEL_ROWS.time, formatTime(this.elapsed), {
      fontFamily: FONT.family,
      fontSize: `${TIME_FONT}px`,
      color: TEXT_COLORS.normal,
    }).setOrigin(0.5);

    // 何番の解を見つけたか（TODO-022）。回転・反転して置いても同じ番号になる
    // ので、盤を回して並べ直しただけの解は同じ番号として出る。分母（解の総数）
    // は盤で違う（8×8 は 65、6×10 は 2339）ので、盤の名前を添える。
    if (this.no !== null && this.total !== null) {
      this.add.text(cx, panelTop + PANEL_ROWS.number,
                    `正解の ${this.no} 番（${board.label} の全 ${this.total} 解）`, {
                      fontFamily: FONT.family,
                      fontSize: `${FONT.body}px`,
                      color: TEXT_COLORS.normal,
                    }).setOrigin(0.5);
    }

    // 記録は盤ごとなので、どちらの盤の記録かが分かるように盤の名前を添える。
    // おまかせ・ヒント表示のどちらかを使った回は、最短時間を更新しなかったことが
    // 伝わる言い方にする（TODO-020）。**一覧には残る**ので「記録しない」とは
    // 言わず、最短時間の話だと分かる文にしてある（TODO-024）。
    // 履歴に足したか・上書きしたか・前の記録のままか（TODO-072）。HUD にも同じものを出す。
    if (this.status !== null) {
      this.add.text(cx, panelTop + PANEL_ROWS.status, RECORD_STATUS[this.status], {
        fontFamily: FONT.family,
        fontSize: `${FONT.body}px`,
        color: this.status === 'kept' ? TEXT_COLORS.dim : TEXT_COLORS.accent,
      }).setOrigin(0.5);
    }

    let bestLine;
    if (!selfSolved) {
      bestLine = this.best !== null
        ? `${board.label} の最短 ${formatTime(this.best)}（今回は最短に入れない）`
        : `${board.label} はまだ最短の記録が無い`;
    } else if (this.bestUpdated) {
      bestLine = `${board.label} の自己最短を更新`;
    } else {
      bestLine = `${board.label} の最短 ${formatTime(this.best)}`;
    }
    this.add.text(cx, panelTop + PANEL_ROWS.best, bestLine, {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: this.bestUpdated ? TEXT_COLORS.accent : TEXT_COLORS.dim,
    }).setOrigin(0.5);

    // おまかせ・ヒント表示のどちらを使ったかは、最短に入らない理由として伝える。
    // 一覧には同じ印が付いて残る（TODO-024）ので、そのことも添える。
    const helps = [];
    if (this.usedAuto) helps.push('おまかせ');
    if (this.usedHint) helps.push('ヒント表示');
    if (helps.length > 0) {
      this.add.text(cx, panelTop + PANEL_ROWS.help,
                    `${helps.join('と')}を使った（記録には残る）`, {
        fontFamily: FONT.family,
        fontSize: `${FONT.small}px`,
        color: TEXT_COLORS.dim,
      }).setOrigin(0.5);
    }

    // 4 つのボタンを横に並べる（TODO-032、TODO-072）。
    const buttonY = buttonTop + STACK[2].height / 2;
    const step = BUTTONS.width + BUTTONS.gap;
    // 「続ける」は本編を止めたところから動かす。ほかは本編を閉じて移る。
    // 「もう一度」は新しく始めるので遊びかけを捨て、「記録」「タイトルへ」は
    // 完成した盤面を遊びかけとして残す（`つづきから` で続きを遊べる）。
    // 解いた直後にその回を一覧で見たくなるので、記録へ直に行けるようにする
    // （タイトルを経由させると、盤を選び直す画面を挟むことになる。TODO-032）。
    const actions = [
      { label: '続ける', onClick: () => this.continueGame() },
      {
        label: 'もう一度',
        onClick: () => {
          clearProgress(board.key);
          this.leaveTo('Game', { resume: false });
        },
      },
      { label: '記録', onClick: () => this.leaveTo('Records') },
      { label: 'タイトルへ', onClick: () => this.leaveTo('Title') },
    ];
    actions.forEach((action, index) => {
      createButton(this, {
        x: cx + (index - (actions.length - 1) / 2) * step,
        y: buttonY,
        width: BUTTONS.width,
        height: BUTTONS.height,
        label: action.label,
        fontSize: FONT.hud,
        onClick: () => {
          audio.button();
          action.onClick();
        },
      });
    });
  }

  /** 表示を閉じて、止めてある本編を動かす（TODO-072）。 */
  continueGame() {
    this.scene.get('Game').continuePlay();
    this.scene.stop();
  }

  /**
   * 止めてある本編を閉じてから移る。閉じないと、下で止まったまま残る。
   * 本編を閉じるときの控え（`onShutdown()`）は `playing` が偽なので何もしない
   * （完成した盤面は `checkSolved()` が控えてある）。
   */
  leaveTo(key, data) {
    this.scene.stop('Game');
    this.scene.start(key, data);
  }
}
