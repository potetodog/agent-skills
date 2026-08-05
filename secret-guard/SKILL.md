---
name: secret-guard
description: APIキーやアクセスキーなどのシークレットがAIのツール実行経由で流出するのを防ぐPreToolUseフックの、インストール・診断・動作確認・allowlist調整を行う。検知とブロックの実体はフック(scripts/guard.sh)であり、このスキルはそのセットアップと運用の入口。
argument-hint: "[install|status|test] 例) install（省略時は現状診断から始める）"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
disable-model-invocation: true
---

# シークレット流出ガード (secret-guard)

シークレット流出の防御は「モデルへのお願い」では成立しないため、検知・ブロックの本体は決定論的に実行される PreToolUse フック（`scripts/guard.sh`）に置いている。このスキルの役割は、そのフックのインストール・診断・動作確認・誤検知の調整をガイドすること。

防御は二層構造:

1. **読み込みブロック（deny）** — `.env` や `~/.aws/credentials` などの保護対象パスに触れるツール呼び出しを拒否する。シークレットは一度コンテキストに入ると変形して持ち出せるため、入口で止めるのが本命の防御。`permissions.deny` ルールとフックの両方で塞ぐ。
2. **出口検知（ask）** — Bash・WebFetch・Write などの引数に既知のAPIキー形式がマッチしたら、ユーザー確認に倒す。誤検知がありうるので即拒否にはしない。あくまで補助であり、これだけに頼らない。

要求されたアクション: $ARGUMENTS

引数が `install` ならステップ2から、`test` ならステップ3だけ、`status` または省略時はステップ1から順に進める。

## ステップ1: 診断 (status)

現状を確認して結果を報告する:

1. `jq` が使えるか（`command -v jq`）。無ければフックは fail-closed で全ブロックになるため、インストールを案内する（macOS: `brew install jq`）
2. `~/.claude/settings.json` とプロジェクトの `.claude/settings.json` を読み、`guard.sh` を指す PreToolUse フックと `permissions.deny` の Read ルールが設定済みか確認する
3. `scripts/patterns.json` が妥当なJSONか（`jq empty` で検証）

未設定の項目があれば、インストールに進むか確認する。

## ステップ2: インストール (install)

1. ユーザーに適用範囲を確認する: 全プロジェクト（`~/.claude/settings.json`）か、このプロジェクトのみ（`.claude/settings.json`）か
2. `scripts/guard.sh` の絶対パスを解決し、実行権限が付いているか確認する（`chmod +x` が必要なら付ける）
3. `hooks.example.json` の内容を対象の settings.json にマージする。**既存の `permissions` や `hooks` を上書きしないこと** — 既存の配列に要素を追記する。`command` は解決した絶対パスに置き換える
4. マージ後の settings.json を `jq empty` で検証する
5. フックは次のセッションから（または設定リロード後に）有効になることを伝える

## ステップ3: 動作確認 (test)

`scripts/self_test.sh` を実行し、全ケース pass することを確認して結果を報告する。fail がある場合は guard.sh / patterns.json の変更内容を疑い、原因を特定して直す。

## 誤検知の調整

ユーザーから「正当な操作がブロックされた」と報告されたら:

1. どのパターンにマッチしたかをフックの拒否メッセージから特定する
2. `scripts/patterns.json` の `allowed_patterns` に、その誤検知だけを通す**できるだけ狭い**正規表現を追加する。allowed_patterns はマッチした文字列**全体**に対する完全一致（`grep -x`）で適用されるため、部分文字列ではなくマッチ全体を表すパターンを書くこと。保護パスや検知パターン自体の削除・緩和は、ユーザーが明示的に求めた場合のみ行う
3. `scripts/self_test.sh` を再実行して既存の検知が壊れていないことを確認する

## 運用上の注意

- 検知理由やログにマッチした値そのものを含めない（第二の流出経路になる）
- このフックは回避可能な補助防御。特に「すでにコンテキストに入ったシークレット」は base64 等の変形で出口検知をすり抜けうる。だからこそ層1（読み込みブロック）を緩めない
- パターンを追加したら必ず `self_test.sh` にケースを足す
