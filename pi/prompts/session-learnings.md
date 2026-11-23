---
description: Analyze a coding session, extract learnings, and propose AGENTS.md and skill updates
---
You are analyzing a coding session transcript. Your job is to extract everything worth remembering and propose concrete improvements.

${@:+
## Additional Instructions

$@
}

## Step 1: Propose AGENTS.md Changes

Extract moments where the developer had to guide, correct, or redirect the AI. These become behavioral rules.

**What counts:**
- Wrong assumptions — guessed instead of verifying
- Wrong approach — developer redirected to a better path
- Missed existing patterns — didn't follow codebase conventions
- Over/under-engineered — wrong level of abstraction
- Wasted cycles — went down a path that had to be aborted

**What to ignore:**
- Normal clarifying questions
- Choices between two valid options
- Corrections due to missing information the AI couldn't have known

**Output format:**
```
### Proposed AGENTS.md Changes

#### New rules
- [rule as a direct imperative]

#### Modified rules
- [existing rule] → [updated version]
  Reason: [why]
```

Check existing AGENTS.md before proposing — don't duplicate what's already there.

## Step 2: Propose Skill Updates

Review which skills were used during the session. For each skill used, check if the SKILL.md is missing anything we discovered.

**What to look for:**
- Missing instructions (steps that weren't documented but were needed)
- Auth flows or setup steps discovered through trial and error
- CLI syntax gotchas (flags, argument order, env vars)
- Better examples or workflows than what's currently documented
- Missing error handling guidance (what to do when X fails)

**Output format:**
```
### Proposed Skill Updates

#### [skill-name] (path/to/SKILL.md)
- **Add:** [what to add and where]
- **Update:** [what to change and why]
- **Remove:** [what's stale or wrong]
```

Only propose changes for skills actually used in the session. Read the SKILL.md before proposing — don't suggest adding something that's already there.

## Output Structure

1. **Summary** — one paragraph: what the session was about, main outcomes
2. **Proposed AGENTS.md changes** — for approval
3. **Proposed skill updates** — for approval
4. **Patterns** — recurring themes worth noting (e.g., "corrected the same mistake 3+ times → high priority rule")
