# TODO-073. 記録画面から、選んだ回の完成形の続きを遊べるようにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort medium | implementer（Opus 5.5 / medium）+ docs（Opus 5.5 / 記載なし）+ reviewer（Opus 5.5 / high）+ verifier（Opus 5.5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 8,373 | 22,086 | 36% |
| implementer | Opus 5.5 | medium | 4,280 | 225,745 | 38% |
| docs | Opus 5.5 | 記載なし | 517 | 47,020 | 6% |
| reviewer | Opus 5.5 | high | 4,559 | 82,108 | 12% |
| verifier | Opus 5.5 | medium | 3,013 | 66,980 | 9% |
| 合計 |  |  | 20,742 | 443,939 | 概算 $10.9 |

- Sonnet 5 が週の利用上限に達しているので、Sonnet 5 の担当を全員 Opus 5.5 に上書きした（TODO-071 のときの利用者の判断）
- docs は定義に `effort` の行が無い。screens は立てず、verifier が撮った
- `--since`（TODO-072 の決着のコミット時刻）で集計した。集計は決着のコミット前（現在時刻まで）。割合は四捨五入のため合計が 100% にならない

## きっかけ

TODO-072 で完成したあとも続けられるようにしたのに合わせ、前に完成させた回からも続けられるようにする（利用者の依頼）。

利用者が決めたこと: 時計はその回の経過時間から、ヒント・おまかせの印は引き継ぐ（0 から始めると、数手入れ替えるだけで短い時間の記録が作れてしまうため）。
遊びかけがあるときは画面内で確かめてから置き換える。ボタンは記録画面の完成形の下に、文字のボタン「この回を続ける」（下段の ▶ と取り違えないため）。

## やったこと

- `src/scenes/records.js`: 完成形の下に「この回を続ける」。遊びかけがあるときは、消すときと同じ画面内の確認で確かめる。見ている盤を registry に書いて本編へ
- `src/storage.js`: 履歴の 1 件から遊びかけの形（盤面・経過時間・印・完成させた解の一覧）を作る関数。盤面の復元は `solutions.js` の `placementIn()` を使う
- `src/scenes/title.js`: 「はじめる」は明示の引数でまっさらな盤から始める。引数なしで `scene.start('Game')` を呼んでいたので、Phaser が前に渡した
  続きの引数を使い回し、「この回を続ける」や「つづきから」のあとに「はじめる」を押すと続きから始まっていた（「つづきから」の分は TODO-030 からあった）
- `src/scenes/game.js`・`src/config.js`: registry を書くのがタイトルだけ、という注記を直した
- `tools/capture.mjs`: TODO-072 で消した `addHistory()` を `recordClear()` に替え、「この回を続ける」を指す吹き出し Ⓖ を足した。`docs/images/records.png` を撮り直した
- `tests.html`: 遊びかけの形を作る計算
- `docs/UsersGuide.md`・`docs/developer.md`・`CLAUDE.md`

## 確かめたこと

- `tests.html` 396 件すべて通過（verifier が Playwright の新しいコンテキストで実測）
- 足したテストは、計算を壊すと落ちる（implementer）
- 操作（verifier）: 記録画面の横 844×390・縦 390×844 でボタンが完成形の下にあり重ならない（画像を main が見た）／6×10 の印付きの回を続けると、
  完成した盤面・その回の経過時間・印で始まり、クリア表示は出ない／外して戻すと「記録済み」で履歴は増えない／遊びかけがあると確認が出て、
  やめると遊びかけは変わらない／「この回を続ける」「つづきから」のあとの「はじめる」はまっさらな盤／吹き出しの番号と UsersGuide が合う

## 残ること

- ボタンの寸法は `config.js` ではなく `records.js` に置いた（この画面の既存の配置値に揃えた。implementer の判断で、reviewer は指摘しなかった）
- 続けた回の経過時間は元の回から数えるので、続きで作った別の解がその解の記録を上書きすることがある（仕様どおり）

## 分担の振り返り

- **見つけたもの**: implementer は、TODO-072 で消した関数を `capture.mjs` がまだ呼んでいることを見つけた。reviewer は「はじめる」が続きを引き継ぐ不具合を
  実測で見つけた（TODO-030 からあった分も）。verifier と docs は食い違いを見つけなかった
- **見込みとの食い違い**: 全員 Opus 5.5（Sonnet 5 の週の上限）。docs は TODO-072 の振り返りどおり最初から立てた。screens は立てず verifier が撮って足りた
- **次に同じ規模なら**: 関数を消す項目では、`rg` で `tools/` も含めて呼び出しを探すことを implementer の依頼に書く（TODO-072 で `capture.mjs` が漏れた）。
  シーンを引数付きで始める所を足す項目では、「引数なしで同じシーンを始める所」を reviewer の観点に入れる
