/**
 * クリア記録の一覧（TODO-008）。盤ごとの履歴を新しい順に並べ、選んだ回の
 * 完成形を縮小して見せる。
 *
 * **この画面の中で盤を切り替えられる**ようにしてある（タイトルで盤を
 * 選び直させると、記録を見比べるだけで画面を 2 往復するため）。切り替えの
 * 行はタイトルと同じ `createChoiceRow`（`ui.js`）。
 *
 * 一覧は**頁送り**で、スクロールは使わない。Phaser には要素を枠内に収めて
 * 流す仕組みが無く、当たり判定を持つ行を切り抜くにはカメラかマスクが要る。
 * 50 件（`HISTORY_LIMIT`）なら 1 頁 7〜9 件でも数頁に収まるので、作りの
 * 単純さを取った。
 *
 * 行にはいつもチェックボックスを出し、チェックした回をまとめて消せる
 * （TODO-071）。前へ・次へは画面下の 1 段のアイコンにまとめ（タイトルへは
 * 左上。TODO-076）、空いた縦の余白で一覧の行数を増やしてある。ゴミ箱は
 * 「全部選ぶ」と同じ行の右端（一覧の右端）に置く（TODO-093）。
 */

import {
  BACKDROP, BOARDS, BOARD_REGISTRY_KEY, COLORS, FONT, LAYOUTS, PALETTES,
  PALETTE_REGISTRY_KEY, SCREEN, TEXT_COLORS,
} from '../config.js';
import { boardIcon, ICONS } from '../icons.js';
import { formatTime, selectionAfterRemoval } from '../logic.js';
import { ensureSolutions, solutionCells } from '../solutions.js';
import {
  loadFound, loadHistory, loadProgress, progressFromRecord, removeRecords, saveProgress,
} from '../storage.js';
import * as audio from '../audio.js';
import {
  CHOICE_ICON_HEIGHT, createButton, createChoiceRow, createPanel, createTitleBar, createTooltip,
  drawMiniBoard,
} from '../ui.js';

/**
 * 一覧の 1 行の高さと、行どうしの間。文字を大きくしたぶん、行も高くしてある
 * （TODO-026。1 頁に載る件数はそのぶん減る）。
 */
const ROW = { height: 44, gap: 6 };

/** 行の左端・一覧の上に置くチェックボックスの大きさと、隣の部品との間隔。 */
const CHECKBOX = { size: 32, gap: 10 };

/**
 * 行の文字（日時・時間・「おまかせ・ヒント」の印）を収める幅。印が右詰めで
 * 収まることを確かめてある値（TODO-027。432 は横画面、570 は縦画面）。
 *
 * `L.listWidth`（一覧の当たり判定全体の幅）は、ここへ
 * `CHECKBOX.size + CHECKBOX.gap` を足して作る。足し忘れると文字の幅が
 * そのぶん狭くなり、「おまかせ・ヒント」が経過時間にくっつく（TODO-071）。
 */
const ROW_TEXT_WIDTH = { portrait: 570, landscape: 432 };

/**
 * 画面の向きごとの配置。一覧と完成形が横に並ぶか縦に並ぶかで組みが変わり、
 * タイトル・クリアの画面のように `stackTops()` で積めないので、向きごとに
 * 数を書いてある。
 *
 * 横画面は左に一覧・右に完成形、縦画面は上に一覧・下に完成形。前へ・次へ・
 * ゴミ箱は画面下の 1 段（`footY`・`foot`）にまとめ、空いた縦の余白を一覧の
 * 行数（`rowsPerPage`）へ回してある（TODO-071）。
 *
 * 完成形の下に「この回を続ける」（`continueY`）を置くため、完成形の枠
 * （`boardBox`）の高さを詰めてある（TODO-073）。
 *
 * 最上段にタイトル行（`titleY`）を足したぶん、横画面は見出しから一覧までを
 * 下げ、一覧の最後の行と下段の間を詰めてある（TODO-089）。
 *
 * 盤の選択をタイトルと同じ図のボタン（`CHOICE_ICON_HEIGHT`）にし、ゴミ箱を
 * 「全部選ぶ」の行へ移して少し大きくした（`trash`）ぶん、`chooseY` から下を
 * 詰め直してある（TODO-093）。横画面は一覧（左）と完成形（右）が別の列なので、
 * 一覧側の高さが増えたぶんは `rowsPerPage` を減らして吸収し、完成形の列は
 * `chooseY` の行が高くなった分だけ動かしてある。
 */
const L = SCREEN.portrait
  ? {
    titleY: 26,
    headingY: 68,
    chooseY: 127,
    selectAllY: 194,
    listX: SCREEN.width / 2,
    listTop: 234,
    listWidth: ROW_TEXT_WIDTH.portrait + CHECKBOX.size + CHECKBOX.gap,
    rowsPerPage: 8,
    detailY: 670,
    boardBox: { x: 60, y: 714, width: 520, height: 250 },
    continueY: 992,
    achieveY: 1039,
    footY: 1084,
    foot: { width: 42, height: 56 },
    trash: { width: 50, height: 60 },
  }
  : {
    titleY: 20,
    headingY: 50,
    chooseY: 109,
    selectAllY: 167,
    listX: 250,
    listTop: 214,
    listWidth: ROW_TEXT_WIDTH.landscape + CHECKBOX.size + CHECKBOX.gap,
    rowsPerPage: 7,
    detailY: 442,
    boardBox: { x: 500, y: 165, width: 424, height: 250 },
    continueY: 497,
    achieveY: 543,
    footY: 596,
    foot: { width: 36, height: 48 },
    trash: { width: 42, height: 54 },
  };

/**
 * 「この回を続ける」の大きさ（TODO-073）。下段の ▶（次へ）と取り違えないよう、
 * 文字のボタンにしてある。
 */
const CONTINUE_BUTTON = { width: 190, height: 48 };

/**
 * 下段のアイコンボタンどうしの間隔。大きさは `L.foot`。本編の HUD と同じく
 * 幅を詰めて高さを取る（TODO-076）。タイトルへも同じ大きさで左上に置く。
 */
const FOOT_GAP = 14;

/** 頁の数を出す文字の幅（下段の並びに使う）。 */
const PAGE_TEXT_WIDTH = 64;

/**
 * 確認の枠の寸法。盤に依らない値なので、1 つの盤の `LAYOUTS` から取って
 * 固定する（この画面は盤を切り替えても組み直さないため）。
 */
const CONFIRM = LAYOUTS[BOARDS['8x8'].key].confirm;

/**
 * 行の右端へ出す印（TODO-027）。何に頼って解いた回かを、履歴 1 件の
 * `a` / `h`（TODO-024、TODO-028）から組み立てる。
 *
 * 記号やアイコンでなく短い言葉にしたのは、**凡例なしで意味が分かるように
 * するため**。「お」「ヒ」のように 1 文字へ縮めると、何を指すかが画面の
 * どこにも書かれない。一番狭い横画面の行（432）でも収まる。
 */
function marksOf(entry) {
  if (!entry) return '';
  const marks = [];
  if (entry.a) marks.push('おまかせ');
  if (entry.h) marks.push('ヒント');
  return marks.join('・');
}

/** 日時の表示で 2 桁に揃える。 */
function pad2(value) {
  return String(value).padStart(2, '0');
}

/**
 * クリアした日時。`toLocaleString()` は環境で桁数や区切りが変わり、行ごとの
 * 幅が揃わないので使わない。
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
    // 初めはタイトルで選んである盤を出す。
    this.boardKey = this.registry.get(BOARD_REGISTRY_KEY);
    this.palette = PALETTES[this.registry.get(PALETTE_REGISTRY_KEY)];
    this.entries = [];
    // 見ている盤の全解のデータ（TODO-022）。読み込むまでは null で、その間は
    // 完成形と達成度を出せない（一覧の日時と時間だけ先に出る）。
    this.solutions = null;
    this.found = [];
    this.page = 0;
    this.selected = 0;
    // チェックした回の解の番号（TODO-071）。頁を送っても残し、盤を
    // 切り替えたら `reload()` が作り直す。
    this.checked = new Set();

    const cx = SCREEN.width / 2;

    createTitleBar(this, L.titleY, () => this.goToTitle());
    this.add.text(cx, L.headingY, '記録', {
      fontFamily: FONT.family,
      fontSize: `${FONT.heading}px`,
      color: TEXT_COLORS.accent,
    }).setOrigin(0.5);

    // タイトルと同じ図のボタンにする（TODO-093）。名前は説明（tooltip）に回す。
    const boardChoices = Object.values(BOARDS).map((board) => ({
      ...board, icon: boardIcon(board), tooltip: `${board.label}（${board.note}）`,
    }));
    this.boardButtons = createChoiceRow(this, cx, L.chooseY, '盤', boardChoices,
                                        (choice) => this.selectBoard(choice.key),
                                        CHOICE_ICON_HEIGHT);

    this.createSelectAll();
    this.createList();
    this.createDetail();
    this.createFoot(cx);

    // タイトル行に添えたのでここでは出さない（TODO-093）。
    // アイコンの説明。ほかの部品より後に作って手前に出し、確認の枠（depth 10）
    // には隠れるようにする（本編の `DEPTH` と同じ重なり順）。
    this.tooltip = createTooltip(this);
    this.createConfirmDialog();
    this.reload();
  }

  /**
   * 一覧の上の行。左に「全部選ぶ」チェック（TODO-071。見えていない頁のぶんも
   * 対象）、右端（一覧の右端に揃える）にゴミ箱（TODO-093。前は下段にあった。
   * チェックした回を消す操作なので、チェックの行にまとめたほうが近い）。
   */
  createSelectAll() {
    const x = L.listX - L.listWidth / 2 + CHECKBOX.size / 2;
    this.selectAllButton = createButton(this, {
      x, y: L.selectAllY, width: CHECKBOX.size, height: CHECKBOX.size,
      label: '', onClick: () => this.toggleSelectAll(),
    });
    this.add.text(x + CHECKBOX.size / 2 + CHECKBOX.gap, L.selectAllY, '全部選ぶ', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0, 0.5);
    const { width: trashWidth, height: trashHeight } = L.trash;
    this.trashButton = createButton(this, {
      x: L.listX + L.listWidth / 2 - trashWidth / 2, y: L.selectAllY,
      width: trashWidth, height: trashHeight,
      label: '', icon: ICONS.trash, tooltip: 'チェックした回を消す', onClick: () => this.confirmTrash(),
    });
  }

  /**
   * 行は 1 頁ぶんだけ先に作り、文字と表示・非表示を差し替える（頁を送るたびに
   * 当たり判定を作り直すと、押した直後の行が入れ替わって二重に反応することが
   * あるため）。
   *
   * 行の左端にはいつもチェックボックスを出す（TODO-071）。行を押すと完成形を
   * 出し、チェックボックスはチェックを付け外しするだけ（当たり判定を分けてある）。
   */
  createList() {
    this.rowButtons = [];
    this.rowChecks = [];
    const rowLeft = L.listX - L.listWidth / 2;
    const rowX = rowLeft + CHECKBOX.size + CHECKBOX.gap + (L.listWidth - CHECKBOX.size - CHECKBOX.gap) / 2;
    const rowWidth = L.listWidth - CHECKBOX.size - CHECKBOX.gap;
    for (let i = 0; i < L.rowsPerPage; i += 1) {
      const y = L.listTop + ROW.height / 2 + i * (ROW.height + ROW.gap);
      const check = createButton(this, {
        x: rowLeft + CHECKBOX.size / 2, y, width: CHECKBOX.size, height: CHECKBOX.size,
        label: '', onClick: () => this.toggleRow(i),
      });
      this.rowChecks.push(check);
      const button = createButton(this, {
        x: rowX,
        y,
        width: rowWidth,
        height: ROW.height,
        label: '',
        fontSize: FONT.small,
        // 日時と時間は左端から、印は右端から（TODO-027）。中央寄せだと
        // 印の有無で日時の位置が行ごとにずれる。
        align: 'left',
        onClick: () => this.selectRow(i),
      });
      this.rowButtons.push(button);
    }

    // 「記録なし」は、行が並ぶはずの範囲の中ほどに置く。
    this.emptyText = this.add.text(
      L.listX,
      L.listTop + (ROW.height + ROW.gap) * L.rowsPerPage / 2,
      '記録なし',
      { fontFamily: FONT.family, fontSize: `${FONT.body}px`, color: TEXT_COLORS.dim },
    ).setOrigin(0.5);
  }

  /**
   * 下段。前へ・次へ・頁の数を 1 段にまとめる（TODO-071）。ゴミ箱は
   * 「全部選ぶ」の行へ移した（TODO-093。`createSelectAll()`）。
   * タイトルへは画面を離れるボタンなので、本編の HUD と同じく分けて、
   * 左上の見出しの高さに置く（TODO-076）。
   */
  createFoot(cx) {
    const { width: size, height } = L.foot;
    const total = size * 2 + PAGE_TEXT_WIDTH + FOOT_GAP * 2;
    let x = cx - total / 2;
    const next = (width) => {
      const center = x + width / 2;
      x += width + FOOT_GAP;
      return center;
    };

    this.prevButton = createButton(this, {
      x: next(size), y: L.footY, width: size, height,
      label: '', icon: ICONS.prevPage, tooltip: '前へ', onClick: () => this.turnPage(-1),
    });
    this.pageText = this.add.text(next(PAGE_TEXT_WIDTH), L.footY, '', {
      fontFamily: FONT.family,
      fontSize: `${FONT.small}px`,
      color: TEXT_COLORS.dim,
    }).setOrigin(0.5);
    this.nextButton = createButton(this, {
      x: next(size), y: L.footY, width: size, height,
      label: '', icon: ICONS.nextPage, tooltip: '次へ', onClick: () => this.turnPage(1),
    });
    // シーンの中では使わないが、`tools/capture.mjs` が吹き出しで指すため
    // プロパティに持たせる。
    this.titleButton = createButton(this, {
      x: SCREEN.margin + size / 2, y: L.headingY, width: size, height,
      label: '', icon: ICONS.title, tooltip: 'タイトルへ', onClick: () => this.goToTitle(),
    });
  }

  goToTitle() {
    audio.unlock();
    audio.button();
    this.scene.start('Title');
  }

  /** 選んだ 1 件の見出し、完成形を描く場所、達成度。 */
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
    this.continueButton = createButton(this, {
      x: L.boardBox.x + L.boardBox.width / 2, y: L.continueY,
      width: CONTINUE_BUTTON.width, height: CONTINUE_BUTTON.height,
      label: 'この回を続ける', fontSize: FONT.small, onClick: () => this.confirmContinue(),
    });
    // 達成度（TODO-022）。分母が盤で違う（8×8 は 65、6×10 は 2339）ので、
    // 盤の名前を頭に付ける。
    this.achieveText = this.add.text(
      L.boardBox.x + L.boardBox.width / 2, L.achieveY, '', {
        fontFamily: FONT.family,
        fontSize: `${FONT.small}px`,
        color: TEXT_COLORS.dim,
      },
    ).setOrigin(0.5);
  }

  /**
   * 消す・この回を続ける（TODO-073）の前の確認。ブラウザの `confirm()` は
   * 使わない（CLAUDE.md）ので、`game.js` のタイトルへ戻る確認と同じ組みで
   * Canvas 内に作る。背景の帯に当たり判定を持たせ、開いている間は後ろの
   * ボタンへクリックが抜けないようにする。
   */
  createConfirmDialog() {
    // 開くときに `showConfirm()` が入れ替える（TODO-031）。枠が出ていない間に
    // 呼ばれることは無いが、プロパティの有無が場面で変わらないよう先に作る。
    this.confirmAction = () => this.hideConfirm();
    const x = (SCREEN.width - CONFIRM.width) / 2;
    const y = (SCREEN.height - CONFIRM.height) / 2;
    const depth = 10;

    this.confirmParts = [
      this.add.rectangle(0, 0, SCREEN.width, SCREEN.height, BACKDROP.color, BACKDROP.alpha)
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
      // 何をするか（TODO-031、TODO-071）は開くときに `confirmAction` へ
      // 持たせる。枠を組み直さず文言と行き先だけを差し替えれば、確認の見え方が
      // 分かれない。
      onClick: () => this.confirmAction(),
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

  /**
   * 行のチェックを付け外しする（TODO-071）。チェックは番号（`entry.no`）で
   * 持つので、全解のデータが届く前（番号がまだ無い件）は付けられない。
   * `removeHistoryMany()` も番号で件を指すため、番号が無いと何を消すかが決まらない。
   */
  toggleRow(index) {
    const entry = this.entries[this.page * L.rowsPerPage + index];
    if (!entry || !entry.no || this.solutions === null) return;
    audio.unlock();
    audio.button();
    if (this.checked.has(entry.no)) this.checked.delete(entry.no);
    else this.checked.add(entry.no);
    this.refresh();
  }

  /**
   * 「全部選ぶ」。見えている頁だけでなく、**その盤の記録すべて**が対象
   * （TODO-071）。既に全部選んでいれば外す。
   */
  toggleSelectAll() {
    if (this.solutions === null || this.entries.length === 0) return;
    audio.unlock();
    audio.button();
    const nos = this.entries.filter((entry) => entry.no).map((entry) => entry.no);
    const allChecked = nos.length > 0 && nos.every((no) => this.checked.has(no));
    nos.forEach((no) => (allChecked ? this.checked.delete(no) : this.checked.add(no)));
    this.refresh();
  }

  /** 端では押せなくしてあるが、ここでも範囲を守る。 */
  turnPage(step) {
    const pages = this.pageCount();
    const next = Math.min(Math.max(this.page + step, 0), pages - 1);
    if (next === this.page) return;
    audio.unlock();
    audio.button();
    this.page = next;
    this.refresh();
  }

  /** チェックした回を消す前の確認（TODO-071）。 */
  confirmTrash() {
    if (this.checked.size === 0) return;
    this.showConfirm(
      `${BOARDS[this.boardKey].label} の記録 ${this.checked.size} 件を消しますか？\nもとに戻せません`,
      () => this.doTrash(),
    );
  }

  /**
   * 選んでいる回の完成形から本編を始める（TODO-073）。遊びかけは盤ごとに
   * 1 つだけなので、あれば消えてよいかを確かめてから置き換える。
   */
  confirmContinue() {
    if (this.continueProgress() === null) return;
    if (loadProgress(this.boardKey) === null) {
      audio.unlock();
      this.doContinue();
      return;
    }
    this.showConfirm(
      `${BOARDS[this.boardKey].label} の遊びかけの盤面が消えます\nこの回を続けますか？`,
      () => this.doContinue(),
    );
  }

  /** 選んでいる回から作った遊びかけ。完成形を引けないうちは `null`。 */
  continueProgress() {
    const entry = this.entries[this.selected];
    if (!entry || !entry.no || this.solutions === null) return null;
    const cells = solutionCells(this.solutions, entry.no);
    return cells === null ? null : progressFromRecord(entry, cells, BOARDS[this.boardKey]);
  }

  /**
   * 遊びかけを置き換えて本編へ移る。遊ぶ盤は `registry` で渡すので、ここで
   * 見ている盤に書き換える（この画面で盤を切り替えただけでは書き換えない）。
   * `progress` を本編へ直接渡すのは、保存できない環境でも始められるようにするため。
   */
  doContinue() {
    const progress = this.continueProgress();
    if (progress === null) return;
    audio.button();
    saveProgress(this.boardKey, progress);
    this.registry.set(BOARD_REGISTRY_KEY, this.boardKey);
    this.scene.start('Game', { progress });
  }

  showConfirm(text, action) {
    audio.unlock();
    audio.button();
    this.confirmAction = action;
    this.confirmText.setText(text);
    this.confirmParts.forEach((part) => part.setVisible(true));
  }

  hideConfirm() {
    audio.button();
    this.confirmParts.forEach((part) => part.setVisible(false));
  }

  /**
   * チェックした回をまとめて消す（TODO-071）。達成度とおまかせの番号の扱いは
   * `removeRecords()`（`storage.js`）の説明にある。
   *
   * 消したあとの選び位置と頁は `selectionAfterRemoval()`（`logic.js`）で出す。
   */
  doTrash() {
    audio.button();
    this.confirmParts.forEach((part) => part.setVisible(false));
    if (this.solutions === null || this.checked.size === 0) return;
    const removed = [...this.checked];
    const next = selectionAfterRemoval(this.entries.map((entry) => entry.no),
                                       this.selected, this.page, removed, L.rowsPerPage);
    this.entries = removeRecords(this.boardKey, removed, this.solutions);
    this.checked.clear();
    this.found = loadFound(this.boardKey, this.solutions.canonical.length);
    this.selected = next.selected;
    this.page = next.page;
    this.refresh();
  }

  // ---- 表示 -------------------------------------------------------------

  /**
   * 履歴を読み直して先頭から見せ直す。
   *
   * 完成形は番号から引くので、全解のデータが要る（TODO-022）。待つ間も
   * 一覧の日時と時間は出せるので、先に一度描いてから届いたぶんを足す。
   * 待つ間に盤を切り替えられることがあるので、**届いたときに見ている盤が
   * 変わっていたら捨てる**。
   *
   * チェック（`this.checked`）は盤を切り替えたら消す（TODO-071）。別の盤の番号を
   * 持ち越しても意味が無いため。
   */
  reload() {
    const spec = BOARDS[this.boardKey];
    this.solutions = null;
    this.found = [];
    this.entries = loadHistory(this.boardKey);
    this.page = 0;
    this.selected = 0;
    this.checked = new Set();
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

  /** 一覧・頁送り・完成形を、今の頁・選んでいる 1 件・チェックに合わせて出し直す。 */
  refresh() {
    const pages = this.pageCount();
    const ready = this.solutions !== null;
    this.rowButtons.forEach((button, i) => {
      const index = this.page * L.rowsPerPage + i;
      const entry = this.entries[index];
      const check = this.rowChecks[i];
      button.setVisible(!!entry);
      check.setVisible(!!entry);
      if (!entry) return;
      button.setLabel(`${formatDate(entry.at)}　${formatTime(entry.ms)}`);
      button.setMark(marksOf(entry));
      button.setSelected(index === this.selected);
      // チェックできるのは番号を持つ件だけ（TODO-071。`toggleRow()` と同じ理由）。
      const checkable = ready && !!entry.no;
      check.setEnabled(checkable);
      const isChecked = checkable && this.checked.has(entry.no);
      check.setSelected(isChecked);
      check.setIcon(isChecked ? ICONS.check : null);
    });
    const empty = this.entries.length === 0;
    this.emptyText.setVisible(empty);
    // 頁送りは 1 頁に収まっていても出す（端で押せなくする）。1 件も無いときだけ
    // 頁の数を消す。送る先が無いことと、記録が無いことは別なので。
    this.pageText.setText(empty ? '' : `${this.page + 1} / ${pages}`);
    this.prevButton.setEnabled(!empty && this.page > 0);
    this.nextButton.setEnabled(!empty && this.page < pages - 1);

    // 「全部選ぶ」は、番号を持つ件が 1 件以上あり、全部（見えていない頁のぶんも）
    // にチェックが付いているときだけ選んである見た目にする。
    const nos = this.entries.filter((entry) => entry.no).map((entry) => entry.no);
    const allChecked = ready && nos.length > 0 && nos.every((no) => this.checked.has(no));
    this.selectAllButton.setEnabled(ready && nos.length > 0);
    this.selectAllButton.setSelected(allChecked);
    this.selectAllButton.setIcon(allChecked ? ICONS.check : null);

    this.trashButton.setEnabled(this.checked.size > 0);
    this.continueButton.setVisible(!empty);
    this.continueButton.setEnabled(this.continueProgress() !== null);

    const entry = this.entries[this.selected];
    // 何番の解かも添える（TODO-022）。一覧の行を日時と時間だけで揃えたいので、
    // 番号は見出しにだけ出す。番号はデータが届いてから付く（古い形の件は
    // 読み替えたあとに入る）ので、無いうちは日時と時間だけ。
    // 印は行にも出るが（TODO-027）、見出しにも添える。行の印は一覧を見渡す
    // ため、こちらは今どの回を見ているかを確かめるため。
    // **2 行に分ける**のは、1 行に並べると完成形の枠より横にはみ出すため（TODO-026）。
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
   * 選んだ回の完成形を縮小して描く（描き方は `drawMiniBoard()`）。
   *
   * 盤面は**番号から引く**（TODO-022）。履歴は 60 マスぶんの文字列を持たない
   * ので、データが届くまでは描けない。
   */
  drawMini(entry) {
    this.mini.clear();
    if (!entry || this.solutions === null) return;
    const cells = solutionCells(this.solutions, entry.no);
    if (cells === null) return;
    drawMiniBoard(this.mini, BOARDS[this.boardKey], cells, this.palette, L.boardBox);
  }
}
