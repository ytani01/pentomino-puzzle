# TODO-035. CLAUDE.md の常駐分を減らす

## きっかけ

`/doctor` の結果（`DOCTOR.md`）から。`CLAUDE.md` は毎セッション必ず
読み込まれるので、そこに置く必要のないものを外して軽くしたい。

- **「### 画面を撮って確かめる」（約 843 トークン、`CLAUDE.md` 全体の約 27%）** は、
  見た目を確認するときにしか要らない手順。スキルにすれば、常駐するのは
  一覧に出る名前と説明（約 30 トークン）だけになり、本体は呼び出したときに読まれる
- **「プロジェクト概要」の前半**は `README.md` とほぼ同じ内容。ただし
  「新しいライブラリを追加しない」「画像・音声アセットを追加しない」は
  コードを読んでも分からない決めごとなので残す。
  「`file://` では動かない」も落とし穴なので残す
- **「公開（GitHub Pages）」は移さない。**
  「`logic.js` や `config.js` を触ったら全解データを作り直す」は
  コードを編集した瞬間に効いてほしい注意で、「push は利用者が行う」は
  安全のための禁止事項。スキルにすると、必要なときに読まれない恐れがある

削る前の文面は `DOCTOR.md` に引用してある（節ごとのトークン概算は
`DOCTOR.md` の check 3 / check 4）。

## やったこと

- 「プロジェクト概要」の前半（`README.md` と重なる説明）を、
  `README.md` への参照に置き換えた
- 「### 画面を撮って確かめる」の中身を `.claude/skills/screenshot/SKILL.md`
  へ移し、`CLAUDE.md` には 1 行の案内だけ残した
- スキルの frontmatter（`name` / `description`）を書き、
  `CLAUDE.md` のファイル構成の表にもスキルを足した

`.claude/skills/screenshot/SKILL.md` の内容は、TODO-034 で仕上げた
CDP 方式から Playwright MCP 方式への置き換えの手順そのもの。

## テスト

コードは触っていないので `tests.html` には足していない。

移したあと、実際に `screenshot` スキル経由で画面を撮れるか確かめた。

- `Skill` ツールで `screenshot` を呼び出し、`SKILL.md` の内容が
  そのとおり読み込まれることを確認
- 手順どおり `browser_resize`（568x320）→ `browser_navigate` →
  `browser_take_screenshot` でタイトル画面を撮影できた
- `browser_evaluate` で `Game` シーンへ進めてから撮影し、
  盤とトレイが表示されたゲーム本編の画面も撮れた
- `browser_console_messages` でエラー 0 件を確認（警告 4 件のみ、
  従来から出ているもので今回の変更とは無関係）

スキルへ移したあとも手順が壊れていないことを確認できた。
