# Description Writing & Pi Format

## Frontmatter

Required fields: `name`, `description`. Directory name must equal `name`.

```yaml
---
name: my-skill
description: What it does. Use when X, Y, Z. Triggers on keyword1, keyword2.
---
```

### Name Rules

- 1–64 chars, lowercase letters/digits/hyphens
- No leading/trailing/consecutive hyphens
- Must match parent directory name
- Valid: `pdf-processing`, `code-review` — Invalid: `PDF-Processing`, `-pdf`, `pdf--processing`

### Optional Fields

| Field | Purpose |
|-------|---------|
| `license` | License name or reference |
| `compatibility` | Environment requirements (max 500 chars) |
| `metadata` | Arbitrary key-value pairs for tooling |
| `allowed-tools` | Space-delimited list of pre-approved tools |
| `disable-model-invocation` | When `true`, user must invoke with `/skill:name` |

## Writing the Description

The description is the only thing always in context. It determines activation. This is the most important step.

### Pattern

```
[What it does]. Use when [scenario 1], [scenario 2], [scenario 3]. Triggers on [keyword 1], [keyword 2], [keyword 3].
```

### Good — Multiple Activation Paths

```yaml
description: "Run ClickHouse queries and look up shard assignments for reportify-clickhouse clusters. Use when debugging data, investigating discrepancies, querying session/order facts, or finding which shard a shop belongs to. Triggers on clickhouse query, debug clickhouse, reportify query, session facts, run on shard."
```

```yaml
description: "Create and modify ShopifyQL schemas in the merchant-analytics-api zone. Covers FACT, DIMENSION, and MATCHABLE schema types. Use when: creating a new schema, adding fields/metrics, debugging schema validation errors, setting up joins. Triggers on: create schema, new schema, add metric, schema validation."
```

### Bad — Vague, Single Phrase

```yaml
description: "Helps with ClickHouse."
```

```yaml
description: "Schema utilities."
```

### Tips

- Cover every angle a user might approach the topic from
- Include both the high-level task ("debug data") and specific terms ("session facts", "shard lookup")
- If the skill wraps a CLI tool, name the tool and its subcommands
- Max 1024 chars — use them

## Skill Locations

| Scope | Path |
|-------|------|
| Global (personal) | `~/.pi/agent/skills/` |
| Project | `.pi/skills/` or `.agents/skills/` |
| Package | `skills/` directory or `pi.skills` in package.json |
| CLI | `--skill <path>` (repeatable) |

## Validation

```bash
# Load only this skill to spot warnings
pi --no-skills --skill /path/to/my-skill

# Invoke explicitly
/skill:my-skill

# After edits
/reload
```

Skills with missing descriptions are not loaded. Name collisions warn and keep the first found.
