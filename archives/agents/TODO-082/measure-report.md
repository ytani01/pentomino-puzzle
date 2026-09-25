# TODO-082 測定結果

## 実行条件
- コマンド: `node archives/agents/TODO-081/measure-dead.mjs`
- 実行日: 2026-09-26

## 生の出力
```
8x8 median places 146 wrong moves 24 placed on dead board 96 max run 8 worst places 1653 worst deadPlaces 1275
6x10 median places 154 wrong moves 22 placed on dead board 104 max run 8 worst places 470 worst deadPlaces 367
```

## 比較表（前回との併記）

| 盤 | 指標 | 今回 | 前回（TODO-081 決着） |
|---|---|---|---|
| 8x8 | median places | 146 | 150 |
| 8x8 | wrong moves | 24 | 25 |
| 8x8 | placed on dead board | 96 | 97 |
| 8x8 | max run | 8 | 8 |
| 8x8 | worst places | 1653 | 790 |
| 6x10 | median places | 154 | 200 |
| 6x10 | wrong moves | 22 | 39 |
| 6x10 | placed on dead board | 104 | 144 |
| 6x10 | max run | 8 | 8 |
| 6x10 | worst places | 470 | 527 |

## 注記
乱数シード無しで実行しているため値は揺れます。良し悪しの判断はしていません。
