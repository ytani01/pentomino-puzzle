# TODO-096 verifier 報告

対象: 未コミットの `tools/stamp-version.mjs`（新規）、`.github/workflows/pages.yml` の
「読み込みに版を付ける」段。作業はすべて
`/tmp/claude-649/-home-ytani-work-pentomino-puzzle/f10f0b39-6a0c-4db6-b5e3-99ddf657eb61/scratchpad/`
の下で行い、本体の木は変更していない（後述の docs/images/ の変更を除く。これは
本作業では触っていない）。

## 1. dist を作って stamp-version.mjs を走らせる（一致）

pages.yml の「公開するファイルだけを集める」と同じ手順（`cp index.html dist/`・
`cp -r src dist/`）を `scratchpad/dist1` に再現し、
`node tools/stamp-version.mjs scratchpad/dist1 v0.0.0-test` を実行。

```
58 か所に ?v=v0.0.0-test を付けた
exit=0
```

`rg` で `.js` の相対 import（静的 import・動的 import・`<script src="src/...">`）のうち
`?v=` の無いものを探したところ該当なし。`git status --short src/ index.html` は、
このセッション開始前から続く既存の未コミット差分（`src/config.js` など。TODO-092〜095 由来、
本項目とは無関係）のみで、`stamp-version.mjs` の実行によって新たに変わったものは無い。

## 2. dist をブラウザで開いて読み込みを確かめる（一致）

`scratchpad/dist1` を `python3 -m http.server`（ポート 8891）で開き、npx の置き場の
Playwright（1.63.0、`~/.npm/_npx/e41f203b7505f1fb/...`）で読み込みを記録した。

起動時の自前 `.js` リクエスト（`https://cdn.jsdelivr.net/.../phaser.min.js` を除く）は
全 15 件すべて `?v=v0.0.0-test` 付き（`src/main.js` `config.js` `scenes/*.js` `logic.js`
`solutions.js` `storage.js` `audio.js` `ui.js` `icons.js` `src/data/8x8.js` を含む）。
`?v=` の無い重複リクエストは無し。コンソールエラーも無し。

`window.game.scene.getScene('Title').start()` を呼んで本編（Game シーン）へ入れたところ
`active scenes: [ 'Game' ]` となり、遷移後に追加の `.js` リクエストは発生しなかった
（`src/data/8x8.js` は起動時に一度、`?v=` 付きで読み込み済みで、本編遷移時に無版で
再取得されることは無かった）。コンソールエラーも無し。

注記（境界線上、実害は未確認）: 画面上のバージョン表示は `dev` のままだった。これは
`VERSION` の置換（`sed` による `src/config.js` 書き換え）を今回意図的に走らせて
いないため（依頼の「見なくてよいもの」に「VERSION の置換」が明記されている）で、
`stamp-version.mjs` 自体の不具合ではないと判断した。ただし「バージョンの表示が
起きていること」という確認項目の文言との整合は main の判断を仰ぎたい。

「はじめる」ボタンは `createButton` が Container を返す構造で、`scene.children.list`
の直下を `text` プロパティで探す方法ではヒットしなかった（`no start button found`）。
実際のクリックではなく `scene.start()` の直接呼び出しに切り替えて確認した。
ボタンの見た目やクリック領域そのものは確認できていない（今回問うている「読み込みに
?v が付くか」には影響しない経路と判断したが、これも境界線上で実害は未確認）。

## 3. 壊すと落ちるか（一致）

`scratchpad/dist2/src/scenes/game.js` の末尾に二重引用符の相対 import
（`import x from "./logic.js";`）を 1 行追加して実行。

```
::error::版を付けられなかった読み込みがある
.../dist2/src/scenes/game.js: import x from "./logic.js";
exit=1
```

想定どおり非 0 で終了し、該当行が出力に含まれた。

相対 import が 1 つも無いディレクトリ（`index.html` に js を含まないものだけを置いた
`scratchpad/dist3`）でも:

```
::error::版を付けた読み込みが 1 つも無い
exit=1
```

想定どおり非 0（`count === 0` のガード）。

## 4. pages.yml の段の順番と `${GITHUB_REF_NAME}` の渡し方（一致）

```
56:      - name: 公開するファイルだけを集める
57:        run: |
65:      - name: 読み込みに版を付ける
66:        run: node tools/stamp-version.mjs dist "${GITHUB_REF_NAME}"
68:      - uses: actions/configure-pages@v5
70:      - uses: actions/upload-pages-artifact@v3
```

dist を作った直後（56）、`configure-pages`／`upload-pages-artifact`（68・70）より前に
版付け（65）が置かれている。`${GITHUB_REF_NAME}` は二重引用符で囲って渡されている。

## 確かめなかったこと・判断できないこと

- VERSION の置換、`gen-solutions --check`、デザインは依頼どおり見ていない。
- 「はじめる」ボタンの実際のクリック（座標・見た目）は確認していない。
  `scene.start()` の直接呼び出しで代替した（上記 2. 参照）。
- **`docs/images/demo.png` `docs/images/game.png` `docs/images/demo.gif` が、
  この確認作業の開始後に更新されている（`git status --short` で新たに `M` が
  付いた。作業中に確認した限り本作業では一切触っていない）。** セッション開始時の
  git status にはこの 3 ファイルの変更は無かった。本項目の対象ファイルではなく、
  自分の操作（`scratchpad` 内のコピーの起動・Playwright での閲覧）でも
  `docs/images/` には触れていないため、他の並行作業によるものと思われるが、
  断定はできない。実害は未確認。念のため報告する。
