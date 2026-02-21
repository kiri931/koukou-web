---
name: commit
description: Create commit messages and run actual Git commits based on current changes and recent repository commit history. Use when asked to "commit", "write a commit message", "commit this work", or when the user wants commit wording aligned with past messages.
---

# Commit Workflow

Follow this sequence every time:

1. Inspect repository state.
2. Inspect recent commit message style.
3. Summarize the current change scope.
4. Draft one concise commit message that matches local history.
5. Stage and commit with non-interactive commands.
6. Verify and report result.

## Inspect State

Run:

```bash
git status --short
git diff --stat
git diff --cached --stat
```

If there are no changes, report that and stop.

## Inspect History Style

Run:

```bash
git log --pretty=format:'%s' -n 20
```

Mirror local conventions:

- Imperative style if the repository uses it
- Prefix patterns (for example: "Add ...", "Update ...", "Fix ...")
- Similar scope granularity to nearby commits

Use `scripts/commit_context.sh` when you need a compact snapshot.

## Draft Message

Create a single-line subject first. Keep it specific to actual file changes.

Rules:

- Do not mention files that are not part of the commit.
- Do not invent motivations that are not visible in the diff.
- Keep subject short and action-oriented.

## Commit Commands

Use non-interactive commands only.

```bash
git add -A
git commit -m "<subject>"
```

If only part of the change should be committed, stage explicitly (for example `git add <paths>`) before commit.

## Verify

After committing, run:

```bash
git show --stat --oneline -1
git status --short
```

Report the created commit hash and subject.
