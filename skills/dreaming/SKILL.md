---
name: dreaming
description: "Use when: Good night Team, EOD, Wrapping up, or end-of-day consolidation. Archives session context, promotes durable patterns, and compacts live agent memory files for the next session."
argument-hint: "EOD trigger phrase or agent name for targeted consolidation"
---

# Dreaming

End-of-day archive-and-compact routine. Reviews the current session plus relevant memory touched during the day, promotes durable patterns, writes a dated archive snapshot, then compacts the live repo memory file down to current state for the next session. Runs on demand — triggered by the team lead saying **"Good night Team"** (or variants).

## Trigger

Phrases that activate dreaming: `"Good night Team"`, `"Good night"`, `"Goodnight Team"`, `"Wrapping up"`, `"EOD"`.

Read your agent identity and follow the per-agent delta below after running the shared consolidation steps.

## Consolidation Rules

- Preserve scope. Do not flatten all memories into one file. Session, repo, and user memory remain in their native stores.
- Treat `memory/<agent>.md` as the live current-state file for the next session, not as the full historical archive.
- Write a dated archive snapshot to `memory/archive/<agent>-YYYY-MM-DD.md` before compacting the live file.
- If the live repo memory file does not exist, create it with HOT / WARM / COLD headings before compacting it.
- If the archive directory does not exist, create `memory/archive/` before writing the dated snapshot.
- Session memory may be deleted after it has been captured in the daily checkpoint or promoted elsewhere.
- Repo and user memory compaction is opt-in only. Rewrite or delete entries there only when they are explicitly marked `dreaming-managed` or were created as transient capture for the same dreaming cycle.
- Never clear the full user, session, or repo memory stores wholesale.
- When compacting the live file, keep only current HOT items, explicit carry-forward items, and durable WARM/COLD knowledge. Move fully resolved day-specific detail into the archive snapshot.

## Compaction Decision Table

An entry or item is eligible for retirement to archive (and not carried forward to the live file) when it meets one of these criteria:

| Criterion | Applies To | Decision | Action |
|-----------|-----------|----------|--------|
| **Resolved signal present** | Any section | "done", "✓ CLOSED", "✓ MERGED", "closed", "merged" in entry text | Retire to archive. Summarise outcome (1 line) if exceeding 500 chars. |
| **No open ticket/PR reference** | LAST_EVENT | Entry is older than 7 days AND contains no active GitHub issue, PR, or blocker reference | Move to archive. |
| **LAST_EVENT age cap** | LAST_EVENT | More than 10 entries in LAST_EVENT section | Keep only the 10 most recent; move older to archive. |
| **HOT entry not referenced in 48h** | HOT | Entry not touched/updated in last 48 hours | Move to WARM during EOD consolidation. |
| **WARM entry not referenced in 7d** | WARM | Entry not touched/updated in last 7 days | Move to COLD during EOD consolidation. |
| **Explicit carry-forward marker** | Any section | Entry contains `carry-forward: true` or `EOD-keep` | Keep in live file (overrides age/size rules). |
| **Transient resolved detail** | Any section | Entry explicitly marked `dreaming-managed` AND has been captured in archive | Delete from live file. |

**Size cap rule:** Individual LAST_EVENT entries in the live file are soft-capped at 500 chars. Entries exceeding this during compaction are summarised to a one-liner (date + outcome + ticket reference) in the live file; full detail is archived.

## Shared Consolidation Steps

Every agent runs these steps. Per-agent sections below specify only the variables (which file, what to promote, who to dispatch).

1. **Review session memory** — read `memory/working-buffer.md` if it exists (session context captured during the session by the Working Buffer Protocol in `proactive-agent`).
2. **Review relevant durable memory touched this session** — inspect the live repo memory file plus any user-memory or repo-memory topics updated during the session; skip unrelated memory topics.
3. **Identify promotable patterns, carry-forward items, and compaction candidates** — using the agent's promotion focus and the Compaction Decision Table (above). Apply decay rules explicitly:
   - **HOT → WARM decay:** Items last referenced more than 48 hours ago move to WARM.
   - **WARM → COLD decay:** Items last referenced more than 7 days ago move to COLD.
   - **LAST_EVENT retirement:** Entries older than 7 days with no open ticket/PR/blocker reference go to archive. Cap LAST_EVENT at 10 most recent entries total.
4. **Size audit LAST_EVENT entries** — entries exceeding 500 chars are summarised to a one-liner (date + outcome + ticket ref) in the live file; full detail moves to archive.
5. **Promote durable items** — append to the targets listed in the agent's per-agent delta, preserving source labels when helpful.
6. **Write daily archive snapshot** — create or overwrite the archive file at the per-agent path using the structure below. Record before/after line counts in the "Compacted" section.
7. **Compact live memory** — rewrite the live file so it remains a short current-state file:
   - keep active HOT items only (apply 48h decay rule)
   - preserve explicit carry-forward items that still matter tomorrow
   - move durable longer-lived facts into WARM / COLD as appropriate (apply 7d decay rule for WARM → COLD)
   - retire resolved or expired LAST_EVENT entries (apply 7d retirement rule and 10-entry cap)
   - remove resolved day-only detail that is now preserved in the archive snapshot
8. **Compact safe memory only** — delete session memory files whose content has been captured above; optionally trim or rewrite only `dreaming-managed` entries; never clear untouched repo or user memory.

### Daily Archive Snapshot Structure

```markdown
# <Agent> Archive — YYYY-MM-DD

## Completed Today

- [...]

## Promoted Memory

- Repo: [...]
- User: [...]    <!-- omit if the agent does not promote to user memory -->

## Carry-Forward

- [...]

## Blockers For Team Lead

- [...]

## Compacted

- Before: XXX lines | After: YYY lines (NNN chars removed from LAST_EVENT; M entries archived)
- Entries moved: [date range], ticket refs: [#XX, #YY, ...]
- [...]
```

The "Compacted" section must always report:
- **Line count delta:** "Before: XXX lines | After: YYY lines" (count the full live file before and after compaction).
- **LAST_EVENT delta:** Number of chars removed and number of entries archived.
- **Date range and ticket refs:** Which entries were retired (by date) and which tickets they reference.

---

## Per-Agent Deltas

### Architect

**Live file:** `memory/architect.md`
**Archive file:** `memory/archive/architect-YYYY-MM-DD.md`

**Promotion focus:** recurring design patterns, confirmed conventions, architectural decisions, corrections from the team lead, unresolved next-day items, transient notes safe to collapse.

**Promotion targets:**

- Session corrections from the team lead → `memory/architect.md` (WARM/COLD tiers) every run
- Cross-project architectural patterns → auto-memory (user-level memory files) when the pattern recurs across 2+ projects
- Dreaming-managed transient captures → compacted in their original memory file after checkpoint (only when explicitly marked)

**Compaction enforcement (Architect):**

- LAST_EVENT: Cap at 10 most recent entries. Retire entries older than 7 days with no open ticket/PR/blocker reference. Summarise entries exceeding 500 chars to one-liner + archive full detail.
- HOT decay: Items not referenced in 48h move to WARM.
- WARM decay: Items not referenced in 7d move to COLD.
- Archive snapshot must report before/after line counts and compaction delta.

**Dispatch behaviour:**

- If Architect receives the trigger directly: run shared steps (including decay rules + LAST_EVENT retirement), then invoke Builder, Tester, and Router as subagents simultaneously — `"End of day consolidation. Run the dreaming skill for [role] workspace."` — then confirm to the team lead: `"Good night. All agents consolidated."`
- If the trigger arrives via subagent dispatch: run shared steps (including decay rules + LAST_EVENT retirement) only, then acknowledge: `"Architect consolidated. Good night."`

### Builder

**Live file:** `memory/builder.md`
**Archive file:** `memory/archive/builder-YYYY-MM-DD.md`

**Promotion focus:** project conventions, coding patterns, resolved edge cases, corrections from the team lead or Architect, unresolved next-day items, transient notes safe to collapse.

**Promotion targets:**

- Project conventions and verified practices → `memory/builder.md` (WARM/COLD tiers) every run
- Cross-project coding patterns → auto-memory (user-level memory files) when the pattern recurs across 2+ projects
- Dreaming-managed transient captures → compacted in their original memory file after checkpoint (only when explicitly marked)

**Compaction enforcement (Builder):**

- LAST_EVENT: Cap at 10 most recent entries. Retire entries older than 7 days with no open ticket/PR/blocker reference. Summarise entries exceeding 500 chars to one-liner + archive full detail.
- HOT decay: Items not referenced in 48h move to WARM.
- WARM decay: Items not referenced in 7d move to COLD.
- Archive snapshot must report before/after line counts and compaction delta.

**Dispatch behaviour:**

- Builder runs end-of-day consolidation when dispatched by Architect as a subagent. Builder does NOT cascade the trigger.
- Run shared steps (including decay rules + LAST_EVENT retirement).
- Acknowledge: `"Builder consolidated. Good night."`

### Tester

**Live file:** `memory/tester.md`
**Archive file:** `memory/archive/tester-YYYY-MM-DD.md`

**Promotion focus:** recurring QA failure patterns, environment gotchas, acceptance criteria that consistently catch regressions, reliable distinguishing tests, blockers, unresolved next-day items, transient notes safe to collapse.

**Promotion targets:**

- Recurring QA failure patterns → `memory/tester.md` (WARM/COLD tiers) every run
- Environment-specific gotchas → `memory/tester.md` (WARM/COLD tiers) every run
- Dreaming-managed transient captures → compacted in their original memory file after checkpoint (only when explicitly marked)

(Tester does not promote to user memory — QA intelligence is project-scoped.)

**Compaction enforcement (Tester):**

- LAST_EVENT: Cap at 10 most recent entries. Retire entries older than 7 days with no open ticket/PR/blocker reference. Summarise entries exceeding 500 chars to one-liner + archive full detail.
- HOT decay: Items not referenced in 48h move to WARM.
- WARM decay: Items not referenced in 7d move to COLD.
- Archive snapshot must report before/after line counts and compaction delta.

**Dispatch behaviour:**

- Tester runs end-of-day consolidation when dispatched by Architect as a subagent. Tester does NOT cascade the trigger.
- Run shared steps (including decay rules + LAST_EVENT retirement).
- Acknowledge: `"Tester consolidated. Good night."`

### Router

**Live file:** `memory/router.md`
**Archive file:** `memory/archive/router-YYYY-MM-DD.md`

**Promotion focus:** stable classification patterns, resolved ambiguous-message types, known escalation triggers and outcomes, unresolved next-day items, transient notes safe to collapse.

**Promotion targets:**

- Stable routing classification patterns → `memory/router.md` (WARM/COLD tiers) every run
- Resolved ambiguous message types → same as above
- Dreaming-managed transient captures → compacted in their original memory file after checkpoint (only when explicitly marked)

(Router does not promote to user memory.)

**Compaction enforcement (Router):**

- LAST_EVENT: Cap at 10 most recent entries. Retire entries older than 7 days with no open ticket/PR/blocker reference. Summarise entries exceeding 500 chars to one-liner + archive full detail.
- HOT decay: Items not referenced in 48h move to WARM.
- WARM decay: Items not referenced in 7d move to COLD.
- Archive snapshot must report before/after line counts and compaction delta.

**Dispatch behaviour:**

- Router runs end-of-day consolidation when dispatched by Architect as a subagent. Router does NOT cascade the trigger.
- Run shared steps (including decay rules + LAST_EVENT retirement).
- Acknowledge: `"Router consolidated. Good night."`

This is internal-only. Do not post to GitHub issues, PRs, or any external channel.
