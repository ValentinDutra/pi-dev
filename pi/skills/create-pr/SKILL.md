---
name: create-pr
description: Create or update a pull request with a clear, no-bullshit description. Use when creating PRs, writing PR descriptions, updating PR titles or bodies. Triggers on create pr, open pr, pull request, pr description, update pr.
---

# Create PR

Create or update a PR for the current branch.

## Procedure

1. **Gather context thoroughly:**
   - `git log main..HEAD --oneline` to see all commits on the branch.
   - `git diff main...HEAD --stat` for a high-level view of what changed.
   - `git diff main...HEAD` to read the actual diff (skim large diffs, focus on key files).
   - If commits reference issues (e.g., `#1234`, `Fixes #567`), **read those issues with `gh issue view`** to understand the real motivation.
   - If updating an existing PR, read the current title and body with `gh pr view`.
   - Check the branch name — it often encodes intent (e.g., `fix/null-email-crash`, `feat/pagination`).

2. **Establish the *why* before writing anything.**
   - The *why* must come from a real source: the linked issue, commit messages, the branch name, or the user.
   - If none of these explain the motivation clearly, **ask the user**. Do not infer or fabricate a why from the code alone. AI describing what changed without why is the #1 complaint about AI-generated PRs.

3. **Write the PR** following the rules below, then show the draft to the user and ask for confirmation before creating or updating.

4. **Create or update:**
   - Write the body to a temp file and pass it with `--body-file`. macOS bash breaks on an apostrophe inside `--body "$(cat <<'EOF' … EOF)"` (`unexpected EOF while looking for matching '`), and PR bodies are full of them ("Juan's", "doesn't").
   - New PR: `gh pr create --title "..." --body-file /tmp/pr-body.md`
   - Update existing: `gh pr edit --title "..." --body-file /tmp/pr-body.md`
   - **Demo video, on every PR that changes something that runs:** record a short video, under 1 minute, that
     shows what this PR implements, one caption per step. If the full flow
     can't run locally (no model credits, an external system), show the part
     that can: the screen with seeded data, an API response, or a terminal
     output. Label any seeded or synthetic data in a caption and in the body.
     Watch the whole recording before attaching it and check each caption
     against the screen. Record it with Playwright against the
     local dev server, then attach it to the description:
     `gh pr edit <number> --attach ./demo.mp4`. It shows up as a video player.
     A PR that changes nothing that runs (seed content, docs, config) has no
     video; say so in the body.
     `--attach` needs gh 2.99.0 or newer: check `gh --version` and upgrade if
     it's older.

## Title

Sentence case, specific, focus on the key change. Optional conventional commit prefix.

Good:
- `fix: Profile crash when user email is null`
- `Add pagination to user management table`
- `Refactor auth context to use zustand`

Bad:
- `Fix bug`
- `Updates`
- `Refactor Python scripts for better maintainability` (says nothing about what or why)

Template: `[Action] [What] [Where/When/Why if it fits]`

## Body Rules

### The Why-What-Tradeoffs hierarchy

Every PR description follows this order. How much of each depends on PR complexity.

1. **Why** (always required): What problem exists? What's the motivation? If it's a bug, what's the concrete user impact? If it's a feature, what need does it serve? This is the most important part — the diff shows *what* changed, only the description explains *why*.

2. **What** (required if non-trivial): High-level approach. Not line-by-line narration of the diff, but the shape of the solution. What strategy did you take?

3. **Tradeoffs / key decisions** (required for medium+ PRs): What alternatives did you consider? Why this approach over others? What's non-obvious about the implementation? This is the highest-value content in a PR description — it's the one thing a reviewer cannot get from the diff alone.

4. **Reviewer guidance** (optional, for larger PRs): Where should the reviewer focus? What files matter most? What can they skim?

### Scaling by PR size

**Trivial** (typos, dep bumps, one-line fixes, config changes):
One sentence. Don't overthink it.

```
Fixes a crash when `order.customer` is nil during webhook processing.
```

```
Bumps `sorbet-runtime` from 0.5.10 to 0.5.11 to pick up the frozen string fix.
```

**Medium** (a focused change touching a few files, a bug fix with some context, a small feature):
A short paragraph or a few bullets. Lead with why, follow with what. Mention key decisions if relevant. No headers needed.

```
Users with null emails from the 2019 migration crash on "Edit Profile" — affects ~500 users.

Added a null check before `toLowerCase()`. Shows an "Add email" prompt instead of the edit form when email is missing. Chose this over backfilling null emails with a placeholder because that creates invalid data without solving the root problem.

Fixes #1234
```

```
The checkout session was being created before payment validation, causing duplicate charges on double-click (~23 incidents last week).

* Disable the submit button on first click, re-enable on response
* Added 1-second debounce as secondary protection
* Button-only change — no payment logic modified, safe to rollback
```

**Large** (multi-file refactor, new feature, architectural change, migration):
Use light headers for skimmability. Still keep it concise — aim for something a reviewer can read in under 2 minutes.

```
## Why

User management page loads all users at once. For admins with 1000+ users,
this means 15s+ load times and browser crashes.

## Approach

Server-side pagination: 50 users per page (configurable), with page controls
that preserve search/filter state across pages.

Backend adds `limit`/`offset` params to `/api/users` (backward compatible —
defaults to 50). Frontend uses `useQuery` with pagination state.

## Key decisions

- 50 per page over 25: balances load time vs scrolling based on usage data
- Page numbers over infinite scroll: users need to share links to specific pages
- Didn't use cursor-based pagination: overkill for admin-only table with stable data

## Reviewer notes

Focus on `UserController.ts` (API changes) and `usePagination.ts` (new hook).
The `package-lock.json` diff is just a transitive dep update, safe to skip.

Fixes #1234
```

### Anti-patterns (never do these)

- Marketing language: "This PR improves...", "This enhancement enables...", "This change optimizes..."
- Restating the diff in English: "In `user.rb`, changed line 45 to add a nil check..."
- Listing every file changed.
- Explaining how the language or framework works.
- Generic testing claims: "thoroughly tested", "all tests pass" without specifics.
- Hedging: "This might help with...", "This could potentially..."
- LLM signatures: "Generated by", "Let me know if you have questions", "Happy to discuss".
- Using ## headers for trivial/medium PRs. Headers are for large PRs only.
- Inventing a *why*. If you don't know why, ask.

### Linking

- If the PR closes an issue: `Fixes #1234` or `Closes #1234` at the end (GitHub auto-closes it).
- If related to other PRs or issues: mention them briefly.
- If part of a stack: note the position (e.g., "Part 2 of 3 in the auth migration").
- Don't just link to a ticket as the entire description. The PR should stand on its own.

## Updating an Existing PR

When updating a PR's title or body, preserve scope prefixes (e.g., `[insights]`, `[targets]`) and structural conventions from the original unless explicitly asked to change them.

## Do NOT Add

Labels, reviewers, assignees, `Co-Authored-By`, or `Generated by` lines.
