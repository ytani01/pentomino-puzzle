# TODO-053 確認の報告（verifier）

対象: 未コミットの `git diff`（`docs/developer.md`・`src/config.js`・`src/scenes/game.js`・`tests.html`）。
設計 `design.md`、reviewer の指摘 `reviewer-report.md` を踏まえ、指示された 5 点を実測した。

手段: `python3 -m http.server 8765` をバックグラウンドで起動（PID 326964。確認後 `kill` → `ps -p` で消えたことを確認）。
Playwright（node、`chromium.launch()`。viewport は起動時に 1 回だけ指定し、開いたあとの resize はしていない）。
Playwright は本リポジトリに依存が無いため、`NODE_PATH` で
`/home/ytani/work/star-base-defender/tests/node_modules` の既存インストール（v1.63.0）を参照した。
使ったスクリプトはスクラッチ領域（`/tmp/claude-649/.../scratchpad/test1_drag.mjs`・`test2_corner.mjs`）。

## 1. 横 568x320・8×8、トレイの 3 マスのピース（F・I）をドラッグして盤へ置く

`window.game.scene.getScene('Game')` から `layout.tray.slots[piece.slot]` の中心・一辺と
`layout.board` を読み、canvas の `getBoundingClientRect()` で内部解像度→ページ座標の倍率を
求めたうえで、スロット中心からマウスで盤の空いたマス（row1.5, col1.5 相当。8×8 の穴は中央 2×2 なので
干渉しない）へドラッグした。

- F: before=tray → after=**board**
- I: before=tray → after=**board**

一致（両方とも置けた）。

## 2. 縦 390x844・6×10、トレイのスロットの角付近（中心から 0.4 倍ずれ）を押してドラッグ

F（3 マスのピース）で、スロット中心 `(436, 639)`、一辺 66（内部解像度）に対し、
`(436+26.4, 639+26.4)` = 角寄りの点からマウスダウンし、盤の空いたマスへドラッグした。

- location after: **board**（掴めて置けた）

一致。

## 3. tests.html が全件通ること

`297 件すべて通った`（変更前は 277 件。implementer-report.md の時点は 293 件だったので、
その後 tests.html にさらに 4 件足されている。後述 4 で確認したとおり、reviewer の指摘 2
「盤の側に詰める、を守るテストが無い」に対応したテストが `tests.html:204` に
`スロットは盤の側の端から詰めてある（…）` として追加されている）。

## 4. テストの強さ（`src/config.js` を手で壊して確認。壊した箇所は測定後に手で元へ戻した）

**(a) スロットを盤から遠い側の端から並べる**（横は `trayInner.x + trayInner.width - depth`、
縦は `trayInner.y + trayInner.height - depth`。reviewer-report.md の式そのまま）:

- 結果: **4 件が失敗**（293 件は通った）。失敗したのは
  `スロットは盤の側の端から詰めてある（横画面・8×8／6×10、縦画面・8×8／6×10）`
  （例: `盤に一番近いスロットの端 期待 496 / 実際 698`）
- reviewer-report.md はこの壊し方を「全件通る」と報告していたが、**今の tests.html では
  落ちる**。reviewer の指摘 2 で提案されていた「盤に一番近いスロットの端が
  `tray.x`（縦は `tray.y`）に接している」を確かめるテストが、reviewer の報告後に
  `tests.html:204` あたりへ足されており、その効果で捕まるようになっていた
  （`docs/developer.md` の修正と合わせて、reviewer 報告後に手当てされたとみられる）
- 参考: 依頼文どおり `size` を差し引かず中心座標をそのまま鏡映しした形（reviewer の式）で
  確認した。最初に `- size` を足した式でも試したが（同じ「遠い側から並べる」意図の別の式）、
  そちらは 9 件失敗しており、いずれにせよ検知できる

**(b) スロットの一辺を全部 3 マス分にする**（`packTray()` の `longSides` を
`PIECES.map(() => 3)` に固定）:

- 結果: **4 件が失敗**（293 件は通った）。失敗したのは
  `どのスロットもピースの長い辺ぶんの一辺がある（横画面・8×8／6×10、縦画面・8×8／6×10）`
  （`I のスロットが狭い`）

どちらも壊した箇所は手で元の内容に戻した（`git stash` は使っていない）。
戻したことは `diff /tmp/config.js.orig src/config.js` で内容が完全一致することを確認、
さらに `git diff --stat` を取り直し、変更ファイルが `docs/developer.md`・`src/config.js`・
`src/scenes/game.js`・`tests.html` の 4 つだけであること（意図しない差分が残っていないこと）
を確認した。

## 5. `node archives/agents/TODO-053/distance.mjs` の出力が `distance-after.txt` と同じか

`diff <(node archives/agents/TODO-053/distance.mjs) archives/agents/TODO-053/distance-after.txt`
は差分なし（`SAME`）。終了コード 0。

```
横 8x8  盤のマス 55  トレイのマス 20  距離 平均 141 最大 237
横 6x10 盤のマス 64  トレイのマス 20  距離 平均 141 最大 237
縦 8x8  盤のマス 74  トレイのマス 20  距離 平均 121 最大 171
縦 6x10 盤のマス 59  トレイのマス 20  距離 平均 121 最大 171
```

## 変更ファイルと指示の範囲

`git diff --stat`:

```
 docs/developer.md  |  18 +++++-----
 src/config.js      | 103 ++++++++++++++++++++++++++++++++++++-----------------
 src/scenes/game.js |  18 ++++------
 tests.html         |  51 +++++++++++++++++++++++++-
 4 files changed, 135 insertions(+), 55 deletions(-)
```

設計は `src/config.js`・`src/scenes/game.js`・`tests.html` の 3 ファイルを挙げ、
`docs/developer.md` は reviewer の指摘 1（「差分の範囲外」「直すかどうかは管理者の判断」）
だったが、実際には修正されて差分に入っている（上の 4 に書いたとおり、内容も
「等分」の説明から「詰めて並べる」説明へ直っており、reviewer の指摘と整合する）。
指示に無い変更や、上記以外のファイルの変更は無い。

## 確かめられなかったこと・判断できないこと

- reviewer-report.md の指摘 3〜5・「好みの範囲」・「作り込みすぎ」（`longSide` の重複計算、
  `while` の shrink ループなど）は今回の実測範囲に含まれていない。直っているかは未確認
- reviewer-report.md の指摘 1（docs/developer.md）・指摘 2（テストの強さ）は、上記の実測で
  「今の差分では直っている」ことを確認できたが、いつ・誰が直したか（implementer の追加作業か
  他の担当か）はコミット履歴が無いため分からない。判断が要る点ではなく事実確認の限界
- 見た目（画面の並び）・デモ・記録・音は依頼の対象外として見ていない
- ドラッグの実測はマウス操作のみ。タッチ入力（`pointer.wasTouch` でオフセットが変わる分岐）は
  依頼にタッチの指定が無かったため確かめていない
