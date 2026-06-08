---
name: task-automation-flow
description: "Use when: 'do work', 'dispatch builder', or team lead triggers automated task implementation. Governs end-to-end flow from dispatch through verification, fail handling, batch mode, and escalation."
argument-hint: "Trigger phrase, ticket reference, verifier type, or fail counter question"
---

# Task Automation Flow

Governs what happens after the team lead approves a ticket for implementation. The trigger is explicit: the team lead says **"do work"** or **"dispatch builder"** after reviewing the task and any linked GitHub issue. From that point the flow runs autonomously until it requires a human decision.

## Trigger Recognition

Load this skill when any of these phrases appear:

- `"do work"`
- `"dispatch builder"`

On trigger: Architect enters automation mode, confirms the verifier field is set on the ticket, then dispatches Builder.

A ticket without a verifier field is underscoped. Do not dispatch — return to the team lead for clarification.

## Verifier

Every ticket has acceptance criteria. Architect specifies the verifier when creating the ticket — in this flow, Architect acts as Developer Lead and is responsible for setting the verifier field at ticket creation, consistent with the Developer Lead role defined in `ticket-lifecycle-mode`. There is no "no QA" — only a question of who verifies.

| Verifier | When Architect assigns it | Flow after Builder completes |
| --- | --- | --- |
| `Tester` | Full functional verification needed | Builder marks ticket `state:ready-for-qa` and notifies Architect. Architect dispatches Tester as a direct session — handing main context to Tester when operating in main, or notifying the team lead to start a dedicated Tester session when not in main. |
| `Architect` | Design or structural review sufficient | Builder notifies Architect who reviews — smaller loop |
| `Automated` | Build + lint + tests are the full acceptance signal | Builder self-certifies; Architect spot-checks before notifying team lead |

The verifier is recorded on the GitHub issue at ticket creation and drives the post-completion branch in the flow.

## Happy Path

### verifier: Tester

```
Team Lead: "do work" / "dispatch builder"
  └─> Architect dispatches Builder
      └─> Builder: implements ticket
          └─> ticket: state:ready-for-qa
              └─> Builder notifies Architect
                  └─> Architect dispatches Tester (direct session)
                      └─> Tester: all ACs pass → state:qa-passed
                          └─> Tester notifies Architect
                              └─> Architect notifies Team Lead
                                  └─> Team Lead: merges + closes ticket
```

After Tester exits (pass or fail), main context returns to Architect. Builder does not spawn Tester — Architect dispatches Tester as a direct session — handing main context to Tester when operating in main, or notifying the team lead to start a dedicated Tester session when not in main.

### verifier: Architect

```
Team Lead: "do work" / "dispatch builder"
  └─> Architect dispatches Builder
      └─> Builder: implements ticket
          └─> Builder notifies Architect: complete
              └─> Architect reviews ACs
                  ├─ Pass → state:qa-passed
                  │   └─> Architect notifies Team Lead
                  │         └─> Team Lead: merges + closes ticket
                  └─> Fail → Architect gives instructions → Builder fixes → Architect re-reviews
```

### verifier: Automated

```
Team Lead: "do work" / "dispatch builder"
  └─> Architect dispatches Builder
      └─> Builder: implements ticket
          └─> Builder: build + lint + tests pass → self-certifies
              └─> Builder notifies Architect
                  └─> Architect spot-checks → state:qa-passed
                      └─> Architect notifies Team Lead
                            └─> Team Lead: merges + closes ticket
```

## Fail Paths

Fail paths below are written for `verifier: Tester`.

For `verifier: Architect`, Architect acts as the verifier for pass/fail decisions; apply the same fail-counter thresholds and escalation rules, but replace “Tester” actions with “Architect” actions.

For `verifier: Automated`, treat an Architect spot-check FAIL as a verifier fail and apply the same fail-counter thresholds and escalation rules. Automated gate failures (build/lint/test) are handled as normal implementation work by Builder until gates pass (do not advance to `state:ready-for-qa`).

### 1st Fail

Tester fails → ticket transitions to `state:changes-requested`. Label applied: `qa-fail-1`.

```
Tester: FAIL (1st)
  └─> Tester applies qa-fail-1 label to GitHub issue
      └─> Tester spawns Builder (sub-agent)
          └─> Builder fixes
              └─> ticket: state:ready-for-qa
                  └─> Tester re-runs
```

### 2nd Fail

Architect reviews and corrects. Builder does not loop autonomously again. Label applied: `qa-fail-2`.

```
Tester: FAIL (2nd)
  └─> Tester removes qa-fail-1 (if present) then applies qa-fail-2 label to GitHub issue
      └─> Architect reviews + corrects
          ├─ Architect can resolve:
          │   └─> Architect provides instructions → Builder fixes → Tester re-runs
          │
          └─ Architect needs a user decision:
              └─> task parked → Architect escalates to Team Lead
                  └─> Team Lead answers
                      └─> Architect updates instructions → dispatches Builder → flow resumes
```

### 3rd Fail

No further agent loops. Escalates directly to the team lead.

```
Tester: FAIL (3rd)
  └─> task parked → Architect notifies Team Lead
```

## Partial Pass

Some ACs pass, some fail. Tester transitions ticket to `state:changes-requested` and applies the appropriate `qa-fail-*` label for the current fail attempt (removing any prior `qa-fail-*` label).

```
Tester: PARTIAL PASS
  └─> goes to Builder
      ├─ Builder: "no change required"
      │   └─> goes to Architect to verify
      │       ├─ Architect agrees → goes to Team Lead
      │       └─ Architect disagrees → Builder fixes (with Architect's instructions)
      │
      └─ Builder: fixes required → Builder fixes → Tester re-runs (counts as next fail attempt)
```

## Tester Can't Run (Environment / Setup Failure)

Not a functional failure — Tester cannot execute the test suite at all.

```
Tester: BLOCKED (can't run)
  └─> goes to Architect for decision + instructions
      └─> Architect escalates to Team Lead
```

## Builder Has a Question During Fix

```
Builder: question arises
  └─> Builder spawns Architect (sub-agent)
      ├─ Architect can decide:
      │   └─> decision flows back to Builder → Builder continues
      │
      └─ Architect needs Team Lead:
          └─> task parked → Architect escalates to Team Lead
              └─> Team Lead answers
                  └─> Architect updates instructions → dispatches Builder → flow resumes
```

## Parked Task Resumption

Whenever the team lead answers a parked question:

```
Team Lead answers
  └─> Architect updates instructions
      └─> Architect dispatches Builder per flow
```

## Fail Attempt Counter

| Fail # | Who acts | GitHub label |
| --- | --- | --- |
| 1st | Tester spawns Builder directly | `qa-fail-1` |
| 2nd | Architect reviews + corrects (or escalates if decision needed) | `qa-fail-2` |
| 3rd | Park + escalate to Team Lead unconditionally | — |

Rules:

- The counter is independent per ticket — a fail on Ticket 1 does not affect Ticket 2's counter.
- The counter resets if the team lead provides new direction and the flow restarts from a parked state. On reset, remove all `qa-fail-*` labels from the GitHub issue before the flow resumes.
- Labels `qa-fail-1` and `qa-fail-2` are applied to the GitHub issue at the moment of the corresponding fail.

## Lifecycle State Mapping

This flow operates within `ticket-lifecycle-mode`.

| Flow event | Lifecycle state |
| --- | --- |
| Builder starts implementation (after dispatch) | `state:in-progress` |
| Builder complete (`verifier: Tester` or `verifier: Automated`) | `state:ready-for-qa` |
| Builder complete (`verifier: Architect`) | `state:ready-for-review` |
| Tester fails | `state:changes-requested` |
| Tester passes all ACs | `state:qa-passed` |
| Team Lead merges + closes | Team Lead merges and closes — out-of-band action, not a managed label. |

Note: For `verifier: Architect`, the intermediate state is `state:ready-for-review` (not `state:ready-for-qa`). On pass, Architect transitions directly from `state:ready-for-review` to `state:qa-passed` — no separate QA phase is required. See the Transition Permissions table in `ticket-lifecycle-mode`.

## Batch Mode (Sequential Pair)

Removes the per-ticket merge gate. Two tickets run back-to-back; the team lead merges both at the end.

Sequential means Ticket 2 does not start until Ticket 1 completes its active work — with one defined exception: if Ticket 1 parks waiting for team lead input, Ticket 2 starts immediately rather than blocking on the parked question. This maximises throughput while preserving the no-concurrent-implementation constraint.

### Eligibility

Architect proposes a candidate pair from eligible backlog tickets. Team lead and Architect jointly confirm the pair meets all three criteria:

- do not touch overlapping files or modules (non-conflicting)
- are not dependent on each other (B does not need A to land first)
- do not require a merge between them before the second can start

Neither ticket is declared eligible unilaterally — this is a joint call every time.

### Batch Flow

```
Joint review → Team Lead approves pair (Ticket 1, Ticket 2)

Ticket 1: full automation flow runs
  ├─ Ticket 1 reaches state:qa-passed:
  │   └─> Ticket 2 starts immediately (no merge gate)
  │
  └─ Ticket 1 parks (needs Team Lead input):
      └─> Ticket 2 starts immediately while Ticket 1 waits
          Architect queues the parking question for Team Lead
          Team Lead answers when ready → Ticket 1 remains parked until Ticket 2 completes, then resumes per standard parked-resumption flow

Both tickets reach state:qa-passed → queued

Architect notifies Team Lead:
  - which tickets are ready
  - recommended merge order (Ticket 1 first, then Ticket 2)

Team Lead: reviews → merges in recommended order → closes both tickets
```

### Merge Order

Architect always recommends merge order at batch completion, even if tickets were declared non-conflicting. Branch history can create ordering sensitivity that wasn't visible at selection time.

### Batch Fail Handling

Each ticket runs its own fail counter independently. A 3rd fail on either ticket parks that ticket and notifies the team lead; the other ticket continues unaffected.

### Hard Rules (Batch)

- Max batch size: 2 tickets.
- Ticket selection is a joint call — Architect proposes, team lead confirms. Architect does not self-select.
- No auto-merge in batch mode. Team lead merges both at the end.
- Tickets run sequentially — Ticket 2 does not start until Ticket 1 completes or parks. When Ticket 1 parks, Ticket 2 starts immediately as a defined exception; this is not concurrent execution but a parking carve-out.
- Architect notifies team lead of each completion as it happens, not only at batch end.

## State Management Protocol

All three rules below are mandatory during an automation run.

### Rule 1 — GitHub issue labels

Apply GitHub issue labels to record both fail counter state and ticket lifecycle state:

- Fail counter labels: `qa-fail-1` (1st fail), `qa-fail-2` (2nd fail)
- Ticket state labels: use the canonical state vocabulary from `ticket-lifecycle-mode` — e.g. `state:in-progress`, `state:ready-for-qa`, `state:qa-passed`, `state:changes-requested`
- Labels are applied by the agent that triggers the transition; they are not deferred
- When a new state label is applied, remove the previous state label from the issue
- When advancing from `qa-fail-1` to `qa-fail-2`, remove `qa-fail-1` first. Both labels must never coexist on the same issue.

### Rule 2 — Task tracking (TaskCreate / TaskUpdate)

- At automation run start: create a task using TaskCreate with ticket reference, verifier, and initial state
- On every state change: call TaskUpdate immediately — do not batch state changes
- Record at minimum: current state, verifier, fail count, and any parking reason

**Fallback (non-Claude Code environments):** Create a task file in the project's `projects/<project-name>/` directory and update it on each state change in place of TaskCreate/TaskUpdate.

### Rule 3 — WAL enforcement (non-negotiable)

All agents write to their own memory file before every response during an automation run. This is not optional.

- Architect writes to `memory/architect.md`
- Builder writes to `memory/builder.md`
- Tester writes to `memory/tester.md`

Each write must reflect the current ticket state and any decisions made in that turn. An agent that has not updated its memory file has not completed its turn.

## Hard Rules

- The team lead's "do work" / "dispatch builder" is the only valid trigger. Architect does not self-start.
- Architect specifies the verifier on every ticket at creation time. A ticket without a verifier is underscoped and must not be dispatched.
- For `verifier: Tester` — Builder never declares QA done. Only Tester transitions to `state:qa-passed`.
- For `verifier: Architect` — Builder never self-approves. Architect is the sole reviewer.
- For `verifier: Automated` — Builder self-certifies on passing build + lint + tests; Architect spot-checks before notifying team lead.
- After a 3rd fail the flow stops on all verifier paths. No further agent loops without team lead direction.
- Merge and close always belong to the team lead.
- After Tester exits main, main returns to Architect.
