# TODO-067 verifier report

## 1. `node tools/gen-solutions.mjs --check`

終了コード 0。

```
8×8: 全 520 解、代表形 65 件（5.6 秒）
  → src/data/8x8.js と一致した
6×10: 全 9356 解、代表形 2339 件（148.2 秒）
  → src/data/6x10.js と一致した
EXIT:0
```

## 2. `tests.html`

`python3 -m http.server 8765` を立て、npx 置き場の Playwright（headless Chromium）で
`http://localhost:8765/tests.html` を開いて読んだ。

```
SUMMARY: 327 件すべて通った
PASS: 327
FAIL: 0
TOTAL: 327
CONSOLE ERRORS: 0
```

327 件・全通過・コンソールエラー 0。tests 担当の報告（327 件）と一致した。

## 3. デモの実物（探し方ランダム・最速、3000 手）

`http://localhost:8765/` を開き、Title から `scene.start('Demo')` で直接デモへ入り、
`scene.toggleStrategy()` でランダムへ、`scene.selectSpeed('fastest')` に切り替えた。
盤は `spec.key === '8x8'`（既定）。

実時間の待ちを飛ばすため、`scene.steps`（`solveStepsRandom()` の generator）の
`next()` をラップして毎回の yield をそのまま記録しつつ、`scene.advance()` を
直接繰り返し呼んで進めた（解いたら `scene.startSearch()` を手動で呼んで
`pauseMs` を待たずに次へ）。記録した yield 列を Node 側へ渡し、
`src/logic.js` の `place()` / `remove()` / `forcedPlacements()` / `placedNames()`
で盤面を再現し、以下を数えた（スクリプトは
`/tmp/claude-649/.../scratchpad/run_demo.mjs` と `analyze.mjs`。セッション限りの
scratchpad のため保存はしていない）。

```
placeCount: 3000
doneCount(generator exhausted): 0
solvedCount: 2
placedFormPlaceCount: 237
followedByMatchingRemove: 237
mismatches: 0
CONSOLE ERRORS: 0
```

- 置いた直後に置き済みのピースと同じ形の 5 マスの空きができた place: 237 件
- そのうち次の手が同じ名前の remove だった件数: 237 件（**一致**）
- 食い違い（`hasPlacedForm` なのに次が同じ名前の remove でない）: 0 件
- コンソールエラー: 0 件
- 解に達した回数: 2 回（3000 手のうち。速さは最速）

ブラウザ実行のコンソールエラーも 0 件（`page.on('console'/'pageerror')` で捕捉）。

## 4. 差分と文書の食い違い

- `src/logic.js` の `solveSteps`/`solveStepsRandom` の JSDoc: 「その場で外す 2 つ」
  → 「3 つ」に直り、TODO-067 の説明も足されている。差分の実装（3 つ目の
  `else if` 分岐）と一致。
- `docs/UsersGuide.md`: 「ピースより小さい閉じた空き」「5 マスの穴を埋めた直後の
  解なし」に加え「置き済みのピースと同じ形の 5 マスの空き」を並記。実装と一致。
- `docs/developer.md`: 同様に 3 つ目の条件を追記し、TODO-067 の参照も付いている。
  「（2 つ目はその前に置いた手もまとめて外す）」という言い方も、TODO-066（穴埋め）
  だけが 2 手戻す実装（`if (forced.length > 0 && !ok)` の分岐）と合っている。

食い違いは見つからなかった。

## 変更ファイルと指示の範囲

`git status` は次の 4 ファイルの変更のみ（未コミット）:

- `docs/UsersGuide.md`
- `docs/developer.md`
- `src/logic.js`
- `tests.html`

TODO.md の TODO-067 の節が挙げる「`solveStepsRandom()` を直す」「`tests.html` に
テストを足す」「`docs/UsersGuide.md`・`docs/developer.md` のランダムの説明を直す」の
3 項目とファイルの範囲が一致している。指示に無いファイルの変更は無い。

## 確かめられなかったこと・判断できないこと

- `tests.html` のテストの強さ（壊すと落ちるか）は、依頼で「見なくてよいもの」に
  挙がっていたため確かめていない（tests 担当が壊して確かめ済みとのこと）。
- 6×10 盤でのデモの実測はしていない（依頼に盤の指定が無かったため既定の 8×8 のみ）。
  6×10 でも同じ経路（`forcedPlacements()`／`placedNames()`）を通るので違いが出るとは
  考えにくいが、実測はしていない。これは境界線上の判断で、実害は未確認。
- ランダムの乱数の偏りにより、まれに `placedFormPlaceCount` が 0 に近い回もあり得る
  （今回は 237 件で十分に発生を確認できた）。複数回の再実行はしていない。
