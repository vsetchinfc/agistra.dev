[← README](../../README.md) · [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)

---

# morning-standup

Start-of-day briefing routine. Architect orchestrates; Builder, Tester, and Router contribute their HOT state as subagents. Read-only — no file writes, no git operations, no state changes.

---

## Trigger

Say **"Good morning"** (or "Good morning Team", "Morning Team") to Architect.

---

## How it works

1. Architect reads its own HOT memory (`memory/architect.md`)
2. Builder, Tester, and Router are dispatched as subagents simultaneously
3. Each agent reads its own memory and returns a short bullet summary
4. Architect compiles all sections and delivers the brief

---

## Brief format

```
Good morning. Team brief for [DATE].

Architect
- [HOT item — one line status]
- Today's focus: [from memory carry-forward]
- Blockers for you: [decisions or approvals needed — or "None"]

Builder
- Active tickets: [state:in-progress items — or "Clear"]
- Blockers: [or "None"]

Tester
- QA queue: [tickets at state:ready-for-qa — or "Clear"]
- Blockers: [environment issues, missing data — or "None"]

Router
- Routing: [pending inbound classifications or escalations — or "Clear"]

Needs you today
- [consolidated list of decisions, approvals, or inputs — or "Nothing urgent"]
```

No narrative. Bullet points only. Architect delivers and stops — you ask for detail if needed.

---

## Memory tiers surfaced

Each agent reports from its HOT tier only — active tickets, active blockers, pending decisions. WARM and COLD items are not surfaced unless explicitly carry-forwarded.

---

**Carried by:** [Architect](../ARCHITECT.md) · [Builder](../BUILDER.md) · [Tester](../TESTER.md) · [Router](../ROUTER.md)
