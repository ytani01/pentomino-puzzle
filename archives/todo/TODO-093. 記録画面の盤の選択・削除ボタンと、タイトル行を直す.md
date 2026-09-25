# TODO-093. 記録画面の盤の選択・削除ボタンと、タイトル行を直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort high | implementer（Sonnet 5 / medium、worktree）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | high | 13,780 | 42,844 | 29% |
| implementer | Sonnet 5 / Opus 5.5 | medium | 7,702 | 200,804 | 52% |
| screens | Sonnet 5 | low | 2,188 | 79,052 | 13% |
| reviewer | Opus 5.5 | high | 6,338 | 15,242 | 7% |
| 合計 |  |  | 30,008 | 337,942 | 概算 $8.9 |

- 集計は `--since '2026-09-26 05:21:39'`（TODO-092 の決着から）。値は決着のコミットの直前まで
- **TODO-092・094 と並行させたので、その分が混ざっている。** TODO-093 の implementer の
  大半は TODO-092 の範囲に入っており、この表の implementer と reviewer の行には
  TODO-094（Opus）のレビューとその後の修正が入っている
- implementer・screens は定義のモデル・effort のまま

## きっかけ

記録画面の盤の選択が文字のボタンのままで、タイトル画面の図のボタンと見た目が
揃っていなかった。ゴミ箱が画面下の頁送りと並んでいて、チェックの行から遠かった。
最上段の「PENTOMINO PUZZLE」が小さく、バージョンは右下にしか出ていなかった。

## やったこと

- 記録画面（`src/scenes/records.js`）: 盤の選択をタイトルと同じ図のボタン
  （`boardIcon()`、高さ `CHOICE_ICON_HEIGHT`、名前は説明に）にした。ゴミ箱を
  「全部選ぶ」の行の右端へ移し、横 42×54・縦 50×60 に大きくした。
  高くなった分は 1 頁の行数（横 8 → 7、縦 9 → 8）で吸収した
- タイトル行（`src/ui.js` の `createTitleBar()`）: 文字を `FONT.small` → `FONT.body` に
  し、右横に `VERSION` を小さく出す。押せるのは題字だけ。`TITLE_BAND` 34 → 42
- 本編・記録・デモでは、右下のバージョン表示をやめた（2 か所に出さないため。
  タイトル画面は右下のまま）。デモの分は取り込むときに main が消した
- 文書: `docs/UsersGuide.md`（ゴミ箱の位置、画面下のボタンの表）、
  `docs/developer.md`（用語）、`docs/images/records.png` の撮り直し。
  `tools/capture.mjs` の記録画面の吹き出しを、ゴミ箱を Ⓒ に含めて番号を 1〜3 に詰め、
  完成形 Ⓔ の位置を新しい配置に合わせた

## 確かめたこと

- screens（[screens-report.md](../agents/TODO-093/screens-report.md)）: 記録（記録を
  10 件入れ、2 頁・完成形を出した状態）・本編・デモを横 960×640・縦 640×1136 で撮り、
  図のボタン・ゴミ箱の位置と押せる状態・重なり・バージョンの 1 か所表示・
  コンソールのエラーの 5 点すべて一致
- implementer: `node --check`、`tests.html` 430 件すべて通過
- main: 撮り直した `records.png` の吹き出しの番号がガイドの表と合うことを見た

## 分担の振り返り

- implementer は、デモでバージョンが 2 か所に出たままになることを見つけて範囲外として
  報告した（依頼で `game.js` の 1 行しか許していなかったため。依頼の書き漏れ）
- screens の 1 回目は、縦画面を横で開いてから大きさを変えて撮っており、縦の配置を
  見ていなかった（向きは起動時に 1 回だけ決まる）。main が画像を見て気づき、撮り直させた。
  TODO-092 のタイトル画面の縦も同じだったので、ついでに撮り直させた（一致）
- 次に縦画面を撮らせるときは、依頼に「大きさを変えてから読み込み直し、
  `window.game.scale.width` を報告に書く」と入れる。`screens` の定義に足すのがよい
- 並行させるときは、呼び出し元を消す類いの変更（`createVersionText()` など）で
  触ってよいファイルを `rg` の結果から全部挙げる
