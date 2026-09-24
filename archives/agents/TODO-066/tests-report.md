# TODO-066 tests 報告

## やったこと

1. `git diff src/logic.js`・`implementer-report.md` を読み、TODO-066 で落ちていた既存 6 件を
   新しい動きに合わせて前提を直した（`tests.html`）。
   - `forced.length > 0 && !ok` のときは、その手と直前の手をまとめて外す二重 `undoLast()` が
     起きることを、既存の「1 手ずつ外す並び」「常に偽の remove 連なり」の 2 件（既定/常に偽 ×
     8×8/6×10）に例外として組み込んだ。判定用に `isForcedFillStep(board, step)` を新設
     （`forcedPlacements()` の結果と name・row・col・cells が一致するかを見る）。
   - 「ピースと同じ 5 マスの閉じた空きは即座には外さない」（TODO-060）は、
     「合うピースが無い 5 マスの閉じた空き」に限る形に直した（forcedPlacements で
     合う手が無いことを確かめてから判定）。加えて、その place 自体が forced な解なしで
     すぐ外される場合は対象から外した。
2. 新しい動きのテストを 8×8・6×10 で 3 件追加。
   - 「合う手があれば次の place は必ずそれになる」（`forcedPlacements` の候補と実際の
     place が一致することを、盤面ごとの控え（failed）を手元でも再現して確かめる）
   - 「埋めた直後に解なしになると、その手と直前の手をまとめて外す」
     （`canContinue` に、直前の呼び出しからの差分が forced な 1 手なら偽を返す
     `makeFailAfterForcedFill()` を新設して渡し、意図的に起こして確かめる）
   - 既存の「合うピースが無い 5 マスは即座に外さない」の直しも 1 に含む
3. 壊すと落ちるかを確認（一時的に `src/logic.js` を変更 → `tests.html` 実行 → 戻す）。
   - `forced.length > 0` の分岐を無効化 → **12 件失敗**
   - 2 回目の `undoLast()` を消す → **7 件失敗**
   - `failed.has(key)` の除外を消す → **9 件失敗**
   - 各確認のあと元に戻し、最終的に `git diff src/logic.js` が implementer の差分と
     一致していることを diff で確認済み（1 回、途中の revert 手順で `undoLast()` の
     1 行を巻き込んで消してしまい 7 件が落ちたことに気づいて直し、最終的に一致させた）。

## 結果

`python3 -m http.server 8765` 経由・Playwright（headless Chromium）で `tests.html` を実行し、
**322 件すべて通った**（既存 312 件 + 新規 10 件。既存 6 件の書き直しは件数を変えていない）。
コンソールにエラー・警告は無し。`src/` は最終的に implementer の変更のみが残っている
（`git diff src/logic.js` を implementer 報告時点の差分と突き合わせて一致を確認）。

## 判断が要る点

特に無し。境界線上の判断も発生しなかった。

## 追記（reviewer 検討 2 の直し）

`tests.html:1180` の「置ける手が尽きて 1 手ずつ外す並び」テストで、`sawImmediate` を
`sawForcedDoubleUndo`（forced な解なしの二重 remove）と `sawSmallRegionUndo`
（TODO-060 の小さな空きの即座の remove）に分け、それぞれ別に assert するようにした。
`src/` は触っていない。Playwright で `tests.html` を実行し、**322 件すべて通った**
（このシード・手数で両方のフラグが立っており、小さな空きの即座の remove は
既定/常に偽 × 8×8/6×10 のいずれでも起きている）。
