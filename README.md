# Pentomino Puzzle

ブラウザで遊ぶペントミノの敷き詰めパズル。ビルド工程は無く、ファイルをそのまま配信すれば動く。

**遊ぶ（公開版）**: https://ytani01.github.io/pentomino-puzzle/

- **依存は Phaser 3.90.0 だけ**（CDN、バージョン固定）。Node.js も npm も要らない
- 画像・音声ファイルを持たない。絵は実行時に描き、効果音は Web Audio API で合成する
- マウスでもタッチでも遊べる

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
| 一手戻す / ヒント / 詰み表示 / やり直し / 音の ON・OFF | 画面のボタン |

置けない場所で離すと、赤く光って元の場所へ戻る。
**詰み表示**を入にすると、置く・外すたびに残りのピースで最後まで置けるかを
調べ、「解ける」「もう解けない」を HUD に出す（調べきれなければ「分からない」）。
クリアまでの最短時間はブラウザに保存される。

## テスト

```bash
python3 -m http.server 8765
#   http://localhost:8765/tests.html
```

`src/logic.js` の計算（向きの生成・配置判定・盤面の更新）と `src/solver.js` の求解、
`src/config.js` のピース定義を検査する。Phaser には触れない。

## 構成

```
index.html            HTML / CSS と Phaser の読み込み
src/
  main.js             Phaser の起動
  config.js           盤面・ピース・色・レイアウトの定数
  logic.js            Phaser に依存しない計算（tests.html の対象）
  solver.js           ヒント用の求解（tests.html の対象）
  audio.js            Web Audio API による効果音
  storage.js          クリア記録の保存
  ui.js               ボタンと枠（3 つのシーンで共通）
  scenes/
    boot.js           マス目テクスチャの生成
    title.js          タイトル
    game.js           本編
    clear.js          クリア表示
tests.html            計算のテスト
```

## ライセンス

MIT
