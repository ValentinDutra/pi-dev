---
description: Make the current failing TDD test pass with minimal implementation
argument-hint: "[context]"
---

# TDD 3: Green — Minimal Implementation

Make the current failing test pass. $@

## Hard rules

- Do not modify tests.
- Do not delete, skip, weaken, or rewrite assertions.
- Do not broaden behavior beyond the current failing test.
- Do not introduce speculative abstractions.
- Do not suppress errors to get green.
- Do not change public contracts unless the failing test requires it and the user approved it.

If passing the test appears to require changing the test, stop and explain why.

## Process

1. Re-read the failing test and failure output.
2. Identify the smallest production change that should satisfy it.
3. Implement that change.
4. Run the targeted test.
5. If it fails, iterate only on production code.
6. Stop when the targeted test passes.
7. Run the smallest relevant neighboring test group if cheap.

## Output format

```markdown
## Implementation
- Files changed:
- Minimal behavior added:

## Verification
- Targeted command:
- Result:
- Additional command, if run:
- Result:

## Notes
- Anything intentionally deferred:
- Any test-list items discovered:
```
