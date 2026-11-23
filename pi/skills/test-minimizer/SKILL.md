---
name: test-minimizer
description: Verify that tests for a PR or branch are minimal — each test exercises one distinct behavior, no test is redundant, and no setup or assertion is unnecessary. Use after writing tests for new production code, during test review, or when asked to minimize/audit/reduce tests. Triggers on review tests, minimize tests, test review, are tests minimal, test quality, test audit, reduce tests.
context: fork
---

# Test Minimizer

Review tests for new or changed production code. The goal: every test must justify its existence. If a test can be removed without losing coverage of a distinct behavior, remove it.

## Inputs

One of:
- A PR URL — extract the test files from the diff
- A file path — review that test file
- A branch — diff against the parent to find changed test files

Only review tests that are new or changed in the diff. Don't audit the entire existing test suite.

Also load the project's AGENTS.md for any project-specific testing rules.

For PRs with more than 20 changed tests, run Phase 2 first and only apply Phase 3 to tests flagged as suspicious (redundant, multi-behavior, or orphan).

## Phase 1: Identify what changed

1. Get the production diff (exclude test files). List every behavior that was added or changed.
2. Get the test diff. List every test that was added or changed.
3. Map each test to the production behavior it exercises.

Flag:
- Tests that don't map to any changed production behavior (orphan tests)
- Production behaviors with no corresponding test (untested behaviors)

## Phase 2: Structural review

For each test, check:

| Check | Fix |
|-------|-----|
| Tests more than one behavior | Split or pick the primary behavior |
| Test body is identical to another except for inputs | Parameterize with the framework's table feature (`pytest.mark.parametrize`, `it.each`) |
| Uses a class when a plain function would work | Convert to function |
| Test asserts something does NOT happen, with no companion test asserting it DOES happen under different conditions | Add a positive case so the test isn't vacuously passing |
| Violates any testing rule in the project's AGENTS.md | Apply the AGENTS.md rule (naming, assertion messages, fixture reuse, etc.) |

## Phase 3: Empirical minimization

For each test (run these steps, don't just reason about them):

1. **Verify the test catches the change.** Use the test-to-behavior mapping from Phase 1 to identify which production file and lines to comment out. Comment out the production change. Run the single test. It must fail. If it passes, the test doesn't exercise the new code — flag it. Restore the production code.

2. **Strip unnecessary setup.** Try removals in this order (most impactful first):
   - Remove a fixture argument the test receives
   - Remove a key from a test dictionary
   - Remove a setup call
   - Simplify a value (replace a complex object with a minimal one)

   After each removal, run the test. If it still passes, that piece was unnecessary — leave it out. If it fails, restore it.

3. **Strip unnecessary assertions.** One at a time, remove an assertion. If the test still fails when the production change is commented out, the assertion wasn't needed for coverage. Keep only assertions that are necessary to detect the behavioral change.

4. **Repeat** until nothing else can be removed.

5. **Final green run.** Run all minimized tests together with the project's test runner. All must pass. If any fail, the minimization removed something load-bearing — restore and re-evaluate.

## Phase 4: Report

Present findings as a summary line followed by a numbered list:

```
Summary: Reviewed N tests — X minimal, Y reduced, Z redundant/removed

1. test_foo_produces_no_facts_when_values_equal
   - Status: minimal ✓
   - Exercises: suppression logic for equal values

2. test_bar_renders_negative_template
   - Redundant: same behavior as test_baz (recommend removing)

3. test_qux_handles_edge_case
   - Reduced: removed 2 unnecessary fixture args, 1 unused dict key
   - Before: 18 lines → After: 11 lines
```

Wait for confirmation before applying changes, unless the caller said to apply them.

## Constraints

- Run tests one at a time during minimization (`pytest path/to/test.py::test_name`, `npx vitest run path/to/file.test.ts -t "name"`), not the full suite.
- Don't touch production code except to temporarily comment it out for verification. Always restore it.
- Don't add tests. This skill removes and shrinks, it doesn't grow.
- If a single test has more than 10 removable pieces of setup, focus on fixture arguments and setup calls first. Skip value simplification for tests already under 15 lines.
