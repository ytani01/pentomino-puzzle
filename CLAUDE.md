# CLAUDE.md

このリポジトリで作業するときの指針（Claude Code 用）。

## プロジェクト概要

概要は [README.md](README.md) を見る。以下はコードを読んでも分からない決めごと。

- **新しいライブラリを追加しない。** 依存は Phaser 3.90.0（CDN、バージョン固定）だけ
- **画像・音声アセットを追加しない。** 絵は Graphics API で実行時に生成し（`src/scenes/boot.js`）、
  効果音は Web Audio API で合成する（`src/audio.js`）。
  例外は文書に載せるキャプチャ（`docs/images/`。ゲームからは読まない）で、
  `tools/capture.mjs` で撮り直す（TODO-056）
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

見た目の確認は `screenshot` スキルを使う（Playwright MCP で headless の
Chromium を動かして撮る。TODO-034）。

## 規約

- **`setTimeout` / `setInterval` を使わない。** 遅延実行は `scene.time.delayedCall()`、
  アニメーションは `scene.tweens`（シーンを切り替えたときに止められず、
  前の画面の処理が残るため）。Web Audio の予約（`ctx.currentTime + t`）は別
- **状態はシーンのプロパティに持たせる。** モジュールのトップレベルに
  書き換わる `let` を置かない（例外は `src/audio.js` の AudioContext と
  ミュートの状態。ゲームの進行とは別に持つ必要があるもの）
- **色と、複数の画面で使う数値は `src/config.js` に置く。** 色をコードへ直接書かない。
  CSS 側（`index.html`）が持つのは画面の地の色だけ。その画面（や `src/ui.js` の
  その部品）だけの配置の数値は、使うファイルの先頭に置く（読む場所を画面から
  離さないため。TODO-107）
- **Phaser に依存しない計算は `src/logic.js`・`src/search.js`・`src/solutions.js` に置く。**
  `tests.html` から確かめられるようにするため。ここに DOM や Phaser を持ち込まない
- **盤面は書き換えず、作り直して返す。** Undo の履歴が壊れないようにするため
- **ブラウザネイティブの `confirm()` / `alert()` / `prompt()` を使わない。**
  確認が要る操作は `src/ui.js` の `createConfirmDialog()`（`createButton` / `createPanel` を
  組み合わせたもの）で、画面内（Phaser の Canvas 上）に確認用の表示を作る。ネイティブダイアログは
  Canvas の外側に OS の見た目で出て浮くうえ、`confirm()` は同期的にブロッキング
  するため、シーンの `update` ループや Tween、経過時間の計測が呼び出し中
  止まってしまう
- JSDoc には「何をするか」でなく **「なぜそうするのか」** を書く。
  中身のない `/** */` を残さない

## ファイル構成

| ファイル | 役割 |
|---|---|
| `index.html` | HTML / CSS、Phaser の読み込み、起動できなかったときの案内 |
| `src/main.js` | Phaser の設定とシーンの登録。画面の向きが変わったら内部解像度を切り替え、動いているシーンを作り直す（TODO-095） |
| `src/config.js` | 盤面の定義、12 種のピースの形と色、マスの大きさ、レイアウト（縦・横の 2 組。今の向きは registry。TODO-095） |
| `src/logic.js` | 向きの生成・正規化、配置判定、盤面の更新、対称な解の代表形（TODO-012）、時間の整形、ピースの色の決定 `pieceColor()` と縁取り用に暗くする `darken()`、ネオンなら暗くして塗る色 `fillColor()`（純関数）、向きを変える印の種類と位置 `turnMarkKind()`・`turnMarkCenter()`（TODO-114）、ヒント表示で自動で置く手 `forcedPlacements()`（TODO-044）、URL でデモを開くパラメータの読み取り `parseDemoParams()`（TODO-083） |
| `src/search.js` | デモ用に 1 手ずつ返す探索 `solveSteps()`（深さ優先。TODO-040）・`solveStepsRandom()`（ランダム。TODO-057）と、その抽選の重みの計算 `touchingEdges()`・`moveDistance()`・`countCellMoves()`・`singlePieceCell()`。本編の判定と分けて読めるよう `logic.js` から分けた（TODO-113）。`search.js` は `logic.js` を読むが、`logic.js` は `search.js` を読まない（循環させない） |
| `src/solutions.js` | 全解のデータの読み込み（動的 import）と、盤面との照合・おまかせ（TODO-022） |
| `src/data/8x8.js` ・ `src/data/6x10.js` | ボードごとの全解（代表形 65 件 / 2339 件）。**手で書き換えない** |
| `src/audio.js` | 効果音の合成。最初のユーザー操作で `unlock()` を呼ぶ |
| `src/storage.js` | クリア記録（最短時間・履歴・見つけた解の番号・おまかせで導いた解の番号）、色の組（TODO-015）、遊びかけの盤面（TODO-030）の保存（失敗しても遊べるようにする） |
| `src/ui.js` | ボタンと枠の組み立て。5 つのシーンが同じ見た目を使うため。HUD のボタンの説明（ツールチップ。TODO-042）。8×8 の穴に嵌めるアクリルの板 `drawAcrylic()`（本編と記録の完成形で共通。TODO-051）。縮小したボード `drawMiniBoard()`（記録の完成形とタイトルの動くボードで共通。TODO-087）。操作の説明の文言 `HOW_TO_OPERATE`（タイトルと本編の下端で共通。TODO-094）。確認の枠 `createConfirmDialog()`（背景の帯・枠・文言・「はい」「いいえ」。本編と記録で共通。寸法は `config.js` の `CONFIRM`。TODO-105）。文字のスタイル `textStyle()`（`add.text()` に渡す `fontFamily`・`fontSize`・`color` を組む。全シーンで共通。TODO-108） |
| `src/icons.js` | HUD のボタンのアイコン。Graphics API の線画（TODO-042）。タイトルのボード・色の選択肢の図（TODO-046）。ピースの外周とネオンのにじみを内側へ寄せて引く `strokePieceEdges()`（本編の `drawPieceEdges()` と色の見本で共通。TODO-111）。向きを変える印の線画 `strokeTurnMark()`（本編のトレイのピース。TODO-114） |
| `src/scenes/boot.js` | マス目テクスチャの生成。ピースの色ごとに 1 枚 |
| `src/scenes/title.js` | タイトル。題字の下（横画面は遊び方の枠の左）でデモのランダムな探索を小さなボードで動かす（飾り。TODO-087） |
| `src/scenes/game.js` | 本編。Phaser とのつなぎに徹し、判定は `logic.js` に任せる |
| `src/scenes/clear.js` | クリア表示。本編を止めてその上に重ねる。記録の更新は本編が完成を見つけたときに済ませる（TODO-072） |
| `src/scenes/records.js` | クリア記録の一覧、選んだ回の完成形（TODO-008）、達成度（TODO-022）、チェックした回をまとめて消す（TODO-031・TODO-071）、選んだ回の続きを遊ぶ（TODO-073） |
| `src/scenes/demo.js` | コンピューターが探索して解を見つける様子を見せるデモ。`GameScene` を継承しボード・トレイの描画を使い回す。記録・遊びかけ・見つけた解には何も残さない（TODO-040）。探し方を深さ優先・ランダムから選べる（TODO-050・TODO-057） |
| `tools/enumerate.mjs` | 全解の数え上げ（開発時のみ。元は `src/solver.js`） |
| `tools/gen-solutions.mjs` | `src/data/*.js` を作る／突き合わせる（開発時のみ） |
| `tools/capture.mjs` | `docs/images/` のキャプチャを撮り直す。Playwright は依存に足さず、npx の置き場から借りる（開発時のみ。TODO-056） |
| `tools/stamp-version.mjs` | 公開するコピーの読み込みに `?v=<タグ名>` を付ける（Pages の 10 分のキャッシュで古い版が出ないように。公開のワークフローで使う。TODO-096） |
| `tests.html` | 計算のテスト（ブラウザで開くだけ） |
| `docs/UsersGuide.md` | 遊び方の詳細（操作、HUD のボタン、記録、つづきから、デモ） |
| `docs/developer.md` | ファイル構成、構成（3 層の分け方・シーンの移り方・registry のキー）、画面の用語、テスト、記録の保存、全解のデータ、GitHub 上の設定 |
| `docs/images/` | 文書に載せるキャプチャ。**手で描き足さない**（`tools/capture.mjs` で撮り直す） |
| `.claude/skills/screenshot/SKILL.md` | Playwright MCP で画面を撮って確かめる手順 |
| `.claude/agents/*.md` | 使い回すサブエージェントの定義（[docs/developer.md](docs/developer.md#サブエージェントの定義)） |
| `.github/workflows/pages.yml` | タグを押したときに GitHub Pages へ公開する |

## 公開（GitHub Pages）

GitHub 上での設定・公開手順は
[docs/developer.md](docs/developer.md#github-上の設定) を見る。
画面の部位の呼び名（ボード・トレイ・スロットなど）は
[同じファイルの「画面の用語」](docs/developer.md#画面の用語)にまとめてある。

- **公開の前に `node tools/gen-solutions.mjs --check` が走る**（`pages.yml`）。
  `src/data/*.js` を作り直して突き合わせ、食い違えばジョブが失敗する（TODO-022）。
  `logic.js` の向きの生成や `config.js` のピース定義を触ったら、
  `node tools/gen-solutions.mjs` で作り直して一緒にコミットすること。
  作り直す条件と手順は
  [docs/developer.md の「全解のデータ」](docs/developer.md#全解のデータ)にある
- `src/config.js` の `VERSION`（既定は `'dev'`）を、`.github/workflows/pages.yml` が
  タグ名へ書き換えてから公開する。ローカルで直接開いた画面は `dev` のまま
  （公開前の見た目と本番の見た目が違う。これは許容している）
- ワークフローの置換は `src/config.js` の `export const VERSION = 'dev';` という
  行を丸ごと文字列一致で探す。**この行の書き方を変えたら
  `.github/workflows/pages.yml` も直す**（見つからなければジョブが失敗して
  気づけるようにしてある。`dev` のまま静かに公開されることはない）
- **TODO 項目を決着させたら、Claude がコミット・タグ付け・push まで行う**
  （このプロジェクトだけの決まり。ユーザー全体の `CLAUDE.md` の
  「push は利用者が行う」より優先する。2026-09-23 に利用者が決めた）。
  決着のコミットのあと `git tag vX.Y.Z -m "<決着のコミットと同じ本文>"` で
  タグを作り、`git push origin develop vX.Y.Z` で送る
  - バージョンは変更の型で決める。`feat` は minor、`fix` / `refactor` は patch
  - 公開するものが変わらない項目（対応しない、文書だけ、`tools/` だけ）は
    タグを付けず、`git push origin develop` だけにする
  - push で GitHub Pages の公開ワークフローが動く。失敗したら利用者に伝える

## 作業の進め方

`TODO.md` に項目を立ててから着手する（決着したものは `archives/todo/` へ）。
詳しくはユーザー全体の `CLAUDE.md` に従う。

### 担当への依頼

- **worktree は使わない。** 担当は 1 人ずつトップの作業ツリーで動かす
- 依頼に書くコマンドは次のとおり。確かめる範囲は変えたところに合わせて選ぶ
  - 画面とテストはローカルサーバ経由で見る（「実行と確認」）。
    `tests.html` は `tests`、画面は `screens` に頼める
  - `src/logic.js` の向きの生成か `src/config.js` のピース定義を変えたときだけ、
    `node tools/gen-solutions.mjs --check` を流させる
- このリポジトリの定義（`tests`・`screens`・`docs`・`measure`）の受け持ちは
  [docs/developer.md](docs/developer.md#サブエージェントの定義)にある（TODO-104）
