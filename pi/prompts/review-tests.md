---
description: Review tests for redundancy, gaps, naming, structure, and convention
---
Review the tests I just wrote or changed in the current conversation. $@

### Review Checklist

1. **Redundancy.** Is any assertion already logically covered by another test? Flag duplicates.
2. **Coverage gaps.** Read the production code the tests cover. List branches/behaviors that have no test.
3. **Minimality.** For each test, could any setup line or assertion be removed without the test losing its purpose? If yes, flag it.
4. **Naming.** Test names should describe behavior: `test "#method does X when Y"`. Flag vague names ("handles correctly", "works properly") or names that describe scope instead of behavior.
5. **Variable naming.** Variables should reflect domain meaning, not type-system classification. `resolver` not `type`, `converted_amount` not `result`.
6. **Structure.** Tests belong in the existing test file. Flag unnecessary nested classes, separate files, or duplicate setup that could be a shared helper.
7. **Convention.** Compare against how other components test the same pattern. Flag deviations from the strongest codebase convention.
8. **Framework misuse.** Flag tests fighting a DSL (complex workarounds, multiple layers of indirection) when a simpler approach would work.
9. **One behavior per test.** Flag tests that assert on multiple independent behaviors.
