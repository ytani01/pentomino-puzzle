/**
 * Phaser の設定とシーンの登録。
 *
 * Phaser は CDN からグローバルとして読み込む（このファイルは import しない）。
 * 内部解像度は `LAYOUT` が起動時の向きから選んだ 1 組（横 960×640 / 縦
 * 640×960）で、以後は変えずに `Scale.FIT` へ任せる。盤の座標計算を実際の
 * 画面幅から切り離しておけるので、`logic.js` の升目の計算がそのまま画面に対応する。
 */

import { COLORS, LAYOUT } from './config.js';
import BootScene from './scenes/boot.js';
import TitleScene from './scenes/title.js';
import GameScene from './scenes/game.js';
import ClearScene from './scenes/clear.js';

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: LAYOUT.width,
  height: LAYOUT.height,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene, ClearScene],
});

// ここまで来たら起動できている。`index.html` の案内を引っ込める。
const notice = document.getElementById('notice');
if (notice) notice.hidden = true;
