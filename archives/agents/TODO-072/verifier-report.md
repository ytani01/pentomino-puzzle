# TODO-072 verifier の報告

実測スクリプト: `archives/agents/TODO-072/verify.mjs`（Playwright 1.63.0 を npx の置き場から借用。新しいコンテキスト、844×390、各手順 1 回）。
`PLAYWRIGHT=~/.npm/_npx/6bcb61ec6d5aea22/node_modules/playwright/index.mjs node archives/agents/TODO-072/verify.mjs` → **終了コード 0、pageerror・コンソールエラー 0 件**。
サーバは既に動いていた `localhost:8765`（配信中の `clear.js` に「続ける」、`storage.js` に `recordCompletion` があることを確認）。ゲームの論理サイズは 960×640（横画面）。

## 結果

1. tests.html: 「390 件すべて通った」（ok 390 / ng 0）、コンソールエラー 0 件。一致
2. おまかせ 12 回で完成（8×8）: 一致
   - Game の status 6（paused）、Clear が重なって出る（画面は移らない）。`playing: false`
   - 時計: 完成時 45ms → 1.5 秒後も 45ms（止まっている）
   - 表示中に HUD の一手戻す・おまかせ・ヒント表示を実際のマウスでクリックし、盤のピースをトレイへドラッグ → 盤は同じ、`history` は 12 → 12、`hinting: false` のまま、Clear も出たまま
   - HUD「新しい解（59 番）」、クリア表示「正解の 59 番（8×8 の全 65 解）」「新しい解」
   - localStorage の履歴 1 件 `{"no":59,"ms":44.98,"a":true}`、`progress.solved: [59]`
3. 「続ける」（Clear のボタンを実際のマウスでクリック）: 一致
   - 経過時間: 完成時 45 → 表示中 3.5 秒ほど置いたあとの押す直前 45 → 押した直後 273 → 1 秒後 1408。表示中の時間は数えていない
   - `playing: true`、status 5（running）、HUD の「新しい解（59 番）」は残る
   - F 以外の 1 つ（先頭のピース）を実際のマウスで盤→トレイへ外す → `left: 1`、HUD の知らせは消える。同じピースをトレイから同じ位置へ実際のマウスで戻す（向きは変わっていない。`cells` 一致）→ `left: 0`、HUD「記録済み（59 番）」、クリア表示「記録済み」。履歴は 1 件のまま（中身も変わらない）
4. 印の比べ方: 一致
   - 4a: 履歴を `[{no:59, ms:600000}]`（印なし 10:00）に書き換え → 一手戻す 1・おまかせ 1 で同じ 59 番を完成（印あり）→ HUD・クリア表示とも「記録済み」、履歴は書き換えたまま
   - 4b（`recordCompletion` を `evaluate` で import して呼んだ）: 履歴 `[{no:59, ms:5000, a:true}]` に、印なし 900000ms → `status: "improved"`、`best: 900000, updated: true`、履歴は `[{no:59, ms:900000}]`（印が外れ、日時も今回）。続けて印なし 950000ms の `recordClear` → `"kept"`
5. 完成したまま（クリア表示の）「タイトルへ」→ Game は shutdown（status 8）、Clear も閉じる。タイトルの「つづきから」は押せる → クリック → `left: 0`（完成した盤面）、1.5 秒待ってもクリア表示は出ない、`solvedNumbers: [59]`、`playing: true`、HUD の知らせは空。一致
6. 履歴に 3 番を 3 件（`ms 50000 a`・`ms 30000` 印なし・`ms 20000 h`）と 7 番を 1 件入れて記録画面を開く → `entries` は `[{no:3, ms:30000}, {no:7, ms:70000}]`。3 番は印なしの 30000 の 1 件にまとまった（印なしを先に立てる決めごとどおり）。一致
7. ヒント表示を入（入にした時点で `left: 12` のまま。空の盤なので形の決まった空きが無い）→ おまかせで完成（「新しい解（61 番）」「おまかせとヒント表示を使った」）→ 続ける → 盤のピースを実際のマウスでトレイへ → 1.2 秒後 `left: 1`、Clear は出ない、`hinting: true`、`playing: true`。埋め戻されない。一致
8. 画面: `~/tmp/playwright-mcp/todo072-overlay.png`（クリア表示）、`~/tmp/playwright-mcp/todo072-demo.png`（デモで解が出たとき）
   - クリア表示の 5 行と 4 つのボタンは画面内（論理座標 x 213〜773、y 80〜522 / 960×640）。ボタン同士・文字同士の重なり・欠けは無い
   - デモ: 最速で 45 手目に解 → 動いているシーンは `Demo` だけ（Clear は出ない）、下に「解けた！ 45 手目」。今までどおり

## 食い違い・気になった点（境界線上。実害は未確認）

- クリア表示の「COMPLETE」（y 80〜148）が、暗くした本編の HUD のボタンの段（ヒント表示・やり直しのアイコンのあたり）の真上に重なる。幕で暗くなっているので読めるが、アイコンの線が文字の後ろに透けて見える（画像参照）。重なり方として問題にするかは判断できない

## 変更されたファイル

`git status`: CLAUDE.md、docs/UsersGuide.md、docs/developer.md、src/config.js、src/scenes/clear.js、src/scenes/game.js、src/scenes/records.js、src/storage.js、tests.html、archives/agents/TODO-072/（未追跡）。implementer・docs の報告にある範囲と合っている。verifier が足したのは `archives/agents/TODO-072/verify.mjs` とこの報告だけ。

## 確かめていないこと

- 縦画面（640×1136）でのクリア表示（依頼の条件は 844×390 のみ）
- デモの後の localStorage は、直前の手順 7 の分が残っていたため、デモが何も書かないことは切り分けていない（依頼に無い）
- 記録画面の一覧の表示（配置は対象外。`entries` だけ見た）
