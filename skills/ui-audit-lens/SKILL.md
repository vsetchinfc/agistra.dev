---
name: ui-audit-lens
description: "Use when: UI standards discovery, UI pattern research, UI audit, pre-handoff UI state coverage review, or when a business-specific child skill needs a stack-agnostic UI methodology to load first."
argument-hint: "UI surface, product area, org standard, or child skill brief to audit or research"
---

# UI Audit Lens

Use this skill as a stack-agnostic UI methodology. It does not define a business's visual standards for them. It provides the repeatable method a child skill can reuse before layering organisation-specific rules, component libraries, accessibility bars, content rules, or approval steps.

This skill covers three phases in one place:

1. research the target product or organisation's existing UI conventions before proposing change
2. audit a named UI surface against a stated standard
3. run a pre-handoff UI state coverage gate so handoff does not omit key observable states

Framework specifics belong in the child skill, not here. Nothing in this method assumes React, Angular, Syncfusion, Supabase, server-rendering, or any particular design system.

## When to Load

Load this skill when the work involves any of the following:

- defining UI standards for an organisation, product line, or programme
- researching an existing application's interaction patterns before proposing new UI work
- auditing a screen, workflow, component family, or design system against explicit standards
- performing a pre-handoff UI coverage check before design review, implementation handoff, or acceptance review
- creating a business-specific child skill that should inherit a generic UI methodology first

Do not load this skill for purely aesthetic direction alone when the work is just moodboarding or visual exploration. Use a design-oriented skill for that. Do not load it for automated visual regression tooling; that is a different capability.

## Phase 1 - Research

Start with evidence, not taste. Before recommending a standard or flagging a defect, identify what the target app or organisation already does.

Collect the smallest evidence set that answers these questions:

- Which UI surfaces matter for this task: pages, workflows, forms, dashboards, admin screens, public marketing views, or all of the above?
- Which standards already exist: design system docs, accessibility rules, brand constraints, regulatory requirements, screenshot libraries, or prior shipped screens?
- Which interaction patterns repeat already: navigation, tables, empty states, validation handling, destructive actions, permissions, mobile breakpoints?
- Which constraints are real: legacy framework limits, third-party component library limits, content governance, localisation, device targets, browser support?

Output the research phase as a compact inventory:

```markdown
## UI Research Snapshot

- Target surface: [what is being studied]
- Existing conventions: [patterns already in use]
- Explicit standards: [docs, references, or rules already defined]
- Constraints: [technical, regulatory, or product limits]
- Unknowns: [gaps that block a strong recommendation]
```

If the evidence is thin, say so explicitly. Do not invent a house style from memory or generic frontend norms.

## Phase 2 - Audit

Audit against a named standard, never against vague preference. The standard may come from an existing design system, a business-specific child skill, accessibility guidance, or an explicit review brief.

For each audited surface, inspect at least these dimensions:

- **Consistency** — labels, spacing logic, control choice, navigation patterns, and interaction rules match the stated standard
- **Clarity** — users can identify the next action, current state, and outcome without hidden assumptions
- **Accessibility** — the chosen standard names the applicable bar; audit against that bar rather than treating accessibility as a hand-wavy suggestion
- **State handling** — the surface defines what happens when data is absent, in flight, valid, invalid, or failed
- **Boundary behavior** — role gates, destructive actions, long-running operations, and degraded environments fail clearly rather than silently

Return audit findings as a structured record:

```markdown
## UI Audit

| Area | Standard / expectation | Observed evidence | Gap | Severity | Recommended action |
| --- | --- | --- | --- | --- | --- |
| [surface or pattern] | [named rule] | [what exists now] | [what is missing or inconsistent] | [required/recommended/fyi] | [specific next action] |
```

Keep findings tied to observable evidence. If the standard is missing, the finding is not "the UI is wrong"; the finding is "the standard is undefined, so evaluation cannot be completed cleanly."

## Phase 3 - Pre-Handoff UI State Coverage Gate

Before handing the work to implementation, review, or acceptance, verify the UI surface has explicit coverage for five observable states. These states are stack-agnostic and concern what the user can see, not how the framework implements them.

| State | What to verify |
| --- | --- |
| **Empty / first-run** | The surface behaves intentionally when there is no data, no history, or no prior configuration |
| **In progress** | The user can tell work is loading, processing, or waiting, and the interface does not become ambiguous while work is underway |
| **Success / steady state** | The intended successful outcome renders clearly and matches the stated standard |
| **User-correctable error** | Validation, missing required input, permission guidance, or another recoverable issue is explained clearly enough for the user to act |
| **System failure** | Unexpected failures, unavailable dependencies, or transport/service faults surface without leaving the user in a blank or misleading state |

When a specific surface has no form validation, substitute the most realistic user-correctable state for that flow and name it explicitly. Examples include permission denied with a clear next step, offline/disconnected mode, or a prerequisite step the user must complete first. Do not silently skip the fourth state.

Record the gate in this form:

```markdown
## UI State Coverage Gate

- Empty / first-run:      [observed, designed, or still missing]
- In progress:            [observed, designed, or still missing]
- Success / steady state: [observed, designed, or still missing]
- User-correctable error: [observed, designed, or still missing]
- System failure:         [observed, designed, or still missing]
```

Blank entries mean the gate is incomplete.

## Child Skill Extension Pattern

Business-specific child skills should load this skill first, then add the answers this generic method intentionally does not contain.

Child skills should provide things like:

- the organisation's named accessibility bar and compliance obligations
- design system tokens, component choices, and content rules
- product-specific state taxonomy or escalation rules
- approval workflow, stakeholder roles, or documentation templates

Child skills should not duplicate this methodology. Reuse this skill for the process, then layer the business-specific standards on top.

## Relationship to Other Skills

- `uix-lens` remains the existing product-specific sibling for React/Supabase UI work. This skill does not replace or deprecate it.
- `code-review-and-quality` can run alongside this skill when the audit includes a concrete code diff that also needs engineering review.
- `skill-quality-review` applies when editing this skill or any child skill built on top of it.

## What This Skill Does Not Do

- It does not prescribe one visual style, component library, or framework.
- It does not generate automated visual testing or regression tooling.
- It does not replace product-specific child skills that define a business's actual standards.
- It does not deprecate or modify `uix-lens`.