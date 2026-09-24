# TODO-063 verifier report

## 1. `node tools/gen-solutions.mjs --check`

終了。出力（`process.exit(1)` は「食い違う」のときだけ呼ばれるが、その文字列は出ていない → 終了コード 0 と判断）:

```
8×8: 全 520 解、代表形 65 件（6.4 秒）
  → src/data/8x8.js と一致した
6×10: 全 9356 解、代表形 2339 件（156.3 秒）
  → src/data/6x10.js と一致した
```

一致。

## 2. `tests.html`

`python3 -m http.server 8765` を立て、Playwright（npx の置き場から `chromium.launch()`）の新しいコンテキストで
`http://localhost:8765/tests.html` を開き、`#summary` の文字列と `console` の error を集めた。

```
SUMMARY: 333 件すべて通った
CONSOLE_ERRORS: []
```

一致（落ちた件数 0、コンソールエラー 0）。

## 3. デモの実物（ランダム・最速、8×8 / 6×10）

`window.game.scene.start('Demo')` を board/palette をレジストリへ入れてから起動し、
`toggleStrategy()` → `random`、`selectSpeed('fastest')` のあと、`update()` の待ち時間を介さず
`scene.advance()` を直接ループで呼んで手を進めた（上限 6000 手）。各手の種別は、
`tried` が増えたら `place`、`state` が `solved` に変わったら `solved`、それ以外は `remove` と判定
（generator の中身を直接覗かずに済むように、外から観測できる状態変化で判定した）。

### 8×8

```json
{
  "totalMoves": 895,
  "solvedAtMove": 895,
  "runLengthDist": { "1": 350, "2": 6, "5": 3, "6": 3, "7": 3, "8": 2, "9": 1 },
  "maxRun": 9,
  "waitViolations": 0,
  "tried": 453
}
```

### 6×10

```json
{
  "totalMoves": 205,
  "solvedAtMove": 205,
  "runLengthDist": { "1": 66, "2": 1, "3": 1, "4": 2, "5": 1, "6": 2 },
  "maxRun": 6,
  "waitViolations": 0,
  "tried": 108
}
```

両方とも上限 6000 手に達する前に解に到達した。コンソールエラーは両方とも 0 件。

`waitViolations` は「remove が連なる箇所（`types[i]==='remove' かつ types[i+1]==='remove'`）で、
`scene.waitScale` が 0 でなかった回数」。8×8・6×10 とも 0 件で、連なりの remove の間に待ちは
入っていない（`advance()` の先読みどおり。TODO-060）。

`runLengthDist` に「行き詰まりの外しと崩しの見分けは要らない」とのことなので、区別せず
そのまま連なりの長さの分布として載せた（依頼どおり、値の良し悪しは判断していない）。

再現に使ったスクリプト:
`/tmp/claude-649/-home-ytani-work-pentomino-puzzle/cca004d0-857c-4d9d-8a29-4fff99c43862/scratchpad/run_demo.mjs`
（セッション用の scratchpad。このリポジトリには置いていない）

## 4. JSDoc の食い違い

`rg -n "最後の 1 手|その場で外す手も" src/ docs/` は 0 件（古い言い回しは残っていない）。

`git diff` で見た `docs/UsersGuide.md`・`docs/developer.md`・`src/config.js`・`src/logic.js` の
JSDoc とコメントは、いずれも「詰まり（置ける手が尽きて戻る一続き）」「置いた直後のその場外しは
数えない」「`DEMO.randomCollapseAfter` 回で `DEMO.randomCollapseMoves` 手まとめて外す」という
説明で揃っており、食い違いは見当たらなかった。

## 確かめられなかったこと・判断できないこと

- `tests.html` の新規テスト（remove の連なり・崩しの位置を手元で再現するテスト）の強さは、
  依頼の指定どおり見ていない（tests・reviewer の担当のため）。
- 8×8 の実測で `runLengthDist` に長さ 3・4 の連なりが出ておらず、5 以上へ飛んでいる
  （`randomCollapseAfter=5` のとき、5 回目の行き詰まりで崩しが起きるため、その depth では
  3・4 回目の「単発の行き詰まり」自体は起きているはずだが、連なりの長さとしては 1 になる。
  今回の 1 回の乱数シードでの実測に限るため、これが仕様どおりの分布かどうかは判断しない
  （値の良し悪しは見なくてよいと指定されているため、ここでは実測結果を載せるのみ）。
