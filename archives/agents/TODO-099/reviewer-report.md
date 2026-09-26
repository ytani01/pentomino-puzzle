# TODO-099 レビュー報告

対象: `git diff`（未コミット分）。TODO.md の TODO-099 節と
`archives/agents/TODO-099/implementer-report.md` を前提に確認した。

## 要修正

- **`.claude/agents/screens.md:64,80,88,98`・`tests.md:33`・`measure.md:47,68`・
  `docs.md:30`（計 8 箇所）に「盤」が残っている。** これらは今回の差分に
  含まれておらず（`git status` にも出ない）、「盤面」ではない単独の「盤」
  （例: `screens.md:88` 「盤・トレイ・スロット・HUD などの」、`measure.md:47`
  「どの盤で測ったのか」）。
  根拠: 実装報告が完了の根拠にした
  `rg -n '盤' --glob '!archives/**' --glob '!src/data/**' --glob '!TODO.md'`
  は、`ripgrep` が既定で隠しディレクトリ（`.claude/` 配下）を検索しない
  ため、`.claude/agents/*.md` を素通りしている（`--hidden` を付けて
  同じコマンドを流すと 8 件出ることを実測して確認した）。`.claude/agents/*.md`
  は `archives/` でも `src/data/` でもなく、CLAUDE.md のファイル構成表にも
  載っている追跡対象のファイルなので、置き換え漏れに当たる。
  特に `screens.md:88` は「`docs/developer.md` の「画面の用語」— 盤・トレイ・
  スロット・HUD などの」と、今回「ボード」に変わった節を名指しで参照して
  いるため、そのまま残すと参照先と用語が食い違う。
  境界線上の判断（`.claude/agents/*.md` を今回の対象に含めるべきかどうか）は
  未確認・報告のみとする。管理者の判断を仰ぎたい。

## 検討

なし。

## 好みの範囲

なし。

## 確認して問題が無かった点

- 置き換え漏れ（隠しディレクトリを除く）: `rg -n '盤' --glob '!archives/**'
  --glob '!src/data/**' --glob '!TODO.md' | rg -v -e '盤面' -e '終盤'` は空。
  実装報告の主張と一致した
- 「盤面」「終盤」: 全箇所で変わっていない（`git diff` で「盤面」を含む行を
  拾い、追加側も「盤面」のまま残っていることを確認した）
- 識別子: `git diff` の追加行から `board` を含む語を抽出し、`BOARD_REGISTRY_KEY`・
  `BOARDS`・`boardKey`・`boardButtons`・`boardPanel`・`boardCells()`・
  `boardSymmetries()`・`boardCell`・`boardGap`・`board.grid`・`boardOk` は
  すべて識別子側は元のまま、日本語の説明文だけが「ボード」に変わっている
  ことを確認した
- 保存データのキー: `src/storage.js` の diff にリテラル文字列の変更は無く、
  日本語コメントのみの変更だった
- `CLAUDE.md`: 差分に含まれているが、TODO-099 のチェックリストに
  `CLAUDE.md` が明記されており対象内。「盤面」を含む行（`src/config.js`・
  `src/logic.js`・`src/solutions.js`・`src/storage.js` の説明）はそのまま
  残り、単独の「盤」だけが「ボード」に変わっている。実装報告にあった
  「CLAUDE.md は変えていない」という記述と実際の diff は食い違うが
  （実装後に main か別の作業で反映されたと見られる）、内容自体に問題は無い
- Markdown のアンカー: 見出しが変わったのは `docs/UsersGuide.md:6`
  （`## 盤と色を選ぶ` → `## ボードと色を選ぶ`）のみ。この見出しへのリンクを
  `rg -n '\]\(.*#.*盤'` 相当で捜したが、`archives/` 以外に参照は無かった。
  `docs/developer.md` の見出しは変わっていない（`CLAUDE.md` からのアンカー
  リンクは全て無事）
- `src/ui.js` の `labelWidth: 48 → 96` は、依頼で main が意図した変更と
  明記されていた箇所（追加分のレビューで JSDoc の記述を再確認した内容は
  下の節を見る）
- 日本語としての自然さ: 「盤外」「盤の外」→「ボードの外」、「盤上」→
  「ボード上」、「盤に載った」→「ボードに載った」など、置換後の文を
  一通り目視したが、助詞の欠落や意味の変化は見当たらなかった
- `tests.html` の diff は `git diff -U0` を `盤|ボード` 以外の行で絞り込むと
  0 件で、テスト名・コメントの文言以外は変わっていない
- 範囲外の変更: `src/ui.js` の 2 箇所（main 了承済み。詳細は下の節）を除き、
  `盤|ボード` 以外の追加・削除行は無かった

## 作り込みすぎ

なし（文字列置換のみの差分で、新しい抽象化や依存の追加は無い）。

## 追加分（`src/scenes/title.js` の HOW_TO_PLAY_LEAD / howToPlayText、`src/ui.js` の labelWidth JSDoc）

問題なし。確認した内容:

- **`orientation` が `create()` 内で定義済みか**: `src/scenes/title.js:125`
  `const orientation = orientationOf(this);` が `howToPlayText(orientation)`
  の呼び出し（`:162`）より前にあり、未定義参照は無い
- **`HOW_TO_PLAY_LEAD` / `howToPlayText` の書き方がまわりのコードに合うか**:
  同じファイルの `STACK`（`:43`）・`PREVIEW`（`:71`）・`STACK_BIAS` と同じ
  「`{ portrait: …, landscape: … }` を向きのキーで引く」形で、if/else で
  分岐する既存コードは無い。`howToPlayText` も `topOf` / `centerOf` と
  同じく `create()` 内で使う小さな arrow function の外側版として module
  スコープに置いてあり、既存のパターンから外れていない
- **JSDoc が「なぜ」を書いているか**: `:98-101` の
  「縦画面は 1 行目が枠に収まらない。折り返しは空白でしか切れず「12」だけが
  1 行に残るので、切る位置を手で決める（TODO-099）。」は、何を変えたかでは
  なく、なぜ手で改行するかの理由（Phaser の `wordWrap` が空白でしか切れない
  という制約）を書けており規約に沿う
- **横画面の文言が変わっていないか**: `HOW_TO_PLAY_LEAD.landscape` は
  `'12 種のピースをボードにすき間なく敷き詰めるパズル。'` で、`盤`→`ボード`
  の単語置換以外の変更は無い（`\n` は付いていない）。改行が入ったのは
  `portrait` のみで、依頼の経緯（縦画面だけ手で改行）と一致する
- **`STACK.portrait.howTo.height`（186）が変わっていないか**: `:47` と
  `:59` の両方で `height: 186` のまま。今回の diff にこの値の変更は無い
- **`src/ui.js` の `labelWidth` JSDoc から「行ごとに変えると、上下の行で
  ボタンの列が揃わなくなる」の文を消した件**: 削除は妥当と判断した。
  `createChoiceRow` は `left = cx - (labelWidth + buttonsWidth) / 2`
  で行全体を `cx` を中心に描くため、ボタンの実際の x 座標は
  `labelWidth` と `buttonsWidth`（選択肢の数 × 幅）の両方に左右される。
  タイトル画面の 2 行は `boardChoices`（`BOARDS`、2 択）と
  `paletteChoices`（`PALETTES`、3 択以上）で選択肢の数が異なり
  （`src/config.js` の `BOARDS` と `PALETTES` の定義を確認）、
  `buttonsWidth` が行ごとに違うので、`labelWidth` を統一していても
  ボタンの列は元々揃っていない。削除前の文は「揃っていたものが崩れる」と
  読める書き方だったが、実際には最初から揃っていなかったので、消した
  ほうが正確。残った文（「いちばん長い『ボード』の 3 文字ぶんに間隔を
  足した値」）は「なぜ 96 か」の説明として成立している
- 上記の視覚的な折り返しの見え方（実際に 7 行に収まるか、はみ出さないか）は
  screens の担当分のため未確認
