---
name: qa-ticket-workflow
description: "Use when: Tester runs a full QA session, processes a Builder handoff, executes test steps, writes a GitHub test report, or aligns ticket state after verification."
argument-hint: "Ticket reference, handoff payload, acceptance criteria, or QA execution question"
---

# QA Ticket Workflow

Use this skill when Tester receives a ticket or PR handoff that requires the full QA execution flow, GitHub reporting, and ticket-state alignment.

## Modes

### Full QA — direct team-lead-initiated session

When run directly by the team lead, execute the complete workflow below (handoff check → pre-test setup → execution → report → state alignment → defect notification → cleanup).

### Pre-QA Readiness Check — Builder subagent dispatch

When invoked as a subagent by Builder (not by the team lead), Tester operates in readiness-check mode only:

- Do NOT execute tests, navigate browsers, or interact with the running app.
- Validate the Developer → QA handoff payload is complete (against `ticket-lifecycle-mode`).
- Add the ticket to Tester's HOT memory queue in `memory/tester.md` so it is tracked.
- Return to Builder: `READY` (handoff complete) | `INCOMPLETE: [list of missing fields]`.

Full QA requires a direct Tester session because tests use shared browser state that cannot run inside a subagent. After Builder confirms readiness, the team lead triggers full Tester QA in a dedicated session.

## Required Handoff

The canonical Developer → QA handoff payload is defined in `ticket-lifecycle-mode`. Tester blocks execution if any required field is missing and asks for it before proceeding.

## Pre-Test Setup

Before executing any test step:

1. Confirm the environment URL matches the ticket target. Navigate to it and do not run server commands.
2. Confirm infrastructure is ready. If a dependency is missing, surface it as BLOCKER and stop.
3. Note the initial page and auth state as the test baseline.

## Execution Workflow

### Step 1 - Parse the ticket

Extract:

- acceptance criteria, each becoming a test step
- target URL
- user role and credentials
- preconditions

List any gaps not answerable from the ticket or `.env.local`.

### Step 2 - Ask all pre-flight questions

Batch missing credentials, ambiguous acceptance criteria, missing URL, required seed data, and infrastructure readiness into one question set before starting. Do not execute any test step until all blocking questions are resolved.

### Step 3 - Choose execution strategy

- **Sequential** - step N depends on the result or state of step N-1
- **Independent** - a step can run in isolation with its own test data

Parallelization rules:

- each parallel sub-agent gets unique test data
- do not parallelize tests that touch auth rapidly
- do not parallelize tests that require the same shared browser window sequentially
- wait for all sub-agents to complete before writing the report

### Step 4 - Execute test steps

For each step:

1. State what you are about to do in one line.
2. Perform the action.
3. Verify resulting URL and visible page text after each navigation or submission.
4. Mark the step PASS, FAIL, or BLOCKED with one-line evidence.

If a step fails but later steps are independent, continue. If failure blocks subsequent steps, mark them BLOCKED and stop.

### Step 5 - Verify supporting systems

Where applicable, confirm via shared browser windows:

- email delivery
- auth records and profile rows in Supabase

Do not substitute CLI queries for browser verification.

## Report Format

```markdown
## Test Report - [Ticket/PR] - [YYYY-MM-DD]

**Ticket:** [org/repo#number]
**PR:** [org/repo#number] (if applicable)
**Environment:** [base URL tested]
**Tester:** Tester
**Run date:** [date]

### Summary
[1-2 sentences: overall result and key finding]

### Test Steps
| # | Step | Expected | Actual | Result |
| - | ---- | -------- | ------ | ------ |
| 1 | ... | ... | ... | PASS |

### Defects Found
[List with description, expected, actual, severity - or None]

### Additional Observations
[Out-of-scope findings, or None]

### Verdict
[PASS | FAIL | PARTIAL PASS | BLOCKED] - [one sentence justification]
```

## GitHub And State Actions

### Step 6 - Post report to GitHub

Write the report to a temp file using a line-by-line `.cjs` script in `$env:TEMP`. Use `gh issue comment --body-file`. Never inline multi-line content with `--body`.

### Step 7 - Align ticket state

- PASS -> `state:qa-passed`
- FAIL or PARTIAL PASS -> `state:changes-requested`

### Step 8 - Notify Builder on defects

If verdict is FAIL or PARTIAL PASS, notify Builder. Choose based on session capability:

**Preferred — dispatch Builder as subagent in development mode**

When Tester has subagent dispatch available (team-lead-initiated session with `agent` tool), invoke Builder with:

- ticket / PR reference
- one-line defect summary
- GitHub report URL
- status: needs fix — awaiting retest

Builder triages and either fixes immediately or schedules.

**Fallback — append to Builder's live HOT memory**

When subagent dispatch isn't available (relay mode, isolated context), append to `memory/builder.md` HOT section:

- QA result summary (one line)
- defects (one line per defect)
- ticket / PR reference
- GitHub report URL
- status: needs fix — awaiting retest

Do not modify any other section of Builder's memory file.

If verdict is PASS with no defects, skip this step — Builder will see the GitHub comment.

### Step 9 - Clean up

Remove temp report files and summarize the final verdict in chat.
