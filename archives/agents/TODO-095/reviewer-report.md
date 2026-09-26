# TODO-095 reviewer 報告

対象: `git diff --cached`（13 ファイル）。依頼 `brief.md`・実装者の報告 `implementer-report.md` を読んだうえで見た。
実測は Playwright（`~/.npm/_npx/6bcb61ec6d5aea22` のもの）で、ポート 8765（このリポジトリの作業ツリー）に対して行った。
スクリプトは scratchpad の `race.mjs` / `race2.mjs`（リポジトリには置いていない）。

## 要修正

### 1. `tools/window-shim.mjs:3-7`・`.claude/agents/measure.md:25-26` の説明が実装と合わなくなった

- 何が問題か: どちらも「`src/config.js` はトップレベルで `window.innerHeight` を触る（`PORTRAIT`）」と書いてある。
  この差分で `PORTRAIT` は消え、`config.js` は `window` を読まなくなった。
- 根拠（実測）: `node --input-type=module -e "await import('./src/config.js'); await import('./src/logic.js'); await import('./src/solutions.js')"`
  を shim 無しで実行して例外なく読めた（`typeof window` は `undefined`）。`tools/enumerate.mjs`・`gen-solutions.mjs` が
  読むのは `config.js` と `logic.js` だけ。
- `measure.md` はサブエージェントの定義なので、次に呼ばれた担当が誤った前提で動く。直し方（説明を書き直すか、
  shim ごと消すか）は管理者の判断。消すなら `docs/developer.md:67`・`:531` の行も対になる（下の「作り込みすぎ」も参照）。

## 検討

### 2. シーンの予約が処理される前に `relayout()` が重なると、シーンが 2 つ動く・状態が消える（`src/main.js:60-74`）

`followOrientation()` は `scene.restart()` を予約するだけで、Phaser はそれを次のフレームの頭で処理する。
その間に別の予約が入ると、予約の列がかみ合わない。**実害は未確認**（実機でこの間合いが起きる頻度は測っていない）。
registry の向きを逆にしてから `resize` を送り、同じ tick の中で向きの変化を偽装して測った。

| 場面 | 結果 |
|---|---|
| A1: Title で `scene.start('Records')` の直後（同じ tick）に向きが変わる | `Title` と `Records` が**両方動いている**（`getScenes(true)` = `['Title','Records']`） |
| A2: Game で `goToTitle()` の直後に向きが変わる | `Title` と `Game` が両方動いている。Game は作り直されて履歴 2 のまま |
| B: 同じ tick で向きが 2 回変わる（Game、おまかせ 3 手） | 前 `{hist:3, onBoard:3}` → 後 `{hist:0, onBoard:0}`。1 回目の `create()` が `relayoutState` を使って捨て、2 回目はまっさらで始まる（遊びかけは `onShutdown()` が保存済みなので localStorage には残る） |

- A1・A2 は、クリック（Phaser 3.16 以降は DOM のイベントで即時に処理される）と `resize` が同じフレームに入ったとき。
- B は、ブラウザが `resize` をフレームごとにまとめるので通常は起きにくい。ただしタブが隠れて Phaser のループが止まって
  いる間（`VisibilityHandler`）は予約が処理されないので、そこで向きが 2 回変わると起きうる（未確認）。
  Clear が重なっている場合は、2 回目の `create()` で `relayouting` が偽に戻っているのでファンファーレも鳴り直す（コードを読んだだけ。未確認）。
- 依頼の重点 2（作り直しの途中・シーンの切り替え中）に当たるため挙げる。境界線上なので、直すかどうかは管理者の判断。

### 3. `src/scenes/game.js:1160-1216` の控える項目と戻す項目が、2 か所に分かれた同じ並び

- `relayout()` が 17 項目を名前で控え、`applyRelayout()` が 1 行ずつ書き戻す。本編に持ち越すべき状態を足したときに、
  片方だけ直して取りこぼす形（依頼の「対で保守すべきものの片方だけ」）。`demo.js:139-151` は `progress` にまとめて
  `Object.assign(this, saved.progress)` で戻しており、同じ差分の中で作りが揃っていない。
- 根拠: 読んだコード。いま取りこぼしは無い（`create()` で初期化しているプロパティと突き合わせた。`messageText` だけ
  意図して持ち越していない、と報告にある）。

### 4. `src/scenes/records.js:76` の `LAYOUT`・`this.layout` が、`docs/developer.md` の用語「`LAYOUT`」と別物

- `docs/developer.md:227-229` は「`makeLayout()` が返す画面の部位ごとの配置を `LAYOUT` と呼ぶ」と定めている。
  この差分で records.js の `L` を `LAYOUT` に改名し、`this.layout` にも入れたので、中身の形が違う（`titleY`・`listX`・`rowsPerPage` …）
  ものが同じ名前になった。Game・Demo の `this.layout` は `makeLayout()` の戻り値で、records.js の `this.layout` だけが違う。
- `records.js:49` の JSDoc も「`listWidth`（…。`LAYOUT`）」と書いており、用語の表と取り違えやすい。
  改名は依頼に無い（`L` を `{ portrait, landscape }` にすれば足りた）。

### 5. `src/scenes/game.js:36` の `CLEAR_DELAY_MS` は `config.js` が置き場所

- CLAUDE.md の規約「数値と色は `src/config.js` に集約する」。他の時間の値（`INPUT.messageMs`・`INPUT.invalidFlashMs`・
  `DEMO.randomTurnStepMs`・`TITLE_DEMO.pauseMs`）は `config.js` にある。元は 700 の直書きで前からの違反だが、
  名前を付けて 2 か所で使うようにしたこの差分で置き場所を決めるのが自然。実装者も判断点に挙げている。

## 好みの範囲

### 6. 記録の画面の頁が往復でずれる件（実装者の判断点）は、今のままで妥当

- 1 頁の行数が違う（横 7・縦 8）以上、頁の番号は保てない。選んでいる回が頁にあればそれを、無ければ頁の先頭を
  載せる、という今の決め方で、「見えていた回が回したあとも見えている」ことは毎回保たれる。往復で頁が 1 つずれる
  のは、選んでいない頁を眺めていた場合だけ。ずれないようにするには、頁を送るまで最初の基準の回を持ち回る状態が
  もう 1 つ要り、得るものに見合わない。

## 向きを変えないときの同一性（重点 4）

実装者の `scripts/same.mjs` は、HEAD を別ポートに出し、横 1200×800・縦 450×800 の各々で 5 シーンの全オブジェクト
（型・座標・大きさ・文字・表示・depth・拡大率・Graphics の命令数）を突き合わせている。見た目の確かめ方としては十分。
挙動の差として、向きが同じ `resize` は `followOrientation()` の 1 行目で返る（コードで確認）。
`game.js:140-141` の `avoidNumbers` の和は、ふだんは `create()` の `new Set()`（134 行）に足すので従来と同じ。

## 重点ごとの確認（問題なし）

- 起動時の向きに固まった値: `rg -n "SCREEN|LAYOUTS|PORTRAIT|portrait|innerHeight|innerWidth" src tools tests.html` で、
  向きを決めて固定している所は残っていない。`records.js:132` の `CONFIRM` は `LAYOUTS.landscape` 固定だが、
  `makeLayout()` の `confirm` は向きに依らない定数（`config.js:460`）なので問題ない。
- トップレベルの書き換わる状態: `rg -n "^(let|var) " src` は `audio.js` の 2 つ（規約の例外）だけ。
  `main.js` の `startOrientation` は `const`、今の向きは registry。`setTimeout` / `setInterval` は 0 件。
- `resize` の登録は `main.js:75` の 1 か所だけ（`rg -n addEventListener src`）。
- Clear の記録の二重更新: 記録は `checkSolved()` で済み、Clear の `create()` は書かない（読んだコード）。
- Demo: `cancelTurn()` で回している途中を仕上げてから控える。`loading` 中に回したときは、古い promise と新しい
  promise のどちらか一方だけが `state === 'loading'` の見張りを通るので探索は 1 本（読んだコード）。
- 文書: `docs/developer.md` の「画面の向きが変わったとき」の表・registry のキー、`docs/UsersGuide.md` の段落、
  `CLAUDE.md` のファイル構成は実装と合っている（メッセージを持ち越さないことは、表に書いていないことで正しく表れている）。

## 作り込みすぎ

- `tools/window-shim.mjs:1-15` + `enumerate.mjs:15`・`gen-solutions.mjs:15`: delete: `config.js` が `window` を読まなくなり、
  shim は要らなくなった（実測は指摘 1）。文書の 2 行と `measure.md` の一文も一緒に消せる。約 -18 行。ただし
  この項目の範囲外なので、消すかは管理者の判断（検討）。
- `src/scenes/game.js:1189-1201`: shrink: 10 行の書き戻しを、控えるときに 1 つの入れ物にまとめて `Object.assign(this, saved.state)`
  1 行にできる（Demo と同じ形）。約 -8 行（検討。指摘 3 と同じ）。
- `src/scenes/records.js:246-250`: shrink: `pageAnchor()` は呼び出しが `relayout()` の 1 か所だけ。中へ入れれば約 -3 行（好み）。

net: -29 lines possible.

## 修正後の再レビュー

対象は `implementer-report.md` の「レビュー後の修正」の分だけ。Phaser 3.90.0 の `SceneManager.js`・`ScenePlugin.js`・`Game.js`
を CDN から取って読み、待ち合わせを確かめた。実測は scratchpad の `race3.mjs`（ポート 8765、本体の木）。

### 前の指摘の片付き具合

| # | 指摘 | 結果 |
|---|---|---|
| 1 | window-shim の説明が古い（要修正） | 片付いた。shim を消し、import 2 か所・`CLAUDE.md`・`docs/developer.md` の 2 行を削除。`measure.md` の書き直しも合っている（`storage.js:40` などは関数の中で `window.localStorage` を読む）。`rg -n window-shim -uu --glob '!archives/**' .` は、本体の木では 0 件（ヒットは `.claude/worktrees/` の別の木だけ） |
| 2 | 予約が残っている間に作り直しが重なる（検討） | 片付いた（下の実測） |
| 3 | Game の控える／戻す項目が 2 か所に分かれている（検討） | 片付いた。`RELAYOUT_KEYS`（12 項目）を控えるときにも戻すときにも使う。前の 12 項目と同じで、抜けは無い。Demo も同じ作りで、前の 11 項目と同じ |
| 4 | records.js の `LAYOUT` の名前（検討） | 片付いた。`L` と `this.L` に戻り、`LAYOUT` は 0 件 |
| 5 | `CLEAR_DELAY_MS` の置き場所（検討） | 片付いた。`config.js:863-867` に移り、JSDoc も「なぜ」を書いている |
| 6 | 記録の画面の頁（好み） | 変えていない。前の判断のまま妥当 |
| 作り込みすぎ | shim の削除・書き戻しの 1 行化・`pageAnchor()` を中へ入れる | 3 つとも済んだ |

### 待ち合わせ（`src/main.js:50-106`）の実測

registry の向きを逆にしてから `resize` を送り、同じ tick で向きの変化を偽装した（前回と同じ方法）。
`watchers` は `game.events.listenerCount('poststep')`。何もしていないときは 1（Phaser 自身の分）。

| 場面 | 結果 |
|---|---|
| A1: `scene.start('Records')` と同じ tick | 動いているのは `['Records']` だけ。watchers 1 に戻った |
| A2: Game の `goToTitle()` と同じ tick | `['Title']` だけ。Game の `relayoutState` は残っていない |
| B: 同じ tick で 2 回（元の向きに戻る） | hist 3・盤 3 → hist 3・盤 3。向き・内部解像度とも変わらず |
| ループを止めている間（`game.loop.sleep()`。タブが隠れたときと同じく `poststep` が来ない）に 3 回変わる | 止めている間は watchers 2（見張りは 1 つだけ足された）、`wake()` のあと 1 回作り直して watchers 1。hist 3・盤 3 のまま |
| 実際に窓を 450×800 → 1200×800 と変える | 640×1136 → 960×640 と切り替わり、hist 3・盤 3 のまま |

pageerror は 0 件。コードでも確かめた:
- `Game.step()` は `scene.update()`（頭で `processQueue()`）のあとに `POST_STEP` を出す。`processQueue()` は処理中に足された
  予約も同じ回で処理する（`this._queue.length` をループのたびに読み直す）。なので `poststep` で `_queue` が空なら、
  切り替えは済んでいる。
- `ScenePlugin` の `start`・`restart`・`launch`・`stop`・`pause`・`resume` はどれも `queueOp()` を通る。`_queue` を見れば漏れは無い。
- 止めてある Game の `events.once(CREATE, () => this.scene.pause())` も予約だが、同じ `processQueue()` の中で処理される。

### 新しく見つけたこと

- **好みの範囲（待ち続ける経路）:** 作り直しが始まらずに待ち続けるのは、シーンが `START`・`LOADING`・`CREATING` のまま
  止まったときだけ。このゲームには `preload` も `this.load` も無い（`rg -n "preload|this\.load\." src` は 0 件）ので、
  起きるのは `create()` が例外で止まったときに限られる。そのときはゲーム自体が壊れているので、実害は小さい。実害は未確認。
- **好みの範囲（前からある 1 フレームの間）:** `poststep` で `relayout()` が控えてから、次のフレームの `processQueue()` で作り直すまで
  1 フレームの間がある。その間は古い部品が新しい内部解像度で 1 回描かれ（実装者の懸念にもある）、DOM の入力も古いシーンに届く。
  ドラッグ中にちょうどその間に指を離すと、置いた手（完成なら記録まで）が反映されたあと、控えた「掴む前」の盤へ戻る筋がある。
  修正前も同じ間はあったので新しく入ったものではない。実害は未確認（実測していない）。
- `game.scene._queue` は Phaser の private。3.90.0 に固定してあり、JSDoc にも理由が書いてあるので、このままでよい
  （実装者の残る懸念どおり、Phaser を上げるときに見直す）。

要修正: なし。
作り込みすぎ: なし。
