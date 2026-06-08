---
name: ticket-lifecycle-mode
description: "Use when: ticket lifecycle, state transitions, ready for QA, changes requested, QA passed, role-based workflow policy, Developer to QA handoff, or relay routing across delivery agents."
argument-hint: "Ticket reference, current state, role, handoff, or lifecycle question"
---

# Ticket Lifecycle Mode

Shared role-based ticket lifecycle for delivery agents. This skill defines canonical ticket states, transition permissions, entry gates, and handoff payloads without naming specific agent profiles.

Profiles should bind themselves to one or more lifecycle roles. The skill stays profile-neutral.

## Role Model

- `Developer` - implements scoped work and addresses engineering defects.
- `Developer Lead` - approves implementation quality, decides when work is ready for QA, and triages engineering returns.
- `QA` - verifies acceptance criteria and records pass, fail, or partial pass evidence.
- `Relay` - classifies workflow signals, routes work to the correct owner, and leaves an audit trail.
- `Team Lead` - makes scope, approval, merge, close, or post-QA direction decisions.

One profile may bind to multiple roles. For example, a single engineer may act as both `Developer` and `Developer Lead` in the direct lane.

## Automation Fields

These fields extend the ticket definition. All base ticket fields are defined in the Developer → QA Handoff Payload section below.

Every ticket must include the following required field before it may be dispatched for implementation.

| Field | Values | Set by | Notes |
| ----- | ------ | ------ | ----- |
| `verifier` | `Tester` \| `Architect` \| `Automated` | `Developer Lead` at ticket creation | Drives the post-completion branch in `task-automation-flow`. A ticket without a verifier is underscoped — do not dispatch. |

## Canonical Ticket States

| State | Meaning | Typical owner |
| ----- | ------- | ------------- |
| `state:ready-for-implementation` | Ticket is scoped and ready for implementation handoff or start | `Developer Lead` |
| `state:in-progress` | Implementation work is actively underway | `Developer` |
| `state:ready-for-review` | Implementation is complete and waiting for accountable engineering review | `Developer` or delegated implementer |
| `state:changes-requested` | More engineering work is required after review or QA | `Developer Lead` or `QA` |
| `state:ready-for-qa` | Engineering work is accepted and the QA handoff is complete | `Developer Lead` |
| `state:qa-passed` | QA passed and the work is waiting for team lead approval, merge, close, or next direction | `QA` |

After `state:qa-passed`, the `Team Lead` decides whether the work is closed or moved to another workflow state outside this shared baseline.

## QA Fail Labels

These labels are applied to the GitHub issue by the active verifier (`QA` when `verifier: Tester`; otherwise the `Developer Lead` acting as verifier) during a `task-automation-flow` run to track the fail counter. They are independent of lifecycle state labels.

| Label | Applied when | Applied by |
| ----- | ------------ | ---------- |
| `qa-fail-1` | QA fails for the first time on a ticket | active verifier |
| `qa-fail-2` | QA fails for the second time on the same ticket | active verifier |

When progressing from `qa-fail-1` to `qa-fail-2`, remove the `qa-fail-1` label before applying `qa-fail-2`. These labels do not replace lifecycle state labels — both sets coexist on the issue.

## Transition Permissions

| From | To | Allowed role | Gate |
| ---- | -- | ------------ | ---- |
| scoped backlog or planning state | `state:ready-for-implementation` | `Developer Lead` | scope and owner are clear |
| `state:ready-for-implementation` | `state:in-progress` | `Developer` | implementation has started |
| `state:in-progress` | `state:ready-for-review` | `Developer` | work is complete and ready for accountable review |
| `state:ready-for-review` | `state:changes-requested` | `Developer Lead` | review found engineering defects or missing requirements |
| `state:ready-for-review` | `state:qa-passed` | `Developer Lead` (acting as verifier) | only when `verifier: Architect` — Developer Lead has reviewed engineering quality and verified all ACs; no separate QA phase required |
| `state:ready-for-review` or `state:in-progress` | `state:ready-for-qa` | `Developer Lead` | engineering acceptance and QA handoff complete |
| `state:ready-for-qa` | `state:qa-passed` | `Developer Lead` (acting as verifier) | only when `verifier: Automated` — automated gates pass and Developer Lead spot-check is complete |
| `state:ready-for-qa` | `state:qa-passed` | `QA` | only when `verifier: Tester` — QA PASS with evidence |
| `state:ready-for-qa` | `state:changes-requested` | `QA` | only when `verifier: Tester` — QA FAIL or PARTIAL PASS requiring engineering work |
| `state:qa-passed` | closed or next state | `Team Lead` | approval or next-direction decision |

`Relay` does not own implementation-quality transitions. Relay classifies, routes, and audits — it does not declare engineering acceptance, QA pass, or closure.

`state:qa-passed` is normally reached via `QA`. The sole exception is when the ticket's verifier field is set to `Architect`: in that case the `Developer Lead` (acting as verifier) transitions directly from `state:ready-for-review` to `state:qa-passed` after reviewing engineering quality and verifying all ACs — no separate QA phase is required. In all other verifier paths, a `Developer Lead` completing an engineering review must advance to `state:ready-for-qa`, never directly to `state:qa-passed`. The local ticket record and GitHub labels must be updated together when the state changes.

## Typical Direct Lane Flow

Use this as the default ticket state sequence unless the repository defines a stricter variant:

1. Scope is clear and the ticket is ready to start -> `state:ready-for-implementation`
2. Active implementation begins on the issue branch -> `state:in-progress`
3. Implementation is complete and waiting for accountable engineering review -> `state:ready-for-review`
4. Engineering review rejects the work -> `state:changes-requested`
5. Engineering review accepts the work and QA is the next step -> `state:ready-for-qa`
6. QA passes with evidence -> `state:qa-passed`
7. Team lead decides merge, close, or next direction after `state:qa-passed`

If work returns from `state:changes-requested`, move it back to `state:in-progress` when implementation resumes, then back through review and QA.

## Entry Gates

### Before `state:ready-for-qa`

All of these should be true:

- implementation is complete for the scoped acceptance criteria
- accountable engineering review is complete
- branch is pushed and PR exists when the repository uses PR workflow
- required build, lint, test, and repo-specific validation have passed
- required migrations, edge functions, seed data, or environment setup are ready for QA
- the target QA environment is live, reachable, and configured for the intended handoff path
- the Developer -> QA handoff payload is complete

### Before `state:qa-passed`

All of these should be true:

- QA executed the requested validation or acceptance steps
- the QA report contains pass evidence
- no unresolved blocker prevents team lead approval review

### Before `state:changes-requested`

At least one of these is true:

- engineering review rejected the implementation
- QA found defects requiring engineering work
- a required acceptance criterion or validation gate is not satisfied

Before the state is changed, a deterministic review record should exist in the issue, PR, or other required audit trail with the verdict, findings, and implementer next steps.

## Developer Lead Review Output

When a `Developer Lead` reviews work in `state:ready-for-review`, the review record should include:

- explicit verdict: `accepted`, `changes requested`, or `blocked`
- acceptance criteria coverage summary
- validation run and result
- classification of each finding as `branch-local defect`, `stale-branch drift`, `repo-wide blocker`, or `missing evidence` when known
- concrete file references and implementer next steps
- lifecycle action taken, including any state change

Post the review record to the GitHub issue or PR comment thread. A local audit trail alone is not sufficient — the GitHub thread must reflect the verdict and any state change.

If the review is blocked by missing context, credentials, or environment, record the blocker and do not advance the lifecycle state.

## Developer -> QA Handoff Payload

Provide these fields before QA starts:

- ticket or PR reference
- acceptance criteria or explicit test steps
- environment URL or running app location
- starting auth state and role
- credentials or test data source, without exposing secrets in chat
- test focus
- developer validation already completed
- known blockers or limitations

If the handoff is incomplete, `QA` should block execution and request the missing information before testing.

## QA Verdict Rules

- `PASS` -> move to `state:qa-passed`
- `FAIL` or `PARTIAL PASS` -> move to `state:changes-requested`
- `BLOCKED` -> do not claim QA completion; return the missing dependency or blocker to the owning role

## Relay Rules

When a workflow update arrives, `Relay` should:

- classify the signal using the available workflow context
- route the work to the correct lifecycle role
- leave a deterministic audit trail when the workflow requires one
- ask for clarification if the update is missing owner, state, or requested action

`Relay` may describe the current lifecycle state, but it does not replace `Developer Lead`, `QA`, or `Team Lead` decisions.

## Role Binding Guidance

Keep these concerns in the profile, not in this skill:

- the actual agent names bound to each role
- memory location and update policy
- stakeholder-specific escalation rules
- role-specific execution details, such as engineering coding flow, QA execution flow, or relay channel behavior
- workstream-specific exceptions to the shared lifecycle