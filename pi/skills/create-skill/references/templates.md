# Skill Templates

Copy-paste starting points for SKILL.md and reference files.

## Flat Skill Template

For single-concern skills under 4KB:

```markdown
---
name: my-skill
description: [What it does]. Use when [scenario 1], [scenario 2]. Triggers on [keyword 1], [keyword 2].
---

# My Skill

Brief overview — one or two sentences on what this skill provides and why.

## Usage

Primary usage pattern with a working example:

\`\`\`bash
command --flag value
\`\`\`

### Option B (if applicable)

Alternative approach for a different scenario.

## Common Workflows

### Do X From Scratch
1. First step with command
2. Second step — what to check
3. Third step — how to verify

### Debug Y
1. Check this first
2. If that fails, try this
3. Verify with this command

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Error message X | Run Y because Z |
| Command hangs | Check A, then B |
```

## Router Skill — SKILL.md Template

For multi-domain skills over 4KB:

```markdown
---
name: my-skill
description: [What it does across domains]. Use when [scenario 1], [scenario 2], [scenario 3]. Triggers on [keyword 1], [keyword 2], [keyword 3].
---

# My Skill

One-sentence overview.

## Setup (if applicable)

| Dependency | How to get it |
|------------|---------------|
| Tool X | \`command to install\` |
| Auth Y | \`command to authenticate\` |

## Quick Start

The most common usage pattern — a single working example:

\`\`\`bash
command --flag value
\`\`\`

## Reference

| Topic | File | When to read |
|-------|------|-------------|
| Full command reference | [references/commands.md](references/commands.md) | Looking up options, flags, output fields |
| Step-by-step workflows | [references/workflows.md](references/workflows.md) | Following a multi-step task |
| Types and lookup tables | [references/types.md](references/types.md) | Choosing the right type or value |

Read the reference matching the current task before proceeding.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Common error | Solution |
```

## Reference File Template

Each reference should be self-contained for its domain:

```markdown
# Topic Name

Brief context — one sentence on what this reference covers.

## Commands / Patterns / API

Full reference with examples:

\`\`\`bash
command subcommand --flag value
\`\`\`

### Subcommand A

Description and examples.

### Subcommand B

Description and examples.

## Common Workflows

### Workflow Name
1. First step with command
2. Second step — what to look for in the output
3. Third step — how to verify success

### Another Workflow
1. Step one
2. Step two

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Error X happens | Do Y because Z |
| Command returns empty | Check A — likely cause is B |
```

## Script Documentation Pattern

When SKILL.md references scripts, document them like this:

```markdown
## Query Data

\`\`\`bash
# Basic usage
scripts/query.sh --shop 123 "SELECT count() FROM table"

# With options
scripts/query.sh --env staging --format json "SELECT 1"
\`\`\`

Run \`scripts/query.sh --help\` for all options.
```

The agent needs usage examples to call scripts correctly — it doesn't read script source to figure out flags.
