# TODO-095. 画面の縦横の変化に追従する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort high | implementer（Opus 5.5 / medium）+ reviewer（Opus 5.5 / high）+ screens（Sonnet 5 / low） |
| 実施 | Opus 5.5 / effort high | implementer（Opus 5.5 / medium、worktree → 本体の木）+ reviewer（Opus 5.5 / high、2 回）+ screens（Sonnet 5 / low） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| implementer | Opus 5.5 | medium | 8,619 | 583,694 | 53% |
| main | Opus 5.5 | high | 15,042 | 271,492 | 27% |
| reviewer | Opus 5.5 | high | 6,095 | 269,634 | 15% |
| screens | Sonnet 5 | low | 2,266 | 77,370 | 5% |
| 合計 |  |  | 32,022 | 1,202,190 | 概算 $23.9 |

- 集計は `--since '2026-09-26 05:50:15'`（TODO-096 の決着から）。値は決着のコミットの直前まで
- implementer の出だし（着手前の計測と実装の前半）は TODO-096 の範囲に入っている（TODO-096 の表の implementer の行）
- implementer・reviewer は定義のモデルが sonnet。設計が込み入る実装と挙動のレビューなので Opus 5.5 に上書きした
- 途中で API のセッション上限に当たり、レビュー後の修正が止まった（上限が戻ってから同じ担当に続きを頼んだ）

## きっかけ

画面の向きを起動時に 1 回だけ決め、`SCREEN` / `LAYOUTS` や各シーンの配置をモジュールの
定数で持っていた（TODO-011 で「組み直さず `Scale.FIT` に任せる」と決めていた）。
スマホを回すと、前の向きの配置のまま小さく映った。

## やったこと

- **向きごとの組**（`src/config.js`）: `PORTRAIT`・`SCREEN` をやめ、`SCREENS`・
  `LAYOUTS[向き][盤]`・`DEMO_LAYOUTS[向き][盤]` の縦・横 2 組を作る。今の向きは registry
  （`ORIENTATION_REGISTRY_KEY`）に置き、`orientationOf(scene)`・`screenOf(scene)` で引く。
  各シーン（タイトル・クリア・記録）のモジュールの配置も向きごとの組にした。
  `config.js` はトップレベルで `window` を読まなくなったので、Node から `src/` を読むための
  `tools/window-shim.mjs` を消した
- **向きの変化**（`src/main.js`）: `resize` を 1 つだけ登録し、`innerHeight > innerWidth` が
  変わったときだけ、`getParentBounds()` → `setGameSize()`（960×640 ⇄ 640×1136）→ 動いている
  シーンの `relayout()` を呼ぶ。着手前の計測で、`resize` の中でそのまま `setGameSize()` を
  呼ぶと縦 → 横で小さく映ると分かったので、先に親要素の大きさを読み直す。
  シーンの予約（`start`・`restart`）が残っている間は `poststep` で待ち、最後の向きで 1 回だけ
  作り直す（予約の列は Phaser が公開していないので `game.scene._queue` を読む。Phaser 3.90.0 に
  固定しているため）
- **保つもの**: 本編は盤面・トレイのピースの位置と向き・経過時間・Undo の履歴・おまかせ／
  ヒントの状態と印・全解のデータ（控える項目は 1 か所の一覧）。ドラッグ中のピースは元へ戻す。
  やり直し／タイトルへの確認は開き直す。クリア表示は同じ内容で出し直し、記録は二重に
  更新せず、ファンファーレも鳴らし直さない。記録画面は盤・チェック・選んでいる回・確認。
  デモは探索の途中（generator）・先読み・速さ・探し方・数。タイトルは盤・色（動く盤は始め直す）
- **記録画面の頁**: 1 頁の行数が横 7・縦 8 と違うので、選んでいる回（無ければ頁の先頭の回）が
  載る頁に合わせる。行き来すると頁がずれることがある（reviewer も妥当と見た）
- その他: マス目のテクスチャを縦・横の両方の大きさで起動時に焼く。`CLEAR_DELAY_MS` を
  `config.js` へ。`tests.html` のスロットのテストを画面が実際に引く向きごとの組で回し、
  向きごとの組の寸法のテストを足した（456 件）
- 文書: `docs/developer.md`（画面の向きが変わったときの節、registry のキー、画面の用語）、
  `docs/UsersGuide.md`（回すと組み直して続く）、`CLAUDE.md`（ファイル構成の表）、
  `.claude/agents/measure.md`（shim の記述）

## 確かめたこと

- implementer: 着手前に `resize` / `matchMedia` の来方と `FIT` の追従を測った。向きを変えない
  ときは、変更前の版と画面上の全オブジェクトの型・座標・大きさ・文字・depth などを
  JSON で突き合わせ、12 組すべて一致。`tests.html` 456 件、`gen-solutions --check`（shim 無し）一致
- reviewer（[reviewer-report.md](../agents/TODO-095/reviewer-report.md)）: 1 回目は要修正 1
  （shim のコメントと measure.md）、検討 4。うち「シーンの予約が処理される前に向きがまた変わると、
  シーンが 2 つ動き、本編の履歴と盤面が消える」を同じ tick の偽の `resize` で再現した。
  すべて直させ、2 回目で要修正 0。予約の待ち合わせは、ループを止めた間に 3 回向きが変わる
  場合も含めて測り直し、シーンは 1 つだけ動き状態が保たれた
- screens（[screens-report.md](../agents/TODO-095/screens-report.md)）: 開いたあとに横 → 縦 → 横と
  変え、タイトル・本編・確認の表示・クリア表示（記録は 1 件だけ増える）・記録・デモの 6 つで、
  状態と配置、コンソールのエラー 0 件を確かめた
- main: 取り込んだあと、`VERSION` の行が残っていること、`tools/stamp-version.mjs` が通ること
  （58 か所）を見た。デモの画像でトレイのピースが重なって見えたので、向きの前後で
  動いていないピースが本来の位置にあるかを数値で見た。ずれは向きを変える前にも同じ頻度で
  1 個出ており、動いている途中を撮っただけだった

## 残ること

- 作り直しは、シーンの `create()` が例外で止まったときだけ始まらないまま待ち続ける
  （reviewer の再レビュー。実害は未確認）
- 状態を控えてから作り直すまでの 1 フレームにドラッグを離すと、その手が元に戻る筋がある
  （修正前からある経路。実害は未確認）
- `archives/` に残る古い計測スクリプト 7 本は `tools/window-shim.mjs` を import しているので、
  そのままでは動かない（archives は記録なので直さない）
- Phaser を上げるときは、`src/main.js` の `game.scene._queue` の読み方を見直す

## 分担の振り返り

- implementer は着手前の計測で、`resize` の中の `setGameSize()` が縦 → 横で追従しないことを
  見つけ、実装の前に直し方を決められた。reviewer は、予約が重なる間合いで状態が消える経路を
  偽の `resize` で再現した。これは screens の縦横の切り替えでは出ない間合いで、reviewer が
  いなければ残っていた
- screens は 6 つの場面で食い違いを見つけなかった。依頼に「デモの一時停止」と書いたのは
  main の誤り（デモに一時停止は無い）
- 見込みと食い違ったのは、TODO-094 の決着を待たずに始めるための worktree と、API の
  セッション上限による中断。費用の半分は implementer（1 回目の実装と、レビュー後の修正で
  文脈を読み直した分）
- 次に同じ規模の項目をやるなら、同じ組み方でよい。reviewer の指摘が込み入った分岐に
  及んだときは、今回と同じく同じ reviewer に修正分だけを再レビューさせる（文脈を持っているので安い）
