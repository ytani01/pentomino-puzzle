# TODO

**残っている項目: TODO-076・077・078。** これまでに 75 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-079` から。**

---

## TODO-076. ボタンを高く・幅を狭くし、タイトルへのボタンを左上に置く

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] 全画面のボタン（本編・デモの HUD、記録、クリア表示、タイトル）を今より高く、幅を狭くする
- [ ] 寸法は `config.js` に置く（値は仮。画面で見て利用者が決める）
- [ ] タイトルへのボタンを、本編・デモの HUD では並びの一番左に、記録画面では左上に置く
- [ ] `docs/UsersGuide.md`・`docs/developer.md` のボタンの並びの説明と、`docs/images/` のキャプチャを直す

今の HUD のボタンは幅 `HUD_BUTTON_MAX` 130（場所が足りなければ詰める）・高さ 44 で、
タイトルへのボタンは並びの最後（`game.js`・`demo.js` の `createHudButtons()`）。
記録画面では下の並び（`records.js` の `titleButton`）にある。
範囲は全画面・タイトルへは全画面と、利用者が決めた（2026-09-25）。
縦画面では HUD が 2 段に折り返すので、高くした分だけ盤とトレイが縮まないかを見る。

---

## TODO-077. デモのランダムで、どのピースも覆えない空きマスがあれば外す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high） |

- [ ] `logic.js` に、残りのピースのどの置き方でも覆えない空きマスがあるかを返す関数を足す
- [ ] `solveStepsRandom()` で、それがあれば置いた直後にその場で外す（今の「5 の倍数でない空き」と同じ扱い）
- [ ] `tests.html` に、覆えないマスがある盤・無い盤のテストを足す（壊すと落ちるかも見る）
- [ ] `docs/developer.md`・`docs/UsersGuide.md` のランダムの説明を直す

今の打ち切りは `regionsFitPieces()`（閉じた空きの大きさが 5 の倍数か）と、
5 マスの穴に合うピースが置き済みのとき（`forcedPlacements()`）だけ。
判定は空きマス 1 つずつで見ると利用者が決めた（2026-09-25）。
深さ優先（`solveSteps()`）は変えない。1 手ごとに全ピースの置き方を当てるので、
着手時に 1 手あたりの時間を測ってから入れる。

---

## TODO-078. デモのランダムのアイコンを別の図案に替える

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ screens（Sonnet 5 / low） |

- [ ] `src/icons.js` の `SCATTER_NODES`・`SCATTER_EDGES` を下の図案に替える
- [ ] `ICONS.depthFirst` の JSDoc の「輪もできる」を直す（この図案は輪が無く、一筆でつながる）
- [ ] `node tools/capture.mjs` で `docs/images/` のデモのキャプチャを撮り直す

利用者が 10 通りの候補から 3 番を選んだ（2026-09-25。比較画像は
`~/tmp/playwright-mcp/random-icon-ten.png`）。節 6 つ・大きさは今と同じで、交差は 2 か所。
線が関係ない節の上を通らないことは座標から計算して確かめてある。

```js
const SCATTER_NODES = [[-0.5, 0.25], [0.45, -0.65], [-0.25, -0.7], [0.7, -0.05], [0.1, 0.45], [0.6, 0.7]];
const SCATTER_EDGES = [[1, 0], [3, 5], [2, 3], [4, 2], [0, 4]];
```

`docs/UsersGuide.md` の「線が絡まった点」はそのままで合う。
形だけの変更で挙動は変わらないので reviewer は入れない。screens には
深さ優先と並べて見分けられるか、0.5 倍で潰れないかを見させる。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
