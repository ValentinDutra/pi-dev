---
description: Run the final AI-assisted TDD definition-of-done checklist
argument-hint: "[scope]"
---

# TDD 6: Done — Final Verification Checklist

Verify whether the current TDD change is complete. $@

## Rules

Do not edit files unless explicitly asked. Inspect and run verification commands only.

## Checklist

Confirm each item:

- [ ] A behavior test list exists in the conversation or notes.
- [ ] At least one new or changed test failed before implementation.
- [ ] The red failure was for the intended reason.
- [ ] Implementation did not require weakening or deleting assertions.
- [ ] No tests were skipped, focused, quarantined, or loosened.
- [ ] The targeted test passes.
- [ ] Relevant neighboring tests pass.
- [ ] Broader project checks were run, or there is a reason they were not.
- [ ] Refactoring was done or explicitly deemed unnecessary.
- [ ] The diff was reviewed adversarially.
- [ ] Security/privacy/authorization implications were considered.
- [ ] Any discovered bug has regression coverage.
- [ ] Deferred work is documented.

## Verification process

1. Inspect current diff.
2. Identify test commands from project docs or existing patterns.
3. Run the narrowest relevant command if not already run.
4. Recommend broader commands, and run them if safe and appropriate.
5. Produce a final readiness report.

## Output format

```markdown
## Done status
One of:
- Done
- Not done
- Cannot determine

## Checklist result
- Passed:
- Failed:
- Unknown:

## Verification run
- Command:
- Result:

## Required before completion
- ...

## Optional follow-up
- ...
```
