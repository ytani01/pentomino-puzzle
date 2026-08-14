# Pentomino Puzzle

ブラウザで遊ぶペントミノの敷き詰めパズル。ビルド工程は無く、ファイルをそのまま配信すれば動く。

**遊ぶ（公開版）**: https://ytani01.github.io/pentomino-puzzle/

- **依存は Phaser 3.90.0 だけ**（CDN、バージョン固定）。npm は使わない
- 画像・音声ファイルを持たない。絵は実行時に描き、効果音は Web Audio API で合成する
- マウスでもタッチでも遊べる
- **遊ぶのにも公開するのにも Node.js は要らない。** 要るのは
  [全解のデータ](docs/developer.md#全解のデータ)を作り直すときだけ

## 遊ぶ

`file://` では ES Modules が読めないので、ローカルサーバ経由で開く。

```bash
python3 -m http.server 8765
#   http://localhost:8765/
```

盤はタイトル画面で 2 つから選ぶ。**8×8**（中央 2×2 が穴）と **6×10**（穴なし）で、
どちらも置けるマスは 60。そこへペントミノ 12 種（F I L N P T U V W X Y Z）を
すべて置くと完成。解は回転・反転で同じものを 1 つと数えて、8×8 が 65 通り、
6×10 が 2339 通り。

| 操作 | 割り当て |
|---|---|
| ピースを置く / 動かす | ドラッグ |
| 右 90° 回転 | ピースをタップ |
| 裏返す | ピースをダブルタップ |
| 一手戻す / ヒント / 詰み表示 / やり直し / 音の ON・OFF / タイトルへ | 画面のボタン |

置けない場所で離すと、赤く光って元の場所へ戻る。
**詰み表示**を入にすると、置く・外すたびに残りのピースで最後まで置けるかを
調べ、「解ける」「解なし」を HUD に出す。**ヒントと詰み表示は全解のデータを
引くだけ**なので待たされない（`src/data/`）。

クリアすると「正解の何番か」が出る。回転・反転して置いても同じ番号になる。
最短時間とクリアした解はブラウザに保存され、**記録**の画面で見返せる
（何解のうち何解を見つけたかも出る）。

## テスト

```bash
python3 -m http.server 8765
#   http://localhost:8765/tests.html
```

`src/logic.js` の計算（向きの生成・配置判定・盤面の更新）、`src/solutions.js` の
照合とヒント、`src/storage.js` の記録、`src/config.js` のピース定義、そして
`src/data/*.js`（全解のデータ）を検査する。Phaser には触れない。

## 構成

```
index.html            HTML / CSS と Phaser の読み込み
src/
  main.js             Phaser の起動
  config.js           盤面・ピース・色・レイアウトの定数
  logic.js            Phaser に依存しない計算（tests.html の対象）
  solutions.js        全解のデータの読み込みと照合（tests.html の対象）
  data/
    8x8.js            8×8 の全解（65 件）。tools/gen-solutions.mjs が作る
    6x10.js           6×10 の全解（2339 件）。同上
  audio.js            Web Audio API による効果音
  storage.js          クリア記録の保存
  ui.js               ボタンと枠（4 つのシーンで共通）
  scenes/
    boot.js           マス目テクスチャの生成
    title.js          タイトル
    game.js           本編
    clear.js          クリア表示
    records.js        クリア記録の一覧
tools/                開発時にだけ使う（公開しない）
  enumerate.mjs       全解の数え上げ
  gen-solutions.mjs   src/data/*.js を作る／突き合わせる
  window-shim.mjs     Node から src/ を読むためのダミーの window
tests.html            計算のテスト
docs/developer.md     画面の用語、全解のデータ、GitHub 上の設定
TODO.md               進行中の項目と、完了済みの目次（archives/todo/ に本体）
```

`src/data/*.js` は**手で書き換えない**。作り直し方と、いつ作り直すのかは
[docs/developer.md の「全解のデータ」](docs/developer.md#全解のデータ)にある。

## ライセンス

MIT
