/**
 * 効果音。アセットファイルを持たずに Web Audio API で合成する。
 *
 * AudioContext とミュートの状態だけはモジュールに持たせている。
 * シーンをまたいでも同じ出力先とミュート設定を使い続ける必要があり、
 * ゲームの進行（＝シーンのプロパティ）とは別のものだから。
 */

let context = null;
let muted = false;

/**
 * 最初のユーザー操作から呼ぶ。ブラウザは操作をきっかけにしないと
 * AudioContext を鳴らせる状態にしてくれない。
 */
export function unlock() {
  try {
    if (!context) {
      // 古い Safari は接頭辞付きしか持たない。
      const Ctor = window.AudioContext || window['webkitAudioContext'];
      if (!Ctor) return;
      context = new Ctor();
    }
    if (context.state === 'suspended') context.resume();
  } catch (error) {
    // 音が出せない環境でも遊べるようにする。
    context = null;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
}

/** ミュートを切り替え、切り替えた後の状態を返す。 */
export function toggleMuted() {
  muted = !muted;
  return muted;
}

/**
 * 単音を 1 つ鳴らす。`freqTo` を渡すと音程を滑らせる。
 * エンベロープを毎回作るのは、鳴り終わったノードを使い回さず捨てるため
 * （ノードの寿命を気にせずに済む）。
 */
function tone({ freq, freqTo = null, type = 'sine', delay = 0, duration = 0.12, gain = 0.12 }) {
  if (!context || muted) return;
  const at = context.currentTime + delay;
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (freqTo !== null) osc.frequency.exponentialRampToValueAtTime(freqTo, at + duration);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(amp);
  amp.connect(context.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** ピースを掴んだ。 */
export function pick() {
  tone({ freq: 420, freqTo: 620, type: 'triangle', duration: 0.07, gain: 0.07 });
}

/** ピースを盤に置けた。 */
export function drop() {
  tone({ freq: 300, freqTo: 180, type: 'triangle', duration: 0.11, gain: 0.13 });
  tone({ freq: 600, type: 'sine', duration: 0.06, gain: 0.05 });
}

/** ピースを盤から外してトレイへ戻した。 */
export function lift() {
  tone({ freq: 260, freqTo: 380, type: 'triangle', duration: 0.09, gain: 0.08 });
}

/** その場所には置けない。 */
export function invalid() {
  tone({ freq: 190, freqTo: 110, type: 'square', duration: 0.16, gain: 0.09 });
}

/** 右 90° 回転。 */
export function rotate() {
  tone({ freq: 660, freqTo: 880, type: 'square', duration: 0.05, gain: 0.05 });
}

/** 反転。回転より低く、区別が付くようにする。 */
export function flip() {
  tone({ freq: 880, freqTo: 520, type: 'square', duration: 0.07, gain: 0.05 });
}

/** 一手戻した。 */
export function undo() {
  tone({ freq: 520, freqTo: 330, type: 'sine', duration: 0.12, gain: 0.09 });
}

/** ヒントで 1 個置いた。 */
export function hint() {
  tone({ freq: 660, type: 'sine', duration: 0.09, gain: 0.08 });
  tone({ freq: 990, type: 'sine', delay: 0.07, duration: 0.12, gain: 0.07 });
}

/** ボタンを押した。 */
export function button() {
  tone({ freq: 540, type: 'sine', duration: 0.05, gain: 0.06 });
}

/** 完成。 */
export function fanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    tone({ freq, type: 'triangle', delay: index * 0.11, duration: 0.24, gain: 0.11 });
  });
}
