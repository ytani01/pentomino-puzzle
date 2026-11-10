# TODO-105 implementer 報告

## 変更
- `src/ui.js`: `createConfirmDialog(scene, { width, height, depth, onYes, onNo })` を追加。
  `{ parts, text }` を返す（`parts` = 背景の帯・枠・文言・「はい」・「いいえ」の順、すべて
  `setVisible(false)` 済み。`text` = 文言の Text）。`width`/`height` は画面の大きさ。
  作る順・位置・スタイルは元の 2 つと同じ。
- `src/scenes/game.js` / `src/scenes/records.js`: `createConfirmDialog()` を呼ぶだけにし、
  `confirmParts`・`confirmText`・`confirmAction` を従来どおり設定。`openConfirm()` /
  `hideConfirm()` / `confirmKind` は触っていない。不要になった import（`BACKDROP`、
  records の `LAYOUTS`・`createPanel`）を削除。records の `CONFIRM` 定数を削除。
- `src/config.js`: `CONFIRM` と `RECORDS_CONFIRM_DEPTH` を追加。`makeLayout()` の `confirm` を削除。
- `docs/developer.md`（ファイル構成の `ui.js` 行）、`CLAUDE.md`（`ui.js` の行と規約の
  `createConfirmDialog()`）、`TODO.md`（TODO-105 のチェック）。

## config.js の値と前の値
| | 前 | 後 |
|---|---|---|
| 枠の寸法（本編・縦） | `LAYOUTS.portrait[*].confirm` = 460/200/130/56/20 | `CONFIRM`（同値） |
| 枠の寸法（本編・横） | `LAYOUTS.landscape[*].confirm` = 同値 | 同上 |
| 枠の寸法（記録） | `LAYOUTS.landscape['8x8'].confirm` | 同上 |
| 本編の depth | `DEPTH.confirm`（40、game.js） | 変更なし |
| 記録の depth | 直書き `10` | `RECORDS_CONFIRM_DEPTH = 10` |

`makeLayout()` の `confirm` は向き・ボードによらず同じリテラルだったので、縦・横の差は元から無い。
本編の depth は 40 で記録の 10 と違うため、共通にせず別の値にした（depth は引数）。

## 検証
`node --check` を config.js・ui.js・game.js・records.js に流して全部成功。
`node` で `config.js` を import し、`CONFIRM` の値と、`LAYOUTS.portrait['8x8']` に `confirm` が
無いことを確認。ブラウザ・`tests.html` は流していない（指示どおり）。

## 懸念
- `layout.confirm` の他の参照は `rg` で見つからなかった（demo.js も含む）。
- 画面の撮り比べで差が出たら、まず depth（本編 40・記録 10）と生成順を疑う。

## レビューの指摘の修正
1. `src/ui.js`: `createConfirmDialog()` を `createButton()` の JSDoc の前へ動かした。
   `createButton` の JSDoc → `BUTTON_PAD` → 関数の並びは元（121d137~1）と同じ。
2. `RECORDS_CONFIRM_DEPTH` を `config.js` から外し、`src/scenes/records.js` の先頭の
   `CONFIRM_DEPTH = 10` にした（値は同じ）。文書に `RECORDS_CONFIRM_DEPTH` の記述は無かった
   （`rg` で確認）。`node --check` は `src/*.js` と `records.js` で成功。
