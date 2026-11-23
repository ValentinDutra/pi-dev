#!/usr/bin/env bash
# Antigravity PreInvocation hook. Reuses the Claude Code english-check hook, which
# decides whether a prompt is gradable and returns the directive. Antigravity fires
# PreInvocation before every model call, so the directive is injected once per new
# user prompt, tracked per conversation in a state file.
input="$(cat)"
conversation="$(printf '%s' "$input" | jq -r '.conversationId // empty')"
prompt="$(printf '%s' "$input" | jq -r '.lastUserInput // empty')"
[ -z "$conversation" ] || [ -z "$prompt" ] && { echo '{}'; exit 0; }

state_dir="$HOME/.gemini/config/hooks/.english-coach-state"
mkdir -p "$state_dir"
prompt_hash="$(printf '%s' "$prompt" | shasum | cut -d' ' -f1)"
state_file="$state_dir/$conversation"
[ "$(cat "$state_file" 2>/dev/null)" = "$prompt_hash" ] && { echo '{}'; exit 0; }
printf '%s' "$prompt_hash" > "$state_file"

directive="$(jq -n --arg prompt "$prompt" '{prompt: $prompt}' \
  | "$HOME/.claude/hooks/english-check.sh" \
  | jq -r '.hookSpecificOutput.additionalContext // empty')"
[ -z "$directive" ] && { echo '{}'; exit 0; }
jq -n --arg directive "$directive" '{injectSteps: [{systemMessage: {systemMessage: $directive}}]}'
