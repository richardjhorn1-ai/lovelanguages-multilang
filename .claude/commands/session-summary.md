# /session-summary — End-of-Session Context Capture

When the user invokes `/session-summary`, generate a structured summary of the current session that can be pasted at the start of a new session to restore context.

## How to Generate

1. **Review the conversation** — scan all tool calls, file edits, decisions made
2. **Check git status** — run `git status`, `git diff --stat`, `git log --oneline -5`
3. **Check build** — run `npx tsc --noEmit` and note pass/fail
4. **Compile the summary** using the format below

## Output Format

Generate a fenced block the user can copy-paste:

```markdown
## Session Summary — [DATE]

### What Was Done
- [List files created, modified, or deleted]
- [List features added, bugs fixed, refactoring done]
- [List any migrations or dependency changes]

### Decisions Made
- [Architecture decisions with brief reasoning]
- [Trade-offs considered and which option was chosen]
- [Anything the user explicitly approved or rejected]

### Current State
- **Branch**: [branch name]
- **Pushed?**: [yes/no — if no, note unpushed commits]
- **Build**: [passes/fails — if fails, note the error]
- **Uncommitted changes**: [yes/no — brief description if yes]

### What Remains
- [Unfinished tasks or known issues]
- [Next steps if this work continues]
- [Any blockers or open questions]

### Key Files Touched
- [List the most important files modified, with brief note on what changed]
```

## Rules

- **Be specific** — file paths, not vague descriptions
- **Be honest** — if something is broken, say so
- **Include decisions** — the next session's biggest risk is re-debating settled questions
- **Keep it scannable** — bullet points, not paragraphs
- **Don't include secrets** — no API keys, tokens, or passwords in the summary
