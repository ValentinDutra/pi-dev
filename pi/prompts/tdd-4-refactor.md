---
description: Refactor after green while preserving behavior
argument-hint: "[scope]"
---

# TDD 4: Refactor — Preserve Behavior

Refactor the green implementation. $@

## Hard rules

- No new behavior.
- Do not change test intent.
- Do not weaken assertions.
- Do not make speculative architecture changes.
- Keep the system ready for the next test.
- If a test is coupled to implementation details and blocks a valid refactor, stop and ask before changing it.

## Refactor goals

Improve only where useful:
- naming
- duplication
- structure
- error handling clarity
- separation of concerns
- readability
- use of existing helpers/patterns

Do not refactor beyond the current TDD cycle's needs.

## Process

1. Review the current diff.
2. Identify small refactor opportunities.
3. Apply the smallest useful refactor.
4. Run targeted tests.
5. Run relevant broader tests if cheap.
6. Summarize what changed and what stayed the same.

## Output format

```markdown
## Refactor summary
- Files changed:
- Behavior preserved:
- Design improvement:

## Verification
- Command:
- Result:

## Deferred cleanup
- Optional future cleanup:
```
