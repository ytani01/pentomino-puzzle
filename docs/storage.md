# 記録の保存の仕組み（`src/storage.js`）

このゲームは、クリア記録・見つけた解・遊びかけの盤面をブラウザに保存する。
その置き場所が **localStorage**、扱いをまとめたのが `src/storage.js` である。

読む人の想定は「C や Python での開発経験はあるが、JavaScript は詳しくない」人。
JavaScript 特有の書き方には、そのつど注釈を付けた。

---

## 1. localStorage とは何か

ブラウザが持つ、**文字列から文字列への永続的な連想配列**（Python の `dict`
に近い）。サーバも DB も要らず、JavaScript から 3 つの関数で触る。

```javascript
window.localStorage.setItem('key', 'value');   // 書く
window.localStorage.getItem('key');            // 読む（無ければ null）
window.localStorage.removeItem('key');         // 消す
```

C や Python から来た人が押さえておくべき性質は次のとおり。

| 性質 | 中身 |
|---|---|
| **値は文字列だけ** | 数値も配列もそのままは入らない。数値は `String(n)`、構造は `JSON.stringify()` で文字列にしてから入れる |
| **同期 API** | ファイル I/O のようにブロックする。`await` は要らない代わりに、大量のデータを毎フレーム書くと画面が固まる |
| **オリジン単位** | `http://localhost:8765` と公開先（GitHub Pages）では別の入れ物。手元で作った記録は公開版へは引き継がれない |
| **容量は 5MB 程度** | 実装依存。このゲームの使用量はせいぜい十数 KB なので余裕がある |
| **消えることがある** | 利用者がブラウザのデータを消せば消える。永続ストレージであって、保証されたストレージではない |
| **そもそも使えないことがある** | プライベートウィンドウ、サードパーティ Cookie の制限などで**アクセス自体が例外を投げる**。これが後述の「全部 try で包む」理由 |

Python でいえば、`open()` が失敗しうるファイルに `json.dump()` している、
くらいの感覚で捉えるとよい。しかも中身は**利用者がいつでも手で書き換えられる**
（開発者ツールから編集できる）。つまり **localStorage の中身は信用できない入力**
である。この 2 点——「壊れる」「嘘が入る」——が `storage.js` の設計をほぼ決めている。

---

## 2. 何を、どのキーに保存しているか

キーは `src/config.js` の `BOARDS` に盤ごとに定義してある（`storage.js` は
キー文字列を直接書かない）。盤は 8×8 と 6×10 の 2 つ。

| 用途 | キー（8×8 の場合） | 値の形 |
|---|---|---|
| 最短時間 | `pentomino-puzzle/best-ms` | ミリ秒の数値を文字列にしたもの |
| クリア履歴 | `pentomino-puzzle/history/v2/8x8` | JSON の配列（最大 50 件、新しい順） |
| 見つけた解の番号 | `pentomino-puzzle/found/8x8` | JSON の数値配列（昇順） |
| おまかせで出した解の番号 | `pentomino-puzzle/auto/8x8` | JSON の数値配列（昇順） |
| 遊びかけの盤面 | `pentomino-puzzle/progress/8x8` | JSON のオブジェクト |
| 色の組 | `pentomino-puzzle/palette` | 組の名前（盤に依らないので 1 つだけ） |

6×10 は末尾が `/6x10` になる。ただし**最短時間の 8×8 だけ接尾辞が無い**——
盤が 1 種類しかなかった頃の記録をそのまま引き継ぐためで、後から足したキーは
すべて接尾辞付きで揃えてある。

`history` に入っている **`v2` はスキーマのバージョン**である。詳しくは §6。

### なぜ 4 つに分かれているのか

「見つけた解の番号」（`found`）と履歴が別なのがポイント。履歴は一覧表示のために
50 件で打ち切るが、達成度（「2339 解中 37 解」）はそこでは数えられない。
番号だけなら 2339 件全部貯めても 12KB 程度なので、別立てにしてある。

`auto`（おまかせが導いた解）をさらに分けてあるのは、**達成度の分子に混ぜないため**。
自力で見つけた数という意味が崩れてしまう。おまかせが毎回同じ解を出さないように
候補から外す、という用途専用である。

---

## 3. 値の形

### 履歴 1 件

```javascript
{ at: 1755300000000, ms: 184300, no: 12, a: true }
```

- `at` … クリアした時刻（エポックミリ秒。`Date.now()` の値）
- `ms` … その回の所要時間（ミリ秒）
- `no` … 何番の解か（解の通し番号。1 から数える）
- `a` … おまかせを使った回だけ `true`
- `h` … ヒント表示を使った回だけ `true`

**`a` / `h` は使ったときだけ鍵ごと持たせる**（`false` は書かない）。自力で解いた
回が記録の大半なので、そちらを昔と同じ形のままにしておけば「印が無い＝自力」で
判定でき、古い記録との互換を考えずに済む。

盤の縦横は 1 件には持たせない。保存先のキーが盤ごとに分かれているので、
どの盤の記録かはキーで決まる。

### 遊びかけ

```javascript
{ ms: 42000, usedAuto: false, usedHint: false, pieces: [ /* 12 個 */ ] }
```

`pieces` の 1 個は `{ name, cells, location, row, col }`。`location` は
`'tray'`（未使用）か `'board'`（盤上）。

ここで効いている設計判断が 2 つある。

- **盤面そのもの（60 マスの配列）は保存しない。** ピースの位置から組み直せるし、
  両方持つと手で書き換えられたときに「盤面とピースが食い違う」状態をどう扱うかを
  決めなければならなくなる。持たなければその問題自体が存在しない
- **Undo の履歴は保存しない。** 最大 60 手ぶんの盤面になり、保存量も検証も
  一気に膨らむ。「続きを始めた直後だけ戻せない」との引き換え

---

## 4. 読み書きの構え——2 つの原則

### 原則 1: 失敗しても遊べる

localStorage への操作は**すべて `try` で包み、例外を握りつぶす**。

```javascript
export function loadBest(boardKey) {
  try {
    const raw = window.localStorage.getItem(keyOf(boardKey));
    if (raw === null) return null;
    const ms = Number(raw);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch (error) {
    return null;                 // 記録が無いのと同じに見せる
  }
}
```

呼ぶ側（シーン）は「記録が無い」と「読めなかった」を区別しない。
プライベートウィンドウでもゲームは普通に遊べて、記録が残らないだけになる。

書く側も同じ方針だが、もう一段ある。**保存に失敗しても、保存できたはずの値を
戻り値で返す。**

```javascript
export function saveBest(boardKey, ms) {
  const previous = loadBest(boardKey);
  if (previous !== null && previous <= ms) return { best: previous, updated: false };
  try {
    window.localStorage.setItem(keyOf(boardKey), String(Math.round(ms)));
  } catch (error) {
    // 保存できなくても、その回の結果は表示できる。
  }
  return { best: ms, updated: true };
}
```

こうしておくと、クリア画面は「保存できたか」を気にせず戻り値をそのまま表示できる。
その場の見た目と、次回起動時の記録は別問題、と割り切っている。

### 原則 2: 読んだ値は 1 件ずつ検証する

localStorage の中身は外部入力なので、`JSON.parse()` が通っただけでは信用しない。
型・範囲・整合性をすべて見て、**通らなかったものは黙って捨てる**。
例外にはしない——利用者から見れば「その記録が無い」だけで十分だからである。

捨てる粒度は、データの性質で分けてある。

- **履歴は 1 件ずつ捨てる**（`sanitizeHistory`）。件どうしは独立しているので、
  壊れた 1 件を落として残りは残す
- **遊びかけは 1 か所でも変なら丸ごと捨てる**（`sanitizeProgress`）。12 個で
  1 つの盤面なので、一部だけ通すと**遊べない盤面**（同じマスに 2 個、存在しない
  向き）ができてしまう

遊びかけの検証はかなり踏み込んでいて、次の 4 つを見る。

1. 12 種がそれぞれ 1 個ずつあること
2. 各ピースの `cells` が、そのピースの正当な向きのどれかであること
   （`orientations()` と照合）
3. 盤に置いてある分を順に置いていって、重ならないこと（`canPlace()`）
4. 12 個とも盤に載っている状態ではないこと——それは完成形であって「続き」が無い

つまり **保存データをそのまま復元せず、ルール上ありうる盤面かを再計算して確かめる**。
「クライアントから来たデータは検証してから使う」という、サーバ側でおなじみの作法と
同じことを、保存データに対してやっている。

検証を通った件は**組み立て直して返す**点にも意味がある。

```javascript
const item = { at: entry.at, ms: entry.ms, no: entry.no };
if (entry.a === true) item.a = true;
```

元のオブジェクトをそのまま通さず必要な鍵だけ拾い直すので、知らない鍵や
`a: 1` のような中途半端な値が保存へ書き戻されることがない。

---

## 5. 検証を「純関数」として切り出してある理由

`sanitizeHistory` / `sanitizeFound` / `sanitizeProgress` / `migrateHistory` は
localStorage に一切触らない。値を受け取って値を返すだけの関数（純関数）で、
localStorage を触るのは `loadXxx` / `saveXxx` の薄い外側だけ、という構造になっている。

```javascript
export function loadHistory(boardKey, solutions = null) {
  const board = boardOf(boardKey);
  try {
    const entries = sanitizeHistory(window.localStorage.getItem(board.historyKey), board);
    return migrateHistory(entries, solutions);
  } catch (error) {
    return [];
  }
}
```

分けてある理由は**テストのため**。`tests.html` から、壊れた値を実際に書き込んで
読み直す、といった手順を踏まずに検証だけを確かめられる。
これはこのリポジトリ全体の方針（Phaser に依存しない計算は切り出す）と同じ考え方で、
テストフレームワークもモックライブラリも導入せずに済ませるための構造でもある。

`sanitize*` は**生の文字列でもパース済みの値でも受け取る**ようになっている。
テストから組み立てた配列を、わざわざ JSON 文字列へ直してから渡す手間を省くため。

```javascript
let parsed = value;
if (typeof value === 'string') {
  try { parsed = JSON.parse(value); } catch (error) { return []; }
}
```

---

## 6. スキーマが変わったときの扱い

保存データは長く残るので、形式変更への対応が要る。このリポジトリでは
**2 通りを使い分けている**。

### 読み替える（マイグレーション）

以前の履歴は、完成形を 60 文字の文字列（`cells`）で持っていた。全解をデータとして
持つようになってからは**解の番号さえあれば完成形を引き直せる**ので、番号だけを持つ形に変えた。

古い記録を捨てないよう、読むときに番号へ読み替える。

```javascript
export function migrateHistory(entries, solutions) {
  if (!solutions) return entries;
  const migrated = [];
  for (const entry of entries) {
    if (Number.isInteger(entry.no) && entry.no > 0) { migrated.push(entry); continue; }
    const no = solutionNumber(solutions, entry.cells);
    if (no === null) continue;              // 解に無い盤面。捨てる
    const { cells, ...rest } = entry;       // cells だけ外して残りは持ち越す
    migrated.push({ ...rest, no });
  }
  return migrated;
}
```

読み替えた結果は、次に `addHistory()` で書き戻すときに保存され、古い形が徐々に
消えていく。読み替えに解のデータが必要なので、**データが届く前でも
日時と時間だけは表示できる**よう、`solutions` が無ければ何もしない作りにしてある。

### キーを変える（読み捨て）

履歴の印の文字を `h` / `c` から `a` / `h` へ付け替えたときは、読み替えではなく
**キーそのものを変えた**（`.../history/` → `.../history/v2/`）。

理由は、`h` の**指すものが入れ替わった**ため（前はおまかせ、今はヒント表示）。
古い記録をそのまま読むと印の意味がずれるが、値を見ても新旧を区別できない。
キーを変えれば前の版が書いた件は読まれなくなる（データは残るが使われない）。

**読み替えられるなら読み替え、意味の区別が付かないならキーを変える**。
この 2 つの使い分けが、実質的なバージョニング戦略になっている。

---

## 7. いつ書き込まれるか

| タイミング | 呼ぶもの |
|---|---|
| 盤の状態が変わるたび／シーンを離れるとき | `saveProgress()`（1 個も置いていなければ代わりに `clearProgress()`） |
| おまかせで解を出したとき | `addAuto()` |
| クリアしたとき | `saveBest()`（自力のときだけ）・`addHistory()`・`addFound()` |
| 解き切ったとき・やり直したとき | `clearProgress()` |
| 記録を 1 件消したとき | `removeHistory()` + `removeFound()` + `removeAuto()` |

遊びかけは**盤が変わるたびに書いている**。localStorage は同期 API なので毎フレーム
書けば重くなるが、書くのはピースを動かした瞬間だけで、量も 12 個ぶんと小さい。

最後の行に注意。履歴を 1 件消すときは、`found` と `auto` からも同じ番号を外す。
そうしないと**一覧からは消えたのに達成度には残る**という、辻褄の合わない状態ができる。
分けて持つデータには、まとめて更新すべき組がある、ということ。

なお、消す件は**解の番号で指定する**。履歴は同じ番号を 2 件持たないので番号で
1 件に定まり、「一覧の何行目」のような**表示位置に依存しない**。ページ送りの
状態と削除処理を切り離すためである。

---

## 8. JavaScript の書き方メモ（C / Python 経験者向け）

`storage.js` に出てくる、JavaScript 特有の書き方を拾っておく。

**`===` を使う。** `==` は型変換を伴う比較で `0 == '0'` が真になる。
このリポジトリでは常に `===`（型も一致）を使う。
`entry.a === true` と書いているのは、`a: 1` のような値を通さないため
（`if (entry.a)` だと通ってしまう）。

**`null` と `undefined` は別物。** `getItem()` は鍵が無ければ `null` を返し、
オブジェクトに無い鍵へのアクセスは `undefined` になる。Python の `None` が
2 種類あると思えばよい。

**数値の検証は `Number.isFinite` / `Number.isInteger`。** JavaScript の数値は
すべて倍精度浮動小数点で、整数型が無い。`NaN`（数値でない値。Python の
`float('nan')` に相当）や `Infinity` が混ざりうるので、`typeof x === 'number'`
だけでは足りない。

**JSON との変換は `JSON.stringify()` / `JSON.parse()`。** Python の
`json.dumps()` / `json.loads()` と同じ。`parse` は不正な文字列で例外を投げる。

**スプレッド構文 `...`。** Python の `*` / `**` に近い。

```javascript
const list = [entry, ...existing];        // 先頭に足した新しい配列（元は変えない）
const { cells, ...rest } = entry;         // cells を取り出し、残りを rest へ
migrated.push({ ...rest, no });           // rest を展開し no を足したオブジェクト
```

`{ ...rest, no }` の `no` は `no: no` の省略記法。

**デフォルト引数 `solutions = null`。** Python と同じだが、JavaScript の
デフォルト値は**呼び出しのたびに評価される**ので、Python の「可変デフォルト引数」の
落とし穴は無い。

**`filter` / `map` / `find` / `findIndex`。** Python のリスト内包表記や
`next(...)` に相当する。返るのは常に**新しい配列**で、元は変わらない。

**`Set` で重複を除く。** `[...seen].sort((a, b) => a - b)` で配列に戻して昇順に
並べている。`sort()` は**引数無しだと文字列として比較する**（`10 < 9` になる）ので、
数値を並べるときは比較関数が要る。

**`export function`。** ES Modules の書き方で、Python の「モジュール内の
公開関数」に相当する。ファイルの外から使うものだけに `export` を付ける
（`removeNumber()` に付いていないのは、`storage.js` の中だけで使う共通部分だから）。

---

## 9. 制限と、承知のうえの割り切り

- **端末をまたいで共有されない。** サーバを持たない設計なので、PC の記録と
  スマホの記録は別物になる
- **オリジンが変われば別。** 手元の `localhost` と公開先の記録は繋がらない
- **利用者が書き換えられる。** 防ぐのではなく、**壊れた値を安全に捨てる**方向で
  対処している（§4）
- **同一ページの複数タブで同時に遊ぶと、後から書いた側が勝つ。** 排他制御はしていない
- **`storage` イベントを使っていない。** 他タブでの変更を検知して追随する仕組みは
  入れていない

いずれも「ブラウザで完結する、1 人用のパズル」という前提から来ている。
記録が消えても遊べなくならないことを最優先にした結果である。

---

## 関連ファイル

- `src/storage.js` — この文書の対象。読み書きと検証
- `src/config.js` — `BOARDS`（キーの定義）と `HISTORY_LIMIT`
- `src/logic.js` — `canPlace()` / `orientations()` など、遊びかけの検証が使う計算
- `src/solutions.js` — `solutionNumber()`。古い履歴を番号へ読み替えるのに使う
- `tests.html` — `sanitize*` / `migrateHistory` のテスト
