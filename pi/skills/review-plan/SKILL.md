---
name: review-plan
description: Review an implementation plan before /skill:implement. Checks that it is the simplest plan that meets the goal, that its paths and commands are real, and that nothing is left open. Triggers on review plan, check the plan, is the plan solid, validate plan, plan review.
---

# Review Plan

A wrong line in the plan becomes many wrong lines of code. Catch it here, while it is cheap.

## Process

1. Read the plan in full: the argument, else ask which file in `~/.pi/agent/plans/<repo>/`.
2. Run every check below. Record each issue with the task or line it concerns. Do not stop at the first issue.
3. Present all findings at once, in the format below.

## Checks

1. **Simplest plan.** For each task: can it not exist? Can existing code, a library or the platform do it? Can two tasks merge? Does a task add a layer, option or special case the goal does not need? Write out the simpler version for each finding.
2. **Paths exist.** Open every file path in the plan. A path a task creates is fine; any other missing path is a failure.
3. **Commands run.** Run each verification command, or at least confirm its script or binary exists. A vague command ("run tests") is a failure.
4. **Nothing left open.** No questions, "TBD", "decide later", or choices left to the implementer.
5. **Scope stated.** `## Out of scope` exists and names specific things.

## Output

```
## Plan review: <path>

### Failures (fix before /skill:implement)
1. <check>: <issue, quoting the plan>

### Simplifications
1. <task>: <simpler version, written out>

### Passed
- <check>
```

Omit empty sections. If nothing failed and nothing simplifies: "Plan is ready. Run `/skill:implement <path>`."

## Fixes

When the user says to fix: edit the plan, then rerun the checks. When the user rejects a finding, drop it.
