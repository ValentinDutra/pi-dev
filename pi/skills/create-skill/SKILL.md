---
name: create-skill
description: Create or update a Pi agent skill. Use when building a new skill, improving an existing SKILL.md, adding references or scripts to a skill, or converting a prompt template into a skill. Triggers on create skill, new skill, build skill, improve skill, update skill, skill template.
---

# Create Skill

Build Pi agent skills that follow progressive disclosure: frontmatter (always in context) → SKILL.md body (on trigger) → references (on demand).

## Principles

- **Conciseness**: only domain-specific knowledge, workflows, and tooling the agent can't infer earn their token cost.
- **Progressive disclosure**: for multi-domain skills, SKILL.md is a routing layer to references. For single-concern skills, everything fits in SKILL.md.
- **Activation**: Pi decides whether to load a skill based solely on the frontmatter `description`. Pack it with trigger phrases covering every angle a user might approach the topic.
- **Context over directives**: "X helps Y because Z" is more robust than "You MUST do X".

## Quick Start

1. Clarify 2-4 concrete use cases
2. Write the description — most important step ([see guide](references/description-and-format.md))
3. Choose flat or router shape ([see architecture](references/architecture.md))
4. Write SKILL.md + references if needed ([see templates](references/templates.md))
5. Validate: `pi --no-skills --skill /path/to/my-skill`

## Reference

| Topic | File | When to read |
|-------|------|-------------|
| Description writing + Pi format rules | [references/description-and-format.md](references/description-and-format.md) | Writing frontmatter, naming, description trigger phrases |
| Flat vs router architecture | [references/architecture.md](references/architecture.md) | Deciding skill shape, sizing heuristics, directory layout |
| SKILL.md and reference file templates | [references/templates.md](references/templates.md) | Writing the actual files — copy-paste starting points |

Read the reference matching the current step before proceeding.

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Put everything in SKILL.md when it exceeds 4KB | Route to references for detail beyond that size |
| Put "when to use" in the body | Put trigger phrases in frontmatter `description` |
| Create references SKILL.md never mentions | Every reference must be linked from SKILL.md |
| Duplicate content between SKILL.md and references | Single source of truth per fact |
| Write generic instructions the agent already knows | Focus on domain-specific knowledge it can't infer |
| Skip the "Common Workflows" section | Always include multi-step recipes for real tasks |
| Use vague descriptions | Pack descriptions with specific trigger phrases |
| Create references/ for a small single-concern skill | Keep it flat — references add indirection without benefit |
