# TODO-054 verifier report

## 検証環境

TODO-052 のときと同じ手段。`python3 -m http.server 8765` をバックグラウンド
で起動し、Playwright（scratchpad へ一時導入した npm パッケージ）で
**最初から `headless: false`** で確かめた。スクリプトは
`/tmp/claude-649/.../scratchpad/verify054.js`・`verify054b.js`・
`verify054c.js`（セッション終了で消える一時ディレクトリ）。

## 確認項目

1. **深さ優先・最速で solved → 約 10 秒後に running、tried が 0 から
   増え直し、盤のピースが一度全部 'tray' に戻ること。solvedCount が
   減らないこと**
   経過時間 **10002ms**（許容 9500〜11000ms）。round-trip 越しに読んだ
   `tried` は遷移直後 **0**、1 秒後 **53** で増え続けた。**一致**

   「一度全部 'tray' に戻る」は、外部から `page.evaluate` で 50ms 間隔で
   ポーリングする方法では観測できなかった（`fastest` は 1 手の間隔が
   0ms のため、次のフレームで即 1 個目のピースが盤へ戻り始め、
   ポーリングの往復遅延の間に間に合わなかったと判断）。そこで
   `state` に `Object.defineProperty` の setter を仕込み、`'running'` へ
   書き換わった**その瞬間**（`startSearch()` 内で `state = 'running'` を
   代入した行）にトレイ内のピース数を同期的に記録する方法に切り替えた。
   結果は **`trayCount: 12`**（12 個全部）で、そのときの `tried` は
   まだ直前の値（例: 83）だった。これは `startSearch()` 内で
   `this.state = 'running'` の代入が `this.tried = 0` より 1 行前にある
   ためで、同じ関数呼び出しの中で数マイクロ秒後に 0 になる
   （実際、外部からの `page.evaluate` では毎回 `tried: 0` と観測できて
   いる）。**「盤のピースが一度全部 'tray' に戻る」は一致**（コード上
   `startSearch()` はループで `location = 'tray'` をすべてのピースへ
   代入してから `state = 'running'` にしており、実測でも運とtrayCount=12
   を確認した）

   `solvedCount` は 1 回目 `1`、2 回目の解に達するまで待つと `2` になり、
   減らなかった。**一致**

2. **深さ優先で solved の間に `searchNext()` → すぐ tried が 0 から
   増え直す**
   呼んだ直後、`state` は `'running'`、`tried` は **1**（すでに増え始めて
   いる。0 を経て 1 になった）。**一致**

3. **幅優先へ切り替えると solvedCount が 0 になる**
   `toggleStrategy()` 直後の `solvedCount` は **0**。**一致**

   **幅優先で 'solved' を代入 → 約 10 秒後に running に戻り、tried は
   0 に戻らず続きから増える。盤のピースも一斉には戻らない**
   ボードに 1 個ピースが乗っている状態（`boardCount: 1`）を待って
   `state = 'solved'` を代入。経過時間 **9984ms**。`tried` は代入前
   **359**、resume 直後も **359**（0 に戻らず、探索が動き出してから
   増える）。盤のピース数（`location === 'board'`）は代入前・resume 直後
   ともに **1** のまま変わらず、一斉リセットは起きなかった。**一致**

   （別の実行では `tried: 25` → resume 直後 `25` → 1 秒後 `54` で、
   こちらも一致）

4. **`state = 'done'`（幅優先のまま）→ 約 10 秒後に tried が 0 から
   始まる**
   経過時間 **9995ms**。resume 直後の `tried` は **0**。**一致**

5. **コンソールのエラー 0 件、`tests.html` が全件通ること**
   4 つのシナリオを通して `console` の error と `pageerror` は
   **0 件**。`tests.html` は **297 件すべて通った**（fail・error に
   該当する行は無し）

## 変更ファイルと指示範囲の一致

`git status --short` は次の 3 ファイルの変更のみ:
`README.md` / `docs/developer.md` / `src/scenes/demo.js`
（未追跡の `archives/agents/TODO-054/` を除く）。`src/config.js` は
今回のコミット前差分に含まれていない（TODO-052 での追加分のみ残っている
状態で、TODO-054 として新たに変えたファイルは無い）。TODO.md の
TODO-054 節の指示（`src/scenes/demo.js` の変更と README・developer.md の
文書更新）と一致しており、指示に無いファイルの変更は無かった。

## 確かめられなかったこと・判断できないこと

- 「盤のピースが一度全部 'tray' に戻る」の外部からの直接観測は、
  ポーリングの往復遅延のため通常の `page.evaluate` の繰り返しでは
  できなかった。`Object.defineProperty` によるフック（自作の計測用の
  仕込みで、対象コードそのものは変更していない）で代替した。この
  代替手段が「実測」として十分かどうかは、境界線上の判断として
  管理者に委ねる
- `startSearch()` 内で `state = 'running'` の代入が `tried = 0` より
  先にある順序自体は、外部から見た挙動には影響しない（同一の同期処理
  内で完結するため）が、コードの読みやすさの観点は確認の対象外
  （reviewer の担当と理解している）
- 実機（Playwright を介さない通常のブラウザタブ）での挙動までは
  確かめていない
