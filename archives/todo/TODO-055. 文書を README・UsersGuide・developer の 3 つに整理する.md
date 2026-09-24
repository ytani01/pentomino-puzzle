# TODO-055. 文書を README・UsersGuide・developer の 3 つに整理する

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort 記載なし | docs（Sonnet 5 / medium。書く）+ reviewer（Sonnet 5 / high。重複と食い違い）+ verifier（Sonnet 5 / medium。コードと突き合わせ） |
| 実施 | Opus 5.5 / effort 記載なし | docs（Sonnet 5 / medium）+ reviewer（Sonnet 5 / high）+ verifier（Sonnet 5 / medium） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | 記載なし | 6,740 | 19,946 | 32% |
| docs | Sonnet 5 | medium | 13,050 | 116,986 | 33% |
| reviewer | Sonnet 5 | high | 5,048 | 83,625 | 16% |
| verifier | Sonnet 5 | medium | 3,434 | 68,478 | 18% |
| 合計 |  |  | 28,272 | 289,035 | 概算 $3.1 |

- モデルの上書きはしていない。effort は各定義ファイル（`.claude/agents/docs.md`、`~/.claude/agents/reviewer.md`・`verifier.md`）の値
- main の effort はセッションの設定で、記録に残らないため「記載なし」

## きっかけ

利用者から、文書を 3 つに整理する依頼。README は概要と特徴のアピール、UsersGuide は遊び方の詳細、
developer.md は開発者向けの技術説明にし、`docs/storage.md` と
`docs/20260816-0538 ペントミノパズル Codebase 構造分析.md` は中身を精査して developer.md へ移して消す。

決めたこと（2026-09-24）: UsersGuide は `docs/` に置く。storage.md の localStorage の一般的な説明（§1）と
JavaScript の書き方メモ（§8）は落とす。README の「テスト」節は developer.md へ移す。

## やったこと

- `README.md`：1 行の説明、公開版の URL、特徴の箇条書き、ローカルで開く手順、UsersGuide と developer.md へのリンク、ライセンスに絞った
- `docs/UsersGuide.md`（新規）：盤と色を選ぶ／操作／HUD のボタン／クリアと番号／つづきから／記録の画面／デモ。ボタンの説明の文言はコードから拾った
- `docs/developer.md`：「構成」（3 層の分け方、シーンの移り方の図、registry のキー）、「テスト」、「記録の保存」の節を足した。目次とファイル構成の図に UsersGuide を足した
- 移す元の古い箇所を直した：構造分析のシーンの図に Demo が無く、Clear → Records の矢印の向きが逆だった。色の組を 2 つとしていたが `neon` を含めて 3 つ。storage.md はコードと一致していた
- 2 ファイルを削除
- `CLAUDE.md` のファイル表、`.claude/agents/docs.md` の受け持ちに UsersGuide を足した

## 確かめたこと

- reviewer：UsersGuide の「残りのマス数」が誤り（実際はトレイに残るピースの数）、README の要約に「構成」が無い、
  `sanitize*` が生の文字列も受け取る理由の書き漏れ、の 3 件。main が直した
- verifier：ボタンの文言・数・シーンの図・registry のキー・保存のキーと書き込むタイミングをコードと突き合わせて食い違い無し。
  README の手順でサーバを立て、`/`・`/tests.html`・`/src/main.js` が 200。リンクとアンカーも一致
- `.claude/agents/docs.md` の差分は main が読んで確認した（受け持ちの列挙に 1 つ足しただけ）

## 残ること

- `.claude/agents/docs.md` を直したので、新しい受け持ちが効くのは Claude Code の再起動後

## 分担の振り返り

- docs は移す元の古い箇所 2 件（シーンの図、色の組の数）を見つけた。reviewer は事実の誤り 1 件と書き漏れ 2 件を見つけた。verifier は食い違いを見つけなかった
- 見込みどおりの編成で動いた。料金は docs が最大（移す元とコードを両方読むため）
- 次に同じ規模の文書整理をするなら：reviewer の指摘 1 件目（HUD の「残り」）は事実の突き合わせで、verifier の仕事だった。
  reviewer の依頼から「事実の照合」を外していたのに見つけたので、reviewer と verifier を 1 つ（Sonnet / high）にまとめても
  品質は落ちなかった見込み。削れるのは verifier の約 $0.6
