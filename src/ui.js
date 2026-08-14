/**
 * 画面部品（ボタンと枠）の組み立て。
 *
 * タイトル・本編・クリアの 3 シーンが同じ見た目のボタンを使うので、
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
 * ボタン。中心を `(x, y)` に置く。
 *
 * 戻り値の Container には `setEnabled()` と `setLabel()` を生やしてある。
 * ヒントや Undo は押せない場面があるので、押せるかどうかを見た目に出す必要がある。
 */
export function createButton(scene, options) {
  const {
    x, y, width, height, label, onClick,
    fontSize = FONT.body,
  } = options;

  const container = scene.add.container(x, y);
  const face = scene.add.graphics();
  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT.family,
    fontSize: `${fontSize}px`,
    color: TEXT_COLORS.normal,
  }).setOrigin(0.5);
  container.add([face, text]);

  container.enabled = true;
  container.hovered = false;
  container.pressed = false;

  const redraw = () => {
    let fill = COLORS.buttonFace;
    if (!container.enabled) fill = COLORS.panel;
    else if (container.pressed) fill = COLORS.buttonFaceDown;
    else if (container.hovered) fill = COLORS.buttonFaceHover;
    face.clear();
    face.fillStyle(fill, 1);
    face.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    face.lineStyle(2, container.enabled ? COLORS.buttonEdge : COLORS.panelEdge, 1);
    face.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);
    text.setColor(container.enabled ? TEXT_COLORS.normal : TEXT_COLORS.disabled);
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

  redraw();
  return container;
}
