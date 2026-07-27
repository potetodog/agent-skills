#!/bin/bash
# 比較対象のデフォルトブランチ（main/master/develop等）を検出して標準出力に1行で返す
set -euo pipefail

# 1. ローカルに origin/HEAD の参照があればそれを使う（高速・オフラインで動く）
ref="$(git symbolic-ref -q refs/remotes/origin/HEAD 2>/dev/null || true)"
if [ -n "$ref" ]; then
  basename "$ref"
  exit 0
fi

# 2. リモートに問い合わせて origin/HEAD を解決する
branch="$(git remote show origin 2>/dev/null | sed -n '/HEAD branch/s/.*: //p')"
if [ -n "$branch" ]; then
  echo "$branch"
  exit 0
fi

# 3. よくある名前を順に確認するフォールバック
for candidate in main master develop trunk; do
  if git show-ref --verify --quiet "refs/remotes/origin/$candidate" || git show-ref --verify --quiet "refs/heads/$candidate"; then
    echo "$candidate"
    exit 0
  fi
done

echo "main"
