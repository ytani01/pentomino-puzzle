# TODO-103. デモで解けたことを HUD の 1 段目の右端に出す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 62 | 10,729 | 29,307 | 2,350,853 | 77% |
| screens | Sonnet 5.5 | low | 20 | 218 | 41,681 | 319,296 | 12% |
| reviewer | Opus 5.5 | high | 18 | 84 | 48,310 | 289,204 | 11% |
| 合計 |  |  | 100 | 11,031 | 119,298 | 2,959,353 | 計 3,089,782 |

- モデルと effort は上書きしていない（どちらも定義の値）
- サブエージェントの分は `token-usage.py` の仕様で少なめに出ている

## きっかけ

利用者の依頼。デモで解けたときの表示を、ボード下のメッセージ欄でなく、
HUD の 1 段目（試した手などの行）の右端に右揃えで出したい。あとから
「目立つようにして」と足された。

## やったこと

- `src/ui.js` の `createHintBadge()` に `solved`（解けた！）の状態を足した。
  地は `COLORS.solved`（金色系）、文字は `TEXT_COLORS.onBright`、
  `HINT_BADGE.blinkMs` の Tween で点滅させる。同じ状態で呼ばれたら何もしない
  （デモは 1 手ごとに呼ぶので、点滅を始め直さないため）。状態が変わると点滅を止める
- `src/scenes/demo.js` の `onSolved()` で `hintState` を `null` から `'solved'` にし、
  メッセージ欄への「解けた！ N 手目」をやめた
- デモのメッセージ欄は使わなくなったので、作らないようにし、作り直しでの持ち越しも消した
  （reviewer の指摘）
- `docs/UsersGuide.md`・`docs/developer.md` の記述を合わせた

## 確かめたこと

- reviewer: 本編の札の挙動は変わらない。再開・次の解・探し方の切り替え・向きの変更で
  札と点滅が正しく戻る。規約違反なし
- screens: 横 960×640・縦 390×844 で札と左の文字が重ならない（bounds を測った）。
  点滅中は alpha が変わり、`searchNext()` 後は「解ける」で alpha 1 のまま。
  向きを変えて作り直しても点滅が続く。コンソールのエラーなし

## 分担の振り返り

- reviewer は、デモのメッセージ欄が空回りになったことと、JSDoc・TODO の背景が
  2 状態のままだったことを見つけた。screens は食い違いを見つけなかった
- 見込みと食い違いなし
- 次に同じ規模（既存部品に状態を 1 つ足す）なら同じ組み方でよい。screens は
  ボード下を見るところまでで足りたので、作り直しの確認は reviewer の静的な確認に寄せて、
  screens の手順を 1 つ減らせる
