# TODO-047 verifier 報告

対象: `README.md`・`docs/developer.md`・`CLAUDE.md`。ファイルは直していない。

## 1. 手順を実際に試した結果

- `curl --max-time 5 -s -o /dev/null -w '%{http_code}'` で README のローカル URL 2 つを開いた。
  `http://localhost:8765/` → `200`、`http://localhost:8765/tests.html` → `200`。一致。
- `timeout 900 node tools/gen-solutions.mjs --check` を実行。終了コード `0`（正常）。出力:
  ```
  8×8: 全 520 解、代表形 65 件（17.0 秒）
    → src/data/8x8.js と一致した
  6×10: 全 9356 解、代表形 2339 件（388.9 秒）
    → src/data/6x10.js と一致した
  ```
  `docs/developer.md:114` の「8×8 が数秒、**6×10 が数分**（実測 327 秒）」と比べると、
  6×10 は今回 388.9 秒（約 6.5 分）で「数分」の範囲には収まる。8×8 の 17.0 秒は
  「数秒」と呼ぶには長め。ただし同じ行に「機械の混み具合で変わる」と自ら
  ことわっており、今回の値もその変動の範囲内と見なせる。数値を検証したという
  記録として残すのみで、書き換えるべきとまでは判断していない（境界線上、実害は未確認）。
- `gh run list --repo ytani01/pentomino-puzzle --limit 3` は動いた。直近 3 件はすべて
  `completed / success`（`docs/developer.md` の「日常的なデプロイの手順」4. の
  コマンドと一致）。
- `git tag` / `git push` の実行は指示どおり試していない。内容を CLAUDE.md の
  「公開（GitHub Pages）」と読み比べた（3 節を参照）。

## 2. 変わった箇所とコードの突き合わせ（`git diff README.md docs/developer.md`）

一致したもの（1 行で）:
- README `icons.js` の説明「HUD のボタンのアイコンと、タイトルの盤・色の選択肢の図」
  ← `src/icons.js:2`「HUD のボタンのアイコン（TODO-042）と、タイトルの盤・色の選択肢の図（TODO-046）」と一致。
- README「近くの置けるマスへ吸い付く」・「押すと）何のボタンかが出る」は言い回しの統一のみで事実は変えていない。
- `docs/developer.md:77` 内部解像度「横画面は 960×640、縦画面は 640×1136」
  ← `src/config.js:274-276` の `screenSize()`（`portrait ? 640 : 960` / `portrait ? 1136 : 640`）と一致。
- `docs/developer.md` の「日常的なデプロイの手順」1.〜3.（`develop` に積む→タグを作り
  `git push origin develop vX.Y.Z`、`feat`=minor・`fix`/`refactor`=patch、
  文書/tools だけならタグを付けない）
  ← `CLAUDE.md:104-112`（「公開（GitHub Pages）」節）の決めごとと完全に一致。
- 外した TODO 番号の参照（`docs/developer.md` 各所、TODO-008/012/013/022/024/026/027/028/037/040/042/043/044/045）は、
  対応する `archives/todo/` の記録が実際に存在し、現行の説明内容自体は変わっていないことを
  `src/` 側の関数名・キー名で個別に確認済み（`forcedPlacements()`＝`src/logic.js`、
  `createHintBadge()`＝`src/ui.js`、`canonicalBoard()`＝`src/logic.js` など）。

食い違い・懸念（今回の diff の範囲では見つからず）。

## 3. 3 文書を通しで照らした結果

- 一致: `.claude/agents/*.md` のモデル／effort（tests: sonnet/medium、screens: sonnet/low、
  docs: sonnet/medium、measure: sonnet/medium）は `docs/developer.md` の表と実ファイルで一致。
- 一致: `README.md`・`CLAUDE.md` のファイル構成表は `find src -maxdepth 2 -name '*.js'` の
  実際の一覧と過不足なく一致。
- **食い違い（新規発見）**: `docs/developer.md:193-196`「タグを push して公開する」節。
  ```
  git tag v0.2.0
  git push --tags
  ```
  ここだけ `develop` を push する記述が無く、タグだけ push する古い手順のまま。
  すぐ下（234 行あたり）の「日常的なデプロイの手順」3. は
  `git tag v0.3.0 -m "..."` に続けて `git push origin develop v0.3.0` としており、
  `CLAUDE.md:108` の「`git push origin develop vX.Y.Z` で送る」とも一致する。
  同じファイル内で 2 通りの push 手順が併存しており、上の節だけ読むと
  `develop` を push し忘れる恐れがある。この節は今回の diff（docs/wording 担当の
  編集）に含まれておらず、以前から変わっていない記述と見られる。
  直すかどうかは判断が要る点として報告のみ（実害は未確認。手順通りに実行すると
  GitHub Pages 公開ワークフロー自体はタグ push で動くので即座に壊れるわけではないが、
  `develop` 側の変更が反映されないまま公開される可能性がある）。

他に、README・docs/developer.md・CLAUDE.md の間で数値（65/2339 解、内部解像度、
ボタン数 6 個など）・関数名・ファイル名の食い違いは見つからなかった。

## 4. TODO 番号の残存確認

```
rg -n 'TODO-\d' README.md docs/developer.md
```

結果は `docs/developer.md:87` の 1 件のみ:
```
実測は[全解をデータとして持つと決めたときの記録](../archives/todo/TODO-022.%20解を全てデータとして持つ.md)にある。
```
これは archives へのリンク先パスなので、指示の除外対象に該当する。本文中に
残った TODO 番号は無い。

## 確かめられなかったこと・判断できないこと

- `git tag` / `git push` の実コマンドは指示により実行していない（内容の突き合わせのみ）。
- `docs/developer.md:114` の「実測 327 秒」という具体的な数字が正しかったか（測定当時の値）は
  今回さかのぼって確認できない。今回の実測（8×8: 17.0 秒、6×10: 388.9 秒）との差が
  機械差によるものかは判断できない。
- 3 の「タグを push して公開する」節を直すべきかどうかは、文体・優先順位の判断が要るため
  報告のみにとどめた（実害は未確認）。
