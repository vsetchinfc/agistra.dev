[← README](../../README.md) · [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)

---

# dreaming

End-of-day memory consolidation. Each agent reviews the session, promotes durable patterns, writes a dated archive snapshot, and compacts the live memory file down to only what's needed tomorrow.

---

## Trigger

Say **"Good night"** (or "Good night Team", "EOD", "Wrapping up") to any agent.

---

## How it works

Every agent runs the same consolidation steps:

1. **Review session memory** — read all files in the session memory store
2. **Identify what's worth keeping** — recurring patterns, corrections from you, carry-forward items, durable knowledge
3. **Review for contradictions** — scan the agent's own recent memory (never another agent's) for a statement that conflicts with an earlier entry on the same topic, and flag it — see below. Best-effort, never auto-resolved.
4. **Promote durable items** — to the appropriate project memory store
5. **Write dated archive snapshot** — `memory/archive/<agent>-YYYY-MM-DD.md`
6. **Compact live memory** — rewrite `memory/<agent>.md` to keep only what matters tomorrow

---

## Contradiction review (best-effort, human review only)

Each agent's nightly pass also reviews its own recent memory (current HOT plus roughly the last 7 days of its own archive — never another agent's file) for two statements that assert a different value for the same tracked fact (a stack description, a port number, a repo path, a capability claim, etc.). Anything that looks like a genuine conflict is written to a `## Flagged Contradictions` section in that day's archive snapshot, with both statements and their sources — never picked between automatically. A human decides which is current.

This is a best-effort net, not a guarantee: it will miss real contradictions, and should never be treated as complete coverage.

---

## Archive snapshot structure

```markdown
# Architect Archive — YYYY-MM-DD

## Completed Today
- [tasks finished]

## Promoted Memory
- Repo: [patterns, decisions, conventions added to project memory]

## Flagged Contradictions
- [conflicting statement pairs found this cycle, with sources — omit if none found]

## Carry-Forward
- [items still active tomorrow]

## Blockers For You
- [decisions or approvals still needed]

## Compacted
- [what was removed from live memory and why]
```

---

## What stays in live memory vs. what moves to archive

| Keep in live memory | Move to archive |
| --- | --- |
| Active HOT tickets | Resolved same-day tasks |
| Explicit carry-forward items | Day-specific context |
| Durable WARM/COLD knowledge | Working buffer entries after recovery |

---

## Cascade

When you say "Good night" to Architect, dreaming cascades through the team:

1. Architect consolidates its own memory
2. Architect dispatches Tester as a subagent to consolidate
3. Tester dispatches Router to consolidate

Each agent consolidates its own memory independently — no agent reads or writes another agent's memory during dreaming.

---

**Carried by:** [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)
