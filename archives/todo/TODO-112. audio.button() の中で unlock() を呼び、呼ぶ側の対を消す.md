# TODO-112. audio.button() の中で unlock() を呼び、呼ぶ側の対を消す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ screens（Sonnet 5.5 / low） |
| 実施 | Fable 5.2 / effort 記録なし | main（実装）+ screens（Sonnet 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Fable 5.2 | 記録なし | 13 | 3,589 | 4,081 | 523,428 | 51% |
| screens-112（screens） | Sonnet 5.5 | low | 24 | 2,995 | 46,252 | 453,281 | 49% |
| 合計 |  |  | 37 | 6,584 | 50,333 | 976,709 | 計 1,033,663 |

- main の effort は transcript に残らないので書いていない

## きっかけ

`audio.unlock(); audio.button();` と対で書いている箇所が 13 あった（`title.js` 6、`records.js` 7）。

## やったこと

- `src/audio.js` の `button()` の先頭で `unlock()` を呼ぶようにした
- 13 か所から `audio.unlock()` の行を消した。`title.js` の先頭のコメントも合わせて直した
- `button()` を伴わない `unlock()`（`game.js` のピースを掴んだとき、`demo.js` の最初の
  `pointerup`、`records.js` の `confirmContinue()` で確認なしに続きを始めるとき）は残した

## 確かめたこと

- タイトルの「記録」と記録の画面の「タイトルへ」を押して、シーンが切り替わり、
  コンソールに error が無いこと（[報告](../agents/TODO-112/screens-report.md)。
  warning 4 件は WebGL のドライバ通知で、読み込み時点から出ている）
- 音が鳴ることは確かめていない（headless では聞けない）

## 分担の振り返り

- **各担当が何を見つけたか:** screens は問題を見つけなかった
- **見込みとの食い違い:** 無い
- **次に同じ規模なら:** 同じ組み方でよい。押すボタンの名前は依頼の前に `rg` で確かめて書く
  （「もどる」と書いたが、実際は「タイトルへ」だった）
