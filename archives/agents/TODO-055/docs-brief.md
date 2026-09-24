# TODO-055 docs 担当への依頼

## 目的
文書を 3 つに整理する。
- `README.md` — このアプリの概要と特徴のアピール（遊ぶ人・GitHub で見つけた人向け）
- `docs/UsersGuide.md`（新規）— 遊び方の詳細
- `docs/developer.md` — このプロジェクトで開発する人向けの技術説明

## やること
1. `README.md` を書き直す。残すもの: 1 行の説明、公開版の URL、特徴（依存が Phaser だけ・
   アセット無し・マウス/タッチ・8×8 と 6×10・全解 65/2339 を持つのでおまかせ・ヒントが待たない・
   デモで探索を眺められる、など、読んだ人が遊びたくなる形で）、ローカルで開く手順、
   UsersGuide と developer.md へのリンク、ライセンス。
   今の「遊ぶ」の操作表・細かい挙動と「デモ」節は UsersGuide へ移す。「テスト」節は developer.md へ移す。
2. `docs/UsersGuide.md` を作る。盤の選び方、色の組、操作、置き方の吸い付き、HUD のボタン
   （一手戻す・おまかせ・ヒント表示・やり直し・音・タイトルへ）、クリアと番号、記録の画面
   （一覧・完成形・達成度・1 件消す）、つづきから、デモ（速さ・探し方・次の解を探す）。
   README にあった説明を土台にし、**今のコード（`src/scenes/*.js`、`src/ui.js`、`src/config.js`）と
   合っているか確かめてから書く**。ボタンの文言・説明（ツールチップ）の文字列は `src/` から拾う。
3. `docs/developer.md` に次を足す。
   - README から移した「テスト」節
   - 構成の節: `docs/20260816-0538 ペントミノパズル Codebase 構造分析.md` から
     「3 層の分け方（Phaser に依存しない計算 / 全解のデータ / シーン）」「シーンの移り方の図」
     「registry のキー」を取り込む。**Demo シーンが図に無いなど古い箇所は今のコードに合わせる**
     （`src/main.js` のシーン登録、各シーンの `scene.start` を rg で見る）。
     ファイル表は developer.md に既にあるので写さない。§5（hoge の話）は捨てる。
     「完全」「徹底」など誇張した言い回しは使わない
   - 「記録の保存」節: `docs/storage.md` の §2〜§7 と §9 の設計判断を移す。
     §1（localStorage の一般的な説明）と §8（JS の書き方メモ）と「読む人の想定」は落とす。
     §1 の表のうち「オリジン単位」「使えないことがある（例外を投げる）」は設計の理由なので短く残す。
     キー・値の形・関数名が今の `src/storage.js` / `src/config.js` と合っているか確かめる
   - 冒頭の目次と「ファイル構成」の図に `docs/UsersGuide.md` を足す
4. 2 つのファイルを `git rm` で消す:
   `docs/20260816-0538 ペントミノパズル Codebase 構造分析.md`、`docs/storage.md`
5. `CLAUDE.md` のファイル表の `docs/developer.md` の行の説明を今の中身に合わせ、
   `docs/UsersGuide.md` の行を足す。`.claude/agents/docs.md` の受け持ち（description と
   「触ってよいファイル」）に `docs/UsersGuide.md` を足す。

## 保つもの
- developer.md の既存のアンカー（`#全解のデータ`、`#github-上の設定`、`#画面の用語`、
  `#サブエージェントの定義`）。CLAUDE.md・README からリンクされている。
  確認: `rg -n 'developer\.md#' --glob '!archives/**'`
- 書き方はユーザー全体の CLAUDE.md「日本語の書き方」に従う。造語を作らない

## 変えないもの
- `src/**`・`tests.html`・`tools/**`・`archives/**`・`TODO.md`
- commit しない

## 完了条件
- 上の 1〜5 が済み、`rg -n -e 'storage\.md' -e '構造分析' --glob '!archives/**'` が 0 件
- コードと合わなかった箇所（元の文書が古かったところ）を報告に列挙する

## 報告
`archives/agents/TODO-055/docs-report.md` に: 変えたファイル、移した・落とした内容、
元の文書とコードが食い違っていた箇所。返事は 5 行以内（終わったか・報告のパス・判断が要る点）。
