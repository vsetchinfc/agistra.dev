---
name: morning-standup
description: "Use when: Good morning Team, start-of-day briefing, or morning status request. Architect orchestrates; Builder, Tester, and Router return their sections as subagents."
argument-hint: "Good morning Team, or agent name for a targeted morning brief"
---

# Morning Standup

Start-of-day briefing routine. Triggered by the team lead saying **"Good morning Team"** (or variants). Architect orchestrates; Builder, Tester, and Router are invoked as subagents and return their sections to Architect.

## Trigger

Phrases: `"Good morning Team"`, `"Good morning"`, `"Morning Team"`.

Read your agent identity and follow the section below that matches.

---

## Architect — Orchestrator

### Rules

- Read-only. No file writes, no git operations, no memory updates.
- Bullet points only. The team lead will ask for detail if needed.
- Dispatch Builder, Tester, and Router as subagents in parallel before compiling the briefing.
- Read the live memory file first. Use only the latest available archive snapshot for additional context on carry-forward items or yesterday's outcomes.
- Do not scan all historical archive files by default.

### Protocol

**Step 1 — Read Architect's memory**

- Read `memory/architect.md` (HOT, WARM, COLD)
- Read the latest available archive snapshot at `memory/archive/architect-YYYY-MM-DD.md` if one exists
- Prefer `memory/architect.md` for current state. Use the archive snapshot only for context on carry-forward items, blockers, and yesterday's outcomes.

**Step 2 — Dispatch subagents**

Run Builder, Tester, and Router as subagents simultaneously with the morning-standup prompt. Collect their reports.

**Step 3 — Compile and deliver briefing**

```
Good morning. Team brief for [DATE].

**Architect**
- [HOT item 1 — one line status]
- [HOT item 2 — one line status]
- Today's focus: [from architect.md or latest archive Carry-Forward section]
- Decisions needed: [any team lead decision or approval needed, or "None"]

**Builder**
[paste Builder's bullets verbatim]

**Tester**
[paste Tester's bullets verbatim]

**Router**
[paste Router's bullets verbatim]

**Needs team lead today**
- [consolidated list of decisions, approvals, or inputs required across all agents — or "Nothing urgent"]
```

No closing questions. No narrative. Deliver and stop.

---

## Builder — Subagent

### Rules

- Invoked as a subagent by Architect.
- Read-only. No file writes, no git operations, no memory updates.
- Return bullet points only to Architect — do not deliver directly to the team lead.

### Protocol

**Step 1 — Read Builder's memory**

- Read `memory/builder.md` if it exists
- Read the latest available archive snapshot at `memory/archive/builder-YYYY-MM-DD.md` if one exists
- Prefer `memory/builder.md` for current state. Use the archive snapshot only for context on carry-forward items and yesterday's outcomes.

**Step 2 — Return brief**

```
**Builder**
- Active: [current branch or ticket — one line, or "No active work"]
- Yesterday: [one-line outcome summary, or "No sessions"]
- Blockers: [blocked on decision or environment issue, or "None"]
```

Three bullets maximum unless there are multiple active items. If nothing to report, return:

```
**Builder**
- Clear. No active work.
```

---

## Tester — Subagent

### Rules

- Invoked as a subagent by Architect.
- Read-only. No file writes, no git operations, no memory updates.
- Return bullet points only to Architect — do not deliver directly to the team lead.

### Protocol

**Step 1 — Read Tester's memory**

- Read `memory/tester.md` if it exists
- Read the latest available archive snapshot at `memory/archive/tester-YYYY-MM-DD.md` if one exists
- Prefer `memory/tester.md` for current state. Use the archive snapshot only for context on carry-forward items and yesterday's outcomes.

**Step 2 — Return brief**

```
**Tester**
- QA queue: [tickets in state:ready-for-qa — list briefly, or "Clear"]
- Yesterday: [one-line outcome summary, or "No QA runs"]
- Blockers: [environment issues, missing data, or "None"]
```

Three bullets maximum unless there are multiple queue items. If nothing to report, return:

```
**Tester**
- QA clear. Nothing pending.
```

---

## Router — Subagent

### Rules

- Invoked as a subagent by Architect.
- Read-only. No file writes, no git operations, no memory updates.
- Return bullet points only to Architect — do not deliver directly to the team lead.
- If no remote team is configured, return: `**Router** - Not configured. No relay activity.`

### Protocol

**Step 1 — Read Router's memory**

- Read `memory/router.md` if it exists
- Read the latest available archive snapshot at `memory/archive/router-YYYY-MM-DD.md` if one exists
- Prefer `memory/router.md` for current state. Use the archive snapshot only for context on carry-forward items and yesterday's outcomes.

**Step 2 — Return brief**

```
**Router**
- Routing: [any unresolved classifications or pending escalations — or "Clear"]
- Yesterday: [one-line summary of routing activity, or "No routing events"]
```

Two bullets maximum. If nothing to report, return:

```
**Router**
- Relay clear. Nothing pending.
```
