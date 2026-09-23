# TODO-049. screens の定義を、ブラウザが固まったときに備えた形に直す

|      | main | 担当 |
|------|------|------|
| 見込み | Opus 5.5 / effort medium | main（定義の編集）+ screens（Sonnet 5 / low。直した定義での試し撮り） |
| 実施 | Opus 5.5 / effort medium | main（定義の編集）+ screens（Sonnet 5 / low。直した定義での試し撮り） |

| 担当 | モデル | effort | output | cache_creation | 料金の割合 |
|------|--------|--------|--------|----------------|-----------|
| main | Opus 5.5 | medium | 4,611 | 21,502 | 89% |
| screens | Sonnet 5 | low | 276 | 37,648 | 11% |
| 合計 |  |  | 4,887 | 59,150 | 概算 $1.8 |

## きっかけ

TODO-046 で、screens が 2 回とも、画面を撮ったあとの最初のクリックで Playwright の
`mouse.click` が返らなくなり、約 1 時間止まった。タブを開き直すと直ったが、
固まったきっかけは切り分けられていない。今回はきっかけを探さず、固まっても早く気づいて
止まれるようにするだけにした。

## やったこと

- `.claude/agents/screens.md`
  - 手順に足した: 始める前にタブを開き直す（`browser_close` → `browser_navigate`）。
    クリックなどは `browser_run_code_unsafe` の中で時間の上限を付けて行い、同じ操作が
    2 回続けて返らなければ、やり直さずに報告する。説明（ツールチップ）を出すときは
    `page.mouse.move` を `{ steps: 3 }` で少しずつ動かす。ボタンのゲーム内の座標を画面の座標に直す式
  - 「見るところ」に、同じコードを通る操作は代表 1 つだけ試す、を 1 行で案内した
  - `description` の画像の置き場を、本文と同じ `~/tmp/playwright-mcp/` に直した
    （TODO-046 で main が `description` を写して `~/tmp/claude-img/` と依頼していた）
  - `tools` に `mcp__playwright__browser_close` を足した（無いとタブを開き直せない）
- `.claude/skills/screenshot/SKILL.md` の「操作は `browser_click` で試せる」を、
  時間の上限を付けて `browser_run_code_unsafe` で操作する形に直した

## 確かめたこと

- 利用者が Claude Code を再起動したあと、直した定義の screens で試し撮り
  （[報告](../agents/TODO-049/screens-report.md)）。タブの開き直し、844×390・390×844 の撮影、
  時間の上限付きのクリック（'ok' が返り、`boardKey` が 8x8 → 6x10 に変わった）、
  コンソールのエラー 0 件。ツール呼び出し 9 回ほど、1〜2 分で終わった
- 報告にあった「座標の変換式が定義に無い」を受けて、式を定義に足した

## 分担の振り返り

- **screens** は、定義どおりに最後まで動いたうえで、座標の変換式が定義に無く毎回組み立て直す必要があることを見つけた
- 見込みとの食い違いは無い
- 次に定義を直す項目も、直した定義の担当自身に小さな試しをさせる形でよい。
  再起動が要るので、試しの内容は `TODO.md` に書いておき、再起動のあとで文脈なしに再開できるようにする
