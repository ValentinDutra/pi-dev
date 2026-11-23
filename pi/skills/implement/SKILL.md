---
name: implement
description: Start the implementer subagent on a plan in its own worktree, then run the reviewer and simplify-reviewer until every finding is fixed. Use for every code change once a plan exists. Triggers on implement, implement the plan, build it, start the implementer, /skill:implement [plan path].
---

# Implement

The main session orchestrates. It never edits code in the worktree; the implementer does.

## 1. Prepare the worktree

1. Find the plan: the argument, else ask which file in `~/.pi/agent/plans/<repo>/`. Read it. Its header names `Repo`, `Branch` and `Base`.
2. Get a worktree for `Branch` at `<repo parent>/<repo name>-<branch with / replaced by ->`, following the Git rules in `AGENTS.md`:
   - A worktree for the branch exists: reuse it.
   - The branch exists only on the remote: `git -C <repo> fetch origin <branch>`, then `git -C <repo> worktree add <path> <branch>`.
   - Otherwise fast-forward `Base` and create the branch from it.

## 2. Start the implementer

If the plan header has no `Started:` line, add `Started: <local time, YYYY-MM-DD HH:MM>` under `Base:`. `/skill:finish` logs the task's hours in Toggl from it.

```
subagent({
  name: "implementer",
  agent: "implementer",
  cwd: "<worktree>",
  task: "Plan: <plan path>\nWorktree: <worktree>\nBase branch: <base>\nImplement every task in the plan."
})
```

End the turn. The result arrives as a message with a `Session:` line; keep that path.

## 3. Start both reviewers as soon as the implementer reports

- **Blocked:** show the implementer's question and stop.
- **Done:** spawn both reviewers in parallel right away, before replying. Give them the requirements, not the implementer's report:

```
subagent({
  name: "reviewer",
  agent: "reviewer",
  cwd: "<worktree>",
  task: "Subject: the branch diff, `git diff <base>...HEAD`. Requirements: the Goal and Out of scope sections of <plan path>."
})
subagent({
  name: "simplify-reviewer",
  agent: "simplify-reviewer",
  cwd: "<worktree>",
  task: "Subject: the branch diff, `git diff <base>...HEAD`. Requirements: the Goal and Out of scope sections of <plan path>."
})
```

## 4. Fix every finding, up to 3 rounds

1. When both reviewers report, give every finding to a fresh implementer. If a finding contradicts a decision the user made, ask the user about that one instead of sending it.

```
subagent({
  name: "implementer",
  agent: "implementer",
  cwd: "<worktree>",
  task: "Plan: <plan path>\nWorktree: <worktree>\nBase branch: <base>\nThe plan is implemented on this branch. Apply these review findings: <every finding with its proof, written out>\nThe previous implementer reported: <its final message>"
})
```

   Resume the previous implementer instead (`subagent_resume` with the `Session:` path from its result) only when the fix needs context it built that its report does not carry and that is costly to rebuild.
2. When it reports, review again (step 3). Stop when both reviews have no findings, or after the third fix, then go to step 5.
3. Show the user the commits, the verification results, and each round's findings with how they were fixed.

## 5. Close out

Run `/skill:create-pr` from the worktree, then `/skill:finish` in this session.
