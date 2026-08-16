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
import { cachedSolutions } from '../solutions.js';
import {
  addFound, addHistory, loadBest, saveBest, shouldRecordBest,
} from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createPanel, stackTops } from '../ui.js';

/**
 * 上から順に積む部品。横画面での今までの見え方を写した値で、縦画面では
 * この塊ごと下へずれる（TODO-011）。枠の中の 3 行は枠の上端からの差で置く。
 */
const STACK = [
  { key: 'title', height: 68, gap: 36 },
  { key: 'panel', height: 232, gap: 34 },
  { key: 'buttons', height: 58, gap: 0 },
];

/**
 * 余りのうち上へ回す割合。横画面の 0.44 は今までどおりの位置になる値で、
 * 縦画面は余りが増えるぶん下だけが空くので、素直に中央へ置く（TODO-011）。
 */
const STACK_BIAS = SCREEN.portrait ? 0.5 : 0.44;

/**
 * 枠の上端から見た、中の 4 行の中心。`number`（何番の解か。TODO-022）を
 * 足したぶん枠を高くしてある（`STACK` の `panel`）。TODO-026 で文字を
 * 大きくしたので、行の間もそのぶん広げてある。
 */
const PANEL_ROWS = {
  time: 56, number: 112, best: 156, help: 196,
};

/** 経過時間だけは他より大きく出す（この画面の主役なので）。 */
const TIME_FONT = 58;

export default class ClearScene extends Phaser.Scene {
  constructor() {
    super('Clear');
  }

  init(data) {
    this.elapsed = data && typeof data.ms === 'number' ? data.ms : 0;
    this.usedAuto = !!(data && data.usedAuto);
    this.usedHint = !!(data && data.usedHint);
    // 何番の解か（代表形の番号。TODO-022）。表示にも記録にも使う。
    this.no = data && Number.isInteger(data.no) && data.no > 0 ? data.no : null;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    // 記録は盤ごとに分けてあるので、どの盤を解いたのかを `registry` から読む。
    const board = BOARDS[this.registry.get(BOARD_REGISTRY_KEY)];
    // おまかせ・ヒント表示のどちらかに頼ったら「自力ではない」ので、最短時間には
    // 入れない（TODO-020）。**履歴と達成度には残す**（TODO-024）。
    const selfSolved = shouldRecordBest(this.usedAuto, this.usedHint);
    const record = selfSolved
      ? saveBest(board.key, this.elapsed)
      : { best: loadBest(board.key), updated: false };
    // 全解のデータ（TODO-022）。本編を通ってきた時点で読み込み済みなので、
    // ここでは待たずに取り出すだけ。万一 null なら番号の行を出さず、
    // 記録にも残さない（番号の無い件は残せない）。
    const solutions = cachedSolutions(this.registry, board);
    // クリアした回を履歴へ 1 件足す（TODO-008）。最短時間の更新とは別に、
    // 更新しなかった回も残す（あとから完成形を見比べるためのもの）。
    // 見つけた解の番号は履歴とは別にも貯める（達成度に使う。TODO-022）。
    //
    // おまかせ・ヒント表示に頼った回も残し、何に頼ったかを印として持たせる
    // （TODO-024）。印は使ったときだけ付ける（`storage.js` の履歴の説明）。
    if (this.no !== null && solutions !== null) {
      const entry = { at: Date.now(), ms: this.elapsed, no: this.no };
      if (this.usedAuto) entry.a = true;
      if (this.usedHint) entry.h = true;
      addHistory(board.key, entry, solutions);
      addFound(board.key, this.no, solutions.canonical.length);
    }
    audio.fanfare();

    const cx = SCREEN.width / 2;
    const [titleTop, panelTop, buttonTop] = stackTops(STACK, SCREEN.height, STACK_BIAS);
    const panelWidth = Math.min(560, SCREEN.width - SCREEN.margin * 2);

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
    if (this.no !== null && solutions !== null) {
      this.add.text(cx, panelTop + PANEL_ROWS.number,
                    `正解の ${this.no} 番（${board.label} の全 ${solutions.canonical.length} 解）`, {
                      fontFamily: FONT.family,
                      fontSize: `${FONT.body}px`,
                      color: TEXT_COLORS.normal,
                    }).setOrigin(0.5);
    }

    // 記録は盤ごとなので、どちらの盤の記録かが分かるように盤の名前を添える。
    // おまかせ・ヒント表示のどちらかを使った回は、最短時間を更新しなかったことが
    // 伝わる言い方にする（TODO-020）。**一覧には残る**ので「記録しない」とは
    // 言わず、最短時間の話だと分かる文にしてある（TODO-024）。
    let bestLine;
    if (!selfSolved) {
      bestLine = record.best !== null
        ? `${board.label} の最短 ${formatTime(record.best)}（今回は最短に入れない）`
        : `${board.label} はまだ最短の記録が無い`;
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

    // 2 つのボタンは横に並べる。合わせて 520 なので、縦画面（640）でも収まる。
    const buttonY = buttonTop + STACK[2].height / 2;
    createButton(this, {
      x: cx - 140,
      y: buttonY,
      width: 240,
      height: 58,
      label: 'もう一度',
      fontSize: FONT.hud,
      onClick: () => {
        audio.button();
        this.scene.start('Game');
      },
    });
    createButton(this, {
      x: cx + 140,
      y: buttonY,
      width: 240,
      height: 58,
      label: 'タイトルへ',
      fontSize: FONT.hud,
      onClick: () => {
        audio.button();
        this.scene.start('Title');
      },
    });
  }
}
