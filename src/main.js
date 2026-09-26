/**
 * Phaser の設定とシーンの登録。
 *
 * Phaser は CDN からグローバルとして読み込む（import しない）。
 * 内部解像度は画面の向きごとの 1 組（`SCREENS`。横 960×640 / 縦 640×1136）で、
 * 拡縮は `Scale.FIT` に任せる。ボードの座標を実際の画面幅から切り離し、
 * `logic.js` の升目の計算がそのまま画面に対応するようにするため。
 * ボードの大きさを選び直しても内部解像度は変えない。変えるのは向きが変わったときだけ
 * （`followOrientation()`。TODO-095）。
 */

import { COLORS, ORIENTATION_REGISTRY_KEY, SCREENS } from './config.js';
import BootScene from './scenes/boot.js';
import TitleScene from './scenes/title.js';
import GameScene from './scenes/game.js';
import ClearScene from './scenes/clear.js';
import RecordsScene from './scenes/records.js';
import DemoScene from './scenes/demo.js';

/** 今のウィンドウの向き。正方形は横として扱う。 */
function windowOrientation() {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

const startOrientation = windowOrientation();

window.game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: SCREENS[startOrientation].width,
  height: SCREENS[startOrientation].height,
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

window.game.registry.set(ORIENTATION_REGISTRY_KEY, startOrientation);

/**
 * シーンが組み立ての途中の状態。まだ一度も始めていないシーンは `INIT` のままなので
 * 含めない。
 */
const SCENE_BUSY = [Phaser.Scenes.START, Phaser.Scenes.LOADING, Phaser.Scenes.CREATING];

/**
 * シーンの切り替えが済んでいるか。`scene.start()`・`restart()` は予約で、次の
 * フレームの頭で処理される。予約が残っている間に作り直すと、予約どうしが
 * かみ合わず、シーンが 2 つ動いたり、控えた状態を 1 回目の `create()` が使って
 * 捨てたりする（TODO-095 のレビュー）。予約の列は Phaser が公開していないので
 * `_queue` を読む（Phaser 3.90.0 に固定してあるため）。
 */
function scenesSettled(game) {
  return game.scene._queue.length === 0
    && game.scene.getScenes(false).every((scene) => !SCENE_BUSY.includes(scene.sys.settings.status));
}

/**
 * 向きが変わったら、内部解像度を新しい向きの組にし、動いているシーン
 * （止めてある本編も含む）を今の状態のまま作り直す（TODO-095）。
 * 作り直し方と持ち越す状態は各シーンの `relayout()` が決める。
 *
 * ページを読み込み直さないのは、一手戻す履歴・デモの探索の途中・開いている
 * 確認が消えるため。`resize` はウィンドウの幅を変えるだけでも何度も来るので、
 * 向きが変わったときだけ動く。登録はゲーム全体でここ 1 回だけ（シーンに入る
 * たびに足すと積み上がる）。
 *
 * その場では作り直さず、フレームの終わり（`poststep`）ごとに見て、シーンの
 * 切り替えが済んだところで**そのときの向きで 1 回だけ**作り直す（`relayoutWhenSettled()`）。
 * 待っている間にまた向きが変わっても、見張りは 1 つのまま。作り直しの予約が
 * 処理される前には次を作り直さないので、控えた状態は必ず `create()` が受け取る。
 * 待つのに `setTimeout` を使わないのは規約のため（タブが隠れて Phaser が
 * 止まっている間は、戻ってから 1 回で済む）。
 */
function followOrientation() {
  const { game } = window;
  if (windowOrientation() === game.registry.get(ORIENTATION_REGISTRY_KEY)) return;
  if (game.events.listeners(Phaser.Core.Events.POST_STEP).includes(relayoutWhenSettled)) return;
  game.events.on(Phaser.Core.Events.POST_STEP, relayoutWhenSettled);
}

function relayoutWhenSettled() {
  const { game } = window;
  if (!scenesSettled(game)) return;
  game.events.off(Phaser.Core.Events.POST_STEP, relayoutWhenSettled);
  // 待っている間に元の向きへ戻っていれば、作り直さない。
  const orientation = windowOrientation();
  if (orientation === game.registry.get(ORIENTATION_REGISTRY_KEY)) return;
  game.registry.set(ORIENTATION_REGISTRY_KEY, orientation);
  game.scale.setGameSize(SCREENS[orientation].width, SCREENS[orientation].height);
  for (const scene of game.scene.getScenes(false)) {
    if (!scene.sys.isActive() && !scene.sys.isPaused()) continue;
    scene.relayout?.();
  }
}
window.addEventListener('resize', followOrientation);

// ここまで来れば起動できている。`index.html` の案内を隠す。
const notice = document.getElementById('notice');
if (notice) notice.hidden = true;
