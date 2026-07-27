#!/bin/bash
# 現在のブランチと比較対象ブランチの差分を取得する。
# 引数で比較対象ブランチを指定できる（省略時は detect_base_branch.sh で自動検出）。
#
# 出力:
#   - 標準出力: base/current/merge-baseの情報、変更ファイル一覧（status付き）、差分全文を書き出したファイルのパス
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

BASE="${1:-}"
if [ -z "$BASE" ]; then
  BASE="$("$SCRIPT_DIR/detect_base_branch.sh")"
fi

CURRENT="$(git rev-parse --abbrev-ref HEAD)"

# origin/<base> があればそちらを優先（ローカルbaseが古い可能性があるため）
if git show-ref --verify --quiet "refs/remotes/origin/$BASE"; then
  BASE_REF="origin/$BASE"
else
  BASE_REF="$BASE"
fi

MERGE_BASE="$(git merge-base "$BASE_REF" HEAD)"

echo "# base_branch: $BASE"
echo "# base_ref: $BASE_REF"
echo "# current_branch: $CURRENT"
echo "# merge_base: $MERGE_BASE"
echo ""
echo "## 変更ファイル一覧 (status: A=追加 M=変更 D=削除 R=リネーム)"
git diff --name-status "$MERGE_BASE" HEAD

DIFF_FILE="$(mktemp -t qa-sheet-diff)"
git diff "$MERGE_BASE" HEAD > "$DIFF_FILE"
echo ""
echo "## 差分全文の保存先"
echo "$DIFF_FILE"
