# TODO-008 の分担

[TODO-008. クリアした結果を記録し、あとから見返せるようにする](../../todo/TODO-008.%20クリアした結果を記録し、あとから見返せるようにする.md)
で組んだ担当と、その分け方の理由。

**`.claude/agents/*.md` の定義ファイルは無い。** TODO-009 と同じく、担当ごとに
その場で指示を書いて起動した（役割が 1 回きりのため）。下の表がその代わりの記録。

| 担当 | モデル / effort | 受け持ち |
|---|---|---|
| history-store | Opus / medium | `config.js` の `historyKey`・`HISTORY_LIMIT`、`storage.js` の履歴 API |
| records-scene | Opus / medium | `records.js`（新規）、`title.js` の入口、`clear.js`・`game.js` の受け渡し、`ui.js` への `createChoiceRow` 移動、画面の確認 |
| history-tests | Sonnet / low | `tests.html` に履歴のテスト 22 件 |
| 統合（親） | Opus / high | 分担の設計、差分の確認、テストの実行、`tests.html` の重複整理、TODO の決着 |

## なぜこう分けたか

- **保存層を先に 1 人で決めさせた。** 画面もテストも `storage.js` の
  シグネチャに依るので、ここが決まらないと後の 2 人が書けない。順に流し、
  終わってから残り 2 人を並行させた
- **画面とテストは触るファイルが重ならない。** `records-scene` は
  `src/` 側、`history-tests` は `tests.html` だけと決めてあるので、
  同時に走らせても衝突しない
- **`records-scene` に Opus を充てたのは、判断が多いため。** 頁送りか
  スクロールか、完成形をテクスチャで貼るか `Graphics` で描くか、
  タイトルの縦の積みをどう詰めるかが、いずれもその場で決まらない
- **`history-tests` は Sonnet / low で足りる。** 何を確かめるかを指示の側で
  列挙してあり、既存の `tests.html` の書き方に合わせるだけだったため。
  実際、指示した項目をそのまま 22 件に落として通した
- **`TODO.md` と archives は親が持った。** 決着の書き方は担当の受け持ちを
  またぐので、全部の報告が揃ってからでないと書けない

## 見落として親が直したこと

- `history-tests` が書いた退避・復元の 10 行が 8 か所に重複していた。
  `withCleanStorage()` にまとめ直した。**指示に「重複を避けよ」と
  書いていなかった**ぶんで、Sonnet / low の担当にはこの程度の粒度まで
  指示に書いておくほうが安い
