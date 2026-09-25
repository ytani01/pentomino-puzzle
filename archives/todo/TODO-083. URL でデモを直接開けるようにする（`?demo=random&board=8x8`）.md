# TODO-083. URL でデモを直接開けるようにする（`?demo=random&board=8x8`）

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort medium | main（実装）+ reviewer（Opus 5.5 / high）+ tests（Sonnet 5 / medium）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 14,944 | 78,185 | 58% |
| reviewer | Opus 5.5 | high | 619 | 49,545 | 17% |
| tests | Sonnet 5 | medium | 2,391 | 41,059 | 8% |
| screens | Sonnet 5 | low | 867 | 53,473 | 17% |
| 合計 |  |  | 18,821 | 222,262 | 概算 $3.6 |

- reviewer は定義（`~/.claude/agents/reviewer.md`）のモデルが sonnet。挙動が変わる項目なので Opus 5.5 に上書きした
- 前の項目（TODO-085）と同じ会話の続きではないので、`--since '2026-09-26 00:16:00'`（`/clear` のあと）で切った

## きっかけ

README のデモの GIF から、動いているデモへ直接飛べるようにしたい（TODO-084 の前提）。
利用者が決めたこと（2026-09-26）: URL の形は `?demo=random&board=8x8`（探し方と盤を
指定できる）、「タイトルへ」では URL からパラメータを消す。

## やったこと

- `src/logic.js` に `parseDemoParams(search)`。`demo` が無ければ `null`。
  省いたもの・知らない値はランダム・8×8。盤は `Object.hasOwn(BOARDS, …)` で見る
  （`in` だと `constructor` などが通るため）
- `src/scenes/boot.js`: `parseDemoParams(location.search)` があれば Title を飛ばして Demo を始める
- `src/scenes/demo.js`:
  - `create()` で URL を読み、盤と探し方を URL から取る。registry には書かない。
    `scene.start()` のデータで渡さないのは、Phaser 3.90 がデータ無しの `start()` で
    前回のデータを持ち越すため（タイトルから入り直したときに URL の盤が残る。
    reviewer が Phaser のソースで確かめた）
  - `this.input.once('pointerup', () => audio.unlock())`。直接開くとタイトルのボタンを
    通らず、音が一度も使えるようにならないため。最初は `pointerdown` にしたが、
    reviewer の指摘でタイトルのボタンと同じ `pointerup` に揃えた（タッチの `touchstart` を
    操作として扱わないブラウザがある）
  - `goToTitle()` を上書きし、`history.replaceState()` で `demo`・`board` を消してから移る
- `tests.html` に 7 件（tests 担当）
- `docs/UsersGuide.md` に「URL でデモを直接開く」、`docs/developer.md` のシーンの移り方に
  Boot → Demo、`CLAUDE.md` のファイル構成表に `parseDemoParams()`
- 全解のデータの読み込みは Demo の `create()` が元から `ensureSolutions()` を呼んでいるので、
  直接開いても変えずに済んだ
- 見送り: reviewer の「`replaceState` で他のパラメータの書式（`%20` → `+` など）が変わる」は
  好みの範囲。今のところ他のパラメータを使っていない

## 確かめたこと

- `tests.html` 全 420 件が通る。`Object.hasOwn` を `in` に、`=== 'depth'` を `!== 'random'` に
  変えると、それぞれ対応するテストが落ちる（tests 担当）
- 画面（960×640。screens 担当）: パラメータ無し → Title。`?demo=random&board=8x8` → random・8x8 で
  running（`tried` が増える）。`?demo=depth&board=6x10` → depth・6x10。`?demo=foo&board=bar` → random・8x8。
  「タイトルへ」で `location.search` が空、registry の盤は 8x8 のまま、読み直すとタイトル。
  そのあとタイトルのデモボタンから入ると registry の盤・ランダム。コンソールのエラー 0
- 音（main が測った）: `AudioContext` を差し替えて数えた。直接開いて 3 秒は効果音 0 回。
  盤を 1 回クリックすると音の AudioContext ができて `running`、続く 3 秒で 11 回鳴った。
  操作の前に鳴らないのはブラウザの決まりで、困らないと判断した（利用者には聞いていない）

## 分担の振り返り

- reviewer: `pointerdown` での解放がタッチで効かないおそれと、`CLAUDE.md` の表の漏れを見つけた。
  Phaser の `start()` がデータを持ち越す前提もソースで確かめた
- tests: 足した 7 件が壊すと落ちることを確かめた。食い違いは見つけていない
- screens: 1 回目は tests 担当と**同じ Playwright MCP のブラウザを取り合って**中断した
  （tests も `tests.html` をブラウザで開くため）。同じ担当に続けて頼んで済ませた。
  音の確認（手順 7）は手段が無いと返してきたので main が測った
- 見込みとの食い違い: 担当の顔ぶれは見込みどおり。並行させたのが誤りで、screens の分が 1 回分余計にかかった
- 次に同じ規模なら: **Playwright MCP を使う担当（tests・screens・measure）は並行させず、順に起動する。**
  音のように画面に出ないものは、測り方（`addInitScript` で `AudioContext` を差し替えて数える）を依頼に書く
