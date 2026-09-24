/**
 * 画面部品（ボタンと枠）の組み立て。
 *
 * タイトル・本編・クリア・記録・デモの 5 シーンが同じ見た目のボタンを使うので、
 * 同じ描画をシーンごとに書かずに済むようここへ寄せた。
 * 状態はモジュールに持たず、作った Container のプロパティに持たせる。
 */

import {
  ACRYLIC, COLORS, FONT, HINT_BADGE, SCREEN, TEXT_COLORS, TILE, TOOLTIP, VERSION,
} from './config.js';

/**
 * 右下にバージョンを出す。問い合わせのときにどの版かを画面から読めるように、
 * すべての画面に同じ位置で出す（TODO-041）。
 */
export function createVersionText(scene) {
  return scene.add.text(SCREEN.width - 12, SCREEN.height - 12, VERSION, {
    fontFamily: FONT.family,
    fontSize: `${FONT.small}px`,
    color: TEXT_COLORS.dim,
  }).setOrigin(1, 1).setAlpha(0.6);
}

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
 * 穴に嵌めた透明アクリルふうの板（TODO-051）。本編（デモも使い回す）と
 * 記録の完成形の 2 か所で同じ見た目にするため、ここに置く。
 *
 * 光の筋は板の外へはみ出さないよう、対角に沿った帯を矩形で切った多角形で
 * 塗る（Graphics の塗りに切り抜きが無いため）。`x + y = t` の線が矩形を
 * 横切る 2 点を結び、帯が角をまたぐときだけその角を頂点に足す。
 */
export function drawAcrylic(g, x, y, width, height) {
  g.fillStyle(ACRYLIC.fill, ACRYLIC.fillAlpha);
  g.fillRect(x, y, width, height);

  const lower = (t) => ({ x: x + Math.max(0, t - height), y: y + Math.min(t, height) });
  const upper = (t) => ({ x: x + Math.min(t, width), y: y + Math.max(0, t - width) });
  for (const streak of ACRYLIC.streaks) {
    const t1 = streak.from * (width + height);
    const t2 = streak.to * (width + height);
    const points = [lower(t1), upper(t1)];
    if (t1 < width && width < t2) points.push({ x: x + width, y });
    points.push(upper(t2), lower(t2));
    if (t1 < height && height < t2) points.push({ x, y: y + height });
    g.fillStyle(ACRYLIC.fill, streak.alpha);
    g.fillPoints(points, true);
  }

  // 右と下の厚み。上と左を明るく、下と右を暗くするピースのマス（`TILE`）に揃える。
  const th = ACRYLIC.thickness;
  g.fillStyle(TILE.shadow, ACRYLIC.thicknessAlpha);
  g.fillRect(x, y + height - th, width, th);
  g.fillRect(x + width - th, y, th, height - th);

  const inset = ACRYLIC.innerInset;
  g.lineStyle(ACRYLIC.innerWidth, ACRYLIC.edge, ACRYLIC.innerAlpha);
  g.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
  const half = ACRYLIC.edgeWidth / 2;
  g.lineStyle(ACRYLIC.edgeWidth, ACRYLIC.edge, ACRYLIC.edgeAlpha);
  g.strokeRect(x + half, y + half, width - ACRYLIC.edgeWidth, height - ACRYLIC.edgeWidth);
}

/**
 * ヒント表示の「解ける／解なし」の札（TODO-045）。本編とデモの両方が使うので
 * ここに 1 つだけ置き、文言（`ok`→解ける、`dead`→解なし）の対応もここにだけ持つ。
 *
 * 角丸の帯 + 文字で、色は `ok` が緑（`COLORS.success`）、`dead` が赤
 * （`COLORS.danger`）。幅は文字に合わせて `setState()` のたびに測り直す
 * （「解ける」「解なし」は同じ文字数だが、フォントの実測に委ねたほうが確実）。
 *
 * `originX` は 0 で `x` を左端、1 で右端に固定する（本編は左寄せ、デモは
 * 右寄せで置くため）。`state` に `null` を渡すと帯ごと隠す。
 */
export function createHintBadge(scene, x, y, originX = 0) {
  const face = scene.add.graphics();
  const label = scene.add.text(0, y, '', {
    fontFamily: FONT.family,
    fontSize: `${FONT.hud}px`,
    color: TEXT_COLORS.normal,
  }).setOrigin(0.5, 0.5);

  const TEXT = { ok: '解ける', dead: '解なし' };
  const FILL = { ok: COLORS.success, dead: COLORS.danger };

  const badge = {};
  badge.setState = (state) => {
    face.clear();
    if (!state) {
      label.setText('');
      return badge;
    }
    label.setText(TEXT[state]);
    const width = label.width + HINT_BADGE.padX * 2;
    const left = originX === 0 ? x : x - width;
    label.setPosition(left + width / 2, y);
    face.fillStyle(FILL[state], 1);
    face.fillRoundedRect(left, y - HINT_BADGE.height / 2, width, HINT_BADGE.height, HINT_BADGE.radius);
    return badge;
  };
  badge.setDepth = (depth) => {
    face.setDepth(depth);
    label.setDepth(depth);
    return badge;
  };

  badge.setState(null);
  return badge;
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
 *
 * 選択肢に `icon` があれば文字の代わりに図を描き、`tooltip` があれば説明を出す
 * （タイトルの盤・色。TODO-046）。図にするなら名前を説明に回すこと。
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
      icon: choice.icon,
      tooltip: choice.tooltip,
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
 *
 * `icon`（`icons.js` の描画関数）を渡すと、文字の代わりにアイコンを描く。
 * HUD のボタンは 6 個並べると文字が窮屈になるため（TODO-042）。アイコンだけでは
 * 何のボタンか分からないことがあるので、`tooltip` に説明を渡すと、マウスでは
 * 載せたとき、タッチでは押したときに `scene.tooltip`（`createTooltip()` で作る。
 * 1 シーンに 1 つ）へ出す。`setIcon()`・`setTooltip()` で差し替えられる。
 */

/** 左寄せのボタンで、ラベル・印と枠の間に空ける分。 */
const BUTTON_PAD = 14;

export function createButton(scene, options) {
  const {
    x, y, width, height, label, onClick,
    fontSize = FONT.body, align = 'center', mark = '',
  } = options;
  let { icon = null, tooltip = null } = options;

  const container = scene.add.container(x, y);
  const face = scene.add.graphics();
  const iconGraphics = scene.add.graphics();
  const left = align === 'left';
  const text = scene.add.text(left ? -width / 2 + BUTTON_PAD : 0, 0, icon ? '' : label, {
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
  container.add([face, iconGraphics, text, markText]);

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
    // アイコンも文字と同じ規則で色を変える。Graphics は数値の色を取るので
    // `TEXT_COLORS` に対応する `COLORS` の値を使う。
    let iconColor = COLORS.text;
    if (!container.enabled) iconColor = COLORS.buttonTextDisabled;
    else if (container.selected) iconColor = COLORS.accent;
    iconGraphics.clear();
    if (icon) icon(iconGraphics, iconColor);
    // 印もラベルと同じ状態に連れていく。選んだ行だけ印が地の色のまま残ると、
    // 行が選ばれていることが伝わりにくい（TODO-027）。
    let markColor = TEXT_COLORS.dim;
    if (!container.enabled) markColor = TEXT_COLORS.disabled;
    else if (container.selected) markColor = TEXT_COLORS.accent;
    markText.setColor(markColor);
  };

  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });
  // 説明はマウスとタッチで出し方を分ける（`pointer.wasTouch` で見分ける）。
  // Phaser はタッチでも over / out を出すので、タッチの over では出さず、
  // out でも消さない（押した直後に出した説明を、指を離したときの out で
  // すぐ消してしまわないため）。押せないボタンでも出す——なぜ押せないかは
  // 分からなくても、何のボタンかは分かるように。
  const tip = () => (tooltip ? scene.tooltip : null);
  container.on('pointerover', (pointer) => {
    container.hovered = true;
    redraw();
    if (!pointer.wasTouch) tip()?.showLater(container, tooltip);
  });
  container.on('pointerout', (pointer) => {
    container.hovered = false;
    container.pressed = false;
    redraw();
    if (!pointer.wasTouch) tip()?.hide();
  });
  // ドラッグ中は HUD のボタンを受けない（利用者が決めた。TODO-069）。
  // ドラッグ中の 2 本目の指はどこを押しても向きの変更だけにするため、
  // ボタンの上に乗っても `onClick` を走らせない（`scene.drag` は本編・
  // デモだけが持つので、他の画面では常に偽で今までどおり動く）。
  container.on('pointerdown', () => {
    if (scene.drag) return;
    container.pressed = true;
    redraw();
    tip()?.hide();
  });
  container.on('pointerup', (pointer) => {
    if (scene.drag) return;
    const wasPressed = container.pressed;
    container.pressed = false;
    redraw();
    if (wasPressed && container.enabled) onClick();
    // 動作のあとに出すので、音の ON / OFF は切り替えたあとの説明になる。
    if (wasPressed && pointer.wasTouch) tip()?.flash(container, tooltip);
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
  container.setIcon = (value) => {
    icon = value;
    redraw();
    return container;
  };
  container.setTooltip = (value) => {
    tooltip = value;
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

/**
 * ボタンの説明を出す枠。**1 シーンに 1 つだけ作り、シーンの `tooltip` に持たせる**
 * （TODO-042）。ボタンごとに作ると、隣のボタンへ移ったときに前の説明が
 * 残って重なりうるため。状態（消すまでのタイマー）も
 * この Container に持たせ、モジュールには置かない。
 *
 * HUD は画面の上端にあるので、ボタンの下へ出す。左右は画面の内側に収める。
 * 当たり判定は持たせない（説明がほかのボタンを塞がないように）。
 * 重なりの順は呼ぶ側が `setDepth()` で決める。
 */
export function createTooltip(scene) {
  const box = scene.add.container(0, 0).setVisible(false);
  const back = scene.add.graphics();
  const label = scene.add.text(TOOLTIP.padX, TOOLTIP.padY, '', {
    fontFamily: FONT.family,
    fontSize: `${FONT.small}px`,
    color: TEXT_COLORS.normal,
  });
  box.add([back, label]);
  box.timer = null;

  const cancel = () => {
    if (box.timer) box.timer.remove(false);
    box.timer = null;
  };

  const show = (button, text) => {
    label.setText(text);
    const width = label.width + TOOLTIP.padX * 2;
    const height = label.height + TOOLTIP.padY * 2;
    back.clear();
    back.fillStyle(COLORS.panel, 1);
    back.fillRoundedRect(0, 0, width, height, 6);
    back.lineStyle(2, COLORS.buttonEdge, 1);
    back.strokeRoundedRect(0, 0, width, height, 6);
    const x = Phaser.Math.Clamp(button.x - width / 2,
      SCREEN.margin, SCREEN.width - SCREEN.margin - width);
    // 下に出すと画面からはみ出すボタン（記録の画面の下段。TODO-071）では上に出す。
    const below = button.y + button.height / 2 + TOOLTIP.gap;
    const y = below + height > SCREEN.height - SCREEN.margin
      ? button.y - button.height / 2 - TOOLTIP.gap - height
      : below;
    box.setPosition(x, y);
    box.setVisible(true);
  };

  /** マウス: 少し待ってから出す。横切っただけで出さないため。 */
  box.showLater = (button, text) => {
    cancel();
    box.timer = scene.time.delayedCall(TOOLTIP.hoverDelayMs, () => {
      box.timer = null;
      show(button, text);
    });
  };
  /** タッチ: ホバーが無いので、押した動作と一緒に出す（時間は `TOOLTIP.touchMs` の説明）。 */
  box.flash = (button, text) => {
    cancel();
    show(button, text);
    box.timer = scene.time.delayedCall(TOOLTIP.touchMs, () => {
      box.timer = null;
      box.hide();
    });
  };
  box.hide = () => {
    cancel();
    box.setVisible(false);
  };
  // ボタンから 1 回の移動で Canvas の外へ出ると `pointerout` が来ないので、
  // 説明が盤の上に残らないよう `gameout` でも消す。
  scene.input.on(Phaser.Input.Events.GAME_OUT, box.hide);
  box.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.input.off(Phaser.Input.Events.GAME_OUT, box.hide);
  });
  return box;
}
