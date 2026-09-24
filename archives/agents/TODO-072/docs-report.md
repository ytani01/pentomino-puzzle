# TODO-072 docs の報告

根拠は `git diff src/`（clear.js・game.js・storage.js）と implementer-report.md。src/・tests.html・TODO.md は触っていない。

## docs/UsersGuide.md

- 「クリアと番号」: 「クリアすると『正解の何番か』が出る」→ 盤が埋まると時計が止まり、盤の上にクリアの表示が重なる、に改めた。4 つのボタン（続ける・もう一度・記録・タイトルへ）の表を足した。
  「新しい解／記録を更新／記録済み」の意味（HUD の Ⓒ の位置にも番号付きで出る、盤が埋まっていない状態になると消える）、記録は 1 つの解に 1 件、成績の比べ方（印の無いほう → 経過時間の短いほう、累計で比べる）を足した。
- 「つづきから」: 完成した盤面も残る（記録・タイトルへを選んだあとも続きを遊べる、もう一度で消える）を足した。
- TODO 番号は書いていない。

## docs/developer.md

- シーンの移り方: 「6 つ（`scene.start()` で遷移する）」に、Clear だけは Game を `pause()` して `launch()` で重ねる例外を足した。図の `Game --> Clear: 完成` → 「完成（Game を止めて重ねる）」、`Clear --> Game: もう一度` → 「続ける（止めた Game を動かす）／もう一度（新しく始める）」。図の下に、続ける（`continuePlay()`）と他の 3 つ（Game を stop してから移る、もう一度だけ遊びかけを捨てる）の説明を足した。
- 画面の用語: HUD の行に「盤が完成しているときは、同じ位置に『新しい解』『記録を更新』『記録済み』の知らせ」を足した。
- 保存のキーの表: クリア履歴に「1 つの解に 1 件」を足した。
- 値の形: 履歴の節に「履歴は 1 つの解に 1 件」の段落（`recordClear()` の 'new'／'improved'／'kept'、`isBetterClear()`、`loadHistory()` が `dedupeHistory()` を通す、読むだけでは保存し直さない）を足した。遊びかけの例に `solved: [6]` を足し、`solved` の説明（前の形は空の配列として読む）を足した。
- 読み書きの構え: 「クリア画面はその場の表示を戻り値のまま出せる」→「本編はその戻り値をクリアの表示へ渡し、そのまま出せる」。`sanitizeProgress` の検証項目から「12 個とも盤に載っている状態ではないこと」を外し、完成した盤面も通す理由に替えた。
- スキーマ: 「次に `addHistory()` で書き戻すときに」→「次に `recordClear()` などで書き戻すときに」。
- いつ書き込まれるか: 「クリアしたとき | saveBest・addHistory・addFound」→「完成したとき（続けて作った解も） | saveBest（自力のときだけ）・recordClear・addFound・saveProgress」。「解き切ったとき・やり直したとき | clearProgress」→「やり直したとき・クリアの表示で『もう一度』」。図は Clear の saveBest／addHistory を Game の「完成」へ移し、Clear には「もう一度 → clearProgress()」だけを残した。`G3 -- "完成" --> K` を外した。

## CLAUDE.md

- `src/scenes/clear.js`: 「クリア表示と記録の更新」→「クリア表示。本編を止めてその上に重ねる。記録の更新は本編が完成を見つけたときに済ませる（TODO-072）」
- `src/storage.js` の行は今のままで合う（履歴・遊びかけの保存という役割は変わらない）ので触っていない。

## 直さなかった食い違い（コード側）

- `storage.js` の `addHistory()` はアプリから呼ばれなくなった（tests.html だけが使う）。その JSDoc と履歴の説明（「既にある件を書き換えない」の類）が古い、と implementer が報告している。src/ なので触っていない。
- clear.js の幕の色 `0x000000` の直書き（規約「色は config.js に集約」との関係）。implementer 報告のとおり、判断は管理者。

## 食い違っていなかったところ

- README.md の「クリアすると、それが何番目の解かが出る」「途中でやめても、次は つづきから 再開できる」: 今も正しい。触っていない。
- developer.md の「記録と遊びかけを書き込むのは Game・Clear・Records の 3 つ」: Clear が `clearProgress()` を呼ぶので今も正しい。
- developer.md の「履歴は同じ番号を 2 件持たないので番号で 1 件に定まる」: `dedupeHistory()` で保たれるので正しい。
- `recordClear`・`isBetterClear`・`dedupeHistory`・`continuePlay`・`RECORD_STATUS` の名前と戻り値の文字列は、src/ の定義を開いて確かめた。
- UsersGuide の HUD の「やり直し — 盤を空にして最初から」: `clearProgress()` を呼ぶので合う。
