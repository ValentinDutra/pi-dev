---
description: End-of-session skill refinement — review what happened and update skill files
---
You are reviewing this session to find gaps in existing skills and knowledge that should be captured in skill files. The goal is concrete edits to SKILL.md files and their references so the next session starts smarter.

${@:+
## Focus Areas

$@
}

## Step 1: Reconstruct the session

Review the full conversation. Identify:
- Which skills were loaded and used
- What knowledge was missing — steps discovered through trial and error, gotchas, workarounds
- What instructions were wrong or incomplete in the skill files
- What workflows emerged that aren't documented in any skill
- What the agent got wrong that a better skill would have prevented

Do not ask the user to recap. The conversation is the source of truth.

## Step 2: Audit each skill used

For every skill loaded during the session:

1. Read the full SKILL.md and any references/ it links to
2. Compare what the skill says vs. what actually happened
3. Look for:
   - **Missing steps** — things we had to figure out that should be documented
   - **Wrong instructions** — steps that didn't work or led us astray
   - **Missing gotchas** — errors we hit that the skill should warn about
   - **Missing workflows** — multi-step recipes we executed that aren't in the skill
   - **Missing examples** — commands or patterns we used that would help next time
   - **Stale content** — things that are no longer true or relevant
   - **Missing troubleshooting entries** — errors we debugged that should be in a troubleshooting table

## Step 3: Check for new skill candidates

Look for repeated knowledge that doesn't belong in any existing skill:
- Did we do something complex that we'll need to do again?
- Did we interact with a tool or system that has no skill coverage?
- Was there a multi-step workflow that required specific domain knowledge?

If yes, propose a new skill. Include the name, description (with trigger phrases), and a rough outline of what it would contain. Follow the conventions in the create-skill skill.

## Step 4: Present findings

```
## Skill Refinement

### Updates to existing skills

#### [skill-name] (`path/to/SKILL.md`)
- **Add:** [what to add, which section, and why]
- **Fix:** [what's wrong and the correction]
- **Remove:** [what's stale or misleading]

#### [skill-name] (`path/to/SKILL.md`)
- ...

### New skills to create

#### [proposed-skill-name]
- **Description:** [frontmatter description with trigger phrases]
- **Covers:** [what it would document]
- **Justification:** [why this needs a skill vs. being in an existing one]

### Nothing to update
[If all skills performed correctly and no gaps were found, say so.]
```

Omit any section with zero items.

## Step 5: Wait for confirmation

Do not edit any files yet. The user decides what ships. They may:
- Approve all ("do it")
- Cherry-pick ("just the first one")
- Reject all ("skills are fine")
- Modify ("rephrase that", "put it in a different section")

## Step 6: Apply the changes

For each approved item:

**Skill updates** — read the target SKILL.md (and references if applicable), then edit. Follow the skill's existing structure. If adding a new section, place it where it logically fits. If a reference file is the right home, put it there — don't bloat SKILL.md.

**New skills** — create the skill directory and SKILL.md following the create-skill conventions (flat if < 4KB single concern, router if multi-domain or > 4KB). Include frontmatter with name and packed description.

## Step 7: Receipt

List every file created or modified with a one-line summary of the change.

## Principles

- **Skills capture what the agent can't infer.** Domain-specific knowledge, gotchas, exact CLI syntax, auth flows, error handling. Not things any developer would know.
- **One fact, one place.** Don't duplicate between SKILL.md and references, or between skills.
- **Show, don't tell.** A working command example beats a paragraph of explanation.
- **Troubleshooting tables compound.** Every error we debugged is a future 30-second fix if it's in the skill.
