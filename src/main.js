/**
 * Phaser の設定とシーンの登録。
 *
 * Phaser は CDN からグローバルとして読み込む（このファイルは import しない）。
 * 内部解像度は `SCREEN` が起動時の向きから選んだ 1 組（横 960×640 / 縦
 * 640×1136）で、以後は変えずに `Scale.FIT` へ任せる。盤の座標計算を実際の
 * 画面幅から切り離しておけるので、`logic.js` の升目の計算がそのまま画面に対応する。
 * 盤の大きさ（8×8 と 6×10）を選び直しても内部解像度は変わらない。
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
  // ドラッグ中に向きを変える入力（本編。TODO-069）が使う。ゲーム全体の
  // InputManager / MouseManager に効く値なので、ここで 1 回だけ設定する
  // （`GameScene.create()` から毎回呼ぶと、シーンへ入り直すたびにポインタが
  // 増え、`contextmenu` のリスナーも積み上がる。TODO-069 レビューの要修正 4）。
  // `activePointers: 2` で、既定の 1 本に加えてもう 1 本（2 本目の指）を受ける。
  input: {
    activePointers: 2,
    disableContextMenu: true,
  },
  scene: [BootScene, TitleScene, GameScene, ClearScene, RecordsScene, DemoScene],
});

// ここまで来たら起動できている。`index.html` の案内を引っ込める。
const notice = document.getElementById('notice');
if (notice) notice.hidden = true;
