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
- Before compacting, run `npm run memory -- ensure <agent>` to scaffold `memory/<agent>.md` (with HOT / WARM / COLD headings) and `memory/archive/` if either does not already exist yet. This is a no-op — it never overwrites or truncates an existing file — so it is safe to run unconditionally at the start of every dreaming cycle.
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
5. **Contradiction review pass (best-effort, human-review only)** — before or alongside promoting durable items (next step), review this agent's own recent memory for statements that appear to contradict an existing entry on the same tracked topic (same entity/fact — e.g. a tier's stack description, a port number, a repo path, a capability claim — asserted with a different value in two places).
   - **Scope: own memory only.** Never read another agent's `memory/<agent>.md` or archive snapshots for this step — the Cascade rule below ("no agent reads or writes another agent's memory during dreaming") applies here too. The review covers this agent's own current HOT section plus its own archive snapshots from roughly the last 7 days (the same window the WARM → COLD decay rule already uses), not its full historical archive — a full-history semantic scan is out of scope and would blow out a nightly pass's cost.
   - **Gather the scan corpus mechanically, judge it yourself.** Run `node pipelines/deploy/lib/dreaming-contradiction-scan.js scan <agent-id> --hub-root <hub root>` to assemble the corpus (own live memory + own recent archive snapshots, scoped to the window above) — this is pure file-gathering, not detection. Its JSON output includes `indexAvailable`: when `true`, a memory-index CLI has shipped into this hub and `node pipelines/deploy/lib/memory-index.js find <keyword>` can additionally be used for cheaper cross-entry lookup within this agent's own entries only (filter any results to `agent === <this agent's own id>` — never act on another agent's indexed entries this way, same isolation rule as above); when `false` (memory-index hasn't shipped in this hub, or hasn't been built yet), the scan-corpus script's own file reads are already the full fallback — no separate action needed.
   - **Deciding whether two statements actually conflict is judgment, not mechanics** — per established best-practice and architectural decision-making protocols. Only flag entries that plausibly assert a different value for the same tracked fact; do not flag a routine update, a correction already reconciled by a later entry, or two entries that merely share a keyword without actually disagreeing.
   - **Write findings, never resolve them.** Record each finding in a new `## Flagged Contradictions` section in this cycle's archive snapshot (see structure below): both conflicting statements (verbatim or a faithful excerpt), their source (tier/section and date), and nothing else. Never edit, delete, or pick a winner between the two entries as part of this step — a human (the team lead) decides which is current. Omit the section entirely from the snapshot when no contradiction is found this cycle.
   - **This is a best-effort net, not a guarantee.** The pass will miss real contradictions — it only catches what a routine read of the scoped window surfaces, depends on the judgment quality of whichever model runs `dreaming`, and does not attempt full-corpus or semantic coverage. Never present this step to a customer as complete or guaranteed contradiction detection.
6. **Promote durable items** — append to the targets listed in the agent's per-agent delta, preserving source labels when helpful.
7. **Write daily archive snapshot** — create or overwrite the archive file at the per-agent path using the structure below. Record before/after line counts in the "Compacted" section.
8. **Compact live memory** — rewrite the live file so it remains a short current-state file:
   - keep active HOT items only (apply 48h decay rule)
   - preserve explicit carry-forward items that still matter tomorrow
   - move durable longer-lived facts into WARM / COLD as appropriate (apply 7d decay rule for WARM → COLD)
   - retire resolved or expired LAST_EVENT entries (apply 7d retirement rule and 10-entry cap)
   - remove resolved day-only detail that is now preserved in the archive snapshot
9. **Compact safe memory only** — delete session memory files whose content has been captured above; optionally trim or rewrite only `dreaming-managed` entries; never clear untouched repo or user memory.

### Daily Archive Snapshot Structure

```markdown
# <Agent> Archive — YYYY-MM-DD

## Completed Today

- [...]

## Promoted Memory

- Repo: [...]
- User: [...]    <!-- omit if the agent does not promote to user memory -->

## Flagged Contradictions

<!-- Omit this section entirely when no contradiction was found this cycle. Never auto-resolved — see the Contradiction review pass step above. -->
- Statement A: [...] (source: [tier/section], [date]) vs. Statement B: [...] (source: [tier/section], [date]) — unresolved, needs human review.

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
- Contradiction review: scoped to this agent's own memory only (never another agent's file); findings recorded in `## Flagged Contradictions` in the archive snapshot — best-effort, human-review only, never auto-resolved.

**Dispatch behaviour:**

- If Architect receives the trigger directly:
  1. **Status report phase** — invoke Builder, Tester, and Router as subagents simultaneously with the status-contribution prompt: `"EOD status check. Read your memory file and return your status contribution: active tickets, dispatched-but-unreturned work, and any blockers. Bullets only."` Collect all three responses.
  2. **Compile and deliver EOD report** — using the status contributions plus Architect's own HOT section, compile a single project-grouped report (per the multi-project output format in `agent-foundations`: group by project, mention the relevant agent owner inside each section). Deliver to the team lead before any consolidation output.
  3. **Consolidation phase** — run shared steps (including decay rules + LAST_EVENT retirement), then invoke Builder, Tester, and Router as subagents simultaneously with the dreaming consolidation prompt: `"End of day consolidation. Run the dreaming skill for [role] workspace."` Wait for all three to acknowledge.
  4. Confirm to the team lead: `"Good night. All agents consolidated."`

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
- Contradiction review: scoped to this agent's own memory only (never another agent's file); findings recorded in `## Flagged Contradictions` in the archive snapshot — best-effort, human-review only, never auto-resolved.

**Dispatch behaviour:**

- Builder runs end-of-day consolidation when dispatched by Architect as a subagent. Builder does NOT cascade the trigger.
- If dispatched with the **status-contribution prompt**: read `memory/builder.md` HOT section. Return bullets only — active tickets (branch/ticket reference), dispatched-but-unreturned items, blockers. Do not run consolidation steps; Architect will dispatch again for that separately.
- If dispatched with the **consolidation prompt**: run shared steps (including decay rules + LAST_EVENT retirement). Acknowledge: `"Builder consolidated. Good night."`

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
- Contradiction review: scoped to this agent's own memory only (never another agent's file); findings recorded in `## Flagged Contradictions` in the archive snapshot — best-effort, human-review only, never auto-resolved.

**Dispatch behaviour:**

- Tester runs end-of-day consolidation when dispatched by Architect as a subagent. Tester does NOT cascade the trigger.
- If dispatched with the **status-contribution prompt**: read `memory/tester.md` HOT section. Return bullets only — QA queue (tickets in state:ready-for-qa or in-progress), blockers, any outstanding verdicts. Do not run consolidation steps; Architect will dispatch again for that separately.
- If dispatched with the **consolidation prompt**: run shared steps (including decay rules + LAST_EVENT retirement). Acknowledge: `"Tester consolidated. Good night."`

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
- Contradiction review: scoped to this agent's own memory only (never another agent's file); findings recorded in `## Flagged Contradictions` in the archive snapshot — best-effort, human-review only, never auto-resolved.

**Dispatch behaviour:**

- Router runs end-of-day consolidation when dispatched by Architect as a subagent. Router does NOT cascade the trigger.
- If dispatched with the **status-contribution prompt**: read `memory/router.md` HOT section. Return bullets only — any unresolved routing classifications, pending escalations, or relay activity since last session. Do not run consolidation steps; Architect will dispatch again for that separately.
- If dispatched with the **consolidation prompt**: run shared steps (including decay rules + LAST_EVENT retirement). Acknowledge: `"Router consolidated. Good night."`

This is internal-only. Do not post to GitHub issues, PRs, or any external channel.
