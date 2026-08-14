# TODO-004. プレイ中の画面にもバージョン番号を表示する

## きっかけ

タイトル画面の右下にはバージョン番号（`VERSION`）を表示していたが、
プレイ中の画面には無く、遊んでいる最中にどのバージョンか確かめられなかった。

## やったこと

モデルは Sonnet / effort low。`src/scenes/game.js` への追加 1 か所だけの
単純な変更なので、サブエージェントは編成しなかった。

- `src/scenes/game.js` に `createVersionText()` を追加し、`create()` から呼ぶ
- 表示位置・見た目（フォント・色・不透明度）は `src/scenes/title.js` の
  バージョン表示とそろえ、画面右下（`LAYOUT.width - 12, LAYOUT.height - 12`）に置いた

## テスト

- `node --check src/scenes/game.js` で構文を確認
- この環境では Claude in Chrome の拡張・Playwright のブラウザ双方が使えず、
  Claude 側からの画面確認はできなかった。位置は盤面パネルの下端（594px、
  画面の高さは 640px）やメッセージ表示（x:480）と重ならないことをレイアウトの
  数値で確認したうえで、利用者にローカルサーバ（`python3 -m http.server 8765`）
  経由で実際の画面を確認してもらい、OK の返答を得た
