## Git
- Never implement features in a repo's main checkout; parallel agents share it. Only refresh it. Create a worktree per feature; reuse an existing one for the branch.
- Before creating a feature worktree, fast-forward local `main`. `git worktree add` branches from local `main`, so a stale `main` gives a stale branch. Run these one after another, never in parallel:
  ```bash
  git -C <repo> pull --ff-only origin main
  git -C <repo> worktree add <path> -b <branch> main
  ```
  If the pull fails, stop and report it. Never stash, reset, or discard changes in the main checkout to make it pass.
- Once a worktree's branch has an open PR and the worktree has no uncommitted, unpushed or untracked work, remove it with `git worktree remove <path>` then `git worktree prune`. Never `rm -rf` it, and never pass `--force`; if removal refuses, stop and ask.
- Keep a subagent's or child bb thread's worktree and thread until I approve its result ("ok", "merge it", or similar); this replaces the open-PR rule above for them. Then remove its worktree (`git worktree remove`, never `--force`) and delete the thread with `bb thread delete <id> --yes`. If the worktree has uncommitted, unpushed or untracked work, push it or report it first and keep both until it is safe; never lose work to clean up.
- Never run git commands that open an editor (`git commit` without `-m`, `git rebase -i`, `git rebase --continue`, `git merge`). They hang. Prefix `GIT_EDITOR=true` or pass `--no-edit`.
- Use `gh` for anything on github.com. It handles auth.
- Open PRs as DRAFT and assigned to me: `gh pr create --draft --assignee @me`. Never merge a PR yourself.
- Never reference a PR by shorthand like `ValentinDutra/defensa-sync#12`. Always write the full URL: https://github.com/ValentinDutra/defensa-sync/pull/12

## Code
- Follow YAGNI.
- No abbreviated variable names.
- Prefer self-documenting code. Comment only what the code cannot state: external library behavior, upstream data guarantees, non-obvious constraints.
- Never put a rejected alternative or reasoning about non-existent code in a comment or docstring. That belongs in the commit message or PR description.
- Tests are liability. Minimum tests, maximum value.
- A bug fix contains only the fix. No bundled enhancements.
- Write all code, identifiers, file names, wire contracts, docs/ADRs, commit messages, and PRs in English (even in repos whose CLAUDE.md defaults to Spanish); keep Spanish only for user-facing domain templates and UI text.

## Working
- Verify facts before stating them: source code, local files, docs, MCPs, skills, web.
- Exhaust those resources before asking me.
- Challenge my assumptions — I might be wrong.
- For a reported bug, confirm the cause from the reporter's evidence or a reproduction before editing code. State the hypothesis and what would confirm it.
- When asking me to choose between interpretations, show a concrete example of each in the same question.
- Use subagents only when independent investigation, context isolation, or focused review justifies the handoff cost.
- Code changes go through `/skill:plan`, then `/skill:implement`. The main session never edits repo code itself.
- When an agent gets something wrong twice, the fix is a deterministic check in the project (architecture, a type, a lint rule, or a test), never a rule nothing enforces. `/skill:finish` tracks them in the project's `## Rules` table.
- Consult the advisor before committing to an approach, when the same error comes back, and before declaring a task done.
- I use every task to learn, whatever the subject: AI engineering, architecture, languages, infrastructure, tools, domains. The first time a chat works with a technology, framework, language, tool, pattern or decision, research it from primary sources (official docs, source code), then add a note labelled "Why this way" after the action: what it is, what it gives us, what it costs, what we weighed it against and why we chose this, and what would change the decision. About 6 lines, once per topic per chat. This note is requested content, not a tangent: brevity rules do not remove it.
- Never write `[label](url)`. Pi renders it as an OSC 8 hyperlink that prints only the label, so the URL vanishes. Write URLs bare: `see the PR: https://github.com/x/y/pull/1`.

## Paths
- Personal repos: `~/Documents/Projects/Personal/<repo>` (GitHub: `ValentinDutra`)
- University repos: `~/Documents/Projects/ingsw/<repo>`
- Pi harness: `~/Documents/Projects/Personal/pi-dev` (project `.pi/`), global pi config: `~/.pi/agent`
- Neovim: `~/.config/nvim/` (LazyVim + lazy.nvim; plugins in `lua/plugins/`, config in `lua/config/`)
