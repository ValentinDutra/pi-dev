---
name: plan
description: Write the simplest implementation plan for an approach the user has settled, ready for /skill:implement. Use after grilling or wayfinder, when the user wants a concrete plan. Triggers on plan, create plan, implementation plan, write the plan, plan the implementation, break it into tasks.
---

# Plan

Turn a settled approach into the simplest plan that meets the goal. The implementer subagent executes it with strict TDD, one commit per task. It reads only the plan, the code, and the project's `AGENTS.md`.

## Principles

1. **Simplest plan that meets the goal.** Fewest tasks, files and concepts. Reuse existing code before adding new code. Ask of every task: can this not exist?
2. **No open questions.** Anything unresolved, ask now. A "TBD" becomes the implementer's guess.
3. **Scope is explicit.** Say what we are not doing.
4. **One task = one commit**, testable through the public interface with the code that exists after it. Order tasks by dependency.
5. **Real references.** Every path is verified against the codebase. Point at an existing file to copy the pattern from instead of describing it.
6. **Shape before tasks.** When the change crosses a function boundary, name the data shape first: the types, the signatures callers use, and which module owns each. The tasks build that shape.

## Process

1. Confirm the inputs: the goal, the chosen approach, and answers to every open question. Ask for anything missing.
2. Present the shape (principle 6) and the task skeleton, one line per task, and wait for approval.
3. Write the plan to `~/.pi/agent/plans/<repo name>/<branch with / replaced by ->.md`, using the template below.
4. Tell the user the path. Next steps: `/skill:review-plan`, then `/skill:implement <path>`.

## Template

```markdown
# <Title>

Repo: <absolute path of the main checkout>
Branch: <feature branch to create>
Base: <base branch, usually main>

## Goal
<What we are doing, why, and what is true when it is done.>

## Approach
<The chosen approach and why, grounded in the codebase.>

## Out of scope
- <specific thing we are not doing>

## Shape
<The types and signatures, as code, with the module that owns each. Omit when the change stays inside one function.>

## Patterns to follow
- <area>: `path/to/example`

## Verification commands
- Tests: `<command>`
- Lint: `<command>`
- Type check: `<command>`

## Tasks
1. <Behavior to add. Files to change. Pattern to follow (path). Test file and the test pattern to follow (path).>
2. <Next task. If it builds on an earlier one, name what that task created.>
```

Omit a verification command the project does not have, and say so.

If a task needs more than about 4 lines, it is probably two tasks.
