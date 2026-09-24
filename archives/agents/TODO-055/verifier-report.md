# TODO-055 verifier 報告

対象: `README.md`・`docs/UsersGuide.md`（新規）・`docs/developer.md` の新しい節
（「構成」「テスト」「記録の保存」）。reviewer の指摘（`reviewer-report.md`）は
反映済みであることを確認した（後述）。

## 1. 事実の突き合わせ（一致したものは 1 行）

- 盤・解の数（8×8 65 通り／6×10 2339 通り）: `src/data/8x8.js` の
  `Object.values(m)[0].length === 65`、`src/data/6x10.js` は `2339` を実測して一致。
- 全 520 解／全 9356 解（`docs/developer.md:354-355`）: `src/data/8x8.js:9`
  「全 520 解 → 65 件」、`src/data/6x10.js:9`「全 9356 解 → 2339 件」と一致。
- HISTORY_LIMIT = 50（`docs/developer.md` の履歴の説明）: `src/config.js:74`
  `export const HISTORY_LIMIT = 50;` と一致。
- HUD ボタン名・説明（一手戻す／おまかせ／ヒント表示／やり直し／音 ON・OFF／
  タイトルへ）: `src/scenes/game.js:286-291` の `tooltip` と一致。
- UsersGuide.md:30「トレイに残っているピースの数」: `src/scenes/game.js` の
  `refreshHud()`（1173 行）`const left = this.pieces.filter((piece) =>
  piece.location === 'tray').length;` と一致。reviewer が指摘した「残りのマス数」
  という誤りは**修正済み**であることを確認した。
- デモの速さラベル（ゆっくり／速い／最速）・探し方（探し方: 深さ優先／幅優先）:
  `src/scenes/demo.js:45-47,197` と一致。
- デモの 10 秒待ち: `src/config.js:751` `pauseMs: 10000` と一致。
- 記録画面のボタン（この回を消す／全部消す／タイトルへ／前へ／次へ／はい／いいえ）
  ・タイトルのボタン（はじめる／つづきから／記録／デモ）: `src/scenes/records.js`・
  `src/scenes/title.js` の `label` と一致。
- registry のキー（`BOARD_REGISTRY_KEY` = `'board'`、`PALETTE_REGISTRY_KEY` =
  `'palette'`、`SOLUTIONS_REGISTRY_PREFIX` = `'solutions/'`、
  `solutionsRegistryKey()`）: `src/config.js:86,177,180,763`、
  `src/solutions.js:38-39` と一致。Boot が起動時に `BOARD_REGISTRY_KEY` /
  `PALETTE_REGISTRY_KEY` を一度書き込み、Title が選び直すたびに書き換える、
  という記述も `src/scenes/boot.js:63,65` と `src/scenes/title.js:224,237-238`
  で確認した。
- シーンの移り方の図（`docs/developer.md` 70 行付近）: `src/main.js:29` の
  6 シーン登録と、各 `scene.start()` 呼び出し（`title.js:166,193,206,262`、
  `game.js:1123,1206`、`clear.js:169-171`、`records.js:197`）をすべて洗い出し、
  図の矢印と一致することを確認した。
- 記録の保存のキー・値の形（`pentomino-puzzle/best-ms` 等、履歴 1 件の
  `at`/`ms`/`no`/`a`/`h`、遊びかけの `ms`/`usedAuto`/`usedHint`/`pieces`）:
  `src/config.js:42-59`、`src/storage.js` 全体（`sanitizeHistory`・
  `sanitizeProgress` 等）と一致。8×8 の最短時間だけ接尾辞が無い、という記述も
  `src/config.js:42`（`storageKey: 'pentomino-puzzle/best-ms'`、6×10 側は
  `.../best-ms/6x10`）と一致。
- 「いつ書き込まれるか」の表: `src/scenes/game.js`（`persist()` 943-950 行、
  `restart()` 1090 行、`checkSolved()` 1202 行）、`src/scenes/clear.js`
  （76,92-93 行）、`src/scenes/records.js`（`doRemove()` 432-434 行、
  `removeHistory`+`removeFound`+`removeAuto` を一緒に呼ぶ）とすべて一致。
- README:34「構成（層の分け方・シーンの移り方）」を developer.md への案内に
  含めている点: reviewer が指摘していた抜けも**修正済み**であることを確認した。

## 2. 手順の再現

```
python3 -m http.server 8765（リポジトリのトップ、バックグラウンド）
/            → 200
/tests.html  → 200
/src/main.js → 200
```
すべて `curl --max-time 5 -s -o /dev/null -w '%{http_code}'` で実測。
終了後、`pgrep -f 'http.server 8765'` で確かめた PID を個別に kill し、
サーバは残っていないことを確認した（作業中に生じた残存プロセスの後始末も含め、
最終的に `pgrep -af 'http.server'` はヒットなし）。

## 3. リンク・アンカー

- `README.md` → `docs/UsersGuide.md`、`docs/developer.md`、
  `docs/developer.md#全解のデータ`: いずれも存在するファイル・見出しに一致。
- `docs/developer.md` の目次リンク（`#構成`・`#画面の用語`・`#テスト`・
  `#記録の保存`・`#全解のデータ`・`#ファイル構成`・`#サブエージェントの定義`・
  `#github-上の設定`）と、本文中の相互参照
  （`[docs/UsersGuide.md](UsersGuide.md)`、`[つづきから](UsersGuide.md#つづきから)`
  など）は、`rg '^#' docs/developer.md` と `docs/UsersGuide.md` の見出し一覧
  （`## つづきから` を含む）に照らしてすべて一致。
- `docs/UsersGuide.md` → `../README.md`: 存在するファイルを指している。

## 一致しなかったもの

無し。事実の突き合わせ・手順の再現・リンクのいずれでも食い違いは見つからなかった。

## 確かめられなかったこと・判断できないこと

- reviewer 報告の「検討」節（README に「構成」を含めるかどうかの判断）は
  reviewer 自身が「判断が要る」としていた点だが、今回の差分では既に
  README 側に「構成」が足されており、この懸念は解消済みと見える
  （ただし、これが reviewer の指摘を受けての修正かどうかの経緯は未確認）。
- `.claude/agents/docs.md` の変更（作業ツリーの差分に含まれるが、依頼の対象
  「README.md・docs/developer.md」には明記されていない）は、依頼の対象外と
  判断して確認していない。念のため報告する。
