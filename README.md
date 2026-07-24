# agent-skills

Claude Code向けの [Agent Skills](https://agentskills.io/home) をまとめて管理するリポジトリ。
各スキルは直下の専用ディレクトリに `SKILL.md` を持ち、それぞれ独立してインストール・利用できる。

## スキル一覧

| スキル | 説明 |
| --- | --- |
| [explain-html](explain-html/) | 会話やコードの内容を、チームメンバー共有用の自己完結した1枚のHTMLにまとめる |

各スキルの詳細は、リンク先ディレクトリのREADME・SKILL.mdを参照。

## インストール

使いたいスキルのディレクトリを、対象プロジェクトの `.claude/skills/` 配下にコピーする(個人用途なら `~/.claude/skills/` 配下でも可)。

例: explain-html を使う場合

```
.claude/skills/explain-html/SKILL.md
.claude/skills/explain-html/assets/template.html
.claude/skills/explain-html/references/components.md
```

## 新しいスキルを追加する

1. リポジトリ直下に `<skill-name>/` ディレクトリを作成し `SKILL.md` を置く(`name` フィールドはディレクトリ名と一致させる)
2. 必要に応じて `assets/`(テンプレート等)、`references/`(詳細ドキュメント)を追加する
3. SKILL.mdだけで伝わらない人間向けの説明(使い方の例、スクリーンショットなど)があれば、そのディレクトリに個別のREADME.mdを追加する
4. このREADMEの「スキル一覧」に1行追加する
