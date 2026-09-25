/**
 * Phaser の設定とシーンの登録。
 *
 * Phaser は CDN からグローバルとして読み込む（import しない）。
 * 内部解像度は `SCREEN` が起動時の向きから選んだ 1 組（横 960×640 / 縦
 * 640×1136）に固定し、拡縮は `Scale.FIT` に任せる。盤の座標を実際の画面幅から
 * 切り離し、`logic.js` の升目の計算がそのまま画面に対応するようにするため。
 * 盤の大きさを選び直しても内部解像度は変えない。
 */

import { COLORS, SCREEN } from './config.js';
import BootScene from './scenes/boot.js';
import TitleScene from './scenes/title.js';
import GameScene from './scenes/game.js';
import ClearScene from './scenes/clear.js';
import RecordsScene from './scenes/records.js';
import DemoScene from './scenes/demo.js';

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: SCREEN.width,
  height: SCREEN.height,
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // ドラッグ中に向きを変える入力（TODO-069）が使う。ゲーム全体の
  // InputManager / MouseManager に効く値なので、ここで 1 回だけ設定する
  // （シーンへ入るたびに設定すると、ポインタと `contextmenu` のリスナーが積み上がる）。
  // `activePointers: 2` で 2 本目の指も受ける。
  input: {
    activePointers: 2,
    disableContextMenu: true,
  },
  scene: [BootScene, TitleScene, GameScene, ClearScene, RecordsScene, DemoScene],
});

// ここまで来れば起動できている。`index.html` の案内を隠す。
const notice = document.getElementById('notice');
if (notice) notice.hidden = true;
