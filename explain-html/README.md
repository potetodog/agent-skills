# explain-html

会話の内容やコード・ドキュメントを、チームメンバーへの共有に使える**自己完結した1枚のHTML**として出力するスキル。

[Agent Skills](https://agentskills.io/home) 形式のスキルで、`disable-model-invocation: true` を設定しているため、Claudeが自動判断で実行することはなく、`/explain-html` と明示的に呼び出したときだけ動く。手順・制約の詳細は [SKILL.md](SKILL.md) を参照。

## できること

- この会話でまとまった検討結果を共有用HTMLにする
- ソースコードの処理内容を、実装を追わなくても分かる形にまとめる
- 仕様・設計を、認識をそろえるための資料として配る

出力されるHTMLは外部リソース(CDN・Webフォント・画像URL)に依存せず、CSSも図(インラインSVG)も1ファイルに収まる。

## 使い方

```
/explain-html [説明したい対象]
```

- 引数を省略するとこの会話の内容が対象になる
- ファイルパスやディレクトリ(例: `app/Services/Foo`、`docs/bar/*.md`)を指定するとそれを読んで説明する
- 機能名や仕組みを日本語で書くと、該当するコードを探した上で説明する

### 例

```
/explain-html
```
直前までの会話でまとまった検討結果を、そのままHTMLにする。

```
/explain-html app/Services/PaymentService
```
指定したファイルの処理内容を、実装を追わなくても分かる形にまとめる。

```
/explain-html docs/api/*.md
```
複数のドキュメントをまとめて読み込み、1つのHTMLに整理する。

```
/explain-html 会員登録の仕組み
```
該当しそうなコードをリポジトリから探し、処理の流れを図解付きで説明する。

## 構成

```
SKILL.md                 スキル本体(手順・制約)
assets/template.html     出力HTMLの骨格・CSS
references/components.md 部品カタログ・SVG作図の約束事
```
