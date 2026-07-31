[← README](../../README.md) · [Router](../ROUTER.md)

---

# telegram-relay

Router's rules for bridging your team and a configured remote team via Telegram. Handles inbound message classification, subagent dispatch, outbound state-transition notifications, and information classification. Active only when a remote team is configured in `workspace.config.json`.

---

## What Router does (and doesn't do)

**Does:**
- Classify inbound messages from the remote team by workflow state
- Dispatch to the right agent — Architect, Builder, or Tester
- Compose and validate outbound state-transition notifications
- Enforce information classification before anything leaves the team

**Doesn't:**
- Read raw Telegram channels (the AI Fleet runtime does that)
- Implement, test, approve, or merge anything
- Send free-form messages — outbound is state-machine driven

---

## Inbound classification

| Incoming signal | Workflow state | Router dispatches |
| --- | --- | --- |
| PR ready, review request | `review_requested` | Builder |
| CI or build failure | `ci_failed` | Builder (with CI exception details) |
| Ready for QA, retest | `qa_requested` | Tester (Pre-QA Readiness Check mode only — no live tests) |
| Blocked, waiting | `blocked` | Builder if engineering blocker; HOT memory if decision blocker |
| Approval, scope, price, timeline | `decision_required` | HOT memory → surfaces to you at next standup or dreaming |
| FYI, status update | `info_only` | Short ack — no dispatch |
| Missing context | `unclear` | One clarifying question — no dispatch until resolved |

---

## Outbound rules (strict)

Outbound notifications are sent only after a ticket state transition that crosses the team boundary:

| State transition | Sending agent | Message |
| --- | --- | --- |
| → `ready-for-implementation` on a delegated ticket | Builder | "Ticket #N ready for implementation. `<link>`" |
| → `ready-for-qa` on a delegated ticket | Builder | "Ticket #N ready for QA. `<link>`" |
| `ready-for-qa` → `changes-requested` (QA defect) | Tester | "Ticket #N retest failed, defects on report. `<link>`" |
| `ready-for-qa` → `qa-passed` | Tester | "Ticket #N retest passed clean." |
| → blocked requiring remote team input | Builder | "Ticket #N blocked on `<reason>`. Need `<input>`." |

Free-form outbound messages are refused.

---

## Information classification

Every outbound message is checked before it leaves:

| Tier | Sharable? |
| --- | --- |
| **Inter-team-sharable** — PR status, defect summaries, QA verdicts on remote-team tickets | Yes |
| **Internal** — architecture rationale, internal planning, agent debate | No |
| **Team-lead-only** — scope, price, timeline, client commitments | No |

When in doubt: if the ticket originated from the remote team, share progress. Otherwise refuse and escalate to HOT memory.

---

**Carried by:** [Router](../ROUTER.md)
