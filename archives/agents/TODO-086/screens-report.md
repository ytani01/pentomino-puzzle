# TODO-086 確認報告（画面）

条件: 960x640 の 1 条件。localStorage を空にした新しいコンテキスト。

## 1. 初回起動（タイトル）

- `window.game.registry.get('palette')` = `'neon'`（一致）
- スクリーンショット: `/home/ytani/tmp/playwright-mcp/todo086-title-neon.png`
- 色の選択肢の 3 つ目（赤・緑・青の発光色）が選択枠で囲まれ、ネオンが選ばれて見える（一致）
- コンソール: 0 errors、4 warnings（すべて WebGL の GPU stall パフォーマンス警告。palette 関連ではない）

## 2. デモ（`?demo=random&board=8x8`、新しいコンテキスト）

- `window.game.registry.get('palette')` = `'neon'`（一致）
- 4 秒待ってから撮影。スクリーンショット: `/home/ytani/tmp/playwright-mcp/todo086-demo-neon.png`
- 盤のピース（緑・シアン・マゼンタ・黄）がネオンの発光色（縁が明るい縁取り）で表示されている（一致）
- コンソール: 0 errors

## 3. 保存済みの色を優先（`localStorage.setItem('pentomino-puzzle/palette', 'glass')` → reload）

- `window.game.registry.get('palette')` = `'glass'`（一致。保存した色が既定のネオンより優先される）

## 4. `docs/images/demo.gif`

`ffprobe`:
- width=480, height=320
- avg_frame_rate=10/1
- nb_frames=100
- duration=10.000000

先頭（フレーム 0）・中央（フレーム 50）・末尾（フレーム 99）を `ffmpeg` で抜いて確認:
- 3 枚とも不透明、欠けなし
- 盤・トレイのピースはネオンの発光色（縁取りが光る配色）
- ピースが増えていく（「試した手」が 2 → 4 → 13 と進み、盤上のピース数も増加）
- タイトル画面・注記・カーソルの混入なし
