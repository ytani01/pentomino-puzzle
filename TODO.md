# TODO

**残っている項目: TODO-056。** これまでに 55 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。
**新規項目の番号は `TODO-057` から。**

---

## TODO-056. 文書に図を入れる（UsersGuide に注記付きのキャプチャ、developer に mermaid、README に画面と GIF）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（撮影スクリプト・文書）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |

- [ ] `tools/capture.mjs`（仮）: Playwright で画面を撮る。番号付きの丸と吹き出しは
      HTML/CSS で Canvas に重ねてから撮る。撮り直しはこのスクリプト 1 本で済ませる
- [ ] `docs/images/` に PNG と GIF を置く
- [ ] UsersGuide: 盤と色を選ぶ・HUD のボタン・記録の画面・デモに、注記付きのキャプチャを入れる
- [ ] developer: 3 層の分け方・シーンの移り方・記録の保存（いつ書き込むか）を mermaid で描く
- [ ] README: 遊んでいる途中の盤 1 枚と、デモで探索が進む様子の短い GIF（ffmpeg で作る）
- [ ] CLAUDE.md: 「画像アセットを追加しない」に「文書用の `docs/images/` は例外（ゲームからは参照しない）」と足す。ファイル構成の表に追加分を足す
- [ ] reviewer: mermaid の図がコードと合っているか（シーンの移り方・層の依存関係）
- [ ] screens: 画像を開き、注記がどの部位を指しているか、欠けていないか、余計なものが映っていないかを見る

決めたこと: 画像は `docs/images/` に置く。注記は撮るときに DOM で重ねる。
README は静止画 1 枚＋デモの GIF。3 文書で 1 項目にまとめる。
公開するもの（ゲーム）は変わらないのでタグは付けず、develop だけ push する。

撮影は Playwright MCP で行う。Node 用の Playwright を依存に足さないため、
スクリプトの形（`tools/` に JS を置くか、手順書にするか）は着手時に確かめて決める。

---

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
