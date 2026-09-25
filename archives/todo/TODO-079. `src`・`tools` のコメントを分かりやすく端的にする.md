# TODO-079. `src`・`tools` のコメントを分かりやすく端的にする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer ×3（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort high | implementer ×3（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 19,185 | 45,240 | 18% |
| implementer ×3 | Opus 5.5 | medium | 103,965 | 391,853 | 54% |
| reviewer | Opus 5.5 | high | 6,960 | 186,005 | 23% |
| verifier | Sonnet 5 | medium | 2,804 | 66,232 | 5% |
| 合計 |  |  | 132,914 | 689,330 | 概算 $13.9 |

- implementer と reviewer は定義のモデルが sonnet。日本語の良し悪しと「意味が変わっていないか」の判断が要るので Opus 5.5 に上書きした
- main の分には、途中で TODO-080 を立てたやり取りも入っている

## きっかけ

利用者から、ソースコードのコメントを、もっと分かりやすく端的で自然な日本語にしたいと頼まれた。

## やったこと

- `src/`（`src/data/*.js` を除く）と `tools/*.mjs` の 17 ファイルでコメントを直した（+911 / −1056 行）
  - 冗長な言い回し、直訳調、要らない主語を直した
  - `（TODO-NNN）` の番号は残し、経緯（「レビューの要修正 N」「以前は〜」など）は削った
  - 「なぜそうするのか」は残し、コードを読めば分かる「何を」だけのコメントは消した
  - 表記は元の多数に合わせて「ぶん」に揃えた
- 今のコードと合っていなかったコメントを直した
  - `config.js`: ボタンの高さ（44→56）、`HUD_ROW`（56→68）、`TILE.edgeDarken` の説明（0.68 → TODO-018 で 0.0 にした今の値）
  - `demo.js` の `refreshStatus()`、`records.js` の `refresh()`、`game.js` の「外接矩形の真ん中が空く」例から X を外した
- どこからも呼ばれていない `storage.js` の `clearBest()` を消した（利用者が「使われていないコードは消す」と決めた）。
  同じく使われていない `clearHistory()` は、テストの書き直しが要るので TODO-080 に分けた

## 確かめたこと

- verifier: HEAD と作業ツリーの両方からコメントを除いて比べ、違いは `clearBest()` の削除だけ。
  比較スクリプトは、コードを 1 か所変えた複製で食い違いが出ることを確かめてから使った
- `node --check` が 17 ファイルとも通った。`node tools/gen-solutions.mjs --check` も通った
- `tests.html`: 407 件すべて通った（main が Playwright MCP で実行。verifier の Bash ではサンドボックスのため Chromium がページを開けなかった）

## 分担の振り返り

分担と各担当の報告は [archives/agents/TODO-079/](../agents/TODO-079/README.md)。

- **各担当が見つけたこと**: implementer-1 は `config.js` の古い値 3 か所、implementer-3 は使われていない `clearBest()`、
  implementer-2 はコードと合わないコメント 2 か所を見つけた（2 か所は自分で直した）。reviewer は、意味が逆になった 1 か所
  （`demo.js` の「含まれる」、正しくは「足される」）、理由の文の主語が抜けたところなどの 9 件、表記のずれ（implementer-2 だけ
  「分」に書き換えた）を見つけた。verifier は、変わったのがコメントだけであることを確かめたが、`tests.html` はサンドボックスで走らせられなかった
- **見込みとの食い違い**: 編成は見込みどおり。予定外だったのは、コードの削除が 1 件入ったことと、`tests.html` を main が走らせたこと
- **次に同じ規模の項目をやるなら**: implementer への依頼に、表記を揃える先（「ぶん」など）と「元の動詞や接続を変えるときは
  意味が変わらないか見直す」を書いておく。そうすれば reviewer の指摘は減る。`tests.html` を走らせる確認は、Playwright MCP を持つ `tests`
  の担当に渡す（verifier の Bash では Chromium がページを開けない）。料金の半分は implementer なので、並行 3 人は維持してよい。
  reviewer（23%）は意味が逆になった箇所を見つけたので省かない
