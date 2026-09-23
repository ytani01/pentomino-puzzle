# TODO-049 試し撮り報告（screens 定義の手順どおりに動けるか）

## 撮った画像

- `/home/ytani/tmp/playwright-mcp/title-844x390.png` — タイトル 844x390
- `/home/ytani/tmp/playwright-mcp/title-390x844.png` — タイトル 390x844
- `/home/ytani/tmp/playwright-mcp/title-844x390-6x10-selected.png` — 844x390、盤ボタン（6x10）クリック後

## 手順の実施

1. `browser_close` → `browser_navigate`（http://localhost:8765/）でタブを開き直した。問題なし。
2. 844x390・390x844 でタイトルを各 1 枚撮影。問題なし。
3. 844x390 で、選ばれていない盤ボタン（6x10）をクリック。
   - 座標は `browser_evaluate` で `window.game.scene.getScene('Title').boardButtons` の
     `x`・`y` を Canvas の `getBoundingClientRect()` とゲームの内部解像度の比
     （`scaleX = rect.width / game.scale.gameSize.width`、`scaleY` も同様）で
     画面座標に変換した（点 (486.7, 219.6)）。
   - `browser_run_code_unsafe` 内で `page.mouse.click(...)` を 3 秒上限の `race` で実行。
     結果は **'ok'**（timeout せず返った）。
   - クリック後の `boardKey` は **'6x10'**（クリック前は '8x8'）。定義どおりの状態変化を確認。
4. コンソール: **エラー 0 件、警告 4 件**（すべて WebGL/GPU の `GPU stall due to ReadPixels` という
   ドライバの性能に関する警告で、アプリのロジックとは無関係と見られる）。

## かかった時間

ツール呼び出し 9 回（close, navigate, resize×3, screenshot×3, evaluate, run_code_unsafe,
console_messages）程度で、体感 1〜2 分程度。

## 定義（`.claude/agents/screens.md`）の手順で分かりにくかった点

- ボタンの `x`・`y` から画面座標へ直す変換式（Canvas の表示サイズとゲーム内部解像度の比）は
  定義に具体的な式が書かれていないため、都度組み立てる必要があった。
  `window.game.scale.gameSize.width/height` を使う、という一文があると次回から迷わない。
- それ以外（タブの開き直し、`browser_run_code_unsafe` での時間上限付きクリック、
  コンソール確認）は定義の記述どおりに進められ、迷いはなかった。

## 見た目については確認していません（本タスクの対象外）。
