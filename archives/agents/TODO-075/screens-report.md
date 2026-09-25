# TODO-075 画面確認報告

## 確認結果

- デモを開いたときの既定の探し方: `window.game.scene.getScene('Demo').strategy` は `"random"`（1280x720・640x360 とも）
- コンソール: エラー 0 件。警告は GPU ドライバの性能通知（`GL_CLOSE_PATH_NV ... GPU stall due to ReadPixels`）のみで、コードとは無関係
- アイコンのはみ出し・重なり: 4 枚すべてで無し。ボタンの枠内に収まっている
- depth（枝分かれする木）と random（交差・輪のある線）は、1280x720・640x360 のどちらでも見分けられる。random 側は 640x360 でも線の交差と節が判別できる

## 画像

| 画面サイズ | 探し方 | パス |
|---|---|---|
| 1280x720 | random（既定） | /home/ytani/tmp/playwright-mcp/demo-1280x720-strategy-random.png |
| 1280x720 | depth | /home/ytani/tmp/playwright-mcp/demo-1280x720-strategy-depth.png |
| 640x360 | random（既定） | /home/ytani/tmp/playwright-mcp/demo-640x360-strategy-random.png |
| 640x360 | depth | /home/ytani/tmp/playwright-mcp/demo-640x360-strategy-depth.png |
