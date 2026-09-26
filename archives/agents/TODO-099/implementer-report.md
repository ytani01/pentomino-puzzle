# TODO-099 実装報告

## やったこと

「盤」→「ボード」の一括置換。「盤面」「終盤」は変えず、「盤上」→「ボード上」、
「盤外」→「ボードの外」に変えた（対象は 2 箇所ずつ、`src/logic.js`・`docs/developer.md`）。

変えたファイル（`git diff --stat`）:

```
 README.md               |   6 +-
 docs/UsersGuide.md      |  78 +++++++++++-----------
 docs/developer.md       |  98 +++++++++++++--------------
 src/audio.js            |   4 +-
 src/config.js           | 126 +++++++++++++++++------------------
 src/icons.js            |   8 +--
 src/logic.js            |  64 +++++++++---------
 src/main.js             |   4 +-
 src/scenes/boot.js      |  14 ++--
 src/scenes/clear.js     |   4 +-
 src/scenes/demo.js      |  36 +++++-----
 src/scenes/game.js      |  86 ++++++++++++------------
 src/scenes/records.js   |  40 +++++------
 src/scenes/title.js     |  66 +++++++++----------
 src/solutions.js        |  18 ++---
 src/storage.js          |  36 +++++-----
 src/ui.js               |  26 ++++----
 tests.html              | 172 ++++++++++++++++++++++++------------------------
 tools/capture.mjs       |   6 +-
 tools/enumerate.mjs     |   6 +-
 tools/gen-solutions.mjs |   4 +-
 21 files changed, 451 insertions(+), 451 deletions(-)
```

見出しのアンカー `docs/UsersGuide.md:6`（`## 盤と色を選ぶ` → `## ボードと色を選ぶ`）を
確認したが、この見出しへのリンク（`#盤と色を選ぶ`）は他に無かったので、
見出し自体を変えるだけで済んだ。

すべて Read → 文字列・コメントの置換のみ。識別子（`board` / `BOARDS` /
`boardKey` / `boardPanel` など）、`盤面`、`終盤`、`src/data/*.js`、`TODO.md`、
`archives/` は変えていない。

## CLAUDE.md について（判断が要る点）

依頼の対象範囲に `CLAUDE.md` が明記されていたが、実装担当への指示
（`やらないこと`）に「`CLAUDE.md`、その他の文書を触らない（管理者と wording の
担当）」と固定であるため、**`CLAUDE.md` は変えていない**。
6 行に「盤」が残っている（`rg -n '盤' CLAUDE.md`）。管理者側で直すか、
別途 wording の担当に回すか判断してください。

## はみ出しが心配な文言

`src/ui.js:308` の `createChoiceRow()` は、ラベル用に固定 48px
（`CHOICE_BUTTON.labelWidth`、`src/ui.js:287`）しか確保していない。
本文フォントは 24px（`FONT.body`、`src/config.js:228`）で、全角 1 文字なら
収まるが、「ボード」は全角 3 文字（目安 72px 以上）になり、選択肢の見出し
（`src/scenes/records.js:205`・`src/scenes/title.js:176`。`'盤'` → `'ボード'`）が
最初の選択ボタンに重なる／はみ出す可能性がある。レイアウトの直しは
文言だけの範囲を超えるため直していない。画面で確かめて、必要なら
`labelWidth` を広げる別項目にしてください（Playwright などブラウザで撮る
手段がこの担当には無く、見た目は未確認）。

## 検証

- `rg -n '盤' --glob '!archives/**' --glob '!src/data/**' --glob '!TODO.md' | rg -v -e '盤面' -e '終盤'`
  → 空（`CLAUDE.md` を除く。上記参照）
- `rg -n '盤' --glob '!archives/**' --glob '!src/data/**' --glob '!TODO.md' --glob '!CLAUDE.md' | rg -v -e '盤面' -e '終盤'`
  → 空（完了条件を満たす）
- `node --check` を変更した全 `src/*.js`・`src/scenes/*.js`・`tools/*.mjs` に実行 → 全て成功
- `node tools/gen-solutions.mjs --check` → 8×8 は一致（`17.3 秒`）。6×10 の途中で
  120 秒のタイムアウトに達した（コードの計算ロジックは触っていないので、
  今回の変更とは無関係。時間のかかる検証として、必要なら長い timeout で
  別途流し直してください）
- ブラウザでの見た目の確認（`tests.html` を開く、画面のキャプチャ）は
  この担当では行っていない（役割上、確認は別の担当の分担）

## その他、範囲外だが気づいたこと

特に無し。
