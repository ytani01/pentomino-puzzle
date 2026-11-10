# TODO-112 画面の確認（screens）

1280x720 横、`http://localhost:8765/`（Playwright MCP。クリックは `page.mouse.click` を 3 秒の上限付きで実行）。

## 押したボタン

1. タイトルの `記録`（座標 869.5, 627.3）→ 結果 `ok`。動いているシーンが `Records` に変わった
2. 記録の画面の `タイトルへ`（`titleButton`、アイコンのみ。座標 136, 56.25）→ 結果 `ok`。動いているシーンが `Title` に戻った
   （`もどる` という文字のボタンは無く、`goToTitle()` を呼ぶのはこのボタン）

## コンソール（`all: true`、起動から最後まで）

- error: **0 件**
- warning: 4 件。すべて Chromium（headless の WebGL）のドライバ通知で、ゲームのコードとは無関係
  - `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`（3 回）
  - 同文に `(this message will no longer repeat)` が付いたもの（1 回）
  - 4 件とも、ボタンを押す前の読み込み時点で出ていた（押したあとに増えていない）
