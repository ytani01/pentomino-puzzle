# TODO

**残っている項目: TODO-116。** これまでに 115 件を決着させた。
新しく足すときは「完了済み」の上に節を作る。**番号は `TODO-117` から。**

## TODO-116. localStorage が使えないときの storage.js のテストを足す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | tests（Sonnet 5.5 / low） |

- [ ] `tests.html` に、`window.localStorage` の読み書きが例外を投げるときと、保存データが
      壊れている（JSON でない・形が違う）ときに、`src/storage.js` の export が例外を外へ出さず
      今の既定値を返すことのテストを足す（代表として `loadHistory`・`loadProgress`・
      `loadFound`・`addFound`・`savePalette` を 1 つずつ）

TODO-106 で読み書きを `readItem()` / `writeItem()` / `removeItem()` にまとめたが、この経路を
確かめるテストが無い（TODO-106 のレビュー）。確認は使い捨てのスクリプトでしただけで、
今後の変更で壊れても `tests.html` は落ちない。

**無駄を省く工夫:** 期待値は今の `storage.js` の返す値をそのまま使う（TODO-106 の reviewer が
旧版と同じことを確かめ済み）。足したテストは `storage.js` の try を外すと落ちることを 1 回だけ見る。
画面は撮らない。

## 完了済み

決着した項目は `archives/todo/` にある（1 項目 1 ファイル）。
一覧は [archives/index.md](archives/index.md)（新しい順）。やらないと決めたものは
ファイル名に（対応しない）が付いていて、理由も書いてある。蒸し返す前に読むこと。
