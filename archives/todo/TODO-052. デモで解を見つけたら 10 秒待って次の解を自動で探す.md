# TODO-052. デモで解を見つけたら 10 秒待って次の解を自動で探す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | main（実装・文書）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |
| 実施 | Opus 5.5 / effort 記載なし | main（実装・文書）+ reviewer（Opus 5.5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | 記載なし | 8,680 | 21,387 | 57% |
| reviewer | Opus 5.5 | high | 2,134 | 39,121 | 23% |
| verifier | Sonnet 5 | medium | 1,921 | 48,621 | 20% |
| 合計 |  |  | 12,735 | 109,129 | 概算 $1.7 |

- reviewer は定義（`~/.claude/agents/reviewer.md`）のモデルが sonnet。
  状態の移り方の組み合わせを見させるので Opus 5.5 に上書きした
- main の effort は指定する場所が無いので「記載なし」

## きっかけ

利用者が 2026-09-24 に、デモは解を見つけたら 10 秒止まって自動で次の解を探し、
タイトルへ戻るまで止まらない形にしたいと望んだ。決めたこと:

- 「次の解を探す」ボタンは残し、押せば待たずに次へ進む
- すべて探し終えたら、10 秒後に空の盤から探し直す（見つけた解の数も 0 に戻る）
- 残り秒数は画面に出さない

## やったこと

- `src/config.js`：`DEMO.pauseMs = 10000` を足した
- `src/scenes/demo.js`：`update()` が `solved`・`done` の間も `waited` を数え、
  `pauseMs` を過ぎたら `resume()` を呼ぶ。`resume()` は `solved` なら探索を再開し、
  `done` なら `startSearch()` で空の盤から探し直す。`searchNext()` は音を鳴らして
  `resume()` を呼ぶだけにした。止まっている間の `selectSpeed()` は `waited` を
  0 に戻さない（速さを変えるたびに待ちが延びるため）
- README の「デモ」と `docs/developer.md` の「次の解を探す」の説明を直した

## 確かめたこと

verifier が Playwright（画面表示あり）で実測した（[報告](../agents/TODO-052/verifier-report.md)）。

- 解を見つけてから再開まで 10003ms。再開後も試した手が増え続けた
- 止まっている間に `searchNext()` を呼ぶと 20ms で再開
- `done` から 9979ms で空の盤から探し直し、見つけた解・試した手が 0 に戻った
- 止まって 6 秒後に速さを変えても、解を見つけてから 9349ms で再開（数え直していない。
  10 秒を切るのはポーリングで `solved` を拾うのが遅れた分と見ている）
- コンソールのエラー 0 件、`tests.html` 277 件すべて通過

## 分担の振り返り

- reviewer は要修正 0 件。`resume()` の JSDoc が「なぜ」を書いていない点を見つけ、直した。
  README に「10 秒」と数で書いた点も挙げたが、利用者向けの説明なので残した
- verifier は headless の Chromium で rAF が 10〜12fps に落ち、待ちが 12〜18 秒に
  延びたため、自分の判断で画面表示ありに切り替えて測り直した。見込みとの食い違いは無い
- 次に同じ規模（1 シーンの状態の移り方を変える）なら同じ組み方でよい。ただし
  Phaser の経過時間を測る依頼には、最初から「headless ではなく画面表示ありで測る」と
  書いておく。verifier の料金のうち、headless で測って捨てた分を省ける
