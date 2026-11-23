---
name: finish
description: Close out a task once its PR is up. Turn repeated agent mistakes into project checks, capture skill fixes, remove the worktree, log the hours, delete the plan. Run in the session that ran /skill:implement, after /skill:create-pr. Triggers on finish, close out, wrap up the task, /skill:finish.
---

# Finish

Run in the main session that drove the task, after `/skill:create-pr`.

## 1. Check the PR

`gh pr view <branch> --json url,state` must show an open PR. If it does not, stop: the user runs `/skill:create-pr` first.

## 2. Make repeated mistakes impossible

The project's `AGENTS.md` keeps a `## Rules` table with one row per mistake class: the rule, and what enforces it (`none yet` until a check exists).

1. List the mistakes: every finding the reviewers made the implementer fix, and every time the user corrected or redirected an agent in this session. Group them into classes, and count each class: its occurrences in this session, plus one if its row says `none yet`.
2. A class seen once gets a new row enforced by `none yet`. A class seen twice or more: propose a fix at the highest level that works:
   1. Architecture: one owner per piece of state, one supported way per task, hide internals so the wrong import fails, delete the old way an agent would copy.
   2. A type, so the bad state can't be written.
   3. A lint rule whose error names the file, type or function to use instead: an existing rule or option of the linter the project runs first, a custom rule only when none fits.
   4. A test of the behavior.
   Say why each higher level doesn't work. A class no check can catch gets or keeps a `none yet` row.
3. Show the PR URL, the new rows and the proposed fixes. Wait until the user approves the result and picks the fixes.
4. Start a fresh implementer (`subagent({agent: "implementer", ...})`) in the worktree, even when no fix was picked. Its task holds the approved rows, and each approved fix with the mistake it targets (the commit that fixed it, or the reviewer's repro). It adds the rows to the `## Rules` table, creating the table if missing, in one commit. Then it commits each fix on its own: the check, proof that it fails on that mistake, the verification commands, and its row's enforcer set to the check. Push its commits to the PR branch.
5. Follow `~/.pi/agent/prompts/session-retro.md` only for skill instructions that were wrong or missing; a mistake from step 1 never becomes skill text.

## 3. Remove the worktree

1. In the worktree, `git status --porcelain` must print nothing and `git status -sb` must show nothing ahead of the upstream. If not, stop and report.
2. `git -C <repo> worktree remove <worktree>`, then `git -C <repo> worktree prune`.
3. In bb, delete each child thread this task spawned: `bb thread delete <id> --yes`.

## 4. Log the hours in Toggl

1. Ask how many whole hours the task took. If the plan's `Started:` is today and less than 8 hours ago, suggest the elapsed hours rounded, at least 1. Otherwise ask without a suggestion.
2. Preview: `~/.pi/agent/bin/toggl-log.mjs --description "<plan title, in English>" --hours <hours> --from <Started: date> --dry-run`. The plan title is its `# Title` line. Without a `Started:` line, omit `--from`; it defaults to today. The script fills weekdays to 8 hours from 08:00 and continues on the next weekday.
3. Show the preview, wait for approval, then run the same command without `--dry-run`.

## 5. Delete the plan

Delete the plan file in `~/.pi/agent/plans/<repo>/`. Delete that directory if it is now empty.

Report what was removed, the hours logged in Toggl, and the PR URL.
