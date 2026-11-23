# Skill Architecture

## When to Split vs. Stay Flat

| Condition | Decision |
|-----------|----------|
| Single concern, < 4KB | **Flat** — everything in SKILL.md, no references |
| Multiple domains or > 4KB | **Split** — SKILL.md routes to references/ |
| > 500 lines in SKILL.md | **Must split** — exceeding context budget |
| Repeated lookup tables (types, fields, rules) | **Extract** to references/ |

Choose the right shape first. Not every skill needs references.

## Flat Skills (Single Concern)

When the skill covers one focused topic and fits in < 4KB, put everything in SKILL.md:

```
my-skill/
├── SKILL.md              # Complete: frontmatter + instructions + examples + troubleshooting
└── scripts/              # Optional executables
```

Flat SKILL.md should still include these sections where applicable:
- Quick-start examples
- Common workflows (numbered multi-step recipes)
- Troubleshooting table

Examples of skills that work well flat: coding conventions, API guidelines, logging patterns, small CLI wrappers.

## Router Skills (Multiple Domains)

When the skill covers multiple domains or exceeds ~4KB, SKILL.md becomes a concise routing layer (~60-150 lines) that links to self-contained reference files:

```
my-skill/
├── SKILL.md              # Router: overview + reference table + quick start
├── references/           # One file per domain, loaded on demand
│   ├── commands.md
│   ├── workflows.md
│   └── troubleshooting.md
├── scripts/              # Optional executables
└── assets/               # Optional templates (not loaded into context)
```

Router SKILL.md should:
1. Summarize what the skill does
2. Link to reference files in a table with "when to read" guidance
3. Provide quick-start examples
4. Document auth/setup if applicable

It should NOT contain exhaustive command references, full API docs, or every example. Those go in references.

Examples of skills that need the router pattern: multi-subcommand CLIs, schema creation guides, full workflow systems.

## Reference Files

### Organization

- One file per domain, not one file per concept
- Each file is self-contained — an agent reading just that file can complete tasks in that domain
- Keep references one level deep from SKILL.md (no nested subdirectories)
- The agent won't know a reference exists unless SKILL.md mentions it

### What Goes in References vs. SKILL.md

| Content | Where |
|---------|-------|
| Overview, principles, quick start | SKILL.md |
| Anti-patterns, decision tables | SKILL.md |
| Full command reference with all options | references/ |
| Lookup tables (types, fields, rules) | references/ |
| Step-by-step multi-command workflows | references/ |
| Domain-specific troubleshooting | references/ |

Each fact lives in ONE place — SKILL.md or a reference, never both.

## Scripts

For deterministic tasks the agent shouldn't improvise:
- SKILL.md documents usage; the script handles execution
- Include usage examples in SKILL.md so the agent knows how to call them
- Add `--help` support in the script itself
- Make scripts executable: `chmod +x scripts/*.sh`
- Paths in SKILL.md are relative to the skill directory

## Common Workflows

### Create a New Flat Skill

1. `mkdir -p ~/.pi/agent/skills/my-skill`
2. Write `SKILL.md` with frontmatter + full content
3. Validate: `pi --no-skills --skill ~/.pi/agent/skills/my-skill`
4. Test: `/skill:my-skill`

### Convert a Flat Skill to Router

1. Identify sections > 1KB or lookup tables in SKILL.md
2. `mkdir references/` inside the skill directory
3. Move extracted content to `references/<domain>.md`
4. Replace extracted content in SKILL.md with a reference table linking to the files
5. Verify each reference is mentioned in SKILL.md
6. `/reload` and test

### Convert a Prompt Template to a Skill

1. Read the prompt template to understand its purpose
2. Create skill directory: `mkdir -p ~/.pi/agent/skills/<name>`
3. Move content to `SKILL.md` — remove `$@`/`$1` argument placeholders (skill args come as user message)
4. Add proper frontmatter with packed description
5. Apply flat-or-router sizing decision
6. Delete the old prompt template file
7. Validate and test
