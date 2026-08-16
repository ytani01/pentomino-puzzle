/**
 * クリア記録の一覧（TODO-008）。盤ごとの履歴を新しい順に並べ、選んだ回の
 * 完成形を縮小して見せる。
 *
 * 履歴は盤ごとに分かれているので、**この画面の中で盤を切り替えられる**
 * ようにしてある（タイトルへ戻って盤を選び直させると、記録を見比べるだけで
 * 画面を 2 往復することになるため）。切り替えの行はタイトルと同じ
 * `createChoiceRow`（`ui.js`）を使う。
 *
 * 一覧は**頁送り**で、スクロールは使わない。Phaser には要素をはみ出させずに
 * 流す仕組みが無く、当たり判定を持つ行を切り抜くにはカメラかマスクを別に
 * 用意することになる。50 件（`HISTORY_LIMIT`）なら 1 頁 10 件でも 5 頁に
 * 収まるので、送る手数より作りの単純さを取った。
 */

import {
  BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, LAYOUTS, PALETTES,
  PALETTE_REGISTRY_KEY, PIECES, SCREEN, TEXT_COLORS,
} from '../config.js';
import { formatTime } from '../logic.js';
import { ensureSolutions, solutionCells } from '../solutions.js';
import {
  clearFound, clearAuto, clearHistory, loadFound, loadHistory,
} from '../storage.js';
import * as audio from '../audio.js';
import { createButton, createChoiceRow, createPanel } from '../ui.js';
import { darken, pieceColor } from './boot.js';

/**
 * 画面の向きごとの配置。タイトル・クリアの画面と違って積む部品の高さが
 * 揃わない（一覧と完成形が横に並ぶか縦に並ぶかで組みが変わる）ので、
 * `stackTops()` ではなく向きごとに 1 組ずつ数を書いてある。
 *
 * 横画面は左に一覧・右に完成形、縦画面は上に一覧・下に完成形。
 */
const L = SCREEN.portrait
  ? {
    headingY: 66,
    chooseY: 136,
    listX: SCREEN.width / 2,
    listTop: 190,
    listWidth: 570,
    rowsPerPage: 7,
    detailY: 620,
    boardBox: { x: 60, y: 660, width: 520, height: 350 },
    achieveY: 1040,
    buttonsY: 1090,
  }
  : {
    headingY: 44,
    chooseY: 106,
    listX: 250,
    listTop: 150,
    listWidth: 432,
    rowsPerPage: 7,
    detailY: 500,
    boardBox: { x: 500, y: 146, width: 424, height: 320 },
    achieveY: 556,
    buttonsY: 600,
  };

/**
 * 一覧の 1 行の高さと、行どうしの間。TODO-026 で文字を大きくしたぶん、
 * 行も高くしてある（1 頁に載る件数はそのぶん減る）。
 */
const ROW = { height: 44, gap: 6 };

/** 頁送りの行（前へ・頁数・次へ）。一覧のすぐ下に置く。 */
const PAGER = {
  offset: 30, width: 118, height: 40, gap: 140,
};

/** 下端に並べるボタン。 */
const FOOT = { width: 210, height: 52, gap: 20 };

/**
 * 確認の枠の寸法。盤に依らない値なので、どの盤の `LAYOUTS` から取っても同じ
 * （この画面は盤を切り替えても組み直さないので、1 つ選んで固定しておく）。
 */
const CONFIRM = LAYOUTS[BOARDS['8x8'].key].confirm;

/**
 * 完成形を描くときの、ピースの境目の太さ。マスが 44px ほどまで縮むので、
 * 盤の `OUTLINE.width`（2）のままでは塊の輪郭として細すぎる。
 */
const MINI_EDGE = 3;

/** ピース名から定義を引く表。完成形の 60 マスを 1 文字ずつ引くため。 */
const PIECE_BY_NAME = new Map(PIECES.map((piece) => [piece.name, piece]));

/**
 * 行の右端へ出す印（TODO-027）。何に頼って解いた回かを、履歴 1 件が持つ
 * `a` / `h`（TODO-024、TODO-028）から組み立てる。
 *
 * 記号やアイコンではなく短い言葉にしてあるのは、**凡例を別に置かなくても
 * 意味が分かるようにするため**。1 文字へ縮めれば横幅は空くが、「お」「ヒ」が
 * 何を指すかはこの画面のどこにも書かれていないことになる。
 * 一番狭い横画面の行（432）でも、日時と時間に「おまかせ・ヒント」を足して収まる。
 */
function marksOf(entry) {
  if (!entry) return '';
  const marks = [];
  if (entry.a) marks.push('おまかせ');
  if (entry.h) marks.push('ヒント');
  return marks.join('・');
}

/** 2 桁に揃える。日時の表示に使う。 */
function pad2(value) {
  return String(value).padStart(2, '0');
}

/**
 * クリアした日時。`toLocaleString()` を使わないのは、環境によって桁数や
 * 区切りが変わり、一覧の行ごとに幅が揃わなくなるため。
 */
function formatDate(at) {
  const d = new Date(at);
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`
    + ` ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default class RecordsScene extends Phaser.Scene {
  constructor() {
    super('Records');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.background);
    // 見せる盤はこの画面の中で切り替える。タイトルで選んである盤を初めに出す。
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.palette = PALETTES[this.registry.get(PALETTE_REGISTRY_KEY)];
    this.entries = [];
    // 見ている盤の全解のデータ（TODO-022）。読み込むまでは null で、
    // 完成形と達成度はそのあいだ出せない（一覧の日時と時間だけ先に出る）。
    this.solutions = null;
    this.found = [];
    this.page = 0;
    this.selected = 0;

    const cx = SCREEN.width / 2;

    this.add.text(cx, L.headingY, '記録', {
      fontFamily: FONT.family,
      fontSize: `${FONT.heading}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    this.boardButtons = createChoiceRow(this, cx, L.chooseY, '盤',
                                        Object.values(BOARDS),
                                        (choice) => this.selectBoard(choice.key));

    this.createList();
    this.createDetail();

    // 消せるものが無いときは押せなくする（押しても何も起きないボタンを
    // 残すより、押せないと見せたほうが分かる）。
    this.clearButton = createButton(this, {
      x: cx - (FOOT.width + FOOT.gap) / 2,
      y: L.buttonsY,
      width: FOOT.width,
      height: FOOT.height,
      label: '消す',
      fontSize: FONT.hud,
      onClick: () => this.confirmClear(),
    });
    createButton(this, {
      x: cx + (FOOT.width + FOOT.gap) / 2,
      y: L.buttonsY,
      width: FOOT.width,
      height: FOOT.height,
      label: 'タイトルへ',
      fontSize: FONT.hud,
      onClick: () => {
        audio.unlock();
        audio.button();
        this.scene.start('Title');
      },
    });

    this.createConfirmDialog();
    this.reload();
  }

  /**
   * 一覧の行と頁送りを組む。行は毎回作り直さず、1 頁ぶんだけ先に作って
   * 文字と表示・非表示を差し替える（頁を送るたびに当たり判定を作り直すと、
   * 押した直後の行が入れ替わって二重に反応することがあるため）。
   */
  createList() {
    this.rowButtons = [];
    for (let i = 0; i < L.rowsPerPage; i += 1) {
      const button = createButton(this, {
        x: L.listX,
        y: L.listTop + ROW.height / 2 + i * (ROW.height + ROW.gap),
        width: L.listWidth,
        height: ROW.height,
        label: '',
        fontSize: FONT.small,
        // 日時と時間は左端から、印は右端から（TODO-027）。中央寄せのままだと
        // 印の有無で文字列の長さが変わり、日時の位置が行ごとにずれてしまう。
        align: 'left',
        onClick: () => this.selectRow(i),
      });
      this.rowButtons.push(button);
    }

    // 「記録なし」は一覧の場所へ出す。行が 1 つも無いことが分かればよいので、
    // 一覧の上端に寄せず、行が並ぶはずの範囲の中ほどに置く。
    this.emptyText = this.add.text(
      L.listX,
      L.listTop + (ROW.height + ROW.gap) * L.rowsPerPage / 2,
      '記録なし',
      { fontFamily: FONT.family, fontSize: `${FONT.body}px`, color: TEXT_COLORS.dim },
    ).setOrigin(0.5);

    const pagerY = L.listTop + (ROW.height + ROW.gap) * L.rowsPerPage + PAGER.offset;
    this.prevButton = createButton(this, {
      x: L.listX - PAGER.gap,
      y: pagerY,
      width: PAGER.width,
      height: PAGER.height,
      label: '前へ',
      fontSize: FONT.small,
      onClick: () => this.turnPage(-1),
    });
    this.nextButton = createButton(this, {
      x: L.listX + PAGER.gap,
      y: pagerY,
      width: PAGER.width,
      height: PAGER.height,
      label: '次へ',
      fontSize: FONT.small,
      onClick: () => this.turnPage(1),
    });
    this.pageText = this.add.text(L.listX, pagerY, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5);
  }

  /** 選んだ 1 件の見出しと、完成形を描く場所、そして達成度。 */
  createDetail() {
    this.detailText = this.add.text(
      L.boardBox.x + L.boardBox.width / 2, L.detailY, '', {
        fontFamily: FONT.family,
        fontSize: `${FONT.body}px`,
        color: TEXT_COLORS.normal,
        align: 'center',
        lineSpacing: 2,
      },
    ).setOrigin(0.5);
    this.mini = this.add.graphics();
    // 達成度（TODO-022）。分母は盤で違う（8×8 は 65、6×10 は 2339）ので、
    // どちらの盤の話かが分かるように盤の名前を頭に付ける。
    this.achieveText = this.add.text(
      L.boardBox.x + L.boardBox.width / 2, L.achieveY, '', {
        fontFamily: FONT.family,
        fontSize: `${FONT.small}px`,
        color: TEXT_COLORS.dim,
      },
    ).setOrigin(0.5);
  }

  /**
   * 消す前の確認。ブラウザの `confirm()` は使わない方針（CLAUDE.md）なので、
   * `game.js` のタイトルへ戻る確認と同じ組みで Canvas 内に作る。背景の帯に
   * 当たり判定を持たせ、開いている間は後ろのボタンへクリックが抜けないようにする。
   */
  createConfirmDialog() {
    const x = (SCREEN.width - CONFIRM.width) / 2;
    const y = (SCREEN.height - CONFIRM.height) / 2;
    const depth = 10;

    this.confirmParts = [
      this.add.rectangle(0, 0, SCREEN.width, SCREEN.height, 0x000000, 0.55)
        .setOrigin(0).setDepth(depth).setInteractive().setVisible(false),
      createPanel(this, x, y, CONFIRM.width, CONFIRM.height)
        .setDepth(depth).setVisible(false),
    ];

    this.confirmText = this.add.text(x + CONFIRM.width / 2, y + 50, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.body}px`,
      color: TEXT_COLORS.normal,
      align: 'center',
    }).setOrigin(0.5).setDepth(depth).setVisible(false);
    this.confirmParts.push(this.confirmText);

    const buttonY = y + CONFIRM.height - 40;
    const total = CONFIRM.buttonWidth * 2 + CONFIRM.gap;
    const left = x + (CONFIRM.width - total) / 2;
    this.confirmParts.push(createButton(this, {
      x: left + CONFIRM.buttonWidth / 2,
      y: buttonY,
      width: CONFIRM.buttonWidth,
      height: CONFIRM.buttonHeight,
      label: 'はい',
      fontSize: FONT.small,
      onClick: () => this.doClear(),
    }).setDepth(depth).setVisible(false));
    this.confirmParts.push(createButton(this, {
      x: left + CONFIRM.buttonWidth + CONFIRM.gap + CONFIRM.buttonWidth / 2,
      y: buttonY,
      width: CONFIRM.buttonWidth,
      height: CONFIRM.buttonHeight,
      label: 'いいえ',
      fontSize: FONT.small,
      onClick: () => this.hideConfirm(),
    }).setDepth(depth).setVisible(false));
  }

  // ---- 操作 -------------------------------------------------------------

  /** 盤を切り替える。`registry` は書き換えない（見ているだけで、遊ぶ盤は別）。 */
  selectBoard(key) {
    if (key === this.boardKey) return;
    audio.unlock();
    audio.button();
    this.boardKey = key;
    this.reload();
  }

  selectRow(index) {
    const entry = this.page * L.rowsPerPage + index;
    if (entry >= this.entries.length) return;
    audio.unlock();
    audio.button();
    this.selected = entry;
    this.refresh();
  }

  /** 頁を送る。端では押せなくしてあるので、ここでは範囲だけ守る。 */
  turnPage(step) {
    const pages = this.pageCount();
    const next = Math.min(Math.max(this.page + step, 0), pages - 1);
    if (next === this.page) return;
    audio.unlock();
    audio.button();
    this.page = next;
    this.refresh();
  }

  confirmClear() {
    if (this.entries.length === 0) return;
    audio.unlock();
    audio.button();
    this.confirmText.setText(
      `${BOARDS[this.boardKey].label} の記録 ${this.entries.length} 件を消しますか？\nもとに戻せません`,
    );
    this.confirmParts.forEach((part) => part.setVisible(true));
  }

  hideConfirm() {
    audio.button();
    this.confirmParts.forEach((part) => part.setVisible(false));
  }

  /**
   * 履歴と、達成度に使う「見つけた解の番号」をまとめて消す（TODO-022）。
   * おまかせで導いた解の番号（TODO-016）も一緒に消す——記録を消したのに
   * 「その解は前に出した」とおまかせが避け続けるのは辻褄が合わないため。
   */
  doClear() {
    audio.button();
    clearHistory(this.boardKey);
    clearFound(this.boardKey);
    clearAuto(this.boardKey);
    this.confirmParts.forEach((part) => part.setVisible(false));
    this.reload();
  }

  // ---- 表示 -------------------------------------------------------------

  /**
   * 盤を切り替えた・消したときに、履歴を読み直して先頭から見せ直す。
   *
   * 完成形は番号から引くので、全解のデータが要る（TODO-022）。読み込みを
   * 待つあいだも一覧の日時と時間は出せるので、先に一度描いてから届いたぶんを
   * 足す。待っている間にさらに盤を切り替えられることがあるので、**届いた
   * ときに見ている盤が変わっていたら捨てる**。
   */
  reload() {
    const spec = BOARDS[this.boardKey];
    this.solutions = null;
    this.found = [];
    this.entries = loadHistory(this.boardKey);
    this.page = 0;
    this.selected = 0;
    this.boardButtons.forEach((button) => button.setSelected(button.choiceKey === this.boardKey));
    this.refresh();

    ensureSolutions(this.registry, spec).then((solutions) => {
      if (!this.scene.isActive() || this.boardKey !== spec.key) return;
      this.solutions = solutions;
      this.entries = loadHistory(this.boardKey, solutions);
      this.found = loadFound(this.boardKey, solutions.canonical.length);
      this.refresh();
    });
  }

  pageCount() {
    return Math.max(1, Math.ceil(this.entries.length / L.rowsPerPage));
  }

  /** 一覧・頁送り・完成形を、今の頁と選んでいる 1 件に合わせて出し直す。 */
  refresh() {
    const pages = this.pageCount();
    this.rowButtons.forEach((button, i) => {
      const index = this.page * L.rowsPerPage + i;
      const entry = this.entries[index];
      button.setVisible(!!entry);
      if (!entry) return;
      button.setLabel(`${formatDate(entry.at)}　${formatTime(entry.ms)}`);
      button.setMark(marksOf(entry));
      button.setSelected(index === this.selected);
    });
    const empty = this.entries.length === 0;
    this.emptyText.setVisible(empty);
    // 頁送りは 1 頁に収まっていても出す（端で押せなくする）。1 件も無いときだけ
    // 行ごと引っ込める。送る先が無いことと、記録が無いことは別なので。
    this.pageText.setText(empty ? '' : `${this.page + 1} / ${pages}`);
    this.prevButton.setVisible(!empty).setEnabled(this.page > 0);
    this.nextButton.setVisible(!empty).setEnabled(this.page < pages - 1);
    this.clearButton.setEnabled(!empty);

    const entry = this.entries[this.selected];
    // 何番の解かも添える（TODO-022）。一覧の行は日時と時間だけで揃えたいので、
    // 番号は選んだ 1 件の見出しにだけ出す。番号はデータが届いてから付く
    // （古い形の件は読み替えたあとに入る）ので、無いうちは日時と時間だけ。
    // 印は行にも出るが（TODO-027）、選んだ 1 件の見出しにも添える。行の印は
    // 一覧を見渡すためのもので、こちらは今どの回を見ているかの確認になる。
    // **2 行に分ける**のは、番号と印まで 1 行に並べると完成形の枠より横に
    // はみ出すため（TODO-026 で文字を大きくして収まらなくなった）。
    const marks = marksOf(entry);
    let second = entry && entry.no ? `${entry.no} 番` : '';
    if (marks !== '') second += second === '' ? `（${marks}）` : `　（${marks}）`;
    this.detailText.setText(entry
      ? `${formatDate(entry.at)}　${formatTime(entry.ms)}\n${second}`
      : '');
    this.drawMini(entry);

    // 達成度。データが届くまでは分母が分からないので何も出さない。
    this.achieveText.setText(this.solutions === null
      ? ''
      : `${BOARDS[this.boardKey].label} … ${this.solutions.canonical.length} 解中 ${this.found.length} 解`);
  }

  /**
   * 選んだ回の完成形を縮小して描く。
   *
   * `boot.js` のテクスチャを貼らずに `Graphics` で塗るのは、テクスチャが盤と
   * トレイの大きさで焼いてあり、この画面のマス（44〜56px）に合う 1 枚が
   * 無いため。縮小して貼ると立体の帯や光の筋がつぶれ、かえって塊の境目が
   * 分かりにくくなる。**ピースの境目が見分けられること**だけを目当てに、
   * 塗りと、隣が別のピースになる辺の線だけで描く。
   *
   * 描く盤面は**番号から引く**（TODO-022）。履歴には 60 マスぶんの文字列を
   * 持たなくなったので、データが届くまでは描けない。
   */
  drawMini(entry) {
    this.mini.clear();
    if (!entry || this.solutions === null) return;
    const cells = solutionCells(this.solutions, entry.no);
    if (cells === null) return;
    const board = BOARDS[this.boardKey];
    const box = L.boardBox;
    const cell = Math.min(
      Math.floor(box.width / board.cols),
      Math.floor(box.height / board.rows),
    );
    const originX = box.x + Math.round((box.width - cell * board.cols) / 2);
    const originY = box.y + Math.round((box.height - cell * board.rows) / 2);
    const at = (row, col) => (
      row < 0 || col < 0 || row >= board.rows || col >= board.cols
        ? null
        : cells[row * board.cols + col]
    );

    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        const ch = at(row, col);
        const piece = PIECE_BY_NAME.get(ch);
        let color = COLORS.boardCell;
        if (ch === '#') color = COLORS.hole;
        else if (piece) color = pieceColor(this.palette, piece);
        this.mini.fillStyle(color, 1);
        this.mini.fillRect(originX + col * cell, originY + row * cell, cell, cell);
      }
    }

    // 境目は塗り終えてから引く。先に引くと、あとで塗る隣のマスに上書きされる。
    for (let row = 0; row < board.rows; row += 1) {
      for (let col = 0; col < board.cols; col += 1) {
        const ch = at(row, col);
        const piece = PIECE_BY_NAME.get(ch);
        if (!piece) continue;
        const edge = darken(pieceColor(this.palette, piece), this.palette.outlineDarken);
        this.mini.lineStyle(MINI_EDGE, edge, 1);
        const x = originX + col * cell;
        const y = originY + row * cell;
        // 内側へ半分寄せて引く。外へはみ出すと隣のピースの塗りにかぶる。
        const half = MINI_EDGE / 2;
        if (at(row - 1, col) !== ch) this.mini.lineBetween(x, y + half, x + cell, y + half);
        if (at(row + 1, col) !== ch) {
          this.mini.lineBetween(x, y + cell - half, x + cell, y + cell - half);
        }
        if (at(row, col - 1) !== ch) this.mini.lineBetween(x + half, y, x + half, y + cell);
        if (at(row, col + 1) !== ch) {
          this.mini.lineBetween(x + cell - half, y, x + cell - half, y + cell);
        }
      }
    }

    this.mini.lineStyle(2, COLORS.panelEdge, 1);
    this.mini.strokeRect(originX, originY, cell * board.cols, cell * board.rows);
  }
}
