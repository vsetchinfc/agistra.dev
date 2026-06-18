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

| #   | Step | Expected | Actual | Result |
| --- | ---- | -------- | ------ | ------ |
| 1   | ...  | ...      | ...    | PASS   |

### Defects Found

[List with description, expected, actual, severity - or None]

### Additional Observations

[Out-of-scope findings, or None]

### Verdict

[PASS | FAIL | PARTIAL PASS | BLOCKED] - [one sentence justification]
```

## GitHub And State Actions

Steps 6 and 7 apply to every QA session — CLI/tooling tickets included. The VBR gate is the local task file update; the GitHub comment is the mandatory-when-configured mirror step.

### Step 6 - Write QA Report to local task file (VBR gate)

**This is the primary VBR gate.** A verdict is not complete until the local task file is updated with the QA report and the state transition is recorded.

1. **Append a `## QA Report` section** to the task file with the same report content (verdict, AC table, date, defects, observations).
2. **Update the frontmatter**:
   - Set `status:` to the new lifecycle state
   - Update `fail-count:` if applicable (increment on FAIL or PARTIAL PASS)
   - Set `parked: true` if fail-count reaches 3
3. **Rename the file** to reflect the new state token:
   - PASS → `task_N_done_<slug>.md` (or `task_N_qa-passed_<slug>.md` if not terminal)
   - FAIL or PARTIAL PASS → `task_N_changes-requested_<slug>.md`
   - BLOCKED → leave as `ready-for-qa` and note blocker in the QA Report section

**VBR check:** Verify the local task file now has the `## QA Report` section and the filename reflects the new state before proceeding to Step 7.

### Step 7 - Post report to GitHub (mandatory when tracker configured)

**When a tracker is configured** (presence of `github:` or `github-issue:` field in task frontmatter, or workspace tracker config), posting the GitHub comment is **mandatory**, not optional.

Write the report to a temp file. On Linux/Mac use `mktemp`; on Windows (PowerShell) use `Join-Path $env:TEMP "qa-report.md"`. Write the report line by line to that path. Never inline multi-line content with `--body`. Remove the temp file after posting.

Post destinations (all that apply):

1. **GitHub issue** — when the ticket references an issue number:
   ```bash
   gh issue comment <number> --repo <org/repo> --body-file <path>
   ```
2. **GitHub PR** — when a PR is open for the work (even if an issue also exists):
   ```bash
   gh pr comment <number> --repo <org/repo> --body-file <path>
   ```
   Post the same report to both issue and PR when both exist.

**VBR check (mirror write):** After posting, verify the comment is visible:

```bash
gh issue view <number> --repo <org/repo> --comments
gh pr view <number> --repo <org/repo> --comments
```

**If the mirror write fails:**

- Append the failure to the task file's `## Log` section (timestamp, attempted action, error)
- Record the failed outbound in Router's `memory/router.md` HOT section under `failed-outbound` (if Router is active)
- Reconcile the mirror before the ticket is considered closed

**No tracker configured:** skip this step entirely; the local QA Report is sufficient.

For CLI/tooling tickets with no deployed URL, set **Environment:** to `local / CLI` and cite command output or test counts as evidence in the Test Steps table.

### Step 8 - Align ticket state labels (when tracker configured)

**When a tracker is configured**, apply GitHub issue labels to mirror the local state:

- PASS → apply `state:qa-passed` (remove prior state labels)
- FAIL or PARTIAL PASS → apply `state:changes-requested` and the appropriate `qa-fail-*` label (mirroring the local `fail-count:` field)

The local task file was already updated in Step 6; this step only applies the mirror labels.

**memory/tester.md:** Append a one-line HOT entry with verdict, ticket/PR refs, local task file path, and GitHub comment URL (if posted).

### Step 9 - Notify Builder on defects

**If operating inside a `task-automation-flow` run:** follow the fail counter rules in `profiles/tester-workspace/ROUTING.md` (Automation Run Rules → Fail Counter Logic) instead of the default dispatch below. On 1st fail, dispatch Builder (same as below). On 2nd fail, route to Architect — do not dispatch Builder.

If verdict is FAIL or PARTIAL PASS:

**Preferred path — dispatch Builder as subagent:**
Dispatch Builder in development mode. Pass:

- one-line defect summary
- ticket / PR reference
- local task file path (with `## QA Report` section appended)
- GitHub report URL (if posted)
- status: needs fix — awaiting retest

**Fallback path — when subagent dispatch is unavailable in the current session:**
Append to `memory/builder.md` HOT section:

- QA result summary (one line)
- defects (one line per defect)
- ticket / PR reference
- local task file path
- GitHub report URL (if posted)
- status: needs fix — awaiting retest

Do not modify any other section of Builder's memory file. Builder will read the local task file's `## QA Report` section for full context; the HOT append ensures the defect is tracked for the next Builder session.

If verdict is PASS with no defects, skip this step — Builder will see the local task file update and (if posted) the GitHub comment.

### Step 10 - Clean up

Remove temp report files and summarize the final verdict in chat.
