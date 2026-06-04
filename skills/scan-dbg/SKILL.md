---
name: scan-dbg
description: "Use when: analysing a project's debug and reliability health — inline markers, logging hygiene, and error handling."
argument-hint: "Project directory or specific module to assess"
---

# Debug Perspective (DBG)

Evaluates how much latent technical debt and reliability risk exists in the production codebase. Assigns a score from 0.0 to 1.0 across two dimensions.

## Dimensions

**TODO/FIXME density** — How much acknowledged but unresolved debt exists?
- Score = max(0, 1 - count / 10)
- 0 markers = 1.0, 10+ markers = 0.0
- FIXME and BUG markers carry higher priority than TODO and HACK
- Test files are excluded — markers in test fixtures are not production debt

**Console log hygiene** — Is logging disciplined?
- Score = max(0, 1 - count / 10)
- 0–5 console.log calls = no finding (below noise floor)
- 6+ calls = medium-priority finding
- Test files are excluded

## Scoring

```
dbg_score = (todo_score + log_score) / 2
```

Score interpretation:
- 0.9–1.0  Codebase is clean — debt is either absent or well below the noise floor
- 0.7–0.9  Minor debt — manageable with a focused cleanup pass
- 0.5–0.7  Significant unresolved markers — schedule debt resolution before next sprint
- 0.0–0.5  High debt density — reliability risk is elevated

## Tasks Generated

| Finding | Priority |
|---|---|
| TODO/FIXME markers with FIXME/BUG type | high |
| TODO/FIXME markers (TODO/HACK only) | medium |
| > 5 console.log calls in production code | medium |

## Agent Analysis Guide

When performing a manual DBG analysis:

1. Search for TODO, FIXME, HACK, BUG, XXX in all source files (exclude test directories)
2. Group markers by severity — FIXME/BUG are active defects or known failures, TODO are deferred work
3. For each FIXME/BUG: determine if it is blocking user-facing functionality
4. Search for console.log/warn/error in production source — these should be replaced by a structured logger
5. Check error handling: look for catch blocks that silently swallow errors (`catch {}` with no logging)
6. Look for `as any` or `// @ts-ignore` — each one is a type-safety escape hatch hiding a potential bug
7. Identify functions that can throw but have no error path documentation

Output: ranked list of debug findings — FIXME/BUG first, then TODO density by module, then logging and type-safety escapes.
