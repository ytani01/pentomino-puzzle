# TODO-071 implementer 報告

## 追記（3 回目: `tools/capture.mjs` の記録画面の撮影を直す）

申し送りどおり、`records.png` の撮影処理が無くなったボタン
（`s.removeButton` / `s.clearButton`）を参照したままだったのを直した。

- `src/scenes/records.js:288` 付近 — タイトルへ戻るボタンを `this.titleButton`
  として持たせた（今までは変数に取らず作りっぱなしだった）。ほかの下段の
  ボタン（`prevButton` / `nextButton` / `trashButton`）と同じく、`capture.mjs`
  が吹き出しで指せるようにするため
- `tools/capture.mjs:238` 付近 — `Records` の `annotate()` 呼び出しを、今の部品
  （一覧・チェック・全部選ぶ・印・完成形・達成度・前へ／次へ／ゴミ箱／
  タイトルへ）を指す吹き出しに差し替えた。番号の付け方は `game.js` の撮影
  （Ⓐ〜Ⓕ が名前の付いた部品、1〜6 が並んだアイコンボタン）に揃え、
  Ⓐ一覧・Ⓑチェック・Ⓒ全部選ぶ・Ⓓ印・Ⓔ完成形・Ⓕ達成度、
  1 前へ・2 次へ・3 ゴミ箱・4 タイトルへ、とした
- `docs/UsersGuide.md` の記録の節を、上の記号・番号に合わせて書き直した。
  下段のアイコン 4 つは `game.js` の HUD ボタンと同じ形の表にした

### 検証（3 回目）

- `node --check tools/capture.mjs` … 構文 OK（依頼どおり、撮影は main が行う
  ため実行していない）
- `node --input-type=module --check < src/scenes/records.js` … 構文 OK
- 「印」の吹き出し（Ⓓ）が指す `s.rowButtons[3].list[3]` は、`capture.mjs` が
  仕込む記録データ（237 行付近、`no: 57` がおまかせ・ヒント両方の印を持つ）が
  並ぶ順で 4 行目（0 始まりで index 3）に来ることを、データの組み立て
  （`entries.reverse()` してから `at` を新しい順に振り、`addHistory()` で
  先頭へ積む処理）を読んで確かめた（このデータ生成部分は今回変えていない）。
  実際に撮ってのピクセル確認はしていない（撮影は main の担当）

## 追記（2 回目: 案 B に一本化 + 印の重なりの修正）

利用者が案 B（1 頁 8 行）を選んだのを受けて、次を直した。

- `src/config.js` — `RECORDS_LAYOUT` を削除（切り替えを畳んだ）
- `src/scenes/records.js` — `LAYOUTS_BY_VARIANT`（案 A / B の 2 組）を削除し、
  `L` を向きごと 1 組の定義に戻した（中身は撮り比べで選ばれた案 B の値）
- **印の重なりの原因**: `screens-report.md` の指摘（844×390 で選択中の行の
  「おまかせ・ヒント」が経過時間にくっつく）を調べた。選択中かどうかは
  関係なく、**チェックボックスを足したぶん行の文字を収める幅が 42px
  （`CHECKBOX.size + CHECKBOX.gap`）狭くなっていた**のが原因。元の
  `listWidth`（432 横画面・570 縦画面）は「おまかせ・ヒント」というもっとも
  長い印がちょうど収まるところまで詰めてあった値で、そこからチェックボックスの
  分を差し引くと窮屈になり、選んだ行にたまたま両方の印が付いていたので
  そこだけ目に見えて詰まった（ほかの行は印が短い、または無いので気づかなかった）。
  `src/scenes/records.js` の `ROW_TEXT_WIDTH`（文字を収める幅。元の 432 / 570 と
  同じ）に `CHECKBOX.size + CHECKBOX.gap` を足したものを `L.listWidth`
  （チェックボックスを含む一覧全体の幅）にする形にして、行の文字の幅を
  元の値へ戻した
- `docs/UsersGuide.md` — 記録の説明を、今の配置（チェックボックス・全部選ぶ・
  達成度・画面下のゴミ箱/ホーム/前へ次へ）に合わせて書き直した。番号付きの
  見出し（①②…）は `tools/capture.mjs` の再撮影に合わせて後で振り直す前提で外した

### 検証（2 回目）

- `tests.html` を Playwright の新しいコンテキストで開いて確認。**355 件すべて通った**
  （変わらず。`clampSelection`・`removeHistoryMany` のテストも含む）
- 844×390 で、両方の印が付く行を仕込んで `rowButtons` の `text` と `markText` の
  実際の x 座標を読み、選択中・非選択の両方で間隔が正（重ならない）ことを確認
  （選択中: 38px、非選択: 123px の隙間）

### 残る懸念・main への申し送り

- `tools/capture.mjs` の `records.png` 撮影処理（237〜250 行）は、今回無くした
  `s.removeButton` / `s.clearButton` と、行の内部構造が変わった
  `s.rowButtons[3].list[3]`（今は `list[3]` がチェックの有無に関わらず mark
  なので参照自体はまだ有効そうだが、`removeButton`/`clearButton` は確実に
  無い）をまだ参照している。**このままだと main が撮り直すときにスクリプトが
  例外で止まる。** 今回の依頼の範囲外（依頼は docs/UsersGuide.md の文章だけ）
  なので直していない。`tools/capture.mjs` 側の annotate 呼び出しを
  `s.selectAllButton` / `s.trashButton` / 新しいホーム・前へ・次へのボタンへ
  差し替える必要がある

## 変更したファイル（1 回目）

- `src/logic.js:966` — `clampSelection(length, selected, page, rowsPerPage)` を追加（純関数）。
  件数が減ったあとの選び位置と頁を詰め直す。1 件消す・複数件まとめて消すの両方で使う。
- `src/storage.js:290` 付近 — `removeHistoryMany(boardKey, nos, solutions)` を追加。
  `removeHistory()` の複数版で、番号の配列を渡すと 1 回の保存でまとめて消す。
- `src/config.js:75` 付近 — `RECORDS_LAYOUT = 'A'` を追加（案 A / B を切り替える仮の値）。
- `src/icons.js` — `ICONS.check`（チェックの印）・`ICONS.trash`（ゴミ箱）・
  `ICONS.prevPage` / `ICONS.nextPage`（頁送りの三角）を追加。
- `src/scenes/records.js` — 全面的に書き換え。
  - 一覧の各行の左端にチェックボックスを常設（`rowChecks`）。行を押すと今までどおり
    完成形を出し（`selectRow`）、チェックは選ぶ／外すだけ（`toggleRow`）
  - 一覧の上に「全部選ぶ」（`toggleSelectAll`）。見えていない頁の分も含め、その盤の
    記録すべてを対象にする
  - 「この回を消す」「全部消す」の 2 ボタンを廃止し、ゴミ箱 1 つ（`confirmTrash` →
    `doTrash`）にまとめた。チェックが 1 件以上のときだけ押せる。押すと画面内の確認
    （件数を出す）を経てから `removeHistoryMany` と `removeFound` / `removeAuto` を呼ぶ
  - チェックは盤を切り替えたら消す（`reload()` で作り直す）。頁を送っても残す
  - 「タイトルへ」をホームのアイコン（`ICONS.title`）に、頁送りを三角アイコンにした。
    前へ・次へ・ゴミ箱・タイトルへを画面下の 1 段（`createFoot`）にまとめた
  - 配置は `RECORDS_LAYOUT`（`config.js`）で案 A・B を切り替えられるようにした
    （`LAYOUTS_BY_VARIANT`）。**数値は仮**（後述）
- `tests.html` — `clampSelection`・`removeHistoryMany` のテストを追加（各 5 件・3 件）。
- `docs/UsersGuide.md` — 記録画面の説明を、チェックボックス・全部選ぶ・ゴミ箱の動きに
  合わせて書き換えた（配置は決まっていないので、番号付きの見出し⑤⑥は外した。画像
  `docs/images/records.png` は撮り直していない — 撮る担当の作業）。

## 依頼との違い

- 「この回を消す」「全部消す」の 2 ボタンを完全に無くし、チェック＋ゴミ箱の 1 系統に
  一本化した（依頼の「ゴミ箱 1 つにまとめる」を、1 件だけ選んでも消せる形で解釈した）。
  `removeHistory`（単体消し）は使わなくなったが、`storage.js` からは消していない
  （既存のテスト・関数として残る）。
- 案 A・B の配置の数値は、`SCREEN` の内部解像度から計算はしたが、**画面を撮って確かめて
  いない**（依頼どおり「画面は撮らなくてよい」に従った）。footY と一覧・達成度の間隔が
  詰まっている箇所がいくつかある（余白 10〜20px 程度）。撮る担当・reviewer が見て、
  詰まりすぎていれば `records.js` 冒頭の `LAYOUTS_BY_VARIANT` の数値だけを直せばよい
  （挙動には関わらない）。

## 撮る担当向け

- 案の切り替え: `src/config.js` の `RECORDS_LAYOUT` を `'A'` または `'B'` にして保存
  （ビルド不要、リロードで反映）。
- 記録を何件か入れる方法（ブラウザの devtools コンソールか Playwright の `page.evaluate`）:
  ```js
  localStorage.setItem('pentomino-puzzle/history/v2/8x8', JSON.stringify([
    { at: Date.now(), ms: 12345, no: 1 },
    { at: Date.now() - 60000, ms: 22345, no: 2 },
    // ...盤 8x8 なら no は 1〜65、6x10 は 1〜2339 の範囲で好きなだけ
  ]));
  ```
  6×10 は `pentomino-puzzle/history/v2/6x10` というキー。ページを開き直す（または
  `Records` シーンを開き直す）と一覧に反映される。

## 検証

- `python3 -m http.server 8765` を立て、Playwright（`~/.npm/_npx/*/node_modules/playwright`
  を借用）で `tests.html` を新しいコンテキストで開いて確認。
  **355 件すべて通った**（追加した `clampSelection` 5 件・`removeHistoryMany` 3 件×2 盤を含む）。
  `PAGE ERRORS: []`（実行時エラー無し）。
  - Bash ツールのサンドボックス内では Playwright の Chromium が `localhost` へ届かず
    `page.goto` がタイムアウトしたため、管理者の許可を得て `dangerouslyDisableSandbox: true`
    で実行した。
- `node --input-type=module --check < src/scenes/records.js` で構文を確認（OK）。
- 本編の画面（`index.html`）を Playwright で開き、`localStorage` に履歴を仕込んでから
  `Records` シーンを起動し、`toggleRow` → `toggleSelectAll`（2 回で元に戻る）→
  `trashButton.enabled` の変化 → `doTrash()`（確認 → `confirmAction()`）までを実行時に
  直接呼んで確かめた。3 件のうち 2 件をチェックして消すと、残り 1 件だけが
  `localStorage` に保存され、`selected` / `page` が 0 に詰まることを確認した
  （`errors: []`、実行時エラー無し）。

## 残る懸念

- 案 A・B の配置の細部（余白の詰まり）は目視確認していない。screens / reviewer の
  担当で撮って、詰まっていれば `records.js` 冒頭の数値だけ直す前提。
- `gen-solutions.mjs --check` は今回 `logic.js` の向き生成や `config.js` のピース定義を
  変えていないので実行していない（`docs/developer.md` の条件に当たらない）。
