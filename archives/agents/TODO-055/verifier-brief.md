# TODO-055 verifier への依頼

## 目的
書き直した文書の記述が今のコードと合っているかを確かめる。reviewer の指摘は反映済み
（`reviewer-report.md`）。

## 対象
`README.md`、`docs/UsersGuide.md`（新規）、`docs/developer.md` の新しい節（「構成」「テスト」
「記録の保存」）。差分は `git diff HEAD -- README.md docs/developer.md`。

## 確かめ方
1. 事実の突き合わせ（`rg` でコードを引く。画面は操作しない）:
   - UsersGuide のボタン名・説明の文言 → `src/scenes/game.js`・`src/scenes/demo.js`・`src/scenes/records.js`・`src/scenes/title.js` の文字列
   - 数（65 / 2339、520 / 9356、ボタンの数、履歴の上限、10 秒）→ `src/config.js`・`src/data/*.js`
   - シーンの移り方の図 → `src/main.js` のシーン登録と `rg -n "scene\.start\(" src`
   - registry のキー → `src/config.js`・`src/solutions.js`
   - 記録の保存: キー・値の形・関数名・書き込むタイミングの表 → `src/storage.js`・`src/config.js`、
     呼ぶ側は `rg -n -e saveProgress -e clearProgress -e addAuto -e addHistory -e addFound -e saveBest -e removeHistory src/scenes`
2. 手順の再現: README の手順どおり `python3 -m http.server 8765`（リポジトリのトップ、バックグラウンド）を起こし、
   `curl --max-time 5 -s -o /dev/null -w '%{http_code}'` で `/`・`/tests.html`・`/src/main.js` が 200 を返すことを測る。
   終わったらサーバの PID を `pgrep -f 'http.server 8765'` で確かめてその PID だけ kill する（pkill は使わない）
3. リンク: 文書内の相対リンク先ファイルが存在し、`#アンカー` が見出しに一致するか

## 見なくてよいもの
- 文章の良し悪し・役割の分け方（reviewer が済ませた）
- `archives/`・`TODO.md`
- 画面のスクリーンショット

## やらないこと
- ファイルを直さない。境界線上の判断は報告だけ（「実害は未確認」と添える）

## 報告
`archives/agents/TODO-055/verifier-report.md`。一致したものは 1 行、食い違いは「文書のファイル:行・
文書の記述・コードの実際（ファイル:行）」。手順の再現は測った HTTP コードを載せる。返事は 5 行以内。
