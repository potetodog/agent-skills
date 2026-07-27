# qa-sheet

現在のブランチとデフォルトブランチ(main/master等)のgit diffを解析し、QA項目書をTSV形式で自動生成するスキル。

[Agent Skills](https://agentskills.io/home) 形式のスキルで、`disable-model-invocation: true` を設定しているため、Claudeが自動判断で実行することはなく、`/qa-sheet` と明示的に呼び出したときだけ動く。手順・制約の詳細は [SKILL.md](SKILL.md) を参照。

## できること

- 現在のブランチとデフォルトブランチの差分を読み、正常系・条件分岐網羅・デグレ・エッジケース・レイアウトの観点でQA項目を洗い出す
- Googleスプレッドシートにそのまま貼り付けられるTSVファイルを`~/Downloads/`に出力する(macOSではクリップボードにも自動コピー)
- 洗い出しの型を揃えることで、レビュアーやQA担当者ごとに観点が属人化するのを防ぐ

UIに関係ない変更ではレイアウト観点を出さない、テスト差分のみなら無理に項目を作らないなど、diffの中身を見て要否を判断する。

## 使い方

```
/qa-sheet
```

比較対象ブランチはリポジトリのデフォルトブランチ(origin/HEADが指すブランチ)を自動検出する。`develop`など別ブランチと比較したい場合は引数で指定する。

```
/qa-sheet develop
```

## 構成

```
SKILL.md                        スキル本体(QA観点の定義・出力フォーマット)
scripts/detect_base_branch.sh   デフォルトブランチの自動検出
scripts/get_diff.sh             merge-baseからの差分取得
```
