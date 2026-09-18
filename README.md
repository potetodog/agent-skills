# agent-skills

[Agent Skills](https://agentskills.io/home) をまとめて管理するリポジトリ。
各スキルは直下の専用ディレクトリに `SKILL.md` を持ち、それぞれ独立してインストール・利用できる。

## スキル一覧

| スキル                              | 説明                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [create-testcase](create-testcase/) | 仕様からデシジョンテーブル・値表・状態遷移表でテストケースを洗い出し、承認を得てからテストを実装する |
| [explain-html](explain-html/)       | 会話やコードの内容を、チームメンバー共有用の自己完結した1枚のHTMLにまとめる                          |

各スキルの詳細は、リンク先ディレクトリのREADME・SKILL.mdを参照。

## インストール

### npx で入れる(推奨)

[skills](https://github.com/vercel-labs/skills) CLIを使うと、ファイルを手でコピーせずインストールできる。

```bash
# プロジェクトに入れる(そのプロジェクトだけで使う)
npx skills add potetodog/agent-skills -a claude-code -s create-testcase

# ルート ~/.claude に入れる(全プロジェクトで使う)
npx skills add potetodog/agent-skills -a claude-code -s create-testcase -g

# 収録スキルを事前に確認したいとき
npx skills add potetodog/agent-skills --list
```

`-a` にはClaude Code以外のエージェントも指定できる。Cursorの場合は`cursor`を指定する。

```bash
# Cursorのプロジェクトに入れる
npx skills add potetodog/agent-skills -a cursor -s create-testcase

# Cursorのグローバル(~/.cursor/skills)に入れる
npx skills add potetodog/agent-skills -a cursor -s create-testcase -g
```

`-s` を省略すると収録されている全スキルが対象になる。更新は `npx skills update create-testcase`、削除は `npx skills remove create-testcase` でできる。

### 手動でコピーする

使いたいスキルのディレクトリを、対象プロジェクトのスキルディレクトリ配下にコピーする。Claude Codeなら `.claude/skills/`(個人用途なら `~/.claude/skills/`)、Cursorなら `.agents/skills/`(個人用途なら `~/.cursor/skills/`)。

例: create-testcase を使う場合

```
.claude/skills/create-testcase/SKILL.md   # Claude Code
.agents/skills/create-testcase/SKILL.md   # Cursor
```

## 新しいスキルを追加する

1. リポジトリ直下に `<skill-name>/` ディレクトリを作成し `SKILL.md` を置く(`name` フィールドはディレクトリ名と一致させる)
2. 必要に応じて `assets/`(テンプレート等)、`references/`(詳細ドキュメント)を追加する
3. SKILL.mdだけで伝わらない人間向けの説明(使い方の例、スクリーンショットなど)があれば、そのディレクトリに個別のREADME.mdを追加する
4. このREADMEの「スキル一覧」に1行追加する
