---
description: Write exactly one failing test for the next TDD behavior
argument-hint: "<behavior>"
---

# TDD 2: Red — One Failing Test

Write exactly one failing test for: $@

## Hard rules

- Do not write production implementation.
- Do not modify unrelated tests.
- Do not write multiple tests unless the user explicitly asks.
- Do not skip, focus, quarantine, or weaken tests.
- Do not assert implementation details unless the public contract makes that unavoidable.
- Use valid domain values and existing test helpers.
- Follow nearby test style.

## Test requirements

The test must:
- describe one observable behavior
- fail before implementation
- fail for the intended reason
- be minimal but meaningful
- use the existing project's conventions
- avoid excessive mocking
- not hardcode current incorrect output as expected output

## Process

1. Locate the best existing test file.
2. Read nearby tests and helpers before editing.
3. Add exactly one test.
4. Run the narrowest relevant test command.
5. Confirm the test fails.
6. Explain why the failure proves the missing behavior.

If the test passes unexpectedly, stop and explain why. Do not proceed to implementation.

## Output format

```markdown
## Test added
- File:
- Test name:
- Behavior:

## Red result
- Command:
- Failure summary:
- Why this is the right failure:

## Next step
What minimal implementation should happen in green.
```
