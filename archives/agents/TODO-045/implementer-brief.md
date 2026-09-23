# TODO-045 implementer への依頼

## 目的

ヒント表示の「解ける／解なし」を目立たせる。今は HUD の 1 段目に小さい文字
（`FONT.small`。解ける＝`TEXT_COLORS.dim`、解なし＝`TEXT_COLORS.danger`）で出していて気づきにくい。
これを**色付きの角丸の札**にする。本編とデモの両方。

決まっていること（利用者と決めた。変えない）:

- 「解ける」＝緑地、「解なし」＝赤地の角丸の札に、白い文字。文字は今より大きくする
- 見せ方は HUD の中の札だけ。盤の枠の色は変えない
- 文言（解ける／解なし）と音の鳴らし方は変えない。いつ出す・消すかも変えない

## 対象

```bash
rg -n "hintText|hintState" src
rg -n "TEXT_COLORS|COLORS = |FONT = " src/config.js
```

触るのは `src/ui.js`・`src/config.js`・`src/scenes/game.js`・`src/scenes/demo.js`。
`README.md`・`docs/developer.md` に「解ける／解なし」の見た目（色・文字の大きさ）を書いた
ところがあれば合わせる（`rg -n "解ける|解なし" README.md docs/developer.md`）。

## 設計（main が決めた。迷ったら報告に書いて、この形で進める）

1. **札を作る関数を `src/ui.js` に 1 つ置く**（例: `createHintBadge(scene, x, y, originX)`）。
   返すものに `setState(state)` を持たせ、`'ok'`・`'dead'`・`null`（隠す）で切り替える。
   本編の `runHint()`・`toggleHint()` とデモの `refreshStatus()` は、今の `hintText.setText().setColor()` を
   これの呼び出しに置き換える。文言の対応（ok→解ける、dead→解なし）もこの関数の中に 1 つだけ持つ
2. 札は `createPanel()` と同じく Graphics の角丸矩形 + Text。札の幅は文字に合わせる
   （「解ける」「解なし」は同じ文字数なので固定でもよい）。原点（左寄せか右寄せか）を引数で受ける
3. **色と寸法は `config.js`**。緑は `COLORS` に足す（数値）。赤は `COLORS.danger` を使ってよい。
   白い文字は既存の `TEXT_COLORS.normal` でよいか見て、読みにくければ足す。文字の大きさは
   `FONT.hud`（26）程度。札の高さは HUD の 1 段（`HUD_ROW` = 56）に収める
4. 置き場所: 本編は今と同じ `statusX`（左寄せ）、デモは 1 段目の右端（右寄せ）。
   depth は今の `hintText` と同じ `DEPTH.hud`
5. 本編で、ヒント表示を切にしたとき・残り 0 のとき・全解のデータがまだ無いときは札ごと隠す（今の空文字と同じ時）

## 保つもの（変えない）

- `runHint()` の判定と、`audio.invalid()` を鳴らす条件
- デモの `hintState` の遷移（TODO-043 で決めたもの）
- 規約: 色をコードへ直接書かない、`setTimeout` を使わない、状態はシーンのプロパティ、JSDoc は「なぜ」

## 完了条件と確かめ方

- 4 通りの配置（8×8/6×10 × 横/縦。横 960×640、縦 640×1136 の内部解像度）で、
  1 段目の他の文字と重ならず枠からはみ出さないことを、座標の計算で確かめて報告する
  （本編は時間「99:59」・残り「残り 12」、デモは「試した手 123,456　見つけた解 12」が最も長いとき）。
  実際の画面は別の担当が撮る
- `http://localhost:8765/tests.html` が全件通る（Phaser に触らないので変わらないはずだが念のため。
  サーバが無ければ `python3 -m http.server 8765` をバックグラウンドで。ブラウザで開けなければ報告にそう書く）

## 報告

`archives/agents/TODO-045/implementer-report.md` に、変更点・確かめた方法と結果（数値）・迷った点を書く。
返事は「終わったか・報告ファイルのパス・判断が要る点」の 5 行以内。コミットはしない。
