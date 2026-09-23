# TODO-039 screens 報告

対象: config.js の NEON.glow (0.28/0.5) と blink.minAlpha (0.2) を上げた版。

## 撮った画像（/home/ytani/tmp/playwright-mcp/ 配下）

### タイトル
- title-960x640.png（960x640）: ガラス・12色・ネオンの3つが横並び、はみ出し・重なりなし
- title-960x640-neon-selected.png: ネオンを押すと選択枠がネオンへ移る
- title-640x1136-neon.png（640x1136）: 縦画面でも3つ並んで問題なし

### 本編（ネオン）
- game-960x640-8x8-neon-start.png / -placed.png: 8×8横画面、トレイ12個が蛍光色で判別可、外周が光る
- game-960x640-8x8-neon-corner-zoom3x.png（旧値）: 凹角に欠けなし
- game-960x640-6x10-neon.png: 6×10横画面、盤・トレイとも枠内
- game-640x1136-8x8-neon-start.png / -placed.png: 8×8縦画面、盤・トレイとも枠内

### 明滅（初回・旧値）
- alpha実測（0.3秒間隔×8）: [0.3, 0.436, 0.698, 0.963, 0.98, 0.779, 0.44, 0.3]
- game-640x1136-neon-glow-low.png（alpha≈0.32）/ -high.png（alpha≈0.91）: 静止画2枚での見た目の差はわずかで判然としなかった

### Tweenの後始末
- 本編→タイトル: getTweens().length = 1 → 0
- scene.restart() 後: getTweens().length = 1（二重化していない）

### 記録画面
- clear-640x1136-neon.png、records-640x1136-neon.png: 完成形が地暗く外周が蛍光色

### ガラス・12色
- game-640x1136-glass.png、game-640x1136-colorful.png: `piece.glow` は null、崩れなし

### tests.html
- tests-960x640.png: 「235件すべて通った」
- コンソールエラーは favicon.ico の404のみ（アプリ無関係）。警告はWebGLのGPU stallのみ

## 今回の指示（NEON.glow 0.28/0.5、blink.minAlpha 0.2 へ上げた後）で撮り直した3点

### (a) 縦画面 640x1136、8×8ネオン、おまかせで6個配置、alpha低時・高時の2枚
- game-640x1136-neon-glow-low-v2.png（piece.glow.alpha ≈ 0.25）
- game-640x1136-neon-glow-high-v2.png（piece.glow.alpha ≈ 0.97）
- 見た目の差: **今回ははっきり見て分かる**。低alpha側は各ピースの発光が控えめで内側の暗い塗りが目立ち、高alpha側は外周のにじみが明るく太く見え、特にオレンジ（I）・紫（+）で差が顕著。旧値のときより差が明確になった

### (b) 横画面 960x640、凹の角の3倍ズーム
- game-960x640-8x8-neon-placed-v2.png（元の配置）
- game-960x640-8x8-neon-corner-zoom3x-v2.png（3倍ズーム）
- 水色L字・ピンクF字・紫（青紫）ピースの凹角を含む範囲を確認。**欠けなし、隣のピースへのはみ出しなし**

### (c) トレイのピースがにじみで潰れていないか
- game-960x640-8x8-neon-placed-v2.png の右側トレイ6個（橙I・緑N・緑T・青緑Z・紫+・マゼンタI）で確認。**にじみが強くなった後も、どのピースも形の折れ線・角がはっきり見分けられ、潰れていない**

## 判断が要る点
- 明滅の見た目差は、旧値では静止画2枚で判然としなかったが、今回の調整後は明確に差が見える。これで意図どおりと考えられる
- 実害は未確認（境界線上の判断はしていない）
