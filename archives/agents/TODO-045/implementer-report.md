# TODO-045 implementer 報告

## 変更点

- `src/config.js`
  - `COLORS.success = 0x3fbf6e`（緑地。既存の `danger`/`accent` と同系統の彩度で追加）を足した。
  - `HINT_BADGE = { height: 40, padX: 16, radius: 8 }` を追加（`TOOLTIP` の直後）。
    幅は文字幅に合わせて実行時に測るため固定値を持たない。
  - 未使用だった `HUD_STATUS_W`（コメントだけで参照されていなかった定数）を削除。
- `src/ui.js`
  - `createHintBadge(scene, x, y, originX = 0)` を追加（`createPanel` の直後）。
    - 文言の対応（`ok`→「解ける」、`dead`→「解なし」）と色の対応（`ok`→`COLORS.success`、
      `dead`→`COLORS.danger`）をここに 1 つだけ持つ。
    - `setState(state)` で `'ok'`・`'dead'`・`null`（隠す）を切り替える。
      `null` のときは `Graphics.clear()` とテキスト空文字で、今までの「空文字で隠す」と同じ見た目。
    - 幅は `label.setText()` 後の実測幅 + `HINT_BADGE.padX * 2`。`originX` で左寄せ（0）／
      右寄せ（1）を切り替える。
    - `setDepth(depth)` を生やし、内部の `Graphics`・`Text` の両方に転送する。
- `src/scenes/game.js`
  - `createHud()`: `this.hintText`（Text, `FONT.small`, `setColor` で色替え）を
    `this.hintBadge = createHintBadge(this, ..., 0).setDepth(DEPTH.hud)` に置き換え（129 行目付近）。
  - `toggleHint()`: 切にしたときの `this.hintText.setText('')` を `this.hintBadge.setState(null)` に置換。
  - `runHint()`: 早期 return 側の非表示化と、`state` が決まったあとの表示更新
    （旧: `text`/`color` マップ + `setText().setColor()`）を `this.hintBadge.setState(...)` に一本化。
  - import: `createButton, createHintBadge, createPanel, createTooltip, createVersionText` に更新。
- `src/scenes/demo.js`
  - `createHud()`: `this.hintText` を `this.hintBadge = createHintBadge(this, ..., 1).setDepth(DEPTH.hud)`
    に置き換え（右寄せ）。
  - `refreshStatus()`: 旧 `text`/`color` マップ + 分岐を `this.hintBadge.setState(this.hintState)` に一本化。
  - import: `createHintBadge, createPanel, createVersionText` に更新。
- `docs/developer.md`
  - 「解ける / 解なし」の行（64 行目）を「本編のヒント表示と同じ文字と色」→
    「本編のヒント表示と同じ札（`createHintBadge()`。TODO-045）」に更新。
  - ASCII 図（20 行目）と README.md の記述（38・55・56 行目）は色や大きさの具体値を書いていないため変更なし。

保った点: `runHint()` の判定条件と `audio.invalid()` を鳴らす条件、デモの `hintState` の遷移、
文言・鳴らすタイミングはすべて手を付けていない。

## 確かめた方法と結果

### 1. 配置の重なり・はみ出し（座標の計算）

`node`（`tools/window-shim.mjs` 経由）で `makeLayout()` を呼び、実測した `hud.width`・
`hud.padding`・`hud.statusX`・`hud.remainX` を使って手計算した。CJK/ひらがな相当の文字は
`FONT.hud`（26px）の等幅（1em）、半角の数字・カンマ・半角スペースは 0.56em・0.28em・0.28em、
全角スペースは 1em として見積もった（`system-ui` 系フォントの一般的な字幅比。実際の画面は
別の担当がスクリーンショットで確かめる）。

- **本編**（横 960×640 / 縦 640×1136。8×8 と 6×10 は HUD 1 段目の配置に差がないので共通）
  - 時間「99:59」は `hud.x+padding`（=34）起点、幅はどちらの向きでも変わらず余裕あり
  - 残り「残り 12」は `remainX`=140 起点、x=174〜262 ほど。バッジは `statusX`=250 起点で
    x=284 から。**隙間 22px**（重ならない）
  - バッジ幅の見積り: 「解ける」「解なし」ともに 3 文字 × 26px + パディング 32px = **110px**
  - バッジ右端: 284+110=394。HUD の右内側端は横 926 / 縦 606。**どちらも大きく収まる**
- **デモ**（右寄せ。文字は「試した手 123,456　見つけた解 12」が最長）
  - 左寄せの `statusText` の幅見積り: CJK/かな 9 文字＋全角スペース 1 文字＝10em、
    半角文字（スペース 2・数字 6・カンマ 1・末尾の "12"）で概算 4.5em、合計 約 14.5em×26px
    ≈ **377px**（`hud.x+padding`=34 起点 → 右端 ≈411）
  - バッジ（右寄せ、幅 110px）: 横画面は `x`=926 起点で左端 816、縦画面は `x`=606 起点で
    左端 496
  - **隙間**: 横画面 816−411=405px、縦画面 496−411=85px。**どちらも重ならない**
  - 高さ: バッジは 40px、HUD 1 段（56px）の中央に置くので上下 8px の余白があり収まる

（文字幅の見積りは実測フォントではなく比率での近似。縦画面のデモが最も余裕が薄い
組み合わせなので、実画面の確認はここを優先して見てもらうとよい。)

### 2. `tests.html`

- `python3 -m http.server 8765` は起動済みだったので使い回した。ブラウザで開いての実行は
  **このエージェントには許可された道具がなく（Playwright は別担当専用、他のブラウザバイナリも
  この環境に無い）実施できなかった**。代わりに以下で静的に確かめた。
  - `node --check src/config.js src/ui.js src/scenes/game.js src/scenes/demo.js` → 構文エラー無し
  - `tests.html` が import しているのは `src/config.js`・`src/logic.js`・`src/solutions.js`・
    `src/data/*.js` のみで、今回変更したのは `config.js`（`COLORS.success`・`HINT_BADGE` の追加、
    未使用だった `HUD_STATUS_W` の削除）だけ。`logic.js`・`solutions.js` は無変更
  - `rg -n "COLORS|HINT_BADGE|hud\.|HUD_STATUS" tests.html` → 該当なし
    （テストはどちらの値も参照していない）
  - `node`（window-shim 経由）で `src/config.js` を読み込み、`COLORS.success`・`HINT_BADGE`・
    `makeLayout()` の戻り値が期待どおりであることを確認済み（上記の計算に使った値そのもの）
  - 以上から `tests.html` の結果自体は変わらないはずだが、**実際にブラウザで開いての実行は
    未実施**。確認の担当に依頼してほしい

## 判断が要る点・迷った点

- `COLORS.success` の値（`0x3fbf6e`）は既存の色（`accent`・`danger` など）と並べて見て
  違和感の無い彩度・明度を選んだが、実際の見た目の良し悪しは確認担当の判断に委ねる
- 白い文字は既存の `TEXT_COLORS.normal`（`#e8ecf4`。純白ではなく僅かに青みがかった明色）を
  そのまま使った。緑地・赤地どちらでも十分明るく読めると判断したが、これも実画面での
  確認を勧める
- バッジ幅は固定値を config に置かず、`label.setText()` 後の実測幅（Phaser の `Text.width`）
  から都度計算する設計にした（依頼の「同じ文字数なので固定でもよい」という許容範囲内だが、
  実測に委ねたほうがフォントの実際の字幅とずれないため、より安全な方を選んだ）
- `tests.html` のブラウザでの実行は上記の理由で未実施。範囲外の判断はしていない
