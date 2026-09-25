# TODO-083 reviewer 報告

対象: 未コミットの `git diff`（src/logic.js・src/scenes/boot.js・src/scenes/demo.js・
docs/UsersGuide.md・docs/developer.md）。Phaser は CDN の 3.90.0 の `phaser.js` を
取って読んだ。`parseDemoParams()` と URL の書き換えは node で実測した。

## 要修正

なし。

## 検討

### 1. src/scenes/demo.js:112 — 音の解放を `pointerdown` で行っている（タッチ端末では効かない可能性。実害は未確認）

- 問題: タイトルのボタン（`createButton` の `onClick`）は `pointerup` で走る
  （src/ui.js の `container.on('pointerup', ...)` の中で `onClick()`）。デモの
  追加分はシーンの `pointerdown` で `audio.unlock()` を呼んでおり、タイトルとは
  条件が違う。
- 根拠（実測・ソース）:
  - Phaser 3.90.0 はマウスを DOM の `mousedown` の中で同期的に処理し
    （`MouseManager.onMouseDown` → `InputManager.onMouseDown` →
    `updateInputPlugins`）、シーンの `POINTER_DOWN` は `processDownEvents` で
    ボタンの上を押したときも出る（`cancelled` にしない限り。src 内に
    `stopPropagation` は無い）。したがって**マウスでは**ボタンを押したときも発火し、
    `mousedown` はブラウザのユーザー操作として扱われる。ここは問題なし。
  - **タッチでは** Phaser の `pointerdown` は DOM の `touchstart` から来る。
    HTML の仕様で user activation を与えるのは `touchend`（と `pointerup`）で、
    `touchstart` は含まれない。iOS Safari・Android Chrome で `touchstart` 中の
    `AudioContext` の生成・`resume()` が鳴らせる状態にならない可能性がある。
    `once` なので一度外れると二度と呼ばれず、デモの HUD のボタンは `unlock()` を
    呼ばないため、URL で開いたデモではタッチ端末で最後まで音が出ないおそれがある。
  - 実機では確かめていない（**未確認**）。なお本編の `onPiecePointerDown`
    （src/scenes/game.js:642）も `pointerdown` で `unlock()` しており、同じ性質は
    既存コードにもある。
- 判断が要る点: `pointerup` にすればタイトルのボタンと同じ条件になる。
  直すかどうか・実機で確かめるかは管理者の判断。

### 2. CLAUDE.md のファイル構成表 — `logic.js` の行に `parseDemoParams()` が無い

- 問題: CLAUDE.md の表は `logic.js` の中身を関数名と TODO 番号付きで列挙している
  （`solveSteps()`（TODO-040）、`forcedPlacements()`（TODO-044）など）。今回
  `logic.js` に足した `parseDemoParams()` が載っていない。
- 根拠: CLAUDE.md の「ファイル構成」表。対で保守している一覧の片方だけ変わっていない。
  docs/developer.md の構成節は総称（「Phaser に依存しない計算」）なので直さなくてよい。

## 好みの範囲

### 3. src/scenes/demo.js:394-399 — 他のパラメータの書式が変わる

- 実測（node の `URL`）: ハッシュと他のパラメータは残る。ただし
  `searchParams` が再直列化するため `?a=b%20c&demo=random#frag` → `?a=b+c#frag`、
  `?foo&demo=x` → `?foo=` になる。いまアプリが読むパラメータは `demo`・`board` だけ
  なので実害は無いはず（実害は未確認）。
- JSDoc は「URL で開いたときは」と書くが、タイトル経由で入ったときも走る
  （パラメータが無ければ同じ URL で `replaceState` するだけで害は無い）。

## 問題の無い点

- `scene.start()` のデータを使わない理由のコメント: 正しい。Phaser 3.90.0 の
  `Systems.start(data)` は `if (data) settings.data = data;` で、データ無しの
  `start()` は前回の `settings.data` をそのまま `init`/`create` に渡す。
  Boot から `start('Demo', {...})` で渡すと、後でタイトルの `start('Demo')` に持ち越される。
- デモから出る道は「タイトルへ」だけ（demo.js に他の `scene.start` は無い）で、そこで
  URL を消すので、タイトル経由の再入場で URL の値を拾うことは無い。
- `input.once` の登録は `InputPlugin.shutdown` の `removeAllListeners()` で消えるので、
  入り直しても積み上がらない。
- `parseDemoParams()` 実測: `''`→`null`、`?board=6x10`→`null`、`?demo`・`?demo=`→
  random/8x8、`?demo=DEPTH&board=6X10`→random/8x8、`board=toString`・`__proto__`→8x8
  （`Object.hasOwn` で弾ける）、`demo` が 2 つなら先頭を使う。仕様どおり。
- registry: `BOARD_REGISTRY_KEY` を書くのは Boot・Title・Records だけで、デモは読むだけ。
  `ensureSolutions()` は盤ごとのキーでキャッシュするので、URL の盤が registry と違っても崩れない。
- 規約: `setTimeout` 無し、トップレベルの `let` 無し、`logic.js` に DOM/Phaser 無し
  （`URLSearchParams` は標準の API）、色の直書き無し。コメントは「なぜ」を書いている。
- 文書: UsersGuide の既定値・パラメータ値・「タイトルの盤は変わらない」・音の注意、
  developer.md の状態遷移図と説明はコードと一致。公開 URL は developer.md:643 と同じ。
- 範囲: 指示外の変更は無い。

## 作り込みすぎ

作り込みすぎ: なし（Boot と Demo で 2 回パースするが、渡し方を増やすより短い）。
