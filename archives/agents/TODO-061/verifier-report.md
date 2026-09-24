# TODO-061 verifier 報告

## 1. `node tools/gen-solutions.mjs --check`

終了コード 0。一致。

```
8×8: 全 520 解、代表形 65 件（4.7 秒）
  → src/data/8x8.js と一致した
6×10: 全 9356 解、代表形 2339 件（143.5 秒）
  → src/data/6x10.js と一致した
```

## 2. `tests.html`（Playwright headless Chromium、新しいコンテキスト）

333 件すべて通った。失敗 0、コンソールエラー 0。

## 3. デモの実物

`python3 -m http.server 8765` を立て、`window.game.scene.start('Demo')` で
デモ画面を起動し、`window.game.scene.getScene('Demo')` を取って
`toggleStrategy()` でランダムに、`speed = 'fastest'` にしたうえで、
`scene.advance()` を直接 1500 回ずつ呼んで進めた（HUD のクリックではなく
scene のメソッドを直接叩いたが、起動と探索は `demo.js` の実装をそのまま
使っている）。`solveStepsRandom()` の generator の `.next()` をラップし、
`advance()` が処理する手（`place`/`remove`/`solved`）を漏れなく記録した
（先読み分もラップ経由で拾えるので順序は保たれる）。

- 8×8: コンソールエラー 0、解に達した回数 1（`scene.solvedCount` と一致）、
  `tried`（scene 側の集計）64。
  place 760 件のうち forced（5 マスの穴埋め）12 件を除いた 748 件で、
  各 place の直前の盤面を `countCellMoves()` で数え直し、狭い所
  （`counts` の最小値のマス、同数なら全部）を求めて、その place が
  狭い所のいずれかを覆っていた割合は **260/748 = 34.8%**
- 6×10: コンソールエラー 0、解に達した回数 2（`scene.solvedCount` と一致）、
  `tried` 147。place 765 件のうち forced 14 件を除いた 751 件で、
  狭い所を覆った割合は **281/751 = 37.4%**

狭い所を覆う割合は 100% ではなく 3〜4 割程度だった。これは仕様どおりの
挙動（「覆えるピースが選ばれやすくなる」だけで、`DEMO.randomTightWeight = 4`
の重みでも覆えないピースが選ばれることは起こり得る。選んだピースが狭い所を
覆えないときはそのピースの手から一様に選ぶ）と読めるが、**この割合の
高低（4 割で「隙間に入るピースを探して選ぶように見える」に足りているか）は
値の良し悪しの判断であり、verifier の見なくてよい範囲（依頼書の「見なくて
よいもの」に明記）にあたるため判断しない**。

控え（`failed`）はデモからは見えないので無視した近似（依頼書の指示どおり）。
具体的には、`computeChoices()` で毎回すべての向き・全マスを再計算しており、
実際の `solveStepsRandom()` 内部が持つ `failedByBoard`（一度外した手を
同じ盤面で選び直さない控え）は反映していない。控えに入っている手だけが
「狭い所を覆う唯一の手」だったケースでは、近似側は覆えると判定するが
実際には選ばれない、という向きのずれが起こり得る（逆向き＝近似が過小評価
する方向のずれは起きない）。

## 4. JSDoc・文書の食い違い

- `src/config.js` の `DEMO.randomTightWeight` の JSDoc（狭い所を覆える手を
  持つピースに掛ける重み）は `src/logic.js` の実装（`pickWeighted` に渡す
  重み配列の `moves.length > 0 ? DEMO.randomTightWeight : 1`）と一致
- `src/logic.js` の `solveStepsRandom()` の JSDoc（狭い所を探し、覆える手を
  持つピースを選ばれやすくし、選んだピースが狭い所を覆えるなら置き方を
  狭い所を覆う手に絞る）は実装のとおり
- `docs/UsersGuide.md`・`docs/developer.md` の記述も同じ内容で一致。
  食い違いは見つからなかった

## 確かめられなかったこと・判断できないこと

- 狭い所を覆う割合（34.8%・37.4%）が「人が隙間を探して選ぶように見える」
  という狙いに対して十分かどうかは、値の良し悪しの判断にあたるため
  確かめていない（依頼書の「見なくてよいもの」）
- 控え（`failed`）を無視した近似によるずれの大きさ（実際の割合との差）は
  測っていない。控えを再現するには `solveStepsRandom()` 内部の
  `failedByBoard` を外から観測する手立てが無く、今回の依頼の範囲でも
  「無視してよい」とされているため見送った
