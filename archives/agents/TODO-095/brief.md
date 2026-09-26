# TODO-095 依頼（implementer）

## 目的
画面の縦横が変わったら、今のシーンを状態ごと作り直して新しい向きの配置にする（全画面）。
今は起動時に `PORTRAIT`（`src/config.js`）を 1 回だけ決め、`SCREEN`・`LAYOUTS`・`DEMO_LAYOUTS` と、
各シーンのモジュールのトップレベルの配置（`title.js` の `STACK`・`PREVIEW`・`STACK_BIAS`・`DEMO_BUTTON`、
`records.js` の `L`・`CONFIRM`、`clear.js` の `STACK_BIAS` など）がその値で固まっている。
洗い出しは `rg -n "SCREEN|LAYOUTS|PORTRAIT|portrait" src` で行い、漏れが無いことを報告に書く。

## 方針（管理者が決めた。変えるなら先に報告）
- 縦・横の 2 組を両方とも作っておき、**今の向きは registry に置く**（キーは `config.js` に定数で）。
  各シーン・`ui.js` の関数は、その向きの値を引く（`screenOf(scene)` のような関数を 1 つ用意するなど）。
  モジュールのトップレベルに書き換わる `let` を置かない、という規約（`CLAUDE.md`）を守る。
  `SCREEN` を書き換えて済ませない
- マス目のテクスチャ（`boot.js` が `LAYOUTS` の cell ごとに作る）は、縦・横の両方の大きさを起動時に作っておく
- 向きの変化は `window` の `resize`（または `matchMedia('(orientation: portrait)')`）で見て、
  `innerHeight > innerWidth` が変わったときだけ動く。**遅延は `setTimeout` を使わない**（規約）。
  ゲーム全体に 1 つだけ登録する（シーンに入るたびに足さない）。場所は `main.js` が妥当
- 変わったら `game.scale.setGameSize(w, h)`（内部解像度を 960×640 ⇄ 640×1136）にし、
  動いているシーンを、そのシーンが出す「今の状態」を渡して作り直す
- **ページの再読み込みで済ませない**（Undo の履歴・デモの探索の途中・開いているモーダルが消えるため）

## シーンごとに保つもの
- Title: 選んでいる盤・色（registry にあるので自然に保たれるはず）。動く盤は始め直してよい
- Game: 盤面・トレイのピースの位置と向き・経過時間・Undo の履歴・おまかせ／ヒント表示の状態と印・
  全解のデータの読み込み状態。**ドラッグ中のピースは元の位置へ戻す**。
  やり直し／タイトルへの確認を開いていたら、作り直したあとにも開き直す
- Clear（Game の上に重なる）: Game を作り直したあと、同じ内容で出し直す（記録の更新は二重にしない）
- Records: 見ている盤・頁・チェックした回・選んでいる回・消す／続けるの確認を開いていたらそれも
- Demo: 盤面・探し方・探索の途中（generator は data で渡せば続きから進められるはず）・一時停止の状態・速さなど、HUD の状態

## 保つもの（全体）
- 規約（`CLAUDE.md`）: `setTimeout` 禁止、`confirm()` 禁止、状態はシーンのプロパティ、色と数値は `config.js`、
  盤面は作り直して返す、JSDoc は「なぜ」
- 向きを変えなければ、今の見た目と挙動は 1 ピクセルも変えない
- `src/config.js` の `export const VERSION = 'dev';` の行はそのまま（公開のワークフローが文字列一致で探す）
- `tests.html` の既存のテスト。配置の計算を関数に変えたら、テストの呼び方を合わせる

## 着手前に測ること
Playwright で、`page.setViewportSize()` を横→縦→横と変えたとき、どのイベントが何回来るか、
`game.scale.setGameSize()` のあとに Canvas の拡縮（FIT）が追従するかを先に確かめ、報告に書く。

## 完了条件
- `node --check`、`tests.html` 全件通過。配置を向きごとに引く関数に、縦・横の両方で既存のテスト
  （スロットが収まる等）が効いていることを確かめる
- 各シーン（Title・Game・Clear・Records・Demo）で、横→縦→横と変えて、状態が保たれ、配置が
  新しい向きになることを Playwright で自分で 1 回ずつ見る
- `docs/developer.md`（構成・registry のキー）・`CLAUDE.md`（ファイル構成の表で説明が変わる行）・
  `docs/UsersGuide.md`（向きについて書いた所）を合わせる。利用者向けの文書に TODO 番号を書かない
- コミットはしない。報告は `archives/agents/TODO-095/implementer-report.md`（測った結果・変更点・
  洗い出しの結果・保てなかったもの）。返事は 5 行以内
