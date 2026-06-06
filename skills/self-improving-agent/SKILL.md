---
name: self-improving-agent
description: "Use when: the agent captures a correction from the team lead, hits an unexpected error, discovers a capability gap, or finds a better practice. Logs to .learnings/ and promotes durable patterns to permanent project memory."
argument-hint: "Correction, unexpected error, capability gap, or recurring pattern to log or promote"
---

# Self-Improving Agent

Adapted from [pskoett/self-improving-agent v3.0.21](https://clawhub.ai/pskoett/self-improving-agent) — MIT License. Enables the agent to capture corrections, errors, and knowledge gaps during sessions and promote durable learnings into permanent project memory.

## When to Log

| Trigger | Where |
| ------- | ----- |
| Command or operation fails unexpectedly | `.learnings/ERRORS.md` |
| the team lead corrects the agent ("No, that's wrong...", "Actually...") | `.learnings/LEARNINGS.md` — category: `correction` |
| the team lead requests a capability that does not exist | `.learnings/FEATURE_REQUESTS.md` |
| The agent's knowledge proves outdated or incorrect | `.learnings/LEARNINGS.md` — category: `knowledge_gap` |
| A better approach is discovered for a recurring task | `.learnings/LEARNINGS.md` — category: `best_practice` |

Also review `.learnings/` before starting a major task or entering a new codebase area.

---

## First-Use Initialisation

Before logging anything, ensure the `.learnings/` directory exists in the project root. If missing, create:

```
.learnings/LEARNINGS.md
.learnings/ERRORS.md
.learnings/FEATURE_REQUESTS.md
```

Never overwrite existing files.

Do not log secrets, tokens, private keys, environment variables, or raw command output with sensitive data. Prefer short summaries or redacted excerpts.

---

## Log Formats

### Learning Entry — `.learnings/LEARNINGS.md`

```
## [LRN-YYYYMMDD-XXX] category

**Logged**: ISO-8601 timestamp
**Priority**: low | medium | high | critical
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Summary
One-line description of what was learned

### Details
What happened, what was wrong, what is correct

### Suggested Action
Specific fix or improvement

### Metadata
- Agent: architect | builder | tester | router
- Source: conversation | error | user_feedback
- Related Files: path/to/file.ext
- Tags: tag1, tag2
- See Also: LRN-20250110-001
- Pattern-Key: simplify.dead_code | harden.input_validation (optional)
- Recurrence-Count: 1 (optional)

---
```

### Error Entry — `.learnings/ERRORS.md`

```
## [ERR-YYYYMMDD-XXX] skill_or_command_name

**Logged**: ISO-8601 timestamp
**Priority**: high
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Summary
Brief description of what failed

### Error
Actual error message or output (redact secrets)

### Context
- Command attempted
- Input or parameters used
- Environment details if relevant

### Suggested Fix
If identifiable, what might resolve this

### Metadata
- Reproducible: yes | no | unknown
- Related Files: path/to/file.ext
- See Also: ERR-20250110-001

---
```

### Feature Request Entry — `.learnings/FEATURE_REQUESTS.md`

```
## [FEAT-YYYYMMDD-XXX] capability_name

**Logged**: ISO-8601 timestamp
**Priority**: medium
**Status**: pending
**Area**: frontend | backend | infra | tests | docs | config

### Requested Capability
What the team lead wanted to do

### User Context
Why it was needed, what problem it solves

### Complexity Estimate
simple | medium | complex

### Suggested Implementation
How this could be built

### Metadata
- Frequency: first_time | recurring
- Related Features: existing_feature_name

---
```

---

## ID Format

`TYPE-YYYYMMDD-XXX` where TYPE is `LRN`, `ERR`, or `FEAT` and XXX is a sequential number or 3-char token.

---

## Resolving Entries

When an issue is fixed, update the entry:

1. Change `**Status**: pending` → `**Status**: resolved`
2. Add after Metadata:

```
### Resolution
- **Resolved**: ISO-8601 timestamp
- **Commit/PR**: abc123 or #42
- **Notes**: Brief description of what was done
```

Other status values: `in_progress`, `wont_fix`, `promoted`.

---

## Promotion to Project Memory

When a learning applies across multiple files or features, or prevents a recurring mistake, promote it.

| Promotion target | What goes there |
| ---------------- | --------------- |
| `/memories/repo/<project>.md` | Project facts, conventions, verified practices |
| `AGENTS.md` in the workspace | Workflow improvements, automation rules |
| `/memories/` user memory | Cross-project patterns and preferences |

### Promotion threshold

Promote when `Recurrence-Count >= 3`, seen across at least 2 distinct tasks, within a 30-day window.

After promoting: change `**Status**: pending` → `**Status**: promoted` and add `**Promoted**: <target file>`.

---

## Recurring Pattern Detection

Before logging, search: `grep -r "keyword" .learnings/`

If a match exists, link entries with `See Also` and increment `Recurrence-Count`. Recurring patterns indicate missing documentation, missing automation, or an architectural problem — consider a ticket.

---

## Periodic Review

Review `.learnings/` at natural breakpoints: before a major task, after completing a feature, or weekly during active development.

```bash
# Count pending items
grep -h '\*\*Status\*\*: pending' .learnings/*.md | wc -l

# List high-priority pending
grep -B5 '\*\*Priority\*\*: high' .learnings/*.md | grep "^## \["
```
