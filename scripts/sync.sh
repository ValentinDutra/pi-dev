#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PI_SRC="$HOME/.pi/agent"
GEMINI_SRC="$HOME/.gemini"
AGENTS_SKILLS_SRC="$HOME/.agents/skills"

mkdir -p "$REPO_ROOT/pi" "$REPO_ROOT/gemini/config/hooks" "$REPO_ROOT/shared-skills"

# Pi top-level config files (strict allowlist; never secrets or runtime state)
for file in AGENTS.md settings.json mcp.json web-search.json keybindings.json i-have-adhd.json; do
  if [ -f "$PI_SRC/$file" ]; then
    cp "$PI_SRC/$file" "$REPO_ROOT/pi/$file"
  fi
done

# Sanitize Pi AGENTS.md for public sharing (drop work-specific line and user-local path)
if [ -f "$REPO_ROOT/pi/AGENTS.md" ]; then
  python3 - "$REPO_ROOT/pi/AGENTS.md" "$HOME" <<'PY'
import sys
path, home = sys.argv[1], sys.argv[2]
with open(path, "r", encoding="utf-8") as handle:
    lines = handle.readlines()
filtered = []
for line in lines:
    if "copiloto architecture" in line or "career-decisions-copiloto-architecture.md" in line:
        continue
    line = line.replace(
        "(even in repos whose CLAUDE.md defaults to Spanish, such as bps-nsb-seed Copiloto modules)",
        "(even in repos whose CLAUDE.md defaults to Spanish)",
    )
    line = line.replace(home, "~").replace("pi-harness", "pi-dev")
    filtered.append(line)
with open(path, "w", encoding="utf-8") as handle:
    handle.writelines(filtered)
PY
fi

# Pi directories (exclude work-specific skills/semantix)
for dir in agents skills prompts extensions patches themes; do
  if [ -d "$PI_SRC/$dir" ]; then
    rsync -a --delete --delete-excluded \
      --exclude='.DS_Store' \
      --exclude='node_modules' \
      --exclude='semantix' \
      --exclude='semantix/**' \
      "$PI_SRC/$dir/" "$REPO_ROOT/pi/$dir/"
  fi
done

# Antigravity / Gemini bridge config
if [ -f "$GEMINI_SRC/AGENTS.md" ]; then
  cp "$GEMINI_SRC/AGENTS.md" "$REPO_ROOT/gemini/AGENTS.md"
fi

for file in hooks.json skills.json; do
  if [ -f "$GEMINI_SRC/config/$file" ]; then
    cp "$GEMINI_SRC/config/$file" "$REPO_ROOT/gemini/config/$file"
  fi
done

# Sanitize Gemini JSON configs (strip work-specific skill path and replace local $HOME)
python3 - "$REPO_ROOT/gemini/config/hooks.json" "$REPO_ROOT/gemini/config/skills.json" "$HOME" <<'PY'
import json, os, sys
hooks_path, skills_path, home = sys.argv[1], sys.argv[2], sys.argv[3]

if os.path.isfile(hooks_path):
    with open(hooks_path, "r", encoding="utf-8") as handle:
        content = handle.read().replace(home, "~")
    with open(hooks_path, "w", encoding="utf-8") as handle:
        handle.write(content)

if os.path.isfile(skills_path):
    with open(skills_path, "r", encoding="utf-8") as handle:
        data = json.load(handle)
    entries = []
    for entry in data.get("entries", []):
        raw_path = entry.get("path", "")
        if "semantix" in raw_path:
            continue
        entries.append({**entry, "path": raw_path.replace(home, "~")})
    data["entries"] = entries
    with open(skills_path, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")
PY

if [ -d "$GEMINI_SRC/config/agents" ]; then
  rsync -a --delete --exclude='.DS_Store' \
    "$GEMINI_SRC/config/agents/" "$REPO_ROOT/gemini/config/agents/"
fi

if [ -f "$GEMINI_SRC/config/hooks/english-coach.sh" ]; then
  cp "$GEMINI_SRC/config/hooks/english-coach.sh" "$REPO_ROOT/gemini/config/hooks/english-coach.sh"
fi

# Shared core skills from ~/.agents/skills/
for skill in domain-modeling prototype research wayfinder; do
  if [ -d "$AGENTS_SKILLS_SRC/$skill" ]; then
    rsync -a --delete --exclude='.DS_Store' \
      "$AGENTS_SKILLS_SRC/$skill/" "$REPO_ROOT/shared-skills/$skill/"
  fi
done

echo "Synced clean public harness into $REPO_ROOT"
