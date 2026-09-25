# TODO-081 測り直し

2026-09-25、Node（`archives/agents/TODO-081/measure-dead.mjs`、各盤 20 回の中央値）で測定。
スクリプトは変更していない。

| 盤 | median places | wrong moves | placed on dead board | max run | worst places |
|---|---|---|---|---|---|
| 8x8（直す前） | 1480 | 52 | 1400 | 127 | 4974 |
| 8x8（今） | 150 | 25 | 97 | 8 | 790 |
| 6x10（直す前） | 704 | 39 | 638 | 89 | 2413 |
| 6x10（今） | 200 | 39 | 144 | 8 | 527 |

max run（解の無い盤面で続けて置いた手の最長）が 8 以下か: 8x8・6x10 とも 8 以下（両盤とも中央値 8）。
