/**
 * 画面部品（ボタンと枠）の組み立て。
 *
 * タイトル・本編・クリア・記録の 4 シーンが同じ見た目のボタンを使うので、
 * 同じ描画をシーンごとに書かずに済むようここへ寄せた。
 * 状態はモジュールに持たず、作った Container のプロパティに持たせる。
 */

import { COLORS, FONT, TEXT_COLORS } from './config.js';

/**
 * 縦に積む部品の上端 `y` をまとめて出す。
 *
 * 内部解像度が画面の向きで変わるので（TODO-011）、タイトルとクリアの画面は
 * 固定の `y` を持てない。高さと、次の部品までの間隔だけを並べておき、
 * 余った高さを上下へ配る。`bias` は余りのうち上へ回す割合で、0 なら上寄せ、
 * 1 なら下寄せ、0.5 で中央。横画面での今までの位置を保つ値を各シーンが渡す。
 *
 * @param {{height: number, gap: number}[]} rows 上から順の部品
 * @param {number} available 収める範囲の高さ
 * @param {number} bias 余りのうち上へ回す割合
 * @returns {number[]} `rows` と同じ並びの上端 `y`
 */
export function stackTops(rows, available, bias) {
  const used = rows.reduce((sum, row) => sum + row.height + row.gap, 0);
  let y = (available - used) * bias;
  return rows.map((row) => {
    const top = y;
    y += row.height + row.gap;
    return top;
  });
}

/** 角丸の板。HUD の帯やトレイの下地に使う。 */
export function createPanel(scene, x, y, width, height, radius = 10) {
  const g = scene.add.graphics();
  g.fillStyle(COLORS.panel, 1);
  g.fillRoundedRect(x, y, width, height, radius);
  g.lineStyle(2, COLORS.panelEdge, 1);
  g.strokeRoundedRect(x, y, width, height, radius);
  return g;
}

/**
 * 選ぶボタン 1 個の大きさと間隔、行の頭に置くラベルの幅。
 * ラベルの幅は 1 文字ぶんに間隔を足した値。
 */
const CHOICE_BUTTON = {
  width: 150, height: 46, gap: 16, labelWidth: 48,
};

/**
 * ラベル 1 つと、選択肢ぶんのボタンを 1 行に並べる。中心を `(cx, y)` に置く。
 * 戻り値のボタンには選択肢のキーを持たせ、選び直したときの塗り分けに使う。
 *
 * タイトルの盤・色の選択だけだった頃はあちらの private メソッドだったが、
 * 記録の画面（TODO-008）も盤を切り替えるのに同じ行を使うのでここへ寄せた。
 * 「今どれが選ばれているか」の見え方を 2 つの画面で揃えるため。
 */
export function createChoiceRow(scene, cx, y, label, choices, onSelect) {
  const buttons = choices.length * CHOICE_BUTTON.width
    + (choices.length - 1) * CHOICE_BUTTON.gap;
  const left = cx - (CHOICE_BUTTON.labelWidth + buttons) / 2;
  scene.add.text(left, y, label, {
    fontFamily: FONT.family,
    fontSize: `${FONT.body}px`,
    color: TEXT_COLORS.dim,
  }).setOrigin(0, 0.5);
  return choices.map((choice, index) => {
    const button = createButton(scene, {
      x: left + CHOICE_BUTTON.labelWidth + CHOICE_BUTTON.width / 2
        + index * (CHOICE_BUTTON.width + CHOICE_BUTTON.gap),
      y,
      width: CHOICE_BUTTON.width,
      height: CHOICE_BUTTON.height,
      label: choice.label,
      onClick: () => onSelect(choice),
    });
    button.choiceKey = choice.key;
    return button;
  });
}

/**
 * ボタン。中心を `(x, y)` に置く。
 *
 * 戻り値の Container には `setEnabled()`・`setLabel()`・`setSelected()`・
 * `setMark()` を生やしてある。ヒントや Undo は押せない場面があるので押せるか
 * どうかを、タイトルの盤の選択は 2 つのうちどちらを選んでいるかを、見た目に
 * 出す必要がある。
 *
 * `align` を `'left'` にすると、ラベルを左端から `PAD` だけ空けて左寄せにし、
 * `mark`（あれば）を右端へ右寄せで置く（TODO-027）。記録の一覧の行のように、
 * **中身の長さが行ごとに変わる**ところで使う——中央寄せのままだと、印の
 * 有無で日時や時間の位置が行ごとにずれて読みにくい。
 */

/** 左寄せのボタンで、ラベル・印と枠の間に空ける分。 */
const BUTTON_PAD = 14;

export function createButton(scene, options) {
  const {
    x, y, width, height, label, onClick,
    fontSize = FONT.body, align = 'center', mark = '',
  } = options;

  const container = scene.add.container(x, y);
  const face = scene.add.graphics();
  const left = align === 'left';
  const text = scene.add.text(left ? -width / 2 + BUTTON_PAD : 0, 0, label, {
    fontFamily: FONT.family,
    fontSize: `${fontSize}px`,
    color: TEXT_COLORS.normal,
  }).setOrigin(left ? 0 : 0.5, 0.5);
  // 印はラベルより 1 段落として出す（行の主役は日時と時間なので）。
  const markText = scene.add.text(width / 2 - BUTTON_PAD, 0, mark, {
    fontFamily: FONT.family,
    fontSize: `${Math.round(fontSize * 0.85)}px`,
    color: TEXT_COLORS.dim,
  }).setOrigin(1, 0.5);
  container.add([face, text, markText]);

  container.enabled = true;
  container.hovered = false;
  container.pressed = false;
  container.selected = false;

  const redraw = () => {
    // 選んである状態は「押し込んだ面 + 強調色の枠と文字」で出す。塗りだけ
    // 変えても、隣に並べたときにどちらを選んでいるか一目で分からないため。
    let fill = COLORS.buttonFace;
    if (!container.enabled) fill = COLORS.panel;
    else if (container.pressed || container.selected) fill = COLORS.buttonFaceDown;
    else if (container.hovered) fill = COLORS.buttonFaceHover;
    let edge = COLORS.buttonEdge;
    if (!container.enabled) edge = COLORS.panelEdge;
    else if (container.selected) edge = COLORS.accent;
    face.clear();
    face.fillStyle(fill, 1);
    face.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    face.lineStyle(2, edge, 1);
    face.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    let color = TEXT_COLORS.normal;
    if (!container.enabled) color = TEXT_COLORS.disabled;
    else if (container.selected) color = TEXT_COLORS.accent;
    text.setColor(color);
    // 印もラベルと同じ状態に連れていく。選んだ行だけ印が地の色のまま残ると、
    // 行が選ばれていることが伝わりにくい（TODO-027）。
    let markColor = TEXT_COLORS.dim;
    if (!container.enabled) markColor = TEXT_COLORS.disabled;
    else if (container.selected) markColor = TEXT_COLORS.accent;
    markText.setColor(markColor);
  };

  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  container.on('pointerover', () => { container.hovered = true; redraw(); });
  container.on('pointerout', () => { container.hovered = false; container.pressed = false; redraw(); });
  container.on('pointerdown', () => { container.pressed = true; redraw(); });
  container.on('pointerup', () => {
    const wasPressed = container.pressed;
    container.pressed = false;
    redraw();
    if (wasPressed && container.enabled) onClick();
  });

  container.setEnabled = (value) => {
    container.enabled = !!value;
    redraw();
    return container;
  };
  container.setLabel = (value) => {
    text.setText(value);
    return container;
  };
  container.setMark = (value) => {
    markText.setText(value);
    return container;
  };
  container.setSelected = (value) => {
    container.selected = !!value;
    redraw();
    return container;
  };

  redraw();
  return container;
}
