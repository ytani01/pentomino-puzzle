/**
 * Node から `src/` の計算を読むためのダミーの `window`。
 *
 * `src/config.js` は起動時の画面の向きを 1 回だけ見るので、トップレベルで
 * `window.innerHeight` を触る（`PORTRAIT`）。Node には `window` が無いため、
 * そのままでは読み込みが例外で止まる。生成に使うのは盤とピースの定義だけで、
 * ここで決まる画面の配置（`LAYOUTS`）は参照しないので、値は何でもよい。
 *
 * ES Modules の評価順は import を書いた順なので、**`src/` を読むより先に
 * これを import する**こと。
 */
if (typeof globalThis.window === 'undefined') {
  globalThis.window = { innerWidth: 960, innerHeight: 640 };
}
