# TODO-071 implementer への依頼（2 人目: capture.mjs の吹き出し）

前の implementer（Sonnet 5）は週の利用上限で止まった。実装は済んでいる（`implementer-report.md`）。残りはキャプチャの吹き出しだけ。

## 問題

main が `node tools/capture.mjs` で撮り直した `docs/images/records.png` で:
- Ⓑ（チェック）とⒸ（全部選ぶ）の吹き出しが、チェックボックスと「全部選ぶ」の文字に重なって隠している
- 下の段の ①〜④ の丸が、ボタンのアイコン（◀・▶・ゴミ箱・ホーム）を丸ごと隠している

## やること

`tools/capture.mjs` の記録画面の吹き出しを、指す部品を隠さない位置に置き直す（ほかの画面の吹き出しの置き方に合わせる。
部品の外側・余白へ出して線で指す。下の段は、ボタンの下か上の余白へ出す。画面の中に余白が無ければ、ほかの画面と同じく上下の帯を空ける）。
番号と `docs/UsersGuide.md` の記録の節の対応は変えない。

## 確かめ方

撮り直して（`capture.mjs` の冒頭のコメントの手順。`python3 -m http.server 8765` は立っている）、`docs/images/records.png` を見て、
どの吹き出しも部品を隠していないこと。ほかの画像（`title.png` など）は変えない（撮り直しで変わったら報告）。
Playwright で localhost に届かないならサンドボックスを外してよい。

## 報告

`archives/agents/TODO-071/implementer2-report.md`。返事は 3 行以内。
