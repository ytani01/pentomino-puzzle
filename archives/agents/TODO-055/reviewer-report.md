# TODO-055 reviewer 報告

対象: 作業ツリーの差分（`git diff HEAD`）と新規 `docs/UsersGuide.md`。

## 要修正

- `docs/UsersGuide.md:30`「画面上端に、経過時間・残りのマス数・解の有無と、
  アイコンのボタンが並ぶ。」の**「残りのマス数」が誤り**。
  `src/scenes/game.js` の `refreshHud()` を見ると、`left` は
  `this.pieces.filter((piece) => piece.location === 'tray').length`
  ——**トレイに残っているピースの個数（0〜12）**であり、盤のマス数
  （60 マス中の残り）ではない。根拠: `src/scenes/game.js` の
  `refreshHud()`（1171〜1174 行付近）を実際に読んで確認した。
  この文自体は README を移した文ではなく今回新規に書かれたもので、
  `docs/developer.md` の「画面の用語」表（既存、変更なし）は同じものを
  「残り数」とだけ書いており「マス数」とは言っていない——UsersGuide と
  developer.md の間で表現が食い違っている（依頼の見る観点 2 に該当）。
  「残りのピース数」または単に「残り数」に直すのが妥当。

## 検討

- `README.md:34`「ファイル構成、画面の用語、テスト、記録の保存、全解のデータ、
  GitHub 上の設定は docs/developer.md にある。」に、今回 developer.md へ
  新設した**「構成」節（3 層の分け方・シーンの移り方・registry のキー）が
  含まれていない**。`CLAUDE.md` のファイル表の同じ行（86 行付近）は
  「構成（3 層の分け方・シーンの移り方・registry のキー）」を含めており、
  README とここだけ食い違う。実害は小さい（要約の抜けなので developer.md
  自体の目次は正しい）が、依頼の観点 2「同じ主張が 2 か所にあるところの
  食い違い」に該当するので報告する。README 側に「構成」を足すかどうかは
  判断が要る（意図的に短くしたのかもしれず、未確認）。
- `docs/developer.md` の「記録の保存」節は、削除した `docs/storage.md` の
  §5 にあった「`sanitize*` は生の文字列でもパース済みの値でも受け取る
  （テストから組み立てた配列をわざわざ JSON 文字列に直さずに渡せるため）」
  という設計理由を落としている。依頼で明示的に落としてよいとされたのは
  §1・§8・「読む人の想定」だけで、この一文は対象外。実際にコード側にも
  同じ注記がある（`src/storage.js` 464 行付近のコメントで確認）ので、
  実装と乖離した記述ではないが、**残すべき設計判断が落ちている**可能性がある
  （依頼の観点 3）。実害は小さい（テストの書きやすさの話で、遊ぶ・保守する
  うえでの影響はほぼ無い）ので検討どまりとした。

## 好みの範囲

- 特になし。

## 問題の無かった観点

- 役割分担（README=概要・特徴、UsersGuide=遊び方、developer.md=開発者向け）:
  UsersGuide に関数名・ファイル名など開発者向けの話は混ざっていない。README にも
  操作の細部は残っていない
- 数値の一致（65/2339、HUD ボタン 6 個、パレット glass/colorful/neon 3 種、
  registry のキー名）: README・UsersGuide・developer.md・実コード
  （`src/config.js`）の間で一致を確認した
- developer.md のシーン遷移図: `src/main.js` の `scene:` 配列と各シーンの
  `scene.start()` 呼び出しを rg で洗い、Boot→Title→{Game,Records,Demo}、
  Game→{Title（確認あり）,Clear}、Clear→{Game,Records,Title}、
  Records→Title、Demo→Title（GameScene 継承の `goToTitle()` をそのまま使う）
  のすべてを実コードで裏取りした。食い違いなし
- `docs/storage.md`・`docs/20260816-0538 … 構造分析.md` から移した
  キー名・関数名・値の形（`sanitizeHistory` 等、`historyKey` の `v2`、
  `pentomino-puzzle/...`、`HISTORY_LIMIT`）は `src/storage.js` /
  `src/config.js` と一致を確認した。落とすと決めたもの（§1・§8、§5 の
  hoge の話、ファイル表の重複）以外で、上記「検討」の 1 件を除き大きな
  欠落は無い
- リンク・アンカー: `rg` で拾った全リンクの参照先見出しが実在することを
  確認した（`#全解のデータ`・`#github-上の設定`・`#画面の用語`・
  `#サブエージェントの定義`・`UsersGuide.md#つづきから` など）。切れているものは無い
- ユーザー全体の CLAUDE.md「日本語の書き方」「造語を使わない」: 直訳調の
  言い回しや作られた造語は見当たらなかった
- `.claude/agents/docs.md` と `CLAUDE.md` のファイル表: `docs/UsersGuide.md`
  の追加が両方に反映されている

## 作り込みすぎ

なし（文書の再編のみで、コードの追加は無い）。

net: 対象がコードでないため行数の指標は付けない。
