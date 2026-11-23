@[Pi global instructions](~/.pi/agent/AGENTS.md)

@[ADHD mode](~/.pi/agent/git/github.com/ayghri/i-have-adhd/skills/i-have-adhd/SKILL.md)

## Antigravity differences from Pi
- There is no advisor tool. Skip instructions to consult the advisor.
- `/skill:<name>` means: load and follow the skill named `<name>`.
- Pi's `subagent` tool maps to `invoke_subagent` with the custom agents `implementer`, `reviewer` and `simplify-reviewer`. Use Workspace `branch` when the task needs its own worktree. This overrides bb's instruction to translate `subagent` into `bb thread spawn`: the Pi agent files name Claude models that Antigravity cannot run.
