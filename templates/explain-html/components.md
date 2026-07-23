# 部品カタログ

`template.html` の CSS に対応する HTML スニペット集。ここにある形以外を作らない。
新しい見た目が必要になったら、まず既存部品の組み合わせで表現できないか考える。

---

## 使い分けの早見表

| 伝えたいこと | 使う部品 |
| --- | --- |
| 順番に起きること | `.pipeline` |
| 分岐・条件・しきい値 | SVG図 |
| 並列に存在する概念（3〜4個） | `.grid` + `.card` |
| 項目ごとの値・条件の一覧 | `.tw` + `table` |
| 2軸の組み合わせ | `table` + `.lv0`〜`.lv3` |
| 補足・理由・注意 | `.note` |
| 実際の入出力・コード | `.sample` / `pre` |
| 状態やラベルの名前 | `.badge` |

---

## 見出し

```html
<h2 id="s3"><span class="num">3</span>章タイトル</h2>

<!-- 章に属性を付けたいとき。右端にピルが出る -->
<h2 id="s4"><span class="num">4</span>章タイトル<span class="tag">読むだけ</span></h2>
<h2 id="s5"><span class="num">5</span>章タイトル<span class="tag tag--on">ここが本題</span></h2>

<h3 id="s3-1">3-1. 小見出し</h3>
<h4>さらに細かい区切り</h4>
```

`tag` は章の性質を一目で分ける用。「計算のみ / AIを使う」「変更あり / 変更なし」「必読 / 参考」など、
**2値の対比**にだけ使う。3種類以上の tag を作らない。

## 章グループの帯

```html
<p class="band">ここから実装対象</p>
<p class="band">ここまで</p>
```

目次のグループと対応させる。連続する章を「ひとかたまり」として見せたいときだけ。

---

## 導入文

```html
<p class="lede">この章で何が分かるかを1〜2文で書く。</p>
```

各章の直後に置く。長い章ほど効く。

---

## note（補足・理由・注意）

```html
<div class="note">
  <p class="note__title">なぜこうするのか</p>
  <p>理由を書く。</p>
</div>

<div class="note note--warn">
  <p class="note__title">ここを間違えやすい</p>
  <p>落とし穴・非互換・危険な操作。</p>
</div>

<div class="note note--plain">
  <p class="note__title">補足</p>
  <p>本筋ではないが知っておくとよいこと。</p>
</div>
```

1章に2個までを目安にする。多いと本文と note の区別が消える。

---

## badge（ラベル・状態名）

```html
<span class="badge">最重要</span>
<span class="badge badge--ghost">通常</span>
<span class="badge badge--gray">対象外</span>
<span class="badge badge--warn">要注意</span>
```

文中でシステム上のラベル名を指すときに使う。強調 (`<strong>`) とは役割が違う。

---

## pipeline（順番に起きること）

```html
<div class="pipeline">
  <div class="pipe-step">
    <div class="pipe-num pipe-num--gray">IN</div>
    <div class="pipe-body">
      <h4>入力</h4>
      <p>何が来るか。</p>
    </div>
  </div>
  <div class="pipe-arrow">▼</div>
  <div class="pipe-step">
    <div class="pipe-num">1</div>
    <div class="pipe-body">
      <h4>やること<span class="badge badge--ghost" style="margin-left:8px;">属性</span></h4>
      <p>1〜2文で。</p>
      <p class="tagline">→ 3章</p>
    </div>
  </div>
  <div class="pipe-arrow">▼</div>
  <div class="pipe-step">
    <div class="pipe-num pipe-num--gray">OUT</div>
    <div class="pipe-body">
      <h4>出力</h4>
      <p>何が出るか。</p>
    </div>
  </div>
</div>
```

`.tagline` に飛び先の章を書くと、全体像の章から各章への導線になる。

---

## card グリッド（並列の概念）

```html
<div class="grid grid--2">
  <div class="card">
    <p class="card__label">前提 1</p>
    <p class="card__title">見出し</p>
    <p>説明。</p>
    <p class="card__values">補足値 / 数字</p>
  </div>
</div>
```

`grid--2` は2列（説明が長いとき）、`grid--4` は3〜4列（1行の短文のとき）。
中身の分量が揃わないなら card ではなく表にする。

---

## 表

```html
<div class="tw">
<table>
  <caption>表の説明（任意）</caption>
  <thead><tr><th>項目</th><th class="num">値</th><th>意味</th></tr></thead>
  <tbody>
    <tr><td><span class="badge">A</span></td><td class="num">≦ 6.1</td><td>説明</td></tr>
  </tbody>
</table>
</div>
```

- `.tw` で必ず包む。横スクロールと角丸枠が付く。
- 数値列には `class="num"` を付ける（等幅数字＋折り返し禁止）。
- 行見出しは `<tbody><tr><th>` にすると左端がグレーになる。

### 2軸マトリクス

```html
<div class="tw">
<table>
  <thead><tr><th></th><th>上昇</th><th>横ばい</th><th>低下</th></tr></thead>
  <tbody>
    <tr><th>良好</th><td class="lv0">観察</td><td class="lv0">観察</td><td class="lv1">観察</td></tr>
    <tr><th>並</th>  <td class="lv0">観察</td><td class="lv1">観察</td><td class="lv2">対話</td></tr>
    <tr><th>要支援</th><td class="lv2">対話</td><td class="lv2">対話</td><td class="lv3">対話＋共有</td></tr>
  </tbody>
</table>
</div>
```

`lv0`→`lv3` で青が濃くなる。強さ・優先度・危険度を色で表す唯一の手段。
特定セルに注目させるときは `class="lv2 cell-focus"`（赤い枠）。

---

## sample（入出力の実例）

```html
<div class="sample">
  <p class="sample__head">出力例 ― 管理者向け</p>
  <p>実際に出る文面をそのまま貼る。<span class="mark">注目箇所</span>はマークする。</p>
</div>

<div class="sample sample--ng">
  <p class="sample__head">NG例</p>
  <p>やってはいけない例。<span class="mark--ng">問題箇所</span>を赤くマークする。</p>
</div>
```

OK例とNG例は必ず並べる。片方だけだと基準が伝わらない。

---

## コード

```html
<pre><code>public function handle(<span class="k">Request</span> $request): void
{
    <span class="c">// 説明コメント</span>
<span class="hl">    $this->doSomething();</span>
}</code></pre>
```

- `.k` = 型名・キーワード（青）、`.c` = コメント（グレー斜体）、`.hl` = 注目行（背景青）
- **全文シンタックスハイライトはしない。** 説明したい箇所だけ着色する。
- 20行を超えるコードは貼らない。抜粋して `// …` で省略する。
- 文中の短い識別子は `<code>` を使う。

---

## ファイルツリー（任意）

```html
<div class="tw">
<table class="tree-tbl">
  <tr class="root"><td>app/Foo/</td><td>ルートの説明</td></tr>
  <tr class="dir"><td>├─ Bar/</td><td>ディレクトリの役割</td></tr>
  <tr><td>│  └─ Baz.php</td><td>ファイルの役割</td></tr>
</table>
</div>
```

罫線文字は `├─ │ └─` を使い、インデントは半角スペース。
不要なら `template.html` の `.tree-tbl` ブロックごと削除してよい。

---

# SVG 作図の約束事

## 共通ルール

- `<figure>` + `<figcaption>` + `<div class="fig-body">` で必ず包む
- `viewBox="0 0 720 H"` 固定幅720。H は内容に応じて 150〜400
- `role="img"` と `aria-label="図の内容を1文で"` を必ず付ける
- 幅が要るなら `class="svg-scroll"`（最小600pxで横スクロール）
- 色は下の6色だけ。`var()` は SVG 内で効かないので生の16進で書く

| 用途 | 色 |
| --- | --- |
| 強調・主役・線 | `#0017C1` |
| 中間 | `#9DB7F9` |
| 弱い背景 | `#E8F1FE` |
| 罫線・枠 | `#C6C6C6` |
| 文字（主） | `#1A1A1C` |
| 文字（副） | `#767676` / `#4B4B4B` |
| 警告・NG | `#CE0000` |

- 文字サイズ: 見出し14 / 本文12 / 注記11。これ以外を使わない
- 濃い背景（`#0017C1`）の上の文字は `#fff`、副文字は `#C5D7FB`

## レシピ1：しきい値の帯

数直線を色で区切る。境界値がどちらに含まれるかを注記で明示する。

```html
<figure>
  <figcaption>図N：区切り（0〜10）</figcaption>
  <div class="fig-body">
  <svg viewBox="0 0 720 170" role="img" aria-label="6.1以下がA、6.1超8.4未満がB、8.4以上がC" class="svg-scroll">
    <rect x="40" y="46" width="252" height="46" fill="#0017C1"/>
    <rect x="292" y="46" width="184" height="46" fill="#9DB7F9"/>
    <rect x="476" y="46" width="204" height="46" fill="#E8F1FE"/>
    <rect x="40" y="46" width="640" height="46" fill="none" stroke="#C6C6C6"/>

    <text x="166" y="68" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">A</text>
    <text x="166" y="85" text-anchor="middle" font-size="11" fill="#C5D7FB">補足</text>
    <text x="384" y="68" text-anchor="middle" font-size="14" font-weight="700" fill="#1A1A1C">B</text>
    <text x="578" y="68" text-anchor="middle" font-size="14" font-weight="700" fill="#1A1A1C">C</text>

    <line x1="40" y1="104" x2="680" y2="104" stroke="#767676"/>
    <g font-size="12" fill="#4B4B4B" font-family="ui-monospace,monospace">
      <line x1="40" y1="104" x2="40" y2="112" stroke="#767676"/><text x="40" y="128" text-anchor="middle">0</text>
      <line x1="292" y1="104" x2="292" y2="116" stroke="#0017C1" stroke-width="2"/>
      <text x="292" y="132" text-anchor="middle" font-weight="700" fill="#0017C1">6.1</text>
      <line x1="680" y1="104" x2="680" y2="112" stroke="#767676"/><text x="680" y="128" text-anchor="middle">10</text>
    </g>

    <text x="40" y="30" font-size="12" fill="#4B4B4B">左上に軸の意味</text>
    <text x="292" y="152" text-anchor="middle" font-size="11" fill="#767676">6.1ちょうどはA</text>
  </svg>
  </div>
</figure>
```

## レシピ2：縦フロー

工程の順番と、飛ばすと何が起きるかを右側に添える。

```html
<svg viewBox="0 0 720 300" role="img" aria-label="AからB、Cの順に処理する" class="svg-scroll">
  <defs>
    <marker id="arN" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#0017C1"/>
    </marker>
  </defs>
  <g font-size="12">
    <rect x="150" y="14" width="330" height="40" rx="6" fill="#E8E8E8" stroke="#C6C6C6"/>
    <text x="315" y="39" text-anchor="middle" fill="#1A1A1C">入力</text>
    <path d="M315,58 L315,74" stroke="#0017C1" stroke-width="1.5" marker-end="url(#arN)"/>

    <rect x="150" y="78" width="330" height="46" rx="6" fill="#0017C1"/>
    <text x="167" y="98" font-weight="700" fill="#fff">1. 主役の工程</text>
    <text x="167" y="116" font-size="11" fill="#C5D7FB">補足</text>
    <path d="M315,128 L315,144" stroke="#0017C1" stroke-width="1.5" marker-end="url(#arN)"/>

    <rect x="150" y="148" width="330" height="46" rx="6" fill="#fff" stroke="#C6C6C6"/>
    <text x="167" y="168" font-weight="700" fill="#1A1A1C">2. 次の工程</text>
    <text x="167" y="186" font-size="11" fill="#767676">補足</text>
  </g>
  <text x="500" y="104" font-size="11" fill="#CE0000" font-weight="700">これを飛ばすと</text>
  <text x="500" y="122" font-size="11" fill="#CE0000">こうなる</text>
</svg>
```

`marker` の `id` は**図ごとに別名**にする（`ar1`, `ar2`…）。同名だと後の図に引きずられる。

## レシピ3：2ケース比較

同じ見た目でも結果が変わることを示す。左右に並べ、中央に区切り線。

```html
<svg viewBox="0 0 720 320" role="img" aria-label="ケースAは該当、ケースBは非該当" class="svg-scroll">
  <line x1="360" y1="10" x2="360" y2="310" stroke="#DCDCDC" stroke-dasharray="4 4"/>
  <text x="20" y="26" font-size="13" font-weight="700" fill="#1A1A1C">ケースA</text>
  <text x="380" y="26" font-size="13" font-weight="700" fill="#1A1A1C">ケースB</text>
  <!-- 棒グラフなど。1本だけ #0017C1、他は #C5D7FB にして注目箇所を作る -->
  <rect x="20" y="270" width="320" height="30" rx="4" fill="#E8F1FE" stroke="#0017C1"/>
  <text x="180" y="290" text-anchor="middle" font-size="12" font-weight="700" fill="#00118F">→ 該当</text>
  <rect x="380" y="270" width="320" height="30" rx="4" fill="#F2F2F2" stroke="#C6C6C6"/>
  <text x="540" y="290" text-anchor="middle" font-size="12" font-weight="700" fill="#767676">→ 非該当</text>
</svg>
```

## レシピ4：対応表の引き方

行と列が交わるマスを示す。交点を `#0017C1` で塗り、そこから引き出し線を出す。

```html
<svg viewBox="0 0 720 250" role="img" aria-label="行と列の交点から結果を引く" class="svg-scroll">
  <rect x="120" y="60" width="120" height="34" fill="#F2F2F2" stroke="#C6C6C6"/>
  <rect x="240" y="60" width="120" height="34" fill="#0017C1" stroke="#0017C1"/>
  <text x="300" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">結果</text>
  <path d="M360,77 L440,77" stroke="#0017C1" stroke-width="1.5" marker-end="url(#arN)"/>
</svg>
```

---

# 書き方のルール

- **記号を名前にしない。** `Z`, `x`, `L1` のような略号は、その場で意味の分かる日本語に置き換える。
  数式が必要なら図の中で1回だけ示し、本文では言葉で書く。
- **数字を入れる。** 「しきい値を超えたら」ではなく「6.1以下なら」。抽象的な説明より具体値1つ。
- **境界値の扱いを必ず書く。** 「6.1ちょうどはどちらか」を書いていない図は不完全。
- **1章に図は1〜2枚。** それ以上必要なら章を割る。
- **段落は4文まで。** 5文以上になるなら文の切れ目で `<br>` を入れるか、段落を割る。
- **人名を使わない。** 「田中さん」ではなく「ある社員」「ケースA」。
- **前提知識を確認してから書く。** 読み手が知っていることの説明は削る。
