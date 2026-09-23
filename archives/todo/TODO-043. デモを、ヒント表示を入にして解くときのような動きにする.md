# TODO-043. デモを、ヒント表示を入にして解くときのような動きにする

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | implementer（Opus 5.5 / medium）+ tests（Sonnet 5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort 記載なし | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | 記載なし | 28,924 | 207,002 | 50% |
| screens | Sonnet 5 | low | 3,351 | 86,847 | 19% |
| reviewer | Opus 5.5 | high | 3,946 | 124,067 | 13% |
| implementer | Opus 5.5 | medium | 3,058 | 56,164 | 10% |
| tests | Sonnet 5 | medium | 4,132 | 109,771 | 8% |
| 合計 |  |  | 43,411 | 583,851 | 概算 $9.5 |

- implementer と reviewer は定義（`~/.claude/agents/`）のモデルが sonnet。探索の判定の設計と挙動の変化を見るので Opus 5.5 に上書きした
- 立ててから着手までに TODO-042 の決着が挟まったので、`--since '2026-09-23 23:08:00'` で集計した。
  main の分には、途中で立てた TODO-044・TODO-045 のやり取りも含まれる
- 途中で利用上限に当たり、reviewer と tests が一度止まった（続きから再開させた）

## きっかけ

デモ（TODO-040）は区画の大きさが 5 の倍数かだけを見て進み、行き詰まってから外していた。
人がヒント表示を入にして解くときのように、「解なし」と出たらすぐ外す動きにしたい。

立てるときに決めたこと:

- 今の動き（ヒント無し）は残さず置き換える（ボタンを増やさない）
- 解につながる手だけを選んで置く動きにはしない（試行錯誤に見えなくなるため）

## やったこと

- `src/logic.js`: `solveSteps(spec, random, canContinue = regionsFitPieces)`。置いたあと先へ
  進むかを引数の判定で決める。判定を place の yield の前に動かし、結果を place の手に `ok` として載せた
  （既定の引数なら手順は今までと同じ）
- `src/scenes/demo.js`: 全解のデータ（`ensureSolutions`）が届いてから、
  `hasSolution` を判定に渡して探索を始める（届くまでは `'loading'`）。HUD の 1 段目の右端に、
  本編のヒント表示と同じ文字と色で「解ける／解なし」を出す。解なしに変わったら
  `audio.invalid()`（滑らせる速さのときだけ）。解けて止まったら表示を消す
  - reviewer の指摘で、読み込みの受け取りに条件を足した。Phaser はシーンを使い回すので、
    入り直したあとに前回の読み込みが遅れて届くと、別の盤の表で探索を作り直してしまう。
    `'loading'` でないとき・盤が違うときは捨てる
- `src/config.js`: `DEMO` の JSDoc の所要時間を今の動きに合わせた（最初の解までの置くは
  1〜1.5 万 → 30〜70 ほど。速いでも 30 秒以内）
- `tests.html`: `canContinue` を差し替えたときのテストを 6 件（盤ごとに 3 件）
- `README.md`・`docs/developer.md`: デモの説明と画面の用語（解ける / 解なし）

## 確かめたこと

- 既定の引数で、同じシードの最初の解までの手順が変更の前後で一致（implementer、6 通り）
- `tests.html` 256 件すべて通過。`canContinue` を `regionsFitPieces` 決め打ちに戻すと 4 件落ちる（tests）
- `node tools/gen-solutions.mjs --check` が終了コード 0（implementer）
- 画面: 8×8・6×10 × 横（568×320）・縦（375×667）の 4 通りで、試した手が 6 桁・見つけた解が
  2 桁のときも「解なし」と重ならず、枠からはみ出さない。解けて止まると右端の文字が消える。
  コンソールにエラーなし（screens）

## 残ること

- 本編（`game.js` の `create()`）の全解の読み込みにも、デモで直したのと同じ筋が残っている
  （入り直したあとに前回の盤の表が遅れて届くと `this.solutions` に入る）。範囲外として触っていない。
  ローカルでは読み込みが一瞬で起こせず、実害は未確認

## 分担の振り返り

分担の理由と各担当の報告は [archives/agents/TODO-043/](../agents/TODO-043/README.md)。

- **各担当が見つけたもの**: reviewer は、`config.js` の所要時間の記述が 3 桁ずれていること
  （実測で最初の解まで 30〜70 手）、入り直したときに読み込みを取り違える筋、「変わった瞬間だけ鳴らす」の
  条件が常に真であること、の 3 つを見つけた。どれも implementer は拾っていなかった。
  tests は壊す確認で、「常に偽を返す判定」のテストが generator を展開し切ろうとして固まることを見つけ、
  手数に上限を置いた。screens は最初、横画面を縦の配置のまま撮っていて、main が画像を見て撮り直させた
- **見込みとの食い違い**: 担当は見込みどおり。screens の料金が 19% と大きいのは、撮り直しと、
  tests と同じ時間に同じブラウザを使って画面が tests.html へ飛ばされたため
- **次に同じ規模なら**: tests と screens を並行させない（Playwright MCP のブラウザが 1 つなので
  取り合いになる）。screens への依頼には「横画面は `layout.portrait === false` を確かめてから撮る」
  と書く。reviewer に「今の動きと食い違う記述」を `rg` で探させたのが 1 件目の発見につながったので、
  探索や速さの前提を変える項目では続ける
