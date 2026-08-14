/**
 * クリア表示と記録の更新。
 *
 * 記録の更新はここでだけ行う。本編（`game.js`）は完成を検知して
 * 経過時間を渡すところまでを受け持ち、保存の成否には関わらない。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, SCREEN, TEXT_COLORS,
} from '../config.js';
import { formatTime } from '../logic.js';
import {
  addHistory, loadBest, saveBest, shouldRecord,
} from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createPanel, stackTops } from '../ui.js';

/**
 * 上から順に積む部品。横画面での今までの見え方を写した値で、縦画面では
 * この塊ごと下へずれる（TODO-011）。枠の中の 3 行は枠の上端からの差で置く。
 */
const STACK = [
  { key: 'title', height: 52, gap: 44 },
  { key: 'panel', height: 170, gap: 40 },
  { key: 'buttons', height: 52, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。横画面の 0.44 は今までどおりの位置になる値で、
 * 縦画面は余りが増えるぶん下だけが空くので、素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.44;

/** 枠の上端から見た、中の 3 行の中心。 */
const PANEL_ROWS = { time: 48, best: 106, hint: 140 };

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('Clear');
  }

  init(data) {
    this.elapsed = data && typeof data.ms === 'number' ? data.ms : 0;
    this.usedHint = !!(data && data.usedHint);
    this.usedCheck = !!(data && data.usedCheck);
    // 完成した盤面（`logic.js` の `boardKey()` の出力）。履歴に残すのに使う。
    this.cells = data && typeof data.cells === 'string' ? data.cells : null;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    // 記録は盤ごとに分けてあるので、どの盤を解いたのかを `registry` から読む。
    const board = BOARDS[this.registry.get(BOARD_REGISTRY_KEY)];
    // ヒント・詰み表示のどちらかに頼ったら「自力ではない」ので、
    // 最短時間・履歴のどちらにも残さない（TODO-020）。
    const recordable = shouldRecord(this.usedHint, this.usedCheck);
    const record = recordable
      ? saveBest(board.key, this.elapsed)
      : { best: loadBest(board.key), updated: false };
    // クリアした回を履歴へ 1 件足す（TODO-008）。最短時間の更新とは別に、
    // 更新しなかった回も残す（あとから完成形を見比べるためのもの）。
    // 盤面が渡ってこなかったときは足さない（`cells` の無い件は残せない）。
    if (recordable && this.cells !== null) {
      addHistory(board.key, { at: Date.now(), ms: this.elapsed, cells: this.cells });
    }
    audio.fanfare();

    const cx = SCREEN.width / 2;
    const [titleTop, panelTop, buttonTop] = stackTops(STACK, SCREEN.height, STACK_BIAS);
    const panelWidth = Math.min(440, SCREEN.width - SCREEN.margin * 2);

    this.add.text(cx, titleTop + STACK[0].height / 2, 'COMPLETE', {
      fontFamily: FONT.family,
      fontSize: `${FONT.title}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    createPanel(this, cx - panelWidth / 2, panelTop, panelWidth, STACK[1].height);

    this.add.text(cx, panelTop + PANEL_ROWS.time, formatTime(this.elapsed), {
      fontFamily: FONT.family,
      fontSize: '46px',
      color: TEXT_COLORS.normal,
    }).setOrigin(0.5);

    // 記録は盤ごとなので、どちらの盤の記録かが分かるように盤の名前を添える。
    // ヒント・詰み表示のどちらかを使った回は、記録を更新しなかったことが
    // 伝わる言い方にする（TODO-020）。
    let bestLine;
    if (!recordable) {
      bestLine = record.best !== null
        ? `${board.label} の最短 ${formatTime(record.best)}（今回は記録しない）`
        : `${board.label} はまだ記録が無い（今回も記録しない）`;
    } else if (record.updated) {
      bestLine = `${board.label} の自己最短を更新`;
    } else {
      bestLine = `${board.label} の最短 ${formatTime(record.best)}`;
    }
    this.add.text(cx, panelTop + PANEL_ROWS.best, bestLine, {
      fontFamily: FONT.family,
      fontSize: `${FONT.hud}px`,
      color: record.updated ? TEXT_COLORS.accent : TEXT_COLORS.dim,
    }).setOrigin(0.5);

    // ヒント・詰み表示のどちらを使ったかは、記録に残らない理由として伝える。
    const helps = [];
    if (this.usedHint) helps.push('ヒント');
    if (this.usedCheck) helps.push('詰み表示');
    if (helps.length > 0) {
      this.add.text(cx, panelTop + PANEL_ROWS.hint, `${helps.join('と')}を使った`, {
        fontFamily: FONT.family,
        fontSize: `${FONT.small}px`,
        color: TEXT_COLORS.dim,
      }).setOrigin(0.5);
    }

    // 2 つのボタンは横に並べる。縦画面でも 440 なら収まるので折り返さない。
    const buttonY = buttonTop + STACK[2].height / 2;
    createButton(this, {
      x: cx - 120,
      y: buttonY,
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
      x: cx + 120,
      y: buttonY,
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
