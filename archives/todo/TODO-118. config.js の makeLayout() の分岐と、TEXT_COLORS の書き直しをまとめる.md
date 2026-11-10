# TODO-118. config.js の makeLayout() の分岐と、TEXT_COLORS の書き直しをまとめる

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / low） |
| 実施 | Opus 5.5 / effort medium | implementer（Sonnet 5.5 / medium）+ reviewer（Opus 5.5 / high）+ verifier（Haiku 5.5 / low） |

| 担当 | モデル | effort | input | output | cache_creation | cache_read | 割合 |
|------|--------|--------|-------|--------|----------------|------------|------|
| main | Opus 5.5 | medium | 71 | 11,566 | 64,469 | 1,975,652 | 70% |
| impl-118（implementer） | Sonnet 5.5 | medium | 22 | 4,978 | 42,020 | 361,967 | 14% |
| rev-118（reviewer） | Opus 5.5 | high | 16 | 3,886 | 36,170 | 261,751 | 10% |
| ver-118（verifier） | Haiku 5.5 | low | 12 | 3,729 | 32,864 | 147,499 | 6% |
| 合計 |  |  | 121 | 24,159 | 175,523 | 2,746,869 | 計 2,946,672 |

- TODO-117 と並行して進めた（利用者の指示）。main の行は TODO-117・118 で同じ時間帯を共有した値で、両方のファイルに同じ数を書いた
- 集計は `token-usage.py TODO-118 --since '2026-11-11 04:12:00'`。同じ時間帯に動いた他の項目の担当の行は除いた

## きっかけ

全ファイルを読み直したリファクタリングの洗い出しで、`makeLayout()` に `portrait` の三項演算子が散らばり、`TEXT_COLORS` が `COLORS` の値を文字列で書き直していた。

## やったこと

- `makeLayout()`: ボードの枠とトレイの枠の位置・大きさを縦横の `if` 1 つで決め、`trayPanel` を幅か高さ 0 で作って書き直す形をやめた。三項演算子は 5 か所消した（項目には 6 か所とあったが、`trayLength` はトレイを詰める前に要るので `if` に入らない）
- 残した三項演算子 3 か所（`helpLines`・`trayLength`・スロットの座標）は、枠の位置・大きさではないので項目の範囲外
- `cssColor()` を足し、`TEXT_COLORS` を `COLORS` から作る。`onBright` を地の色から作る理由をコメントに書いた（レビューの検討）

## 確かめたこと

- 変更前（8068479）と変更後で `LAYOUTS`・`DEMO_LAYOUTS`・`TEXT_COLORS` の JSON が一致（implementer と verifier がそれぞれ。`archives/agents/TODO-118/dump-config.mjs`）
- レビュー: 要修正 0 件。参照の共有・評価順の変化も無い

## 分担の振り返り

- implementer は値の一致を JSON で確かめた。reviewer は `onBright` の作り方に理由が無いことと、項目の「6 か所」との食い違いを見つけた。verifier は食い違いを見つけなかった（一致を独立に確かめた）
- 見込みどおりの編成で、食い違いは無い
- 次に同じ規模（1 ファイル・値の一致で確かめられる）なら同じ編成でよい。verifier は implementer と同じスクリプトを流すだけなので、旧版を `git show` で取り出す手順を依頼に書いておけば Haiku / low で足りる
