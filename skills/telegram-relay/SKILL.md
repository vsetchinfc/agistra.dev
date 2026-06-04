---
name: telegram-relay
description: "Use when: Router bridges your team and the remote team across Telegram. Classifies inbound messages from the remote agent, dispatches Builder or Tester as subagents, composes replies, and posts outbound state-change notifications."
argument-hint: "Inbound Telegram message, remote agent request, outbound state transition, or information classification question"
---

# Telegram Relay

Use this skill when Router needs to bridge your team and the remote team across Telegram. The skill defines Router's behaviour rules on top of a Telegram relay infrastructure. It does NOT implement the bridge — that lives in the Telegram bot/runtime layer configured for your workspace.

## Scope

- **In scope:** classifying parsed inbound Telegram messages from the remote agent, dispatching Builder or Tester as subagents to handle the request, composing replies, posting state-change notifications outbound, enforcing information classification.
- **Out of scope:** internal Architect ↔ Builder or Architect ↔ Tester traffic; reading raw Telegram channels; building bot infrastructure.

## Channel

- One shared Telegram group where Router (your team's bot) and the remote agent both operate.
- The team lead is in the channel for awareness; team-lead-only escalations go via `memory/router.md` HOT and surface at morning-standup or end-of-day dreaming.

## Inbound — Remote Agent to Your Team

The runtime parses the remote agent's message and invokes Router with structured fields:

- issue number
- pull request URL or number
- branch
- changed areas
- local validation results
- CI results
- blockers or exceptions
- requested next action

Router never reads the raw channel and never owns the Telegram tool surface — the runtime does.

### Classification

Use the internal-relay state vocabulary:

| Incoming signal | Workflow state | Action |
| --------------- | -------------- | ------ |
| PR ready, review request | `review_requested` | Spawn Builder as subagent with parsed fields |
| CI failure, build failure | `ci_failed` | Spawn Builder as subagent; include CI exception |
| Ready for QA, retest | `qa_requested` | Spawn Tester as subagent in **Pre-QA Readiness Check mode only** |
| Blocked, waiting on something | `blocked` | Spawn Builder if engineering blocker; log to Router HOT if decision blocker |
| Approval, scope, price, timeline | `decision_required` | Log to Router HOT; surface at standup or dreaming |
| FYI, status update | `info_only` | Compose short ack; no subagent spawn |
| Missing context | `unclear` | Ask one concise clarification question; no subagent spawn |

### Subagent dispatch prompt template

When spawning Builder or Tester, pass:

- Sender: remote agent
- Workflow state: `[classified state]`
- Original message context (parsed fields from runtime)
- Expected response type: `answer` | `confirmation of receipt` | `clarification`
- Constraint: response will be posted on Telegram via the runtime; keep it short, inter-team-sharable, and free of team-internal or confidential content.

### Tester-as-subagent constraint

Subagent-spawned Tester cannot run live tests — browser-driven QA needs the shared browser tab and a direct Tester session. On `qa_requested` inbound, Tester operates in **Pre-QA Readiness Check mode only** (see `qa-ticket-workflow`):

- confirms the Developer → QA handoff payload is complete
- queues the ticket in `memory/tester.md` HOT
- returns `READY` or `INCOMPLETE: [missing fields]`

If the remote agent requests actual test execution, Tester's response is a queue confirmation only.

### Reply composition

Router takes the subagent response, applies the information-classification check (see below), then hands the message back to the runtime to post. The reply attributes the originating agent (e.g., `"Builder: ..."`, `"Tester: ..."`).

## Outbound — Builder / Tester to Remote Agent

Outbound is **state-machine driven**, not free-form messaging. Builder or Tester dispatches Router as a subagent only after a state transition that warrants inter-team notification.

### State-transition trigger table

| State transition | Sending agent | Notification template |
| ---------------- | ------------- | --------------------- |
| any → `state:ready-for-implementation` on a delegated ticket | Builder | "Ticket #N ready for remote agent to implement. `<link>`" |
| any → `state:ready-for-qa` on a delegated ticket | Builder | "Ticket #N in state:ready-for-qa, please pick up first-pass QA. `<link>`" |
| `state:ready-for-qa` → `state:changes-requested` (Tester-side defect) | Tester | "Ticket #N retest failed, defects on report. `<link>`" |
| `state:ready-for-qa` → `state:qa-passed` | Tester | "Ticket #N retest passed clean." |
| any → `state:blocked` requiring remote team input | Builder | "Ticket #N blocked on `<reason>`. Need `<input>`." |

Transitions on non-delegated tickets do not generate Telegram notifications.

### Dispatch prompt format from Builder / Tester

```text
Router, notify remote agent:
  Ticket: #N
  State: [current state]
  Action: [what's expected from the remote agent]
  Context: [one short line if needed]
```

### Validation checklist before Router hands the message back to runtime

- ticket exists and is in the claimed state
- the state transition is on the trigger table above
- the message body matches a template; no copies of internal context
- no secrets, no credentials, no scope/price/timeline language (information-classification check)

If any check fails, return an error to the dispatching agent. The dispatching agent appends a retry note to its own HOT memory.

## Information Classification

Three tiers, applied at Router's outbound validation step:

| Tier | Examples | Inter-team sharable? |
| ---- | -------- | -------------------- |
| `inter-team-sharable` | PR open and ready for review; defect summaries; QA verdicts on tickets that originated from the remote team | **Yes** |
| `team-internal` | Architecture-decision rationale, agent-internal debate, internal planning | **No** |
| `confidential` | Scope, price, timeline, client commitments, commercial assumptions | **No** |

Default rule when uncertain: if the ticket originated from the remote team, share progress. Otherwise refuse and escalate to Router HOT.

## Audit Policy

The ticket itself is the audit. Builder and Tester comment on the ticket in their normal workflow when work is performed or state changes. Router does NOT create redundant GitHub comments mirroring Telegram traffic. Router's outbound is a short state-change notification, not a record.

## Failure Modes

| Failure | Response |
| ------- | -------- |
| Unknown sender | Do NOT reply on channel. Append to `memory/router.md` HOT; surfaces to the team lead at morning-standup or dreaming. |
| Telegram unreachable inbound | Runtime queues. Router takes no action until invoked with a parsed message. |
| Telegram unreachable outbound | Return error to the dispatching agent. The dispatching agent appends a retry note to its own HOT. |
| Ambiguous reference (e.g., "the ticket") | Ask one concise clarifying question via the runtime; no subagent spawn until resolved. |
| Classification failure | Escalate to Router HOT; surfaces at next standup or dreaming. No guess. |

## Interactions with Other Skills

- `internal-relay` — workflow-state classification vocabulary used by inbound
- `ticket-lifecycle-mode` — canonical state names used in outbound triggers
- `qa-ticket-workflow` — defines the Pre-QA Readiness Check mode used on `qa_requested` inbound
- `team-relay` — defines what counts as a delegated ticket (and which transitions warrant inter-team notification)
- `agent-foundations` — VBR, WAL, security baseline; loaded under this skill
