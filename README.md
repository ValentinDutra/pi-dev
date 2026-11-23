# pi-dev — Agentic Coding Harness

Personal agentic coding harness shared across **Pi** (`~/.pi/agent/`) and **Antigravity CLI (`agy`)** (`~/.gemini/`), orchestrated inside **bb**.

## Repository Layout

```text
pi-dev/
├── pi/                     # Sanitized mirror of ~/.pi/agent/
│   ├── AGENTS.md           # Global rules (git worktrees, YAGNI, TDD, PRs, ADHD mode)
│   ├── settings.json       # Packages, default model, and observational memory
│   ├── mcp.json            # MCP servers (ClickUp, Toggl via macOS Keychain)
│   ├── web-search.json     # Web search provider routing
│   ├── i-have-adhd.json    # ADHD communication mode always enabled
│   ├── agents/             # implementer, reviewer, simplify-reviewer
│   ├── skills/             # grilling, plan, review-plan, implement, create-pr, finish, ...
│   ├── prompts/            # tdd-1..6, explore, simplify, review-tests, session-retro, ...
│   ├── extensions/         # english-coach, bash-minimal, read-minimal, cockpit, plan-usage, ...
│   ├── patches/            # Advisor notice patch for pi-claude-bridge
│   └── themes/             # minimal, nightowl
├── gemini/                 # Sanitized mirror of ~/.gemini/
│   ├── AGENTS.md           # Imports ~/.pi/agent/AGENTS.md + i-have-adhd + Antigravity mapping
│   └── config/
│       ├── agents/         # implementer, reviewer, simplify-reviewer adapted for agy
│       ├── hooks.json      # PreInvocation hook for english-coach
│       ├── hooks/          # english-coach.sh
│       └── skills.json     # Shared skill paths
├── shared-skills/          # Shared skills from ~/.agents/skills/ (domain-modeling, prototype, research, wayfinder)
└── scripts/
    └── sync.sh             # Syncs this repo from ~/.pi/agent/, ~/.gemini/, and ~/.agents/skills/
```

## How the Workflow Works

The main session orchestrates, plans, and reviews, and **never edits repository code directly**:

1. **`/skill:grilling`** — interviews through the decision tree in rounds until no ambiguity remains.
2. **`/skill:plan`** — writes the simplest implementation plan to `~/.pi/agent/plans/<repo>/<feature>.md`.
3. **`/skill:review-plan`** — verifies paths, commands, and decisions before any code is written.
4. **`/skill:implement`** — creates an isolated git worktree and runs three subagents in rounds:
   - `implementer` (strict TDD, one commit per task, test minimization).
   - `reviewer` (read-only: quality, security, and correctness).
   - `simplify-reviewer` (read-only: checks whether the solution is the simplest one possible).
5. **`/skill:create-pr`** — opens a draft PR assigned to `@me`.
6. **`/skill:finish`** — turns repeated mistakes into deterministic project checks, removes the worktree, logs hours, and deletes the plan.

## Syncing Local Changes

Run the sync script (strict allowlist; never copies credentials, internal work skills, `sessions/`, `plans/`, or logs):

```bash
./scripts/sync.sh
git status
git add -A && git commit -m "Sync harness" && git push
```

## Intentionally Excluded

Credentials, work-specific skills, and ephemeral machine state are never committed:
`auth.json`, `mcp-auth.json`, `models-store.json`, `trust.json`, `claude-bridge.json`, `pi/skills/semantix/`, `*.log`, `sessions/`, `plans/`, `cc-cli-logs/`, `web-search-cache/`, `npm/`, `git/`, `bin/`, `install/`, and `~/.gemini/antigravity-cli/`. `scripts/sync.sh` also replaces the local `$HOME` path with `~` before writing.
