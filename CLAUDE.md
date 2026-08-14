# CLAUDE.md

このリポジトリで作業するときの指針（Claude Code 用）。

## プロジェクト概要

Pentomino Puzzle — ブラウザで遊ぶペントミノの敷き詰めパズル。
盤の 60 マスへ、ペントミノ 12 種をすべて置く。盤はタイトル画面で
8×8（中央 2×2 が穴）と 6×10（穴なし）から選ぶ（TODO-009）。

- **ビルド工程を持たない。** 依存は Phaser 3.90.0（CDN、バージョン固定）だけで、
  **新しいライブラリを追加しない**。Node.js も npm も要らない
- **画像・音声アセットを持たない。** 絵は Graphics API で実行時に生成し（`src/scenes/boot.js`）、
  効果音は Web Audio API で合成する（`src/audio.js`）
- 自動テストは `tests.html` の 1 層だけ（依存なし）。リンタ・型チェックは入れていない
- Phaser は CDN からグローバルとして読み込む。自前のコードだけを ES Modules で分割する。
  そのため **`file://` では動かない**（確認は必ずローカルサーバ経由で）

## 実行と確認

```bash
python3 -m http.server 8765
#   http://localhost:8765/           … パズル本体
#   http://localhost:8765/tests.html … 計算のテスト
```

`src/main.js` は `window.game` に Phaser のインスタンスを入れてある。
ブラウザのコンソールや自動操作から `window.game.scene.getScene('Game')` で
状態を覗ける（ゲーム本体はこれを参照しない）。

### 画面を撮って確かめる

見た目の確認（スマホの横画面ではみ出さないか、など）は、Playwright に同梱の
Chromium を headless で動かして撮る。**この環境では Claude のブラウザ拡張
（claude-in-chrome）も Playwright MCP も使えなかった**（拡張は未接続、MCP は
`chrome` チャンネルを探して見つからない）。同梱の Chromium だけは入っている。

```bash
CHROME=$(echo ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome)
```

タイトル画面のように、開いただけの状態でよければ `--screenshot` で足りる。

```bash
$CHROME --headless=new --disable-gpu --hide-scrollbars \
  --window-size=667,375 --virtual-time-budget=6000 \
  --screenshot=out.png http://localhost:8765/
```

ゲーム本編のように**画面を進めてから撮る**ときは、`--remote-debugging-port`
付きで起動し、CDP を直接叩く。Node.js には WebSocket が組み込みで入っているので、
npm への追加インストールは要らない（このリポジトリに依存を増やさないため）。

```javascript
// node shot.mjs <port> <幅> <高さ> <出力先>
import fs from 'node:fs';
const [,, port, w, h, out] = process.argv;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find(x => x.type === 'page').webSocketDebuggerUrl);
let id = 0; const pend = new Map();
const send = (method, params) => new Promise(r => {
  const i = ++id; pend.set(i, r); ws.send(JSON.stringify({id: i, method, params}));
});
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
};
await new Promise(r => ws.onopen = r);
// mobile: true にするとスマホとして扱われる（画面の大きさだけでなく操作系も）
await send('Emulation.setDeviceMetricsOverride',
           {width: +w, height: +h, deviceScaleFactor: 1, mobile: true});
await send('Page.navigate', {url: 'http://localhost:8765/'});
await new Promise(r => setTimeout(r, 3000));   // Phaser の起動を待つ
await send('Runtime.evaluate',
           {expression: "window.game.scene.getScene('Title').scene.start('Game')"});
await new Promise(r => setTimeout(r, 2500));   // 画面が組み上がるのを待つ
fs.writeFileSync(out, Buffer.from((await send('Page.captureScreenshot',
                                              {format: 'png'})).data, 'base64'));
ws.close();
```

- 起動は `$CHROME --headless=new --disable-gpu --hide-scrollbars \`
  `--remote-debugging-port=9222 --user-data-dir=<一時ディレクトリ> about:blank &`。
  一度立てれば、上のスクリプトを幅・高さを変えて何度も呼べる
- スマホ横画面の確認に使った大きさ: `568x320`（iPhone SE 初代）、`667x375`、
  `844x390`、`915x412`。**一番厳しいのは 568x320**
- 撮り終えたら Chromium を止める。`pgrep -f` は**自分自身にマッチする**ので、
  止まったかどうかは `ps -eo pid,comm | grep -i chrome` で確かめる
  （`pgrep` の出力が毎回違う PID になるのは、消し残りではなく `pgrep` 自身）
- WebGL 由来の `GPU stall due to ReadPixels` が大量に出るが、画像は撮れている

## 規約

- **`setTimeout` / `setInterval` を使わない。** 遅延実行は `scene.time.delayedCall()`、
  アニメーションは `scene.tweens`（シーンを切り替えたときに止められず、
  前の画面の処理が残るため）。Web Audio の予約（`ctx.currentTime + t`）は別
- **状態はシーンのプロパティに持たせる。** モジュールのトップレベルに
  書き換わる `let` を置かない（例外は `src/audio.js` の AudioContext と
  ミュートの状態。ゲームの進行とは別に持つ必要があるもの）
- **数値と色は `src/config.js` に集約する。** 色をコードへ直接書かない。
  CSS 側（`index.html`）が持つのは画面の地の色だけ
- **Phaser に依存しない計算は `src/logic.js` と `src/solutions.js` に置く。**
  `tests.html` から確かめられるようにするため。ここに DOM や Phaser を持ち込まない
- **盤面は書き換えず、作り直して返す。** Undo の履歴が壊れないようにするため
- **ブラウザネイティブの `confirm()` / `alert()` / `prompt()` を使わない。**
  確認が要る操作は `src/ui.js` の `createButton` / `createPanel` を組み合わせ、
  画面内（Phaser の Canvas 上）に確認用の表示を作る。ネイティブダイアログは
  Canvas の外側に OS の見た目で出て浮くうえ、`confirm()` は同期的にブロッキング
  するため、シーンの `update` ループや Tween、経過時間の計測が呼び出し中
  止まってしまう
- JSDoc には「何をするか」でなく **「なぜそうするのか」** を書く。
  中身のない `/** */` を残さない

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | HTML / CSS、Phaser の読み込み、起動できなかったときの案内 |
| `src/main.js` | Phaser の設定とシーンの登録 |
| `src/config.js` | 盤面の定義、12 種のピースの形と色、マスの大きさ、レイアウト |
| `src/logic.js` | 向きの生成・正規化、配置判定、盤面の更新、対称な解の代表形（TODO-012）、時間の整形（純関数） |
| `src/solutions.js` | 全解のデータの読み込み（動的 import）と、盤面との照合・ヒント（TODO-022） |
| `src/data/8x8.js` ・ `src/data/6x10.js` | 盤ごとの全解（代表形 65 件 / 2339 件）。**手で書き換えない** |
| `src/audio.js` | 効果音の合成。最初のユーザー操作で `unlock()` を呼ぶ |
| `src/storage.js` | クリア記録（最短時間・履歴・見つけた解の番号）の保存（失敗しても遊べるようにする） |
| `src/ui.js` | ボタンと枠の組み立て。4 つのシーンが同じ見た目を使うため |
| `src/scenes/boot.js` | マス目テクスチャの生成。ピースの色ごとに 1 枚 |
| `src/scenes/title.js` | タイトル |
| `src/scenes/game.js` | 本編。Phaser とのつなぎに徹し、判定は `logic.js` に任せる |
| `src/scenes/clear.js` | クリア表示と記録の更新 |
| `src/scenes/records.js` | クリア記録の一覧、選んだ回の完成形（TODO-008）、達成度（TODO-022） |
| `tools/enumerate.mjs` | 全解の数え上げ（開発時のみ。元は `src/solver.js`） |
| `tools/gen-solutions.mjs` | `src/data/*.js` を作る／突き合わせる（開発時のみ） |
| `tests.html` | 計算のテスト（ブラウザで開くだけ） |
| `.github/workflows/pages.yml` | タグを押したときに GitHub Pages へ公開する |

## 公開（GitHub Pages）

GitHub 上での設定・公開手順は
[docs/developer.md](docs/developer.md#github-上の設定) を見る。
画面の部位の呼び名（盤・トレイ・スロットなど）は
[同じファイルの「画面の用語」](docs/developer.md#画面の用語)にまとめてある。

- **公開の前に `node tools/gen-solutions.mjs --check` が走る**（`pages.yml`）。
  `src/data/*.js` を作り直して突き合わせ、食い違えばジョブが失敗する（TODO-022）。
  `logic.js` の向きの生成や `config.js` のピース定義を触ったら、
  `node tools/gen-solutions.mjs` で作り直して一緒にコミットすること
- `src/config.js` の `VERSION`（既定は `'dev'`）を、`.github/workflows/pages.yml` が
  タグ名へ書き換えてから公開する。ローカルで直接開いた画面は `dev` のまま
  （公開前の見た目と本番の見た目が違う。これは許容している）
- ワークフローの置換は `src/config.js` の `export const VERSION = 'dev';` という
  行を丸ごと文字列一致で探す。**この行の書き方を変えたら
  `.github/workflows/pages.yml` も直す**（見つからなければジョブが失敗して
  気づけるようにしてある。`dev` のまま静かに公開されることはない）
- **タグ付けまでは Claude が行い、push は利用者が行う。** `git tag vX.Y.Z -m "..."`
  で作るところまでで止め、`git push origin vX.Y.Z` は実行せずコマンドを
  提示する（push は GitHub Pages の公開ワークフローを実際に動かす、
  取り消しにくい操作のため）

## 作業の進め方

`TODO.md` に項目を立ててから着手する（決着したものは `archives/todo/` へ）。
詳しくはユーザー全体の `CLAUDE.md` に従う。
