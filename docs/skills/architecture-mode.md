[← README](../../README.md) · [Architect](../ARCHITECT.md)

---

# architecture-mode

Architect's design and decision mode. Activated when a problem has high ambiguity, multiple viable technical approaches, security or data risk, or cross-module blast radius that makes it unsafe to implement without a settled direction.

---

## When it activates

Say: "architect this", "ADR", "C4", "design decision", "system boundary", or "high ambiguity."

Also auto-activates when Architect cannot implement safely because the architecture or acceptance criteria are unsettled — open questions get a decision first, implementation second.

---

## What it produces

| Artifact | When |
| --- | --- |
| **Architecture Recommendation** | Every architecture session — structured decision record with options, chosen approach, constraints, acceptance criteria |
| **ADR** (Architecture Decision Record) | When the decision is significant enough to reference later |
| **C4 diagram** | Context (L1) and Container (L2) always; Component (L3) only when needed |
| **GitHub story or epic ticket** | After your approval — handoff artifact for Builder to implement |

---

## The decision discipline

- Start from the most concrete entry point available — user journey, failing flow, dependency boundary, or observed symptom
- Label every assumption explicitly — separate facts from assumptions
- Present at least two genuine alternatives — not strawmen, not a preselected winner
- State what was chosen, why, what was rejected, and what risk remains
- Connect every recommendation to a next observable validation signal — a test, metric, or user-visible behavior
- Do not implement while architecture-critical ambiguity remains

---

## ADR format (Michael Nygard)

```markdown
# ADR-NNN: [Decision title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[What is the problem? What forces are at play?]

## Decision
[What was decided — "We will use X"]

## Alternatives Considered
[At least two genuine alternatives with reasons for rejection]

## Consequences
[What this makes easier, harder, or what new problems it creates]

## Assumptions
[What must be true for this decision to hold]
```

---

## Exit criteria

Architecture mode is complete when you confirm the selected approach, or when the decision is low-risk and fully supported by available evidence. Architect then creates the GitHub story/epic ticket and Builder picks it up.

---

**Carried by:** [Architect](../ARCHITECT.md)
