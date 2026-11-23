---
description: Adversarially review the current TDD change, including tests and implementation
argument-hint: "[focus]"
---

# TDD 5: Review — Adversarial Diff Review

Review the current change adversarially. $@

## Review scope

Inspect:
- git diff
- added/changed tests
- production implementation
- nearby code
- existing conventions
- relevant edge cases

Do not edit files unless explicitly asked.

## Review checklist

### Test quality

Check:
- Did the test fail before implementation?
- Does the test assert observable behavior?
- Is the test minimal?
- Does the test use valid domain values?
- Is it over-mocked?
- Does it duplicate existing coverage?
- Would it catch the intended bug?
- Could a bad hardcoded implementation pass it?
- Did any assertion get weakened or deleted?

### Implementation quality

Check:
- Is the implementation minimal?
- Did it add speculative behavior?
- Does it follow existing patterns?
- Are names clear?
- Are error cases handled correctly?
- Are contracts preserved?
- Are there hidden side effects?

### Risk

Check:
- security/auth/privacy
- concurrency/races
- persistence consistency
- external API contracts
- performance regressions
- backward compatibility
- missing integration coverage

## Output format

```markdown
## Verdict
One of:
- Ready
- Ready with nits
- Needs changes
- Blocked

## Critical issues
- ...

## Non-critical issues
- ...

## Missing tests
- ...

## Over-implementation or design concerns
- ...

## Recommended next action
```
