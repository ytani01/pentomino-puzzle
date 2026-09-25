# TODO-088 確認（verifier）

対象: 未コミットの `git diff`（`src/storage.js`・`src/scenes/clear.js`・`src/scenes/game.js`・
`docs/UsersGuide.md`・`docs/developer.md`・`tests.html`）。

## 環境の制約（先に書く）

Playwright（headless Chromium）はこのサンドボックスから `http://localhost:8765/` /
`http://127.0.0.1:8765/` に**接続できない**。`ss -tnp` で見ても TCP の
SYN すら出ていない（`example.com` など外部サイトへは到達できる。node の
`fetch('http://127.0.0.1:8765/...')` や子プロセスの `curl` は同じ URL に一瞬で届く）。
Chromium という個別プロセスだけがループバックへ届かない、というサンドボックス側の制限と見られる。
`tools/capture.mjs` と同じやり方（借りた Playwright、`--no-sandbox`、IPv6 無効化なども試した）で
再現せず、`dangerouslyDisableSandbox: true` でも変わらなかった。

**代わりに**、`tests.html` の `<script type="module">` の中身（テストの本体）をそのまま
Node へ持ち込んで実行した。`window.localStorage` は `Map` で作った偽物、`document` は
`appendChild` などを何もしないダミーに差し替え、`src/` の実ファイルを実際に import して
430 件のテストを 1 つも書き換えずに走らせた（結果の一覧を HTML に描く末尾の処理だけを
`console.log` の集計に差し替えた。スクリプトはリポジトリには残していない）。
ブラウザの DOM そのものを確かめる項目（3 の描画）は無いので影響は無い。
**この置き換えでブラウザ実行の代わりになるかどうかは、判断が要る点として管理者へ返す。**

## 1. tests.html（430 件）

- 429 件通過、**1 件失敗**（Node での代替実行。上記の制約を参照）
- 失敗した項目:
  - グループ: `src/storage.js — 成績の比べ方（isBetterClear・dedupeHistory）`
  - 項目名: `dedupeHistory は同じ番号を、成績が一番よい 1 件にまとめて元の位置に残す`
  - メッセージ: `期待 [{"at":4000,"ms":400,"no":2},{"at":2000,"ms":300,"no":1}] / 実際 [{"at":4000,"ms":400,"no":2},{"at":1000,"ms":100,"no":1,"h":true}]`
  - この項目は今回の `git diff` では**触っていない**（`git diff tests.html` に該当箇所は無い）。
    テストの入力に `h: true` の件（`ms:100`）があり、旧 `isBetterClear()` は `h` も
    「印あり」として除外していたが、新しい `isBetterClear()`（`a` だけを見る）では
    この件が「印なし」の最速の回として勝ってしまい、テストが期待する `ms:300` の件と
    食い違う。下の 2. で、`marked` を旧仕様へ戻すとこの失敗が消えることを確かめた
    （＝この変更が原因であることは実測で確認済み。直すかどうかは判断が要る）

## 2. 3 つの一時的な破壊（手で戻す。`git stash` は使わず、都度 1 行を戻した）

いずれも Node 版の `tests.html` で再実行して確認。終わるごとに元へ戻し、
最後に `git diff --stat src/storage.js` が壊す前と同じ行数（62 行・+44/-18）に
戻っていることを確認した。

- `shouldRecordBest` を `return true;` に変更
  → **落ちた**（3 件増: `shouldRecordBest` 自体のテスト1件、`recordCompletion` の
  おまかせ絡み2件。加えて上記1.の既存の失敗はそのまま残る）
- `isBetterClear` の `marked` を `item.a === true || item.h === true` に戻す
  → **落ちた**（3件: 「おまかせの印の無い回は…」「おまかせの印のある回は…」
  「ヒント表示の印は見ない…」の3件。逆に、上記1.の失敗は消えた＝原因が
  この変更にあることの裏付け）
- `loadBest` の書き戻し（`setItem`）の行を消す
  → **落ちた**（2件: `loadBest: 履歴から出した最短は保存値へ書き戻す`の8×8・6×10）

3 つとも、狙った変更点を壊すと対応するテストが落ちることを確認した
（テストの強さは足りている）。

## 3. タイトル画面の最短表示

Chromium がループバックへ届かないため、実際の Title シーンは開けなかった。
代わりに、`src/scenes/title.js:248-249` の該当行
（`const best = loadBest(this.boardKey); this.bestText.setText(best === null ? '記録なし' : \`最短 ${formatTime(best)}\`);`）
と**同じ式**を、Node から実物の `loadBest()`・`formatTime()`（`src/storage.js` /
`src/logic.js`）を import して直に評価した。

- 8×8 の履歴キー（`BOARDS['8x8'].historyKey` = `pentomino-puzzle/history/v2/8x8`）に
  `{ at: Date.now(), ms: 83000, no: 1, h: true }` だけを入れ、最短時間の保存値
  （`storageKey` = `pentomino-puzzle/best-ms`）を消して `loadBest('8x8')` を呼ぶと
  `83000` → 表示式は `"最短 01:23"`。**通った**
- 同じ手順で `{ at: Date.now(), ms: 83000, no: 1, a: true }` だけにすると
  `loadBest('8x8')` は `null` → 表示式は `"記録なし"`。**通った**

**実際の Title シーン（Phaser・Canvas）を開いて確かめてはいない**（環境の制約のため）。
`bestText` の式そのものは今回の diff で変えていないので、`loadBest()` の戻り値さえ
合っていれば表示も合うはずだが、これは推測。

## 変更されたファイルと指示の範囲

- `src/storage.js`・`src/scenes/clear.js`・`src/scenes/game.js`・`tests.html`・
  `docs/UsersGuide.md`・`docs/developer.md` — 指示の説明（`shouldRecordBest(usedAuto)`・
  `loadBest()` の書き戻し・`isBetterClear()` が `a` だけ見る）と一致。他に指示に無い
  ファイルの変更は無し（`archives/agents/TODO-088/` は今回の作業ディレクトリ）
- reviewer の指摘 1〜6 の反映は、依頼のとおり確認していない

## 確かめられなかったこと・判断が要ること

- **Playwright での実行そのものができなかった**（環境の制約）。Node での代替実行が
  ブラウザ実行の代わりとして十分かどうかは判断できない。DOM／Canvas を触らない
  `src/storage.js` の計算のテストだけを走らせる形なので、範囲としては tests.html の
  対象（「Phaser にも DOM にも触らない部分」）と一致してはいる
- 1. で見つけた **1 件の失敗は、今回の diff では触っていない既存のテストが、
  `isBetterClear()` の仕様変更（`h` を見なくした）によって実際に落ちるようになったもの**。
  期待値を新しい仕様に合わせて書き直すか、`isBetterClear()` の側を見直すかは
  管理者の判断（原因の切り分けはしたが、直すかどうかの判断はしていない）
- reviewer の報告にある「検討」2〜4（`isBetterClear()` と `loadBest()` の組み合わせで
  起きる古いデータの扱い）は、今回の実測では踏み込んでいない（reviewer が実測済み）
