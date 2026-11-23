---
description: Start an AI-assisted TDD cycle with read-only exploration and a behavior test list
argument-hint: "<goal>"
---

# TDD 1: Start — Explore, Map, Test List

We are going to use strict TDD for: $@

## Rules

Read-only mode. Do not edit files. Do not write files. Do not run commands that mutate state.

Use only safe investigation:
- read files
- list directories
- search code
- inspect tests
- inspect configs
- inspect git diff/status if useful

Do not implement anything yet.

## Goal

Build enough understanding to propose a correct test list and identify the smallest first failing test.

## Process

### 1. Restate intent

Restate the requested behavior in concrete terms.

Separate:
- known requirements
- assumptions
- unknowns
- likely risks

### 2. Map existing code

Find:
- relevant production files
- relevant test files
- existing helpers
- similar prior art
- conventions for test naming, fixtures, mocks, factories, assertions
- command(s) for targeted tests and broader verification

Do not stop at the first match. Search for comparable behavior.

### 3. Identify behavior boundaries

List:
- inputs
- outputs
- side effects
- error cases
- authorization/security concerns
- persistence/network/file-system boundaries
- backward compatibility constraints
- performance-sensitive paths, if any

### 4. Create a TDD test list

List behavior scenarios, not implementation tasks.

For each test scenario include:
- behavior under test
- test level: unit, integration, contract, E2E, or eval
- why it matters
- likely test file
- existing helper/pattern to reuse
- whether it is required now or can wait

### 5. Recommend the first red test

Pick exactly one smallest useful first test.

Explain:
- why this is the right first test
- what failure should look like before implementation
- what implementation design pressure it creates
- what not to implement yet

## Output format

```markdown
## Intent

## Current system map
- Production:
- Tests:
- Helpers/patterns:
- Verification commands:

## Behavior boundaries

## TDD test list
1. ...

## First red test recommendation
- Behavior:
- Test level:
- File:
- Expected red failure:
- Why first:
- Do not implement yet:
```
