---
name: scan-dbg
description: "Use when: analysing a project's debug and reliability health — inline markers, logging hygiene, and error handling."
argument-hint: "Project directory or specific module to assess"
---

# Debug Perspective (DBG)

Evaluates how much latent technical debt and reliability risk exists in the production codebase. Assigns a score from 0.0 to 1.0 across five dimensions.

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

**Error handling hygiene** — Are errors surfaced rather than silently swallowed?
- Look for: `catch {}` with no logging, `catch (e) {}` that swallows the error, `.catch(() => {})` no-ops
- Score: 1.0 if no silent swallows, 0.5 if 1–3 found, 0.0 if 4+
- Finding priority: high (silent swallows hide production failures)

**Type-safety escapes** — Are type bypasses minimised?
- Look for: `as any`, `// @ts-ignore`, `// @ts-nocheck`, `// eslint-disable`
- Score: max(0, 1 - count / 5)
- Finding priority: medium

**Observable failure modes** — Can operators see failures from outside the module?
- Heuristic: presence of structured logging, error event emission, or health-check endpoints
- Score: 1.0 if at least one observable output exists per module boundary, 0.5 if partial, 0.0 if none
- Finding priority: medium

## Scoring

```
dbg_score = (todo_score + log_score + error_score + typesafe_score + observable_score) / 5
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
| Silent error swallows in catch blocks | high |
| Type-safety escape hatches (as any, @ts-ignore) | medium |
| No observable failure output in module | medium |

## Agent Analysis Guide

When performing a manual DBG analysis:

1. Search for TODO, FIXME, HACK, BUG, XXX in all source files (exclude test directories)
2. Group markers by severity — FIXME/BUG are active defects or known failures, TODO are deferred work
3. For each FIXME/BUG: determine if it is blocking user-facing functionality
4. Search for console.log/warn/error in production source — these should be replaced by a structured logger
5. Check error handling: look for catch blocks that silently swallow errors (`catch {}` with no logging, `.catch(() => {})` no-ops)
6. Look for `as any`, `// @ts-ignore`, `// @ts-nocheck`, or `// eslint-disable` — each one is a type-safety escape hatch hiding a potential bug
7. Identify whether each module boundary has at least one observable failure output: structured logging, error event emission, or a health-check endpoint

```bash
# Structured logging — look for a logger library in use
grep -r "winston\|pino\|bunyan\|logger\." src/ --include="*.ts" --include="*.js" -l

# Error event emission — look for error events being emitted
grep -r "emit.*['\"]error['\"]" src/ --include="*.ts" --include="*.js" -l

# Health-check endpoints — look for health or ping routes
grep -r "['\"]\/health\|['\"]\/healthz\|['\"]\/ping\|healthCheck\|health_check" src/ --include="*.ts" --include="*.js" -l
```

Output: ranked list of debug findings — FIXME/BUG first, then TODO density by module, then silent swallows, then logging and type-safety escapes, then observability gaps.

When debugging failures are found, apply the Root Before Repair (RBR) protocol from `skills/agent-foundations/SKILL.md` — confirm root cause with evidence before proposing a fix.
