---
name: assumptions-audit
description: "Use when: assumptions audit, audit assumptions, check for hidden assumptions, plan/ticket has ambiguous scope edges, pre-flight before finalizing a ticket, unstated assumptions, or 'what am I assuming'. Surfaces unstated assumptions, ambiguous scope edges, and untested preconditions in a finished plan/ticket/ADR before it is handed to Builder. Optional pass — Architect judges when to apply it; not a mandatory gate on every ticket."
argument-hint: "Plan, ticket, ADR, or acceptance-criteria list to audit for hidden assumptions"
---

# Assumptions Audit

Interrogate a finished plan, ticket, or ADR for what it silently assumes before it is handed off
for implementation. This is a targeted pass, not a rewrite of the plan — it surfaces gaps, it does
not resolve them. Resolution stays with whoever owns the plan (Architect, or the team lead for
scope calls).

This skill is domain-agnostic. It applies identically to a UI ticket, an infrastructure migration,
a client-services contract change, or a non-software plan — nothing here references a specific
project, stack, or business domain.

## When to load

- Architect, before finalizing a ticket that is ambiguous, high-risk, touches a scope boundary, or
  was written quickly under time pressure
- Architect, as an optional pass inside `architecture-mode` or `grill-with-docs` — see "Hook Points"
  below
- Anyone reviewing a plan/ticket/ADR who wants a structured way to ask "what does this assume that
  isn't written down?"

**Not a mandatory gate.** This is one lens among several (see `uix-lens`, `csv-lens`, `inf-lens` for
comparison) — apply it when the ticket's ambiguity or blast radius warrants it, skip it for small,
well-precedented, low-risk tickets. Applying it to every ticket regardless of size adds ceremony
disproportionate to the risk; that is an explicit non-goal.

## Method

Work through three questions against the plan/ticket text as written — not against what the author
probably meant.

### 1. Environment, data, and user assumptions

For each acceptance criterion and each named actor, ask: what does this assume is true about the
environment, the data, or the user that the text never states?

Concrete prompts to run through:

- What state does the system/data need to be in before this criterion can even be evaluated?
- What is assumed about who performs the action (permissions, role, authentication state, device)?
- What is assumed about data shape, volume, or freshness (empty vs. populated, one record vs.
  thousands, stale vs. live)?
- What existing behavior or component is assumed to already work correctly, that this plan does
  not itself verify?
- What is assumed about timing or ordering (this step assumed to happen only after that one)?

### 2. Testable vs. implicit acceptance criteria

For each acceptance criterion, classify it:

- **Testable as written** — a reader with zero shared context could write a test or verification
  step directly from the sentence, with no additional information.
- **Relies on implicit shared understanding** — the criterion only makes sense if the reader
  already knows something not stated in the ticket (an existing convention, a prior conversation,
  an assumed default).

Any criterion in the second bucket is a candidate finding — not because implicit understanding is
always wrong, but because it will not survive contact with a fresh implementer, a future audit, or
Tester's black-box verification.

### 3. Scope-boundary failure mode

For each explicit scope boundary or exclusion in the plan, ask: what happens at that boundary if
the assumption behind it is wrong?

- If the excluded case turns out to occur in practice, what breaks, and is that failure loud or
  silent?
- Is the boundary based on an assumption that was verified (evidence exists) or merely asserted
  (no evidence, just belief)?
- Does the boundary need an explicit fallback/error path, or is "does not happen" itself the
  assumption under audit?

## Output Format

Do not return free prose. Return a structured list — one row per finding — so the output is
directly actionable, not merely descriptive:

```markdown
## Assumptions Audit: <plan/ticket reference>

| # | Assumption | Risk if wrong | How to verify / resolve |
|---|-----------|---------------|--------------------------|
| 1 | [what the plan silently assumes] | [concrete failure mode, not "could cause issues"] | [specific verification step, question to ask, or spike] |
```

Rules for filling the table:

- **Assumption** — state it as a factual claim the plan depends on, not as a question. ("The
  import job assumes input rows are already deduplicated.")
- **Risk if wrong** — name the observable failure, not a vague severity label. Prefer "duplicate
  records get created silently" over "data quality issue."
- **How to verify / resolve** — must be an action someone can take before or during
  implementation: a question for the team lead, a log/data check, a spike, an explicit scope note
  added to the ticket. "Keep in mind" is not a resolution.

Close with one line stating how many findings are blocking (must be resolved before Builder starts)
versus non-blocking (can be tracked as a known risk in the ticket and resolved during
implementation). Not every finding blocks — that judgment call belongs to whoever owns the plan.

## Hook Points

This skill is referenced, not duplicated, from two places:

- **`architecture-mode`** — load this skill as an optional pre-handoff pass after the Decision
  Output is drafted and before the Story/Epic Ticket Output is created, when the decision is
  ambiguous or high-risk enough to warrant it. Architecture mode's own "Think Before Designing"
  step already asks "what assumptions am I making" at a high level; this skill is the deeper,
  structured version applied to the finished artifact.
- **`grill-with-docs`** — load this skill at the "Close with docs" step as an optional final pass
  over the settled decision, before ADRs are written, when the interrogation surfaced enough
  edge cases to warrant a structured second look.
- **`.claude/agents/architect.md`** Builder Handoff Contract — listed as an available check
  Architect may run before dispatching a ticket to Builder, alongside the existing hidden-assumption
  check already in that contract. It formalizes how to run that check when the ticket warrants it;
  it does not replace the contract's existing "no hidden assumptions in the ticket description"
  line as a lighter-weight default expectation for every ticket.

## What This Skill Does Not Do

- It does not replace acceptance-criteria authoring — it audits criteria already written.
- It does not score or grade a plan numerically (no LLM-eval-style automated scoring) — that is a
  different, explicitly deferred capability.
- It does not decide whether a finding blocks the ticket — that is Architect's or the team lead's
  call, informed by the table's risk column.
- It does not apply automatically to every ticket — invocation is a judgment call by whoever is
  finalizing the plan.
