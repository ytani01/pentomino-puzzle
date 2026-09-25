# TODO-096. 公開した直後のリロードで新しい版が出るようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | main（実装）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort high | main（実装）+ verifier（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 21,590 | 47,559 | 57% |
| implementer | Opus 5.5 | medium | 623 | 151,603 | 30% |
| reviewer | Opus 5.5 | high | 3,425 | 43,242 | 6% |
| verifier | Sonnet 5 | medium | 2,629 | 48,321 | 3% |
| screens | Sonnet 5 | low | 164 | 7,975 | 2% |
| 合計 |  |  | 28,431 | 298,700 | 概算 $8.6 |

- 立てたコミット（`9a3a1b8`）から決着のコミットの直前まで
- **TODO-094・095 と並行させたので、その分が混ざっている。** implementer は TODO-095、
  screens は TODO-094 のもの。main にも TODO-094 の決着の作業が入っている
- reviewer は定義のモデルが sonnet。公開の挙動が変わるレビューなので Opus 5.5 に上書きした。
  見込みに reviewer が無かったのは、立てたときに「スクリプトの分岐で公開の挙動が変わる」ことを
  数えていなかったため

## きっかけ

スマホのブラウザでリロードしても、公開したばかりの版が出なかった。GitHub Pages は
`cache-control: max-age=600` を返し（`curl -I` で確認）、読み込みの URL が版ごとに
変わらないので、公開から 10 分は古い JS が使われていた。

## やったこと

- `tools/stamp-version.mjs`: 公開するコピー（`dist/`）の `index.html` の `src/main.js` と、
  `src/` の静的・動的な相対 import のすべてに `?v=<タグ名>` を付ける（今は 58 か所）。
  手元のコードは変えない。置換の形から外れた相対の `.js`（二重引用符の import など）や
  テンプレートリテラルの動的 import が残ったとき、1 か所も付けられなかったときは失敗する
- `.github/workflows/pages.yml`: `dist/` を作ったあと、upload の前に上のスクリプトを走らせる
- 文書: `docs/developer.md` の公開の節とファイル構成のツリー、`CLAUDE.md` のファイル構成の表

## 確かめたこと

- verifier（[verifier-report.md](../agents/TODO-096/verifier-report.md)）: 公開と同じ手順で
  `dist/` を作って走らせ、終了コード 0。ブラウザで開くと自前の `.js` のリクエストがすべて
  `?v=` 付きで、同じモジュールの二重読み込みは無く、全解のデータ（動的 import）も `?v=` 付き。
  二重引用符の import を足すと失敗、相対 import が無いディレクトリでも失敗。段の順番も合っている
- reviewer（[reviewer-report.md](../agents/TODO-096/reviewer-report.md)）: 要修正 1
  （`docs/developer.md` のツリーの書き漏れ）。検討のうち、テンプレートリテラルの動的 import が
  素通りする件は検出に足し、main が試して失敗することを見た
- 公開後、Pages の `index.html` の `src/main.js` に `?v=v1.10.1` が付いていることを `curl` で見る
  （決着のコミットのあとに確かめ、結果は利用者に伝える）

## 残ること

- この仕組みは、リロードで `index.html` 自体が取り直されることを前提にしている。
  `index.html` も 10 分キャッシュされるが、主要なブラウザはリロードで最上位の文書を
  再検証する。iOS Safari で同じかは確かめていない
- コメントの中に引用符付きの相対パス（`'./x.js'`）を書くと、付け漏れと見なしてジョブが
  失敗する（公開が止まるだけで、古い版が混ざることは無い。reviewer の検討）

## 分担の振り返り

- verifier は食い違いを見つけなかった。reviewer は文書の書き漏れと、検出をすり抜ける
  書き方（テンプレートリテラル）を見つけた。後者は今のコードに無いが、検出の目的に
  関わるので直した
- 見込みでは reviewer を入れていなかった。付け漏れの検出という分岐がある以上、
  立てるときに reviewer を入れておくべきだった
- 次に公開の仕組みを変える項目は、立てるときから reviewer を入れ、verifier に
  「公開されたものを `curl` で見る」までを頼む
