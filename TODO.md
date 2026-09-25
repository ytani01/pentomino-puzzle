# TODO

**残っている項目: TODO-083・084。** これまでに 83 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-086` から。**

---

## TODO-083. URL でデモを直接開けるようにする（`?demo=random&board=8x8`）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |

- [ ] 起動時に URL のパラメータを読み、`demo` があればタイトルを飛ばしてデモを開く。`demo` は探し方（`random` / `depth`）、`board` は盤（`8x8` / `6x10`）。省いたものと知らない値は既定（ランダム・8×8）
- [ ] パラメータを読む処理は Phaser に依存しない純関数にして `tests.html` で確かめる（置き場所は `logic.js` か新しい関数か、実装のときに決める）
- [ ] URL で開いたデモから「タイトルへ」を押したら、タイトルへ移り、`history.replaceState` で URL から `demo`・`board` を消す（読み直してもタイトルが開くように）
- [ ] URL の `board` は、そのデモの間だけ使い、タイトルで選んだ盤（保存してある選択）は書き換えない
- [ ] デモが全解のデータを読み込んでから始まる流れ（今はタイトル経由）が、直接開いても崩れないか確かめる
- [ ] 音: ブラウザは操作前に音を出させないので、直接開くと最初の操作までは鳴らない。これで困らないかを画面で確かめ、困るなら利用者に聞く
- [ ] `docs/UsersGuide.md`・`docs/developer.md` に URL を書く
- [ ] 画面で確かめる: パラメータ無し（タイトル）、`?demo=random&board=8x8`、`?demo=depth&board=6x10`、知らない値。「タイトルへ」で URL からパラメータが消えること

**背景。** README のデモの GIF から、動いているデモへ直接飛べるようにしたい
（TODO-084 の前提）。利用者が決めたこと（2026-09-26）: URL の形は
`?demo=random&board=8x8`（探し方と盤を指定できる）、「タイトルへ」では URL から
パラメータを消す。

---

## TODO-084. README のデモの GIF を撮り直し、デモを直接開くリンクにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main + screens（Sonnet 5 / low） |

- [ ] `README.md` の `docs/images/demo.gif` を、`https://ytani01.github.io/pentomino-puzzle/?demo=random&board=8x8` へのリンクにする（TODO-083 の URL）
- [ ] `tools/capture.mjs` の GIF を撮り直す（TODO-081・082 でランダムの動きが変わったため）。撮るときも同じ URL で開くようにできるなら、そうする
- [ ] GIF のフレームを抜いて、欠けていないか・余計なものが映っていないかを見る（screens）

**背景。** GitHub の README は `<iframe>` を取り除くので、動いているデモは
埋め込めない。代わりに今ある GIF をリンクにして、押せば本物のデモが開くようにする
（利用者が 1 と 3 の組み合わせを選んだ。2026-09-26）。TODO-083 が済んでから着手する。
文書と `tools/` だけなので、公開のタグは付けない。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
