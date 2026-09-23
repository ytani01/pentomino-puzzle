# TODO-048. README のファイル構成を developer.md へ移す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main のみ |
| 実施 | Opus 5.5 / effort medium | main のみ |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 2,690 | 4,711 | 100% |
| 合計 |  |  | 2,690 | 4,711 | 概算 $0.8 |

- 見出しは立てたときの「README のファイル構成を docs/developer.md へ移す」から、
  ファイル名に `/` を使えないため「developer.md」に縮めた

## きっかけ

利用者の指示（2026-09-24）。「README.md にファイル構成の説明は不要。developer.md に入れる」。

## やったこと

- `README.md` の「構成」の節（ファイルのツリーと、`src/data/*.js` を手で書き換えない旨）を
  `docs/developer.md` の先頭の節「ファイル構成」へ移した。README には「開発者向け」の節を置き、
  `docs/developer.md` へのリンクだけにした
- `docs/developer.md` の目次に「ファイル構成」を足した。移した文の「全解のデータ」へのリンクは、
  同じファイルの中へのリンク（`#全解のデータ`）に直した
- ツリーの中と `CLAUDE.md` の表の `docs/developer.md` の説明に「ファイル構成」を書き足した
- `CLAUDE.md` のファイル構成の表はそのまま残した（利用者に伝えたうえで、今回は README から移すだけにした）

## 確かめたこと

- 移したツリーが元の README と同じか（`diff` で差分なし）
- README の「構成」への参照が、`archives/` の外に残っていないか（`rg` で無し）
