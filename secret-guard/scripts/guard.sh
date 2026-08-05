#!/bin/bash
# PreToolUse フック本体。stdin で受け取ったツール呼び出しJSONを検査し、
#   - 保護対象パス（.env, ~/.aws/credentials 等）への言及 → deny
#   - シークレットらしき値（既知のAPIキー形式）の混入 → ask
# を permissionDecision のJSONとして stdout に返す。問題なければ何も出力せず exit 0。
#
# 検知理由にマッチした値そのものは含めない（フック出力が第二の流出経路になるため）。
# 全ツール呼び出しの前に走るため、非マッチの通常ケースは結合正規表現1回の grep で
# 早期リターンし、パターン個別の走査はマッチの疑いがあるときだけ行う。
# 依存: bash, jq, grep。jq が無い・patterns.json が壊れている場合は fail-closed（exit 2）。
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATTERNS_FILE="${SECRET_GUARD_PATTERNS:-$SCRIPT_DIR/patterns.json}"

fail() {
  echo "secret-guard: $1" >&2
  exit 2
}

command -v jq >/dev/null 2>&1 || fail "jq が見つからないため判定できません。jq をインストールするか、settings.json からこのフックを外してください。"
[ -f "$PATTERNS_FILE" ] || fail "パターン定義が見つかりません: $PATTERNS_FILE"

input="$(cat)"

# 検査対象のフィールドだけを抽出する。old_string は既存ファイルの内容なので対象外
# （ファイル内に既にあるシークレットの近くを編集しただけでブロックされるのを避ける）。
text="$(jq -r '[
  .tool_input.file_path // empty,
  .tool_input.path // empty,
  .tool_input.command // empty,
  .tool_input.url // empty,
  .tool_input.content // empty,
  .tool_input.new_string // empty
] | map(select(. != "")) | join("\n")' <<<"$input" 2>/dev/null)" || fail "フック入力のJSONを解析できません"
[ -z "$text" ] && exit 0

allowed_re="$(jq -r '.allowed_patterns | join("|")' "$PATTERNS_FILE" 2>/dev/null)" || fail "パターン定義を読み込めません: $PATTERNS_FILE"
[ -z "$allowed_re" ] && allowed_re='^$'
combined_re="$(jq -r '[.protected_paths[], .secret_patterns[].regex] | join("|")' "$PATTERNS_FILE" 2>/dev/null)" || fail "パターン定義を読み込めません: $PATTERNS_FILE"

# 早期リターン。exit 2 は正規表現エラーなので fail-open にせず fail-closed に倒す
grep -qE -e "$combined_re" <<<"$text"
case $? in
  1) exit 0 ;;
  0) ;;
  *) fail "パターン定義の正規表現が不正です: $PATTERNS_FILE" ;;
esac

tool_name="$(jq -r '.tool_name // "unknown"' <<<"$input")"

decide() {
  jq -n --arg d "$1" --arg r "$2" \
    '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: $d, permissionDecisionReason: $r}}'
  exit 0
}

# マッチ箇所を -o で切り出し、その文字列全体が allowlist のいずれかに完全一致する場合のみ除外する
# （部分一致だと xxxx 等をたまたま含む本物のシークレットまで素通しするため -x で全体一致）。
# パターンが -----BEGIN のように - で始まってもオプション扱いされないよう -e で渡す。
# grep -q は SIGPIPE で pipefail を誤動作させるため使わない。
hits() {
  [ -n "$(grep -oE -e "$1" <<<"$text" 2>/dev/null | grep -Evx -e "$allowed_re")" ]
}

# 層1: 保護対象パス。読み込み時点で止めるのが本命の防御なので deny に倒す
while IFS= read -r re; do
  [ -z "$re" ] && continue
  if hits "$re"; then
    decide deny "${tool_name} の入力が保護対象パス（pattern: ${re}）に触れています。シークレットをコンテキストに読み込まないため secret-guard がブロックしました。誤検知なら patterns.json の allowed_patterns に追加してください。"
  fi
done < <(jq -r '.protected_paths[]' "$PATTERNS_FILE")

# 層2: シークレットらしき値。誤検知がありうるので ask（ユーザー確認）に倒す
while IFS=$'\t' read -r name re; do
  [ -z "$re" ] && continue
  if hits "$re"; then
    decide ask "${tool_name} の入力に ${name} 形式のシークレットらしき値が含まれています。外部への流出につながらないか確認してください。"
  fi
done < <(jq -r '.secret_patterns[] | [.name, .regex] | @tsv' "$PATTERNS_FILE")

exit 0
