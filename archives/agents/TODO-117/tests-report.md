# TODO-117 tests 報告

テストは足していない。走らせただけ（`src/` は壊す確認のあと元に戻した）。

## 1. 全件
`http://localhost:8765/tests.html`（Playwright で evaluate）
- summary: **476 件すべて通った**（`li.ok` 476 / `li.ng` 0）
- コンソールのエラーは `favicon.ico` の 404 が 1 件だけ（import の失敗は無い）

## 2. 壊すと落ちるか（1 回）
`src/search.js` の `chooseMove()` 内、直前の手からの近さの重みを外した。

```diff
-    return last ? touch / (1 + moveDistance(m, last)) ** DEMO.randomNearPower : touch;
+    return touch;
```
結果: **4 件が失敗（472 件は通った）**。落ちた題:
- 残りのピースで埋められる 5 マスの閉じた空きがあれば、次の place は必ずそれになる（TODO-066, 6×10）— 合う手のある 5 マスの穴が一度も出なかった
- 5 マスの穴に合う手を埋めた直後に解なしになると、その手と直前の手をまとめて外す（TODO-066, 6×10）— forced な解なしの二重 remove が一度も起きなかった
- 直前の手に近い置き方ほど選ばれやすい（…、8×8）— 効かせたとき 2.171875、効かせないとき 2.171875 で差が無い
- 同（6×10）— 1.796875 と 1.796875

戻したあと `git diff --stat src/search.js` は空。

実害は未確認。今回は 1 か所しか壊していないので、`placeableMoves()` の `failed` の除外や `moveCellKeys()` の鍵の作り方など、ほかの変化がテストで捕まるかは見ていない。

## 判断が要る点
なし。
